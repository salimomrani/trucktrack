import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * System configuration page placeholder.
 * T100-T121: Configuration management
 * Feature: 002-admin-panel
 */
@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="config-container">
      <!-- Header -->
      <div class="page-header">
        <h1>System Configuration</h1>
        <p class="subtitle">Manage application settings</p>
      </div>

      <!-- Configuration Sections -->
      <div class="config-grid">
        <!-- GPS Settings -->
        <mat-card class="config-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="config-icon gps">gps_fixed</mat-icon>
            <mat-card-title>GPS Settings</mat-card-title>
            <mat-card-subtitle>Location tracking configuration</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <ul>
              <li>Update frequency (seconds)</li>
              <li>Idle detection threshold</li>
              <li>Speed alert thresholds</li>
              <li>Geofence default radius</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <!-- Alert Settings -->
        <mat-card class="config-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="config-icon alerts">notifications</mat-icon>
            <mat-card-title>Alert Settings</mat-card-title>
            <mat-card-subtitle>Notification and alert rules</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <ul>
              <li>Email notifications toggle</li>
              <li>Alert severity thresholds</li>
              <li>Escalation rules</li>
              <li>Quiet hours configuration</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <!-- Map Settings -->
        <mat-card class="config-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="config-icon map">map</mat-icon>
            <mat-card-title>Map Settings</mat-card-title>
            <mat-card-subtitle>Map display preferences</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <ul>
              <li>Default center coordinates</li>
              <li>Default zoom level</li>
              <li>Map style (satellite, terrain, etc.)</li>
              <li>Cluster threshold</li>
            </ul>
          </mat-card-content>
        </mat-card>

        <!-- Retention Settings -->
        <mat-card class="config-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="config-icon retention">history</mat-icon>
            <mat-card-title>Data Retention</mat-card-title>
            <mat-card-subtitle>Data lifecycle management</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <ul>
              <li>Location history retention (days)</li>
              <li>Audit log retention (days)</li>
              <li>Alert history retention (days)</li>
              <li>Archived data storage</li>
            </ul>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Coming Soon -->
      <mat-card class="info-card">
        <mat-card-content>
          <div class="info-message">
            <mat-icon>construction</mat-icon>
            <p>Full configuration interface coming soon. These settings are currently managed via environment variables.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .config-container {
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

    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .config-card {
      padding: 16px;
    }

    .config-icon {
      font-size: 32px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
    }

    .config-icon.gps {
      background-color: #4caf50;
    }

    .config-icon.alerts {
      background-color: #f44336;
    }

    .config-icon.map {
      background-color: #2196f3;
    }

    .config-icon.retention {
      background-color: #ff9800;
    }

    .config-card ul {
      padding-left: 20px;
      margin: 16px 0 0 0;
      color: #757575;
    }

    .config-card li {
      margin: 8px 0;
    }

    .info-card {
      margin-top: 24px;
    }

    .info-message {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      color: #757575;
    }

    .info-message mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #ff9800;
    }

    .info-message p {
      margin: 0;
    }
  `]
})
export class ConfigPageComponent implements OnInit {
  loading = signal(false);

  ngOnInit() {
    // TODO: Load configuration
  }
}
