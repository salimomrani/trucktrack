import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { TruckRankEntry } from '../../../../core/models/analytics.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';

/**
 * Truck ranking bar chart component.
 * Feature: 006-fleet-analytics
 * T033: Create trucks-ranking component (bar chart)
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-trucks-ranking',
  standalone: true,
  imports: [NgxChartsModule, EmptyStateComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trucks-ranking.component.html',
  styleUrls: ['./trucks-ranking.component.scss']
})
export class TrucksRankingComponent {
  readonly data = input<TruckRankEntry[]>([]);
  readonly isLoading = input(false);
  readonly chartWidth = input(500);
  readonly unit = input('km');

  readonly colorScheme: Color = {
    name: 'ranking',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#f44336', '#e91e63', '#9c27b0']
  };

  readonly chartData = computed(() => {
    const items = this.data();
    if (!items || items.length === 0) return [];

    return items.map(d => ({
      name: `${d.truckName} (${d.licensePlate})`,
      value: d.value
    }));
  });

  getChartSummary(): string {
    const items = this.data();
    if (!items || items.length === 0) {
      return 'Aucune donnée';
    }
    const topTruck = items[0];
    return `${items.length} camions, 1er: ${topTruck.truckName} avec ${topTruck.value.toLocaleString('fr-FR')} ${this.unit()}`;
  }
}
