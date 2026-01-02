import { Component, OnInit, inject, input, computed } from '@angular/core';
import { StoreFacade } from '../../../store/store.facade';

/**
 * Trip statistics component with KPI cards.
 * T058: Create TripStatsComponent with KPI cards
 * Feature: 010-trip-management (US5: Trip History and Analytics)
 * Migrated to NgRx store for state management via StoreFacade.
 */
@Component({
  selector: 'app-trip-stats',
  standalone: true,
  imports: [],
  templateUrl: './trip-stats.component.html',
  styleUrls: ['./trip-stats.component.scss']
})
export class TripStatsComponent implements OnInit {
  private readonly facade = inject(StoreFacade);

  /** Whether to show in compact mode (for dashboard widget) */
  readonly compact = input<boolean>(false);

  // State from store (using view model selector)
  readonly viewModel = this.facade.tripStatsViewModel;

  // Derived signals from view model
  readonly analytics = computed(() => this.viewModel()?.analytics ?? null);
  readonly loading = computed(() => this.viewModel()?.loading ?? true);
  readonly error = computed(() => this.viewModel()?.error ?? null);

  // Convenience accessors for analytics properties
  readonly completionRate = computed(() => this.analytics()?.completionRate ?? 0);
  readonly tripsToday = computed(() => this.analytics()?.tripsToday ?? 0);

  ngOnInit() {
    // Load analytics via store
    this.facade.loadTripAnalytics();
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
