import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
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
    this.router.navigate(['/admin/groups', group.id]);
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
