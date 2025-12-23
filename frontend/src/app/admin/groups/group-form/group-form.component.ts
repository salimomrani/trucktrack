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
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';

/**
 * Group form component placeholder.
 * T125-T127: GroupFormComponent
 * Feature: 002-admin-panel
 */
@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
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
          <p class="subtitle" *ngIf="isEditMode()">Update group details</p>
        </div>
      </div>

      <!-- Coming Soon -->
      <mat-card class="info-card">
        <mat-card-content>
          <div class="info-message">
            <mat-icon>construction</mat-icon>
            <h2>Group Form</h2>
            <p>This form will include:</p>
            <ul>
              <li>Group name and description</li>
              <li>Truck assignments (multi-select)</li>
              <li>User assignments (multi-select)</li>
              <li>Color coding for map display</li>
            </ul>
            <button mat-stroked-button (click)="goBack()" class="back-btn">
              <mat-icon>arrow_back</mat-icon>
              Back to List
            </button>
          </div>
        </mat-card-content>
      </mat-card>
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

    .info-card {
      padding: 48px;
    }

    .info-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      color: #757575;
    }

    .info-message mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #ff9800;
    }

    .info-message h2 {
      margin: 0 0 16px 0;
      color: #424242;
    }

    .info-message ul {
      text-align: left;
      margin: 16px 0 24px 0;
    }

    .info-message li {
      margin: 8px 0;
    }

    .back-btn {
      margin-top: 16px;
    }
  `]
})
export class GroupFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  isEditMode = signal(false);
  loading = signal(false);

  breadcrumbItems = computed((): BreadcrumbItem[] => [
    { label: 'Groups', link: '/admin/groups', icon: 'workspaces' },
    { label: this.isEditMode() ? 'Edit' : 'New Group' }
  ]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
    }
  }

  goBack() {
    this.router.navigate(['/admin/groups']);
  }
}
