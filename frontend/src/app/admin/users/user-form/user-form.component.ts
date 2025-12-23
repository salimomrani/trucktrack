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
    template: `
    <div class="user-form-container">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="breadcrumbItems()"></app-breadcrumb>

      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-text">
          <h1>{{ isEditMode() ? 'Edit User' : 'Create User' }}</h1>
          <p class="subtitle" *ngIf="isEditMode()">{{ user()?.email }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading()">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Form -->
      <div class="form-content" *ngIf="!loading()">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Account Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" placeholder="John">
                  <mat-error *ngIf="form.get('firstName')?.hasError('required')">
                    First name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" placeholder="Doe">
                  <mat-error *ngIf="form.get('lastName')?.hasError('required')">
                    Last name is required
                  </mat-error>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="john.doe@example.com">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="form.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ isEditMode() ? 'New Password (leave blank to keep current)' : 'Password' }}</mat-label>
                <input matInput formControlName="password" type="password">
                <mat-icon matSuffix>lock</mat-icon>
                <mat-hint>Min 8 characters, 1 uppercase, 1 lowercase, 1 digit</mat-hint>
                <mat-error *ngIf="form.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="form.get('password')?.hasError('minlength')">
                  Password must be at least 8 characters
                </mat-error>
                <mat-error *ngIf="form.get('password')?.hasError('pattern')">
                  Password must have 1 uppercase, 1 lowercase, and 1 digit
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option *ngFor="let role of roles" [value]="role.value">
                    <div class="role-option">
                      <span class="role-name">{{ role.label }}</span>
                      <span class="role-desc">{{ role.description }}</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('role')?.hasError('required')">
                  Role is required
                </mat-error>
              </mat-form-field>

              <mat-divider></mat-divider>

              <div class="form-actions">
                <button mat-button type="button" (click)="goBack()">Cancel</button>
                <button mat-raised-button color="primary" type="submit"
                        [disabled]="form.invalid || saving()">
                  <mat-spinner diameter="20" *ngIf="saving()"></mat-spinner>
                  <span *ngIf="!saving()">{{ isEditMode() ? 'Save Changes' : 'Create User' }}</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- User Status Card (Edit Mode Only) -->
        <mat-card class="status-card" *ngIf="isEditMode() && user()">
          <mat-card-header>
            <mat-card-title>Account Status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-info">
              <div class="status-row">
                <span class="label">Status:</span>
                <mat-chip [class]="user()?.isActive ? 'active' : 'inactive'">
                  {{ user()?.isActive ? 'Active' : 'Inactive' }}
                </mat-chip>
              </div>
              <div class="status-row">
                <span class="label">Last Login:</span>
                <span>{{ user()?.lastLogin ? (user()?.lastLogin | date:'medium') : 'Never' }}</span>
              </div>
              <div class="status-row">
                <span class="label">Created:</span>
                <span>{{ user()?.createdAt | date:'medium' }}</span>
              </div>
              <div class="status-row">
                <span class="label">Groups:</span>
                <span>{{ user()?.groupCount || 0 }} assigned</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Audit Log (Edit Mode Only) -->
        <mat-card class="audit-card" *ngIf="isEditMode() && userId()">
          <app-audit-log
            entityType="USER"
            [entityId]="userId()!">
          </app-audit-log>
        </mat-card>
      </div>
    </div>
  `,
    styles: [`
    .user-form-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-text h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #757575;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-card, .status-card, .audit-card {
      padding: 24px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .half-width {
      flex: 1;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .role-option {
      display: flex;
      flex-direction: column;
    }

    .role-name {
      font-weight: 500;
    }

    .role-desc {
      font-size: 12px;
      color: #757575;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }

    .status-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-row .label {
      width: 100px;
      font-weight: 500;
      color: #757575;
    }

    mat-chip.active {
      background-color: #4caf50 !important;
      color: white !important;
    }

    mat-chip.inactive {
      background-color: #f44336 !important;
      color: white !important;
    }

    mat-divider {
      margin: 24px 0;
    }
  `]
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
