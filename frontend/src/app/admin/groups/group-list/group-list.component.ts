import { Component, OnInit, inject, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { GroupService, GroupDetailResponse } from '../group.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { BreadcrumbComponent } from '../../shared/breadcrumb/breadcrumb.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

/**
 * Group list component.
 * Feature: 002-admin-panel (US5)
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
    selector: 'app-group-list',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        BreadcrumbComponent,
        DatePipe
    ],
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly groupService = inject(GroupService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.openDropdownId.set(null);
    }
  }

  loading = signal(false);
  error = signal<string | null>(null);
  groups = signal<GroupDetailResponse[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = 20;
  searchTerm = '';

  // For template access
  readonly Math = Math;

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

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadGroups();
  }

  toggleDropdown(groupId: string, event: Event): void {
    event.stopPropagation();
    this.openDropdownId.update(current => current === groupId ? null : groupId);
  }

  createGroup() {
    this.router.navigate(['/admin/groups/new']);
  }

  editGroup(group: GroupDetailResponse) {
    this.router.navigate(['/admin/groups', group.id]);
  }

  deleteGroup(group: GroupDetailResponse) {
    this.openDropdownId.set(null);
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
            this.toast.success('Group deleted successfully');
            this.loadGroups();
          },
          error: (err) => {
            console.error('Failed to delete group:', err);
            this.toast.error('Failed to delete group');
          }
        });
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalElements() / this.pageSize);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(0, current - 2);
    let end = Math.min(total - 1, current + 2);

    if (end - start < 4) {
      if (start === 0) {
        end = Math.min(total - 1, 4);
      } else {
        start = Math.max(0, total - 5);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
