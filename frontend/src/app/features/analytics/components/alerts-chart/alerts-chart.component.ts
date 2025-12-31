import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { AlertTypeCount } from '../../../../core/models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

/**
 * Alert breakdown pie chart component.
 * Feature: 006-fleet-analytics
 * T032: Create alerts-chart component (pie chart)
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-alerts-chart',
  standalone: true,
  imports: [NgxChartsModule, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alerts-chart.component.html',
  styleUrls: ['./alerts-chart.component.scss']
})
export class AlertsChartComponent {
  readonly data = input<AlertTypeCount[]>([]);
  readonly isLoading = input(false);
  readonly chartWidth = input(400);

  readonly colorScheme: Color = {
    name: 'alerts',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0']
  };

  readonly chartData = computed(() => {
    const items = this.data();
    if (!items || items.length === 0) return [];

    return items.map(d => ({
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
    const items = this.data();
    if (!items || items.length === 0) {
      return 'Aucune alerte';
    }
    const totalAlerts = items.reduce((sum, d) => sum + d.count, 0);
    return `${totalAlerts} alertes réparties en ${items.length} catégories`;
  }
}
