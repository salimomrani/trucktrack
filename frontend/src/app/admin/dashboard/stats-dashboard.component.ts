import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService, DashboardStats } from './stats.service';
import { TripStatsComponent } from '../trips/trip-stats/trip-stats.component';
import { StoreFacade } from '../../store/store.facade';

/**
 * Admin dashboard with fleet statistics.
 * Feature: 002-admin-panel (US3)
 * T059: Added trip stats widget
 */
@Component({
    selector: 'app-stats-dashboard',
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TripStatsComponent
    ],
    templateUrl: './stats-dashboard.component.html',
    styleUrls: ['./stats-dashboard.component.scss']
})
export class StatsDashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly facade = inject(StoreFacade);

  loading = signal(false);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);

  // T024: Expose cache state for UI feedback
  readonly isCacheLoading = this.facade.isAnyCacheLoading;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    // T024: Trigger cache checks for stale-while-revalidate pattern
    // Dashboard relies on trucks and groups data being up-to-date
    this.facade.checkTrucksCache();
    this.facade.checkGroupsCache();

    this.loading.set(true);
    this.error.set(null);

    this.statsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
        this.error.set('Failed to load dashboard statistics. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
