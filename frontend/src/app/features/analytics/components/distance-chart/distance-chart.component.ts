import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { DailyDataPoint } from '../../../../core/models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';

/**
 * Distance line chart component.
 * Feature: 006-fleet-analytics
 * T031: Create distance-chart component (line chart)
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-distance-chart',
  standalone: true,
  imports: [NgxChartsModule, EmptyStateComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './distance-chart.component.html',
  styleUrls: ['./distance-chart.component.scss']
})
export class DistanceChartComponent {
  readonly data = input<DailyDataPoint[]>([]);
  readonly isLoading = input(false);
  readonly chartWidth = input(500);

  readonly colorScheme: Color = {
    name: 'distance',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5']
  };

  readonly chartData = computed(() => {
    const items = this.data();
    if (!items || items.length === 0) return [];

    return [{
      name: 'Distance',
      series: items.map(d => ({
        name: this.formatDate(d.date),
        value: d.distanceKm
      }))
    }];
  });

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  getChartSummary(): string {
    const items = this.data();
    if (!items || items.length === 0) {
      return 'Aucune donnée';
    }
    const totalDistance = items.reduce((sum, d) => sum + d.distanceKm, 0);
    return `${items.length} jours, ${totalDistance.toLocaleString('fr-FR')} km au total`;
  }
}
