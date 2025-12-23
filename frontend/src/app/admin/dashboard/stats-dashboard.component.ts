import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService, DashboardStats } from './stats.service';

/**
 * Admin dashboard with fleet statistics.
 * Feature: 002-admin-panel (US3)
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

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon>error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="loadStats()">Retry</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Quick Stats -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-icon class="stat-icon users">people</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.totalUsers ?? 0 }}</span>
              <span class="stat-label">Total Users</span>
              <span class="stat-sub">{{ stats()?.activeUsers ?? 0 }} active</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon trucks">local_shipping</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.trucks?.total ?? 0 }}</span>
              <span class="stat-label">Total Trucks</span>
              <span class="stat-sub">{{ stats()?.trucks?.active ?? 0 }} active</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon active">gps_fixed</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.trucks?.active ?? 0 }}</span>
              <span class="stat-label">Active Now</span>
              <span class="stat-sub">{{ stats()?.trucks?.idle ?? 0 }} idle</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon alerts">notifications</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()?.alerts?.total ?? 0 }}</span>
              <span class="stat-label">Alerts Today</span>
              <span class="stat-sub">{{ stats()?.alerts?.unread ?? 0 }} unread</span>
            </div>
          </mat-card>
        </div>

        <!-- Truck Status Breakdown -->
        <mat-card class="status-card">
          <mat-card-header>
            <mat-card-title>Truck Status Breakdown</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="status-grid">
              <div class="status-item active">
                <span class="status-count">{{ stats()?.trucks?.active ?? 0 }}</span>
                <span class="status-label">Active</span>
              </div>
              <div class="status-item idle">
                <span class="status-count">{{ stats()?.trucks?.idle ?? 0 }}</span>
                <span class="status-label">Idle</span>
              </div>
              <div class="status-item offline">
                <span class="status-count">{{ stats()?.trucks?.offline ?? 0 }}</span>
                <span class="status-label">Offline</span>
              </div>
              <div class="status-item out-of-service">
                <span class="status-count">{{ stats()?.trucks?.outOfService ?? 0 }}</span>
                <span class="status-label">Out of Service</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

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

        <!-- Mileage Stats -->
        @if (stats()?.mileage) {
          <mat-card class="mileage-card">
            <mat-card-header>
              <mat-card-title>Fleet Mileage</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="mileage-summary">
                <div class="mileage-stat">
                  <span class="mileage-value">{{ stats()?.mileage?.totalKilometers | number:'1.0-0' }}</span>
                  <span class="mileage-label">Total km</span>
                </div>
                <div class="mileage-stat">
                  <span class="mileage-value">{{ stats()?.mileage?.averagePerTruck | number:'1.0-0' }}</span>
                  <span class="mileage-label">Avg per truck</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
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

    .stat-sub {
      font-size: 12px;
      color: #9e9e9e;
    }

    .status-card, .actions-card, .mileage-card {
      margin-bottom: 24px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 16px 0;
    }

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
    }

    .status-item.active { background: #e8f5e9; }
    .status-item.idle { background: #fff3e0; }
    .status-item.offline { background: #fafafa; }
    .status-item.out-of-service { background: #ffebee; }

    .status-count {
      font-size: 24px;
      font-weight: 600;
    }

    .status-item.active .status-count { color: #4caf50; }
    .status-item.idle .status-count { color: #ff9800; }
    .status-item.offline .status-count { color: #9e9e9e; }
    .status-item.out-of-service .status-count { color: #f44336; }

    .status-label {
      font-size: 12px;
      color: #757575;
      margin-top: 4px;
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

    .mileage-summary {
      display: flex;
      gap: 48px;
      padding: 16px 0;
    }

    .mileage-stat {
      display: flex;
      flex-direction: column;
    }

    .mileage-value {
      font-size: 24px;
      font-weight: 600;
      color: #212121;
    }

    .mileage-label {
      font-size: 12px;
      color: #757575;
    }
  `]
})
export class StatsDashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);

  loading = signal(false);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.error.set(null);

    this.statsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
        this.error.set('Failed to load dashboard statistics. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
