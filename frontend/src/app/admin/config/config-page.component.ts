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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { ConfigService, ConfigResponse, UpdateConfigRequest } from './config.service';
import { BreadcrumbComponent } from '../shared/breadcrumb/breadcrumb.component';

/**
 * System configuration page.
 * Feature: 002-admin-panel (US4)
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatExpansionModule,
    MatSelectModule,
    BreadcrumbComponent
  ],
  template: `
    <div class="config-container">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="[{ label: 'Configuration', icon: 'settings' }]"></app-breadcrumb>

      <!-- Header -->
      <div class="page-header">
        <h1>System Configuration</h1>
        <p class="subtitle">Manage application settings</p>
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
            <button mat-button color="primary" (click)="loadConfig()">Retry</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Configuration Categories -->
        @for (category of categories(); track category) {
          <mat-card class="config-section">
            <mat-card-header>
              <mat-icon mat-card-avatar [class]="'config-icon ' + category.toLowerCase()">
                {{ getCategoryIcon(category) }}
              </mat-icon>
              <mat-card-title>{{ category }}</mat-card-title>
              <mat-card-subtitle>{{ getCategoryDescription(category) }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-accordion>
                @for (config of getConfigsByCategory(category); track config.key) {
                  <mat-expansion-panel>
                    <mat-expansion-panel-header>
                      <mat-panel-title>{{ config.key }}</mat-panel-title>
                      <mat-panel-description>{{ config.value }}</mat-panel-description>
                    </mat-expansion-panel-header>

                    <div class="config-detail">
                      <p class="config-description">{{ config.description }}</p>

                      <mat-form-field appearance="outline" class="config-input">
                        <mat-label>Value</mat-label>
                        @if (config.valueType === 'BOOLEAN') {
                          <mat-select [(ngModel)]="editValues[config.key]">
                            <mat-option value="true">True</mat-option>
                            <mat-option value="false">False</mat-option>
                          </mat-select>
                        } @else {
                          <input matInput [(ngModel)]="editValues[config.key]"
                                 [type]="config.valueType === 'INTEGER' ? 'number' : 'text'">
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="config-input">
                        <mat-label>Reason for change (optional)</mat-label>
                        <input matInput [(ngModel)]="editReasons[config.key]">
                      </mat-form-field>

                      <div class="config-actions">
                        <button mat-button (click)="resetValue(config)">Reset</button>
                        <button mat-raised-button color="primary"
                                [disabled]="editValues[config.key] === config.value"
                                (click)="saveConfig(config)">
                          Save
                        </button>
                      </div>

                      <div class="config-meta">
                        <span>Type: {{ config.valueType }}</span>
                        <span>Version: {{ config.version }}</span>
                        @if (config.updatedBy) {
                          <span>Last updated by {{ config.updatedBy }}</span>
                        }
                      </div>
                    </div>
                  </mat-expansion-panel>
                }
              </mat-accordion>
            </mat-card-content>
          </mat-card>
        }

        @if (configs().length === 0) {
          <mat-card class="empty-card">
            <mat-card-content>
              <mat-icon>settings</mat-icon>
              <p>No configuration settings found.</p>
              <p class="hint">Configuration will be populated when the system initializes.</p>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .config-container {
      padding: 24px;
      max-width: 1000px;
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

    .config-section {
      margin-bottom: 24px;
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

    .config-icon.gps { background-color: #4caf50; }
    .config-icon.alerts { background-color: #f44336; }
    .config-icon.map { background-color: #2196f3; }
    .config-icon.retention { background-color: #ff9800; }
    .config-icon.general { background-color: #9c27b0; }

    .config-detail {
      padding: 16px 0;
    }

    .config-description {
      color: #757575;
      margin-bottom: 16px;
    }

    .config-input {
      width: 100%;
      margin-bottom: 8px;
    }

    .config-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .config-meta {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      font-size: 12px;
      color: #9e9e9e;
    }

    .empty-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #757575;
    }

    .empty-card mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .hint {
      font-size: 12px;
      color: #9e9e9e;
    }
  `]
})
export class ConfigPageComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(false);
  error = signal<string | null>(null);
  configs = signal<ConfigResponse[]>([]);
  categories = signal<string[]>([]);

  editValues: Record<string, string> = {};
  editReasons: Record<string, string> = {};

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.loading.set(true);
    this.error.set(null);

    this.configService.getAllConfig().subscribe({
      next: (data) => {
        this.configs.set(data);
        const cats = [...new Set(data.map(c => c.category || 'General'))];
        this.categories.set(cats);

        // Initialize edit values
        data.forEach(c => {
          this.editValues[c.key] = c.value;
          this.editReasons[c.key] = '';
        });

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load config:', err);
        this.error.set('Failed to load configuration. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getConfigsByCategory(category: string): ConfigResponse[] {
    return this.configs().filter(c => (c.category || 'General') === category);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'GPS': 'gps_fixed',
      'Alerts': 'notifications',
      'Map': 'map',
      'Retention': 'history',
      'General': 'settings'
    };
    return icons[category] || 'settings';
  }

  getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'GPS': 'Location tracking configuration',
      'Alerts': 'Notification and alert rules',
      'Map': 'Map display preferences',
      'Retention': 'Data lifecycle management',
      'General': 'General application settings'
    };
    return descriptions[category] || 'Configuration settings';
  }

  resetValue(config: ConfigResponse) {
    this.editValues[config.key] = config.value;
    this.editReasons[config.key] = '';
  }

  saveConfig(config: ConfigResponse) {
    const request: UpdateConfigRequest = {
      value: this.editValues[config.key],
      version: config.version,
      reason: this.editReasons[config.key] || undefined
    };

    this.configService.updateConfig(config.key, request).subscribe({
      next: (updated) => {
        // Update local state
        const configs = this.configs();
        const index = configs.findIndex(c => c.key === config.key);
        if (index >= 0) {
          configs[index] = updated;
          this.configs.set([...configs]);
          this.editValues[config.key] = updated.value;
        }
        this.editReasons[config.key] = '';

        this.snackBar.open('Configuration saved successfully', 'Close', {
          duration: 3000
        });
      },
      error: (err) => {
        console.error('Failed to save config:', err);
        if (err.status === 409) {
          this.snackBar.open('Configuration was modified by another user. Please refresh.', 'Refresh', {
            duration: 5000
          }).onAction().subscribe(() => this.loadConfig());
        } else {
          this.snackBar.open('Failed to save configuration', 'Close', {
            duration: 3000
          });
        }
      }
    });
  }
}
