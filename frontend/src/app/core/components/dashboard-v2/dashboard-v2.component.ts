import { Component, inject, ChangeDetectionStrategy, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { StoreFacade } from '../../../store/store.facade';

interface KpiCard {
  icon: string;
  labelKey: string;
  value: number | string;
  trend?: number | null;
  trendLabel?: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

interface StatusItem {
  label: string;
  count: number;
  color: string;
  percentage: number;
}

/**
 * DashboardV2 - Industrial Command Center Dashboard
 * Modern KPI dashboard with real-time metrics visualization
 *
 * T023: Updated to use real KPI data from NgRx store
 * T030: Updated to use real Fleet Status data from NgRx store
 * Feature: 022-dashboard-real-data
 */
@Component({
  selector: 'app-dashboard-v2',
  standalone: true,
  imports: [TranslateModule, DecimalPipe],
  templateUrl: './dashboard-v2.component.html',
  styleUrl: './dashboard-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardV2Component implements OnInit {
  private readonly facade = inject(StoreFacade);

  // User from store
  readonly currentUser = this.facade.currentUser;

  // T023: KPI data from dashboard store
  readonly kpiCards = this.facade.dashboardKpiCards as unknown as ReturnType<typeof computed<KpiCard[]>>;
  readonly kpisLoading = this.facade.dashboardKpisLoading;
  readonly kpisError = this.facade.dashboardKpisError;

  // T030: Fleet Status data from dashboard store
  readonly fleetStatusData = this.facade.dashboardFleetStatus;
  readonly fleetStatusLoading = this.facade.dashboardFleetStatusLoading;
  readonly fleetStatusError = this.facade.dashboardFleetStatusError;

  // T038: Activity data from dashboard store
  readonly activityData = this.facade.dashboardActivity;
  readonly activityLoading = this.facade.dashboardActivityLoading;
  readonly activityError = this.facade.dashboardActivityError;
  readonly hasActivity = this.facade.dashboardHasActivity;

  // T046: Performance data from dashboard store
  readonly performanceData = this.facade.dashboardPerformance;
  readonly performanceLoading = this.facade.dashboardPerformanceLoading;
  readonly performanceError = this.facade.dashboardPerformanceError;
  readonly performancePeriod = this.facade.dashboardPerformancePeriod;

  // Computed values from fleet status
  readonly totalTrucks = computed(() => this.fleetStatusData()?.total ?? 0);
  readonly activeTrucks = computed(() => this.fleetStatusData()?.active ?? 0);
  readonly idleTrucks = computed(() => this.fleetStatusData()?.idle ?? 0);
  readonly offlineTrucks = computed(() => this.fleetStatusData()?.offline ?? 0);

  // T032: Check for empty state (0 trucks)
  readonly hasNoTrucks = computed(() => this.totalTrucks() === 0);

  // Dashboard loading states
  readonly isRefreshing = this.facade.dashboardRefreshing;

  ngOnInit(): void {
    // Load dashboard data on component init
    this.facade.loadDashboardKpis();
    this.facade.loadDashboardFleetStatus();
    this.facade.loadDashboardActivity(5);
    this.facade.loadDashboardPerformance('week');
  }

  /**
   * Retry loading KPIs after an error
   */
  retryLoadKpis(): void {
    this.facade.loadDashboardKpis();
  }

  /**
   * T033: Retry loading Fleet Status after an error
   */
  retryLoadFleetStatus(): void {
    this.facade.loadDashboardFleetStatus();
  }

  /**
   * T041: Retry loading Activity after an error
   */
  retryLoadActivity(): void {
    this.facade.loadDashboardActivity(5);
  }

  /**
   * T050: Retry loading Performance after an error
   */
  retryLoadPerformance(): void {
    const period = this.performancePeriod() ?? 'week';
    this.facade.loadDashboardPerformance(period);
  }

  /**
   * T049: Handle period selector change (week/month)
   */
  onPerformancePeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const period = select.value === 'This Month' ? 'month' : 'week';
    this.facade.loadDashboardPerformance(period);
  }

  /**
   * Refresh all dashboard data
   */
  refreshDashboard(): void {
    this.facade.refreshDashboard();
  }

  // Fleet status breakdown - uses real data from store
  readonly fleetStatus = computed<StatusItem[]>(() => {
    const data = this.fleetStatusData();
    if (!data) return [];

    return [
      {
        label: 'Active',
        count: data.active,
        color: '#10b981',
        percentage: Math.round(data.activePercent ?? 0)
      },
      {
        label: 'Idle',
        count: data.idle,
        color: '#f59e0b',
        percentage: Math.round(data.idlePercent ?? 0)
      },
      {
        label: 'Offline',
        count: data.offline,
        color: '#ef4444',
        percentage: Math.round(data.offlinePercent ?? 0)
      }
    ];
  });

  /**
   * T038: Map activity type to icon.
   */
  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      TRIP_STARTED: 'play_arrow',
      TRIP_COMPLETED: 'stop',
      DELIVERY_CONFIRMED: 'check_circle',
      ALERT_TRIGGERED: 'warning',
      MAINTENANCE_SCHEDULED: 'build'
    };
    return icons[type] || 'info';
  }

  /**
   * T038: Format relative time for activity.
   */
  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  getActivityLabel(type: string): string {
    const labels: Record<string, string> = {
      trip_start: 'Trip Started',
      trip_end: 'Trip Completed',
      delivery: 'Delivery Confirmed',
      alert: 'Alert Triggered',
      maintenance: 'Maintenance Scheduled'
    };
    return labels[type] || type;
  }

  getActivityColor(type: string): string {
    const colors: Record<string, string> = {
      trip_start: '#3b82f6',
      trip_end: '#10b981',
      delivery: '#10b981',
      alert: '#f59e0b',
      maintenance: '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  }

  getDonutOffset(index: number): number {
    const status = this.fleetStatus();
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += status[i].percentage * 2.51;
    }
    // Rotate to start from top (-90 degrees = 62.75 offset for r=40)
    return -offset + 62.75;
  }
}
