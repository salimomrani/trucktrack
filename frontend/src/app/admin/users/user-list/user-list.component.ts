import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTableComponent, ColumnDef, PageInfo } from '../../shared/data-table/data-table.component';
import { UserService } from '../user.service';
import { UserAdminResponse, UserRole, USER_ROLES, ROLE_COLORS } from '../user.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

/**
 * User list component with search, filter, and pagination.
 * T043-T044: Create UserListComponent with DataTable
 * T047: Add deactivate/reactivate buttons with confirmation dialog
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-user-list',
    imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DataTableComponent,
    BreadcrumbComponent
],
    template: `
    <div class="user-list-container">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="[{ label: 'Users', icon: 'people' }]"></app-breadcrumb>
    
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>User Management</h1>
          <p class="subtitle">Manage user accounts and permissions</p>
        </div>
        <button mat-raised-button color="primary" (click)="createUser()">
          <mat-icon>add</mat-icon>
          Add User
        </button>
      </div>
    
      <!-- Filters -->
      <mat-card class="filters-card">
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <input matInput
              placeholder="Search by name or email..."
              [(ngModel)]="searchTerm"
              (input)="onSearch()">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
    
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Role</mat-label>
            <mat-select [(ngModel)]="selectedRole" (selectionChange)="onFilterChange()">
              <mat-option [value]="null">All Roles</mat-option>
              @for (role of roles; track role) {
                <mat-option [value]="role.value">
                  {{ role.label }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
    
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="selectedStatus" (selectionChange)="onFilterChange()">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option [value]="true">Active</mat-option>
              <mat-option [value]="false">Inactive</mat-option>
            </mat-select>
          </mat-form-field>
    
          @if (hasFilters()) {
            <button mat-stroked-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear
            </button>
          }
        </div>
      </mat-card>
    
      <!-- Users Table -->
      <mat-card class="table-card">
        <app-data-table
          [columns]="columns"
          [data]="users()"
          [totalElements]="totalElements()"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [isLoading]="loading()"
          [searchable]="false"
          [showActions]="false"
          [rowClickable]="true"
          (pageChange)="onPageChange($event)"
          (onRowClick)="onRowClick($event)">
        </app-data-table>
    
        <!-- Actions column rendered separately -->
        <ng-template #actionsTemplate let-user>
          <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="editUser(user)">
              <mat-icon>edit</mat-icon>
              <span>Edit</span>
            </button>
            @if (user.isActive) {
              <button mat-menu-item
                (click)="confirmDeactivate(user)">
                <mat-icon color="warn">block</mat-icon>
                <span>Deactivate</span>
              </button>
            }
            @if (!user.isActive) {
              <button mat-menu-item
                (click)="confirmReactivate(user)">
                <mat-icon color="primary">check_circle</mat-icon>
                <span>Reactivate</span>
              </button>
            }
            <button mat-menu-item (click)="resendEmail(user)">
              <mat-icon>email</mat-icon>
              <span>Resend Activation</span>
            </button>
          </mat-menu>
        </ng-template>
      </mat-card>
    </div>
    `,
    styles: [`
    .user-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-left h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #757575;
    }

    .filters-card {
      margin-bottom: 16px;
      padding: 16px 24px;
    }

    .filters-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .filter-field {
      width: 180px;
    }

    .table-card {
      padding: 0;
    }

    .role-chip {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      color: white;
    }

    .status-active {
      color: #4caf50;
    }

    .status-inactive {
      color: #f44336;
    }
  `]
})
export class UserListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // State
  users = signal<UserAdminResponse[]>([]);
  totalElements = signal(0);
  loading = signal(false);

  // Filters
  searchTerm = '';
  selectedRole: UserRole | null = null;
  selectedStatus: boolean | null = null;

  // Pagination
  pageIndex = 0;
  pageSize = 25;

  // Column definitions
  columns: ColumnDef[] = [
    { key: 'email', header: 'Email', sortable: true },
    { key: 'fullName', header: 'Name', sortable: true },
    { key: 'role', header: 'Role', type: 'badge', sortable: true, badgeColors: ROLE_COLORS },
    { key: 'isActive', header: 'Status', type: 'boolean', sortable: true },
    { key: 'groupCount', header: 'Groups', sortable: false },
    { key: 'lastLogin', header: 'Last Login', type: 'date', sortable: true },
    { key: 'createdAt', header: 'Created', type: 'date', sortable: true }
  ];

  roles = USER_ROLES;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.userService.getUsers(
      this.pageIndex,
      this.pageSize,
      this.searchTerm || undefined,
      this.selectedRole || undefined,
      this.selectedStatus ?? undefined
    ).subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.pageIndex = 0;
    this.loadUsers();
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.loadUsers();
  }

  onPageChange(pageInfo: PageInfo) {
    this.pageIndex = pageInfo.page;
    this.pageSize = pageInfo.size;
    this.loadUsers();
  }

  hasFilters(): boolean {
    return !!this.searchTerm || !!this.selectedRole || this.selectedStatus !== null;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedRole = null;
    this.selectedStatus = null;
    this.pageIndex = 0;
    this.loadUsers();
  }

  createUser() {
    this.router.navigate(['/admin/users/new']);
  }

  editUser(user: UserAdminResponse) {
    this.router.navigate(['/admin/users', user.id]);
  }

  onRowClick(user: UserAdminResponse) {
    this.editUser(user);
  }

  confirmDeactivate(user: UserAdminResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Deactivate User',
        message: `Are you sure you want to deactivate ${user.fullName}? They will no longer be able to log in.`,
        confirmText: 'Deactivate',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.deactivateUser(user);
      }
    });
  }

  confirmReactivate(user: UserAdminResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reactivate User',
        message: `Are you sure you want to reactivate ${user.fullName}?`,
        confirmText: 'Reactivate',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.reactivateUser(user);
      }
    });
  }

  private deactivateUser(user: UserAdminResponse) {
    this.userService.deactivateUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(`${user.fullName} has been deactivated`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to deactivate user:', err);
        this.snackBar.open(err.error?.message || 'Failed to deactivate user', 'Close', { duration: 3000 });
      }
    });
  }

  private reactivateUser(user: UserAdminResponse) {
    this.userService.reactivateUser(user.id).subscribe({
      next: () => {
        this.snackBar.open(`${user.fullName} has been reactivated`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Failed to reactivate user:', err);
        this.snackBar.open(err.error?.message || 'Failed to reactivate user', 'Close', { duration: 3000 });
      }
    });
  }

  resendEmail(user: UserAdminResponse) {
    this.userService.resendActivationEmail(user.id).subscribe({
      next: () => {
        this.snackBar.open('Activation email sent', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Failed to send email:', err);
        this.snackBar.open('Failed to send activation email', 'Close', { duration: 3000 });
      }
    });
  }
}
