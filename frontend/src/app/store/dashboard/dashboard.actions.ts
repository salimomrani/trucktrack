import { createAction, props } from '@ngrx/store';
import {
  DashboardKpi,
  FleetStatus,
  ActivityEvent,
  PerformanceMetrics,
  DashboardData
} from './dashboard.state';

/**
 * T006: Dashboard NgRx actions
 * Feature: 022-dashboard-real-data
 */

// ============================================
// Load All Dashboard Data (aggregated endpoint)
// ============================================

export const loadAllDashboardData = createAction(
  '[Dashboard] Load All Dashboard Data',
  props<{ performancePeriod?: 'week' | 'month' }>()
);

export const loadAllDashboardDataSuccess = createAction(
  '[Dashboard] Load All Dashboard Data Success',
  props<{ data: DashboardData }>()
);

export const loadAllDashboardDataFailure = createAction(
  '[Dashboard] Load All Dashboard Data Failure',
  props<{ error: string }>()
);

// ============================================
// KPIs Section
// ============================================

export const loadKpis = createAction(
  '[Dashboard] Load KPIs'
);

export const loadKpisSuccess = createAction(
  '[Dashboard] Load KPIs Success',
  props<{ kpis: DashboardKpi }>()
);

export const loadKpisFailure = createAction(
  '[Dashboard] Load KPIs Failure',
  props<{ error: string }>()
);

// ============================================
// Fleet Status Section
// ============================================

export const loadFleetStatus = createAction(
  '[Dashboard] Load Fleet Status'
);

export const loadFleetStatusSuccess = createAction(
  '[Dashboard] Load Fleet Status Success',
  props<{ fleetStatus: FleetStatus }>()
);

export const loadFleetStatusFailure = createAction(
  '[Dashboard] Load Fleet Status Failure',
  props<{ error: string }>()
);

// ============================================
// Recent Activity Section
// ============================================

export const loadActivity = createAction(
  '[Dashboard] Load Activity',
  props<{ limit?: number }>()
);

export const loadActivitySuccess = createAction(
  '[Dashboard] Load Activity Success',
  props<{ activity: ActivityEvent[] }>()
);

export const loadActivityFailure = createAction(
  '[Dashboard] Load Activity Failure',
  props<{ error: string }>()
);

// ============================================
// Performance Metrics Section
// ============================================

export const loadPerformance = createAction(
  '[Dashboard] Load Performance',
  props<{ period: 'week' | 'month' }>()
);

export const loadPerformanceSuccess = createAction(
  '[Dashboard] Load Performance Success',
  props<{ performance: PerformanceMetrics }>()
);

export const loadPerformanceFailure = createAction(
  '[Dashboard] Load Performance Failure',
  props<{ error: string }>()
);

export const setPerformancePeriod = createAction(
  '[Dashboard] Set Performance Period',
  props<{ period: 'week' | 'month' }>()
);

// ============================================
// Refresh Actions
// ============================================

export const refreshDashboard = createAction(
  '[Dashboard] Refresh Dashboard'
);

export const refreshDashboardComplete = createAction(
  '[Dashboard] Refresh Dashboard Complete'
);

// ============================================
// Clear Actions
// ============================================

export const clearDashboard = createAction(
  '[Dashboard] Clear Dashboard'
);
