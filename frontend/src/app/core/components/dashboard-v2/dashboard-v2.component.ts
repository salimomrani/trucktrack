import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { StoreFacade } from '../../../store/store.facade';

interface KpiCard {
  icon: string;
  labelKey: string;
  value: number | string;
  trend?: number;
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
 */
@Component({
  selector: 'app-dashboard-v2',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './dashboard-v2.component.html',
  styleUrl: './dashboard-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardV2Component {
  private readonly facade = inject(StoreFacade);

  // Data from store
  readonly trucks = this.facade.trucks;
  readonly currentUser = this.facade.currentUser;

  // Computed KPIs
  readonly totalTrucks = computed(() => this.trucks()?.length ?? 0);
  readonly activeTrucks = computed(() =>
    this.trucks()?.filter(t => t.status === 'ACTIVE').length ?? 0
  );
  readonly idleTrucks = computed(() =>
    this.trucks()?.filter(t => t.status === 'IDLE').length ?? 0
  );
  readonly offlineTrucks = computed(() =>
    this.trucks()?.filter(t => t.status === 'OFFLINE').length ?? 0
  );

  // KPI Cards configuration
  readonly kpiCards = computed<KpiCard[]>(() => [
    {
      icon: 'local_shipping',
      labelKey: 'DASHBOARD.TOTAL_TRUCKS',
      value: this.totalTrucks(),
      trend: 12,
      trendLabel: 'vs last month',
      color: 'primary'
    },
    {
      icon: 'play_circle',
      labelKey: 'DASHBOARD.ACTIVE_TRUCKS',
      value: this.activeTrucks(),
      trend: 8,
      trendLabel: 'currently moving',
      color: 'success'
    },
    {
      icon: 'route',
      labelKey: 'DASHBOARD.TRIPS_TODAY',
      value: 24,
      trend: -3,
      trendLabel: 'vs yesterday',
      color: 'info'
    },
    {
      icon: 'warning',
      labelKey: 'DASHBOARD.ALERTS_TODAY',
      value: 3,
      trend: 2,
      trendLabel: 'new alerts',
      color: 'warning'
    }
  ]);

  // Fleet status breakdown
  readonly fleetStatus = computed<StatusItem[]>(() => {
    const total = this.totalTrucks() || 1;
    return [
      {
        label: 'Active',
        count: this.activeTrucks(),
        color: '#10b981',
        percentage: Math.round((this.activeTrucks() / total) * 100)
      },
      {
        label: 'Idle',
        count: this.idleTrucks(),
        color: '#f59e0b',
        percentage: Math.round((this.idleTrucks() / total) * 100)
      },
      {
        label: 'Offline',
        count: this.offlineTrucks(),
        color: '#ef4444',
        percentage: Math.round((this.offlineTrucks() / total) * 100)
      }
    ];
  });

  // Recent activity mock data
  readonly recentActivity = [
    { type: 'trip_start', truck: 'TRK-001', time: '5 min ago', icon: 'play_arrow' },
    { type: 'delivery', truck: 'TRK-003', time: '12 min ago', icon: 'check_circle' },
    { type: 'alert', truck: 'TRK-007', time: '18 min ago', icon: 'warning' },
    { type: 'trip_end', truck: 'TRK-002', time: '25 min ago', icon: 'stop' },
    { type: 'maintenance', truck: 'TRK-005', time: '1 hour ago', icon: 'build' }
  ];

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
