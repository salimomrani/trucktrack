import { Component, Input, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { AlertTypeCount } from '../../../../core/models/analytics.model';

/**
 * Alert breakdown pie chart component.
 * Feature: 006-fleet-analytics
 * T032: Create alerts-chart component (pie chart)
 */
@Component({
  selector: 'app-alerts-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, NgxChartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alerts-chart.component.html',
  styleUrls: ['./alerts-chart.component.scss']
})
export class AlertsChartComponent {
  @Input() data: AlertTypeCount[] = [];
  @Input() isLoading = false;
  @Input() chartWidth = 400;

  readonly colorScheme: Color = {
    name: 'alerts',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0']
  };

  readonly chartData = computed(() => {
    if (!this.data || this.data.length === 0) return [];

    return this.data.map(d => ({
      name: this.formatAlertType(d.alertType),
      value: d.count
    }));
  });

  private formatAlertType(type: string): string {
    const labels: Record<string, string> = {
      'SPEED_LIMIT': 'Excès vitesse',
      'GEOFENCE_ENTER': 'Entrée zone',
      'GEOFENCE_EXIT': 'Sortie zone',
      'IDLE': 'Inactivité',
      'OFFLINE': 'Hors ligne'
    };
    return labels[type] || type;
  }

  getChartSummary(): string {
    if (!this.data || this.data.length === 0) {
      return 'Aucune alerte';
    }
    const totalAlerts = this.data.reduce((sum, d) => sum + d.count, 0);
    return `${totalAlerts} alertes réparties en ${this.data.length} catégories`;
  }
}
