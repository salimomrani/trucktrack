import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { GroupService, GroupDetailResponse, CreateGroupRequest, UpdateGroupRequest } from '../group.service';

/**
 * Group form component for create and edit.
 * T142-T143: GroupFormComponent full implementation
 * Feature: 002-admin-panel
 */
@Component({
    selector: 'app-group-form',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        MatSnackBarModule,
        MatChipsModule,
        BreadcrumbComponent
    ],
    template: `
    <div class="group-form-container">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="breadcrumbItems()"></app-breadcrumb>
    
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-text">
          <h1>{{ isEditMode() ? 'Edit Group' : 'Create Group' }}</h1>
          @if (isEditMode()) {
            <p class="subtitle">{{ group()?.name }}</p>
          }
        </div>
      </div>
    
      <!-- Loading -->
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }
    
      <!-- Form -->
      @if (!loading()) {
        <div class="form-content">
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>Group Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Group Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g., North Fleet">
                  <mat-icon matSuffix>workspaces</mat-icon>
                  <mat-hint>A unique name for this group</mat-hint>
                  @if (form.get('name')?.hasError('required')) {
                    <mat-error>
                      Group name is required
                    </mat-error>
                  }
                  @if (form.get('name')?.hasError('maxlength')) {
                    <mat-error>
                      Group name must not exceed 100 characters
                    </mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description"
                    placeholder="Optional description of this group"
                  rows="4"></textarea>
                  <mat-hint>Optional - describe the purpose of this group</mat-hint>
                  @if (form.get('description')?.hasError('maxlength')) {
                    <mat-error>
                      Description must not exceed 500 characters
                    </mat-error>
                  }
                </mat-form-field>
                <mat-divider></mat-divider>
                <div class="form-actions">
                  <button mat-button type="button" (click)="goBack()">Cancel</button>
                  <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || saving()">
                    @if (saving()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    }
                    @if (!saving()) {
                      <span>{{ isEditMode() ? 'Save Changes' : 'Create Group' }}</span>
                    }
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
          <!-- Group Stats (Edit Mode Only) -->
          @if (isEditMode() && group()) {
            <mat-card class="stats-card">
              <mat-card-header>
                <mat-card-title>Group Statistics</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="stats-grid">
                  <div class="stat-item">
                    <mat-icon>local_shipping</mat-icon>
                    <div class="stat-value">{{ group()?.truckCount || 0 }}</div>
                    <div class="stat-label">Trucks Assigned</div>
                  </div>
                  <div class="stat-item">
                    <mat-icon>people</mat-icon>
                    <div class="stat-value">{{ group()?.userCount || 0 }}</div>
                    <div class="stat-label">Users with Access</div>
                  </div>
                </div>
                <div class="stats-info">
                  <p class="info-text">
                    <mat-icon>info</mat-icon>
                    Truck assignments are managed from the Truck Management page.
                    User access is managed from the User Management page.
                  </p>
                </div>
              </mat-card-content>
            </mat-card>
          }
          <!-- Metadata (Edit Mode Only) -->
          @if (isEditMode() && group()) {
            <mat-card class="meta-card">
              <mat-card-header>
                <mat-card-title>Details</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="meta-row">
                  <span class="meta-label">Group ID:</span>
                  <span class="meta-value">{{ group()?.id }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Created:</span>
                  <span class="meta-value">{{ group()?.createdAt | date:'medium' }}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Last Updated:</span>
                  <span class="meta-value">{{ group()?.updatedAt | date:'medium' }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
    `,
    styles: [`
    .group-form-container {
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

    .form-card, .stats-card, .meta-card {
      padding: 24px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
    }

    mat-divider {
      margin: 24px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-item mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
      color: #1976d2;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 500;
      color: #424242;
    }

    .stat-label {
      font-size: 14px;
      color: #757575;
      margin-top: 4px;
    }

    .stats-info {
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
    }

    .info-text {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 0;
      color: #1565c0;
      font-size: 14px;
    }

    .info-text mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .meta-row {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .meta-row:last-child {
      border-bottom: none;
    }

    .meta-label {
      width: 120px;
      font-weight: 500;
      color: #757575;
    }

    .meta-value {
      color: #424242;
      font-family: monospace;
    }
  `]
})
export class GroupFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly snackBar = inject(MatSnackBar);

  // State
  groupId = signal<string | null>(null);
  group = signal<GroupDetailResponse | null>(null);
  loading = signal(false);
  saving = signal(false);

  isEditMode = signal(false);

  breadcrumbItems = computed((): BreadcrumbItem[] => [
    { label: 'Groups', link: '/admin/groups', icon: 'workspaces' },
    { label: this.isEditMode() ? 'Edit' : 'New Group' }
  ]);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.groupId.set(id);
      this.isEditMode.set(true);
      this.loadGroup(id);
    }
  }

  loadGroup(id: string) {
    this.loading.set(true);
    this.groupService.getGroupById(id).subscribe({
      next: (group) => {
        this.group.set(group);
        this.form.patchValue({
          name: group.name,
          description: group.description || ''
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load group:', err);
        this.snackBar.open('Failed to load group', 'Close', { duration: 3000 });
        this.loading.set(false);
        this.router.navigate(['/admin/groups']);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      this.updateGroup();
    } else {
      this.createGroup();
    }
  }

  private createGroup() {
    const request: CreateGroupRequest = {
      name: this.form.value.name,
      description: this.form.value.description || undefined
    };

    this.groupService.createGroup(request).subscribe({
      next: (group) => {
        this.snackBar.open(`Group "${group.name}" created successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/groups']);
      },
      error: (err) => {
        console.error('Failed to create group:', err);
        this.snackBar.open(err.error?.message || 'Failed to create group', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  private updateGroup() {
    const request: UpdateGroupRequest = {
      name: this.form.value.name,
      description: this.form.value.description || undefined
    };

    this.groupService.updateGroup(this.groupId()!, request).subscribe({
      next: (group) => {
        this.snackBar.open(`Group "${group.name}" updated successfully`, 'Close', { duration: 3000 });
        this.router.navigate(['/admin/groups']);
      },
      error: (err) => {
        console.error('Failed to update group:', err);
        this.snackBar.open(err.error?.message || 'Failed to update group', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/groups']);
  }
}
