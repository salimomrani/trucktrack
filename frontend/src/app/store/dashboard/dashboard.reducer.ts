import { createReducer, on } from '@ngrx/store';
import * as DashboardActions from './dashboard.actions';
import { initialDashboardState } from './dashboard.state';

/**
 * T008: Dashboard NgRx reducer
 * Feature: 022-dashboard-real-data
 */
export const dashboardReducer = createReducer(
  initialDashboardState,

  // ============================================
  // Load All Dashboard Data
  // ============================================

  on(DashboardActions.loadAllDashboardData, (state) => ({
    ...state,
    kpis: { ...state.kpis, loading: true, error: null },
    fleetStatus: { ...state.fleetStatus, loading: true, error: null },
    activity: { ...state.activity, loading: true, error: null },
    performance: { ...state.performance, loading: true, error: null }
  })),

  on(DashboardActions.loadAllDashboardDataSuccess, (state, { data }) => {
    const now = new Date().toISOString();
    return {
      ...state,
      kpis: {
        data: data.kpis,
        loading: false,
        error: null,
        lastUpdated: now
      },
      fleetStatus: {
        data: data.fleetStatus,
        loading: false,
        error: null,
        lastUpdated: now
      },
      activity: {
        data: data.recentActivity,
        loading: false,
        error: null,
        lastUpdated: now
      },
      performance: {
        ...state.performance,
        data: data.performance,
        loading: false,
        error: null,
        lastUpdated: now
      },
      refreshing: false
    };
  }),

  on(DashboardActions.loadAllDashboardDataFailure, (state, { error }) => ({
    ...state,
    kpis: { ...state.kpis, loading: false, error },
    fleetStatus: { ...state.fleetStatus, loading: false, error },
    activity: { ...state.activity, loading: false, error },
    performance: { ...state.performance, loading: false, error },
    refreshing: false
  })),

  // ============================================
  // KPIs Section
  // ============================================

  on(DashboardActions.loadKpis, (state) => ({
    ...state,
    kpis: { ...state.kpis, loading: true, error: null }
  })),

  on(DashboardActions.loadKpisSuccess, (state, { kpis }) => ({
    ...state,
    kpis: {
      data: kpis,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    }
  })),

  on(DashboardActions.loadKpisFailure, (state, { error }) => ({
    ...state,
    kpis: { ...state.kpis, loading: false, error }
  })),

  // ============================================
  // Fleet Status Section
  // ============================================

  on(DashboardActions.loadFleetStatus, (state) => ({
    ...state,
    fleetStatus: { ...state.fleetStatus, loading: true, error: null }
  })),

  on(DashboardActions.loadFleetStatusSuccess, (state, { fleetStatus }) => ({
    ...state,
    fleetStatus: {
      data: fleetStatus,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    }
  })),

  on(DashboardActions.loadFleetStatusFailure, (state, { error }) => ({
    ...state,
    fleetStatus: { ...state.fleetStatus, loading: false, error }
  })),

  // ============================================
  // Activity Section
  // ============================================

  on(DashboardActions.loadActivity, (state) => ({
    ...state,
    activity: { ...state.activity, loading: true, error: null }
  })),

  on(DashboardActions.loadActivitySuccess, (state, { activity }) => ({
    ...state,
    activity: {
      data: activity,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    }
  })),

  on(DashboardActions.loadActivityFailure, (state, { error }) => ({
    ...state,
    activity: { ...state.activity, loading: false, error }
  })),

  // ============================================
  // Performance Section
  // ============================================

  on(DashboardActions.loadPerformance, (state) => ({
    ...state,
    performance: { ...state.performance, loading: true, error: null }
  })),

  on(DashboardActions.loadPerformanceSuccess, (state, { performance }) => ({
    ...state,
    performance: {
      ...state.performance,
      data: performance,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString()
    }
  })),

  on(DashboardActions.loadPerformanceFailure, (state, { error }) => ({
    ...state,
    performance: { ...state.performance, loading: false, error }
  })),

  on(DashboardActions.setPerformancePeriod, (state, { period }) => ({
    ...state,
    performance: { ...state.performance, selectedPeriod: period }
  })),

  // ============================================
  // Refresh Actions
  // ============================================

  on(DashboardActions.refreshDashboard, (state) => ({
    ...state,
    refreshing: true
  })),

  on(DashboardActions.refreshDashboardComplete, (state) => ({
    ...state,
    refreshing: false
  })),

  // ============================================
  // Clear Dashboard
  // ============================================

  on(DashboardActions.clearDashboard, () => initialDashboardState)
);
