import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { GroupService, GroupDetailResponse, PageResponse } from '../group.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';

/**
 * Group list component.
 * Feature: 002-admin-panel (US5)
 */
@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    BreadcrumbComponent
  ],
  template: `
    <div class="group-list-container">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="[{ label: 'Groups', icon: 'workspaces' }]"></app-breadcrumb>

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>Group Management</h1>
          <p class="subtitle">Organize trucks and users into groups</p>
        </div>
        <button mat-raised-button color="primary" (click)="createGroup()">
          <mat-icon>add</mat-icon>
          Create Group
        </button>
      </div>

      <!-- Search -->
      <mat-card class="search-card">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search groups</mat-label>
          <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Name or description...">
          <button mat-icon-button matSuffix (click)="search()">
            <mat-icon>search</mat-icon>
          </button>
        </mat-form-field>
      </mat-card>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon>error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="loadGroups()">Retry</button>
          </mat-card-content>
        </mat-card>
      } @else if (groups().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <mat-icon>folder_shared</mat-icon>
            <h2>No Groups Found</h2>
            <p>Create your first group to organize trucks and users.</p>
            <button mat-raised-button color="primary" (click)="createGroup()">
              <mat-icon>add</mat-icon>
              Create Group
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Groups Table -->
        <mat-card class="table-card">
          <table mat-table [dataSource]="groups()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let group">
                <span class="group-name">{{ group.name }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let group">
                <span class="group-description">{{ group.description || '-' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="trucks">
              <th mat-header-cell *matHeaderCellDef>Trucks</th>
              <td mat-cell *matCellDef="let group">
                <span class="count-badge">{{ group.truckCount }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="users">
              <th mat-header-cell *matHeaderCellDef>Users</th>
              <td mat-cell *matCellDef="let group">
                <span class="count-badge">{{ group.userCount }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let group">
                {{ group.createdAt | date:'short' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let group">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="editGroup(group)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item (click)="deleteGroup(group)">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="totalElements()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50]"
            [pageIndex]="currentPage()"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .group-list-container {
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

    .search-card {
      margin-bottom: 24px;
      padding: 16px;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .error-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: #f44336;
    }

    .empty-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
    }

    .empty-card mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #2196f3;
    }

    .empty-card h2 {
      margin: 0 0 8px 0;
      color: #424242;
    }

    .empty-card p {
      margin: 0 0 24px 0;
      color: #757575;
    }

    .table-card {
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .group-name {
      font-weight: 500;
    }

    .group-description {
      color: #757575;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      border-radius: 12px;
      background: #e3f2fd;
      color: #1976d2;
      font-weight: 500;
      font-size: 12px;
    }
  `]
})
export class GroupListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly groupService = inject(GroupService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  loading = signal(false);
  error = signal<string | null>(null);
  groups = signal<GroupDetailResponse[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = 20;
  searchTerm = '';

  displayedColumns = ['name', 'description', 'trucks', 'users', 'createdAt', 'actions'];

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.loading.set(true);
    this.error.set(null);

    this.groupService.getGroups(this.currentPage(), this.pageSize, this.searchTerm || undefined).subscribe({
      next: (response) => {
        this.groups.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
        this.error.set('Failed to load groups. Please try again.');
        this.loading.set(false);
      }
    });
  }

  search() {
    this.currentPage.set(0);
    this.loadGroups();
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize = event.pageSize;
    this.loadGroups();
  }

  createGroup() {
    this.router.navigate(['/admin/groups/new']);
  }

  editGroup(group: GroupDetailResponse) {
    this.router.navigate(['/admin/groups', group.id, 'edit']);
  }

  deleteGroup(group: GroupDetailResponse) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Group',
        message: `Are you sure you want to delete the group "${group.name}"? This will remove all truck and user assignments.`,
        confirmText: 'Delete',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.groupService.deleteGroup(group.id).subscribe({
          next: () => {
            this.snackBar.open('Group deleted successfully', 'Close', { duration: 3000 });
            this.loadGroups();
          },
          error: (err) => {
            console.error('Failed to delete group:', err);
            this.snackBar.open('Failed to delete group', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
