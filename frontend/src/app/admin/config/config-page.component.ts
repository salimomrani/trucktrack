import { Component, OnInit, inject, signal } from '@angular/core';

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
    imports: [
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
    templateUrl: './config-page.component.html',
    styleUrls: ['./config-page.component.scss']
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
