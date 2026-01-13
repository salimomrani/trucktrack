import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DashboardState } from './dashboard.state';

/**
 * T009: Dashboard NgRx selectors
 * Feature: 022-dashboard-real-data
 */

// ============================================
// Feature Selector
// ============================================

export const selectDashboardState = createFeatureSelector<DashboardState>('dashboard');

// ============================================
// KPIs Selectors
// ============================================

export const selectKpisState = createSelector(
  selectDashboardState,
  (state) => state.kpis
);

export const selectKpis = createSelector(
  selectKpisState,
  (state) => state.data
);

export const selectKpisLoading = createSelector(
  selectKpisState,
  (state) => state.loading
);

export const selectKpisError = createSelector(
  selectKpisState,
  (state) => state.error
);

export const selectKpisLastUpdated = createSelector(
  selectKpisState,
  (state) => state.lastUpdated
);

// ============================================
// Fleet Status Selectors
// ============================================

export const selectFleetStatusState = createSelector(
  selectDashboardState,
  (state) => state.fleetStatus
);

export const selectFleetStatus = createSelector(
  selectFleetStatusState,
  (state) => state.data
);

export const selectFleetStatusLoading = createSelector(
  selectFleetStatusState,
  (state) => state.loading
);

export const selectFleetStatusError = createSelector(
  selectFleetStatusState,
  (state) => state.error
);

// ============================================
// Activity Selectors
// ============================================

export const selectActivityState = createSelector(
  selectDashboardState,
  (state) => state.activity
);

export const selectActivity = createSelector(
  selectActivityState,
  (state) => state.data
);

export const selectActivityLoading = createSelector(
  selectActivityState,
  (state) => state.loading
);

export const selectActivityError = createSelector(
  selectActivityState,
  (state) => state.error
);

export const selectHasActivity = createSelector(
  selectActivity,
  (activity) => activity.length > 0
);

// ============================================
// Performance Selectors
// ============================================

export const selectPerformanceState = createSelector(
  selectDashboardState,
  (state) => state.performance
);

export const selectPerformance = createSelector(
  selectPerformanceState,
  (state) => state.data
);

export const selectPerformanceLoading = createSelector(
  selectPerformanceState,
  (state) => state.loading
);

export const selectPerformanceError = createSelector(
  selectPerformanceState,
  (state) => state.error
);

export const selectPerformancePeriod = createSelector(
  selectPerformanceState,
  (state) => state.selectedPeriod
);

// ============================================
// Global Dashboard Selectors
// ============================================

export const selectDashboardRefreshing = createSelector(
  selectDashboardState,
  (state) => state.refreshing
);

export const selectAnyLoading = createSelector(
  selectKpisLoading,
  selectFleetStatusLoading,
  selectActivityLoading,
  selectPerformanceLoading,
  (kpis, fleet, activity, perf) => kpis || fleet || activity || perf
);

export const selectAnyError = createSelector(
  selectKpisError,
  selectFleetStatusError,
  selectActivityError,
  selectPerformanceError,
  (kpis, fleet, activity, perf) => kpis || fleet || activity || perf
);

// ============================================
// Computed Selectors for UI
// ============================================

export const selectFleetStatusChartData = createSelector(
  selectFleetStatus,
  (status) => {
    if (!status) return [];
    return [
      { name: 'Active', value: status.active, color: '#22c55e' },
      { name: 'Idle', value: status.idle, color: '#eab308' },
      { name: 'Offline', value: status.offline, color: '#6b7280' }
    ].filter(item => item.value > 0);
  }
);

/**
 * T022: KPI Cards formatted for dashboard UI.
 * Returns cards with translation keys, colors, and trend labels.
 */
export const selectKpiCards = createSelector(
  selectKpis,
  (kpis) => {
    if (!kpis) return [];
    return [
      {
        icon: 'local_shipping',
        labelKey: 'DASHBOARD.TOTAL_TRUCKS',
        value: kpis.totalTrucks,
        trend: kpis.totalTrucksTrend,
        trendLabel: 'vs last month',
        color: 'primary' as const
      },
      {
        icon: 'play_circle',
        labelKey: 'DASHBOARD.ACTIVE_TRUCKS',
        value: kpis.activeTrucks,
        trend: kpis.activeTrucksTrend,
        trendLabel: 'currently moving',
        color: 'success' as const
      },
      {
        icon: 'route',
        labelKey: 'DASHBOARD.TRIPS_TODAY',
        value: kpis.tripsToday,
        trend: kpis.tripsTodayTrend,
        trendLabel: 'vs yesterday',
        color: 'info' as const
      },
      {
        icon: 'warning',
        labelKey: 'DASHBOARD.ALERTS_TODAY',
        value: kpis.alertsUnread,
        trend: kpis.alertsTrend,
        trendLabel: 'new alerts',
        color: 'warning' as const
      }
    ];
  }
);
