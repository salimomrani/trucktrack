// Period types
export type PeriodType = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export interface PeriodInfo {
  type: PeriodType;
  startDate: string; // ISO date
  endDate: string;
  daysCount: number;
}

// Entity types
export type EntityType = 'TRUCK' | 'GROUP' | 'FLEET';

export interface EntityInfo {
  type: EntityType;
  id: string | null;
  name: string;
  truckCount: number;
}

// KPI Response
export interface FleetKPI {
  period: PeriodInfo;
  entity: EntityInfo;
  totalDistanceKm: number;
  drivingTimeMinutes: number;
  idleTimeMinutes: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  alertCount: number;
  geofenceEntries: number;
  geofenceExits: number;
}

// Daily Metrics (for line chart)
export interface DailyDataPoint {
  date: string;
  distanceKm: number;
  drivingTimeMinutes: number;
  alertCount: number;
}

export interface DailyMetrics {
  period: PeriodInfo;
  entity: EntityInfo;
  dailyData: DailyDataPoint[];
}

// Alert Breakdown (for pie chart)
export interface AlertTypeCount {
  alertType: string;
  count: number;
  percentage: number;
}

export interface AlertBreakdown {
  period: PeriodInfo;
  entity: EntityInfo;
  totalAlerts: number;
  breakdown: AlertTypeCount[];
}

// Truck Ranking (for bar chart)
export interface TruckRankEntry {
  rank: number;
  truckId: string;
  truckName: string;
  licensePlate: string;
  value: number;
  unit: string;
}

export type RankingMetric = 'DISTANCE' | 'DRIVING_TIME' | 'ALERTS';

export interface TruckRanking {
  period: PeriodInfo;
  metric: RankingMetric;
  ranking: TruckRankEntry[];
  limit: number;
}

// Filter State
export interface AnalyticsFilter {
  periodType: PeriodType;
  customStartDate?: string;
  customEndDate?: string;
  entityType: EntityType;
  entityId?: string;
}

// Export types
export type ExportFormat = 'PDF' | 'EXCEL';

// KPI display configuration
export interface KpiCardConfig {
  key: keyof FleetKPI;
  label: string;
  icon: string;
  unit: string;
  formatter: (value: number) => string;
}
