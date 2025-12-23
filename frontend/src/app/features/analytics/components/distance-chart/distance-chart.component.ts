import { Component, Input, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { DailyDataPoint } from '../../../../core/models/analytics.model';

/**
 * Distance line chart component.
 * Feature: 006-fleet-analytics
 * T031: Create distance-chart component (line chart)
 */
@Component({
  selector: 'app-distance-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, NgxChartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './distance-chart.component.html',
  styleUrls: ['./distance-chart.component.scss']
})
export class DistanceChartComponent {
  @Input() data: DailyDataPoint[] = [];
  @Input() isLoading = false;
  @Input() chartWidth = 500;

  readonly colorScheme: Color = {
    name: 'distance',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5']
  };

  readonly chartData = computed(() => {
    if (!this.data || this.data.length === 0) return [];

    return [{
      name: 'Distance',
      series: this.data.map(d => ({
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
    if (!this.data || this.data.length === 0) {
      return 'Aucune donnée';
    }
    const totalDistance = this.data.reduce((sum, d) => sum + d.distanceKm, 0);
    return `${this.data.length} jours, ${totalDistance.toLocaleString('fr-FR')} km au total`;
  }
}
