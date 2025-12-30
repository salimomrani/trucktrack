import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { UserAdminResponse, CreateUserRequest, UpdateUserRequest, USER_ROLES, UserRole } from '../user.model';
import { GroupService, GroupDetailResponse } from '../../groups/group.service';
import { AuditLogComponent } from '../../shared/audit-log/audit-log.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { forkJoin } from 'rxjs';

/**
 * User form component for create and edit.
 * T045-T046: Create UserFormComponent with password validation
 * T048: Add group assignment dialog
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-user-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        AuditLogComponent,
        BreadcrumbComponent
    ],
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly groupService = inject(GroupService);
  private readonly toast = inject(ToastService);

  // State
  userId = signal<string | null>(null);
  user = signal<UserAdminResponse | null>(null);
  loading = signal(false);
  saving = signal(false);

  isEditMode = signal(false);
  roles = USER_ROLES;

  // Groups
  availableGroups = signal<GroupDetailResponse[]>([]);
  selectedGroupIds = signal<string[]>([]);

  breadcrumbItems = computed((): BreadcrumbItem[] => [
    { label: 'Users', link: '/admin/users', icon: 'people' },
    { label: this.isEditMode() ? 'Edit' : 'New User' }
  ]);

  // Password pattern: at least 1 uppercase, 1 lowercase, 1 digit
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    role: ['VIEWER' as UserRole, [Validators.required]]
  });

  ngOnInit() {
    // Load available groups for all modes
    this.loadAvailableGroups();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.userId.set(id);
      this.isEditMode.set(true);
      this.loadUser(id);

      // Make password optional in edit mode
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.setValidators([
        Validators.minLength(8),
        Validators.pattern(this.passwordPattern)
      ]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  loadAvailableGroups() {
    this.groupService.getGroups(0, 100).subscribe({
      next: (response) => {
        this.availableGroups.set(response.content);
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
      }
    });
  }

  loadUser(id: string) {
    this.loading.set(true);
    forkJoin({
      user: this.userService.getUserById(id),
      groups: this.userService.getUserGroups(id)
    }).subscribe({
      next: ({ user, groups }) => {
        this.user.set(user);
        this.selectedGroupIds.set(groups);
        this.form.patchValue({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user:', err);
        this.toast.error('Failed to load user');
        this.loading.set(false);
        this.router.navigate(['/admin/users']);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser() {
    const request: CreateUserRequest = {
      email: this.form.value.email,
      password: this.form.value.password,
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      role: this.form.value.role
    };

    this.userService.createUser(request).subscribe({
      next: (user) => {
        // Save groups if any selected
        if (this.selectedGroupIds().length > 0) {
          this.saveUserGroups(user.id);
        }
        this.toast.success(`User ${user.fullName} created successfully`);
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        console.error('Failed to create user:', err);
        this.toast.error(err.error?.message || 'Failed to create user');
        this.saving.set(false);
      }
    });
  }

  private updateUser() {
    const request: UpdateUserRequest = {};

    if (this.form.value.email !== this.user()?.email) {
      request.email = this.form.value.email;
    }
    if (this.form.value.password) {
      request.password = this.form.value.password;
    }
    if (this.form.value.firstName !== this.user()?.firstName) {
      request.firstName = this.form.value.firstName;
    }
    if (this.form.value.lastName !== this.user()?.lastName) {
      request.lastName = this.form.value.lastName;
    }
    if (this.form.value.role !== this.user()?.role) {
      request.role = this.form.value.role;
    }

    this.userService.updateUser(this.userId()!, request).subscribe({
      next: (user) => {
        // Always save groups on update
        this.saveUserGroups(user.id);
        this.toast.success(`User ${user.fullName} updated successfully`);
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        console.error('Failed to update user:', err);
        this.toast.error(err.error?.message || 'Failed to update user');
        this.saving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }

  onGroupsChange(groupIds: string[]) {
    this.selectedGroupIds.set(groupIds);
  }

  onGroupToggle(groupId: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const currentIds = this.selectedGroupIds();
    if (checkbox.checked) {
      this.selectedGroupIds.set([...currentIds, groupId]);
    } else {
      this.selectedGroupIds.set(currentIds.filter(id => id !== groupId));
    }
  }

  private saveUserGroups(userId: string) {
    this.userService.updateUserGroups(userId, this.selectedGroupIds()).subscribe({
      next: () => {
        // Groups saved successfully
      },
      error: (err) => {
        console.error('Failed to update user groups:', err);
        this.toast.warning('User saved but failed to update groups');
      }
    });
  }
}
