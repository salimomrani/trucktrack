import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Admin dashboard with fleet statistics.
 * T093-T098: Placeholder for statistics dashboard
 * Feature: 002-admin-panel
 */
@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <h1>Admin Dashboard</h1>
        <p class="subtitle">Fleet overview and quick actions</p>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon class="stat-icon users">people</mat-icon>
          <div class="stat-content">
            <span class="stat-value">--</span>
            <span class="stat-label">Total Users</span>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon class="stat-icon trucks">local_shipping</mat-icon>
          <div class="stat-content">
            <span class="stat-value">--</span>
            <span class="stat-label">Total Trucks</span>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon class="stat-icon active">gps_fixed</mat-icon>
          <div class="stat-content">
            <span class="stat-value">--</span>
            <span class="stat-label">Active Now</span>
          </div>
        </mat-card>

        <mat-card class="stat-card">
          <mat-icon class="stat-icon alerts">notifications</mat-icon>
          <div class="stat-content">
            <span class="stat-value">--</span>
            <span class="stat-label">Alerts Today</span>
          </div>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <mat-card class="actions-card">
        <mat-card-header>
          <mat-card-title>Quick Actions</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-grid">
            <button mat-stroked-button routerLink="/admin/users/new">
              <mat-icon>person_add</mat-icon>
              Add User
            </button>
            <button mat-stroked-button routerLink="/admin/trucks/new">
              <mat-icon>add</mat-icon>
              Add Truck
            </button>
            <button mat-stroked-button routerLink="/admin/groups/new">
              <mat-icon>group_add</mat-icon>
              Create Group
            </button>
            <button mat-stroked-button routerLink="/admin/config">
              <mat-icon>settings</mat-icon>
              Configuration
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Coming Soon -->
      <mat-card class="info-card">
        <mat-card-content>
          <div class="info-message">
            <mat-icon>construction</mat-icon>
            <p>Full statistics dashboard coming soon. This will include:</p>
            <ul>
              <li>Fleet mileage reports</li>
              <li>Alert trends by type</li>
              <li>Driver performance metrics</li>
              <li>Export capabilities</li>
            </ul>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #757575;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      gap: 16px;
    }

    .stat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .stat-icon.users { color: #2196f3; }
    .stat-icon.trucks { color: #ff9800; }
    .stat-icon.active { color: #4caf50; }
    .stat-icon.alerts { color: #f44336; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #212121;
    }

    .stat-label {
      font-size: 14px;
      color: #757575;
    }

    .actions-card, .info-card {
      margin-bottom: 24px;
    }

    .actions-grid {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px 0;
    }

    .actions-grid button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: #757575;
      text-align: center;
    }

    .info-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ff9800;
    }

    .info-message ul {
      text-align: left;
      margin: 16px 0 0 0;
    }
  `]
})
export class StatsDashboardComponent implements OnInit {
  loading = signal(false);

  ngOnInit() {
    // TODO: Load actual statistics
  }
}
