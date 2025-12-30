import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

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
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
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

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed) {
        this.reactivateUser(user);
      }
    });
  }

  private deactivateUser(user: UserAdminResponse) {
    this.userService.deactivateUser(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.userService.reactivateUser(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    this.userService.resendActivationEmail(user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
