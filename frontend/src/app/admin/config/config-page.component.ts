import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfigService, ConfigResponse, UpdateConfigRequest } from './config.service';
import { BreadcrumbComponent } from '../shared/breadcrumb/breadcrumb.component';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * System configuration page.
 * Feature: 002-admin-panel (US4)
 */
@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    BreadcrumbComponent
  ],
  templateUrl: './config-page.component.html',
  styleUrls: ['./config-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigPageComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

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
    const translationKeys: Record<string, string> = {
      'GPS': 'CONFIG.GPS_DESC',
      'Alerts': 'CONFIG.ALERTS_DESC',
      'Map': 'CONFIG.MAP_DESC',
      'Retention': 'CONFIG.RETENTION_DESC',
      'General': 'CONFIG.GENERAL_DESC'
    };
    const key = translationKeys[category];
    return key ? this.translate.instant(key) : category;
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

        this.toast.success('Configuration saved successfully');
      },
      error: (err) => {
        console.error('Failed to save config:', err);
        if (err.status === 409) {
          this.toast.error('Configuration was modified by another user. Please refresh.');
          // Auto-reload after conflict
          setTimeout(() => this.loadConfig(), 2000);
        } else {
          this.toast.error('Failed to save configuration');
        }
      }
    });
  }
}
