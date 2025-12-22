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

/**
 * Group list component placeholder.
 * T122-T124: GroupListComponent
 * Feature: 002-admin-panel
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
    MatProgressSpinnerModule
  ],
  template: `
    <div class="group-list-container">
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

      <!-- Coming Soon -->
      <mat-card class="info-card">
        <mat-card-content>
          <div class="info-message">
            <mat-icon>folder_shared</mat-icon>
            <h2>Group Management</h2>
            <p>This section will include:</p>
            <ul>
              <li>Create and manage truck groups</li>
              <li>Assign trucks to groups</li>
              <li>Assign users to groups</li>
              <li>Group-based access control</li>
              <li>Group statistics and overview</li>
            </ul>
          </div>
        </mat-card-content>
      </mat-card>
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
      color: #2196f3;
    }

    .info-message h2 {
      margin: 0 0 16px 0;
      color: #424242;
    }

    .info-message ul {
      text-align: left;
      margin: 16px 0 0 0;
    }

    .info-message li {
      margin: 8px 0;
    }
  `]
})
export class GroupListComponent implements OnInit {
  private readonly router = inject(Router);
  loading = signal(false);

  ngOnInit() {
    // TODO: Load groups
  }

  createGroup() {
    this.router.navigate(['/admin/groups/new']);
  }
}
