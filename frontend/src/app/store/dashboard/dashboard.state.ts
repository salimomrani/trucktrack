/**
 * T007: Dashboard NgRx state interface
 * Feature: 022-dashboard-real-data
 */

// ============================================
// Data Models
// ============================================

export interface DashboardKpi {
  totalTrucks: number;
  activeTrucks: number;
  tripsToday: number;
  alertsUnread: number;
  totalTrucksTrend: number | null;
  activeTrucksTrend: number | null;
  tripsTodayTrend: number | null;
  alertsTrend: number | null;
}

export interface FleetStatus {
  total: number;
  active: number;
  idle: number;
  offline: number;
  activePercent: number | null;
  idlePercent: number | null;
  offlinePercent: number | null;
}

export type ActivityType =
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'DELIVERY_CONFIRMED'
  | 'ALERT_TRIGGERED'
  | 'MAINTENANCE_SCHEDULED';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  truckId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  tripCompletionRate: number;
  onTimeDelivery: number;
  fleetUtilization: number;
  driverSatisfaction: number | null;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
}

export interface DashboardData {
  kpis: DashboardKpi;
  fleetStatus: FleetStatus;
  recentActivity: ActivityEvent[];
  performance: PerformanceMetrics;
  generatedAt: string;
  userId: string;
}

// ============================================
// Section State Interface
// ============================================

export interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// ============================================
// Dashboard State Interface
// ============================================

export interface DashboardState {
  kpis: SectionState<DashboardKpi>;
  fleetStatus: SectionState<FleetStatus>;
  activity: {
    data: ActivityEvent[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  performance: SectionState<PerformanceMetrics> & {
    selectedPeriod: 'week' | 'month';
  };
  refreshing: boolean;
}

// ============================================
// Initial State
// ============================================

export const initialDashboardState: DashboardState = {
  kpis: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  fleetStatus: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  activity: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  },
  performance: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    selectedPeriod: 'week'
  },
  refreshing: false
};
