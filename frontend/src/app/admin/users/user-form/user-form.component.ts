import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../user.service';
import { UserAdminResponse, CreateUserRequest, UpdateUserRequest, USER_ROLES, UserRole } from '../user.model';
import { AuditLogComponent } from '../../shared/audit-log/audit-log.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';

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
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatChipsModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        AuditLogComponent,
        BreadcrumbComponent
    ],
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  // State
  userId = signal<string | null>(null);
  user = signal<UserAdminResponse | null>(null);
  loading = signal(false);
  saving = signal(false);

  isEditMode = signal(false);
  roles = USER_ROLES;

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

  loadUser(id: string) {
    this.loading.set(true);
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user.set(user);
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
        this.snackBar.open('Failed to load user', 'Close', { duration: 3000 });
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
        this.snackBar.open(`User ${user.fullName} created successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        console.error('Failed to create user:', err);
        this.snackBar.open(err.error?.message || 'Failed to create user', 'Close', { duration: 3000 });
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
        this.snackBar.open(`User ${user.fullName} updated successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        console.error('Failed to update user:', err);
        this.snackBar.open(err.error?.message || 'Failed to update user', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }
}
