import { Component, OnInit, inject, signal, input } from '@angular/core';
import { TripService } from '../trip.service';
import { TripAnalytics } from '../trip.model';

/**
 * Trip statistics component with KPI cards.
 * T058: Create TripStatsComponent with KPI cards
 * Feature: 010-trip-management (US5: Trip History and Analytics)
 * Migrated to Tailwind CSS (Feature 020)
 */
@Component({
  selector: 'app-trip-stats',
  standalone: true,
  imports: [],
  templateUrl: './trip-stats.component.html',
  styleUrls: ['./trip-stats.component.scss']
})
export class TripStatsComponent implements OnInit {
  private readonly tripService = inject(TripService);

  /** Whether to show in compact mode (for dashboard widget) */
  readonly compact = input<boolean>(false);

  // State
  analytics = signal<TripAnalytics | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading.set(true);
    this.error.set(null);

    this.tripService.getAnalytics().subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load analytics:', err);
        this.error.set('Failed to load analytics');
        this.loading.set(false);
      }
    });
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null || minutes === undefined) return 'N/A';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  formatPercent(value: number | null): string {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(1)}%`;
  }

  formatTrend(value: number | null): string {
    if (value === null || value === undefined) return '';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  getTrendClass(value: number | null): string {
    if (value === null || value === undefined) return '';
    return value >= 0 ? 'trend-up' : 'trend-down';
  }

  getTrendIcon(value: number | null): string {
    if (value === null || value === undefined) return '';
    return value >= 0 ? 'trending_up' : 'trending_down';
  }
}
