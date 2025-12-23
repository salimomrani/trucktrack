# Data Model: Fleet Analytics Dashboard

**Feature**: 006-fleet-analytics
**Date**: 2025-12-23

---

## Backend DTOs (Java)

### FleetKPIResponse

Response DTO for aggregated fleet KPIs.

| Field | Type | Description |
|-------|------|-------------|
| period | PeriodInfo | Selected period details |
| entity | EntityInfo | Selected entity (truck/group/fleet) |
| totalDistanceKm | Double | Total distance traveled in kilometers |
| drivingTimeMinutes | Long | Total driving time in minutes |
| idleTimeMinutes | Long | Total idle time in minutes |
| avgSpeedKmh | Double | Average speed in km/h (when moving) |
| maxSpeedKmh | Double | Maximum recorded speed |
| alertCount | Integer | Total alerts triggered |
| geofenceEntries | Integer | Number of geofence entry events |
| geofenceExits | Integer | Number of geofence exit events |

### PeriodInfo

Embedded object for period details.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Period type: TODAY, WEEK, MONTH, CUSTOM |
| startDate | LocalDate | Period start date |
| endDate | LocalDate | Period end date |
| daysCount | Integer | Number of days in period |

### EntityInfo

Embedded object for entity details.

| Field | Type | Description |
|-------|------|-------------|
| type | String | Entity type: TRUCK, GROUP, FLEET |
| id | UUID | Entity ID (null for FLEET) |
| name | String | Display name |
| truckCount | Integer | Number of trucks included |

### DailyMetricsResponse

Response DTO for daily metrics (chart data).

| Field | Type | Description |
|-------|------|-------------|
| period | PeriodInfo | Selected period |
| entity | EntityInfo | Selected entity |
| dailyData | List\<DailyDataPoint\> | List of daily data points |

### DailyDataPoint

| Field | Type | Description |
|-------|------|-------------|
| date | LocalDate | Day |
| distanceKm | Double | Distance traveled on this day |
| drivingTimeMinutes | Long | Driving time on this day |
| alertCount | Integer | Alerts on this day |

### AlertBreakdownResponse

Response DTO for alert distribution (pie chart).

| Field | Type | Description |
|-------|------|-------------|
| period | PeriodInfo | Selected period |
| entity | EntityInfo | Selected entity |
| totalAlerts | Integer | Total alert count |
| breakdown | List\<AlertTypeCount\> | Alerts by type |

### AlertTypeCount

| Field | Type | Description |
|-------|------|-------------|
| alertType | String | Alert type: SPEED, GEOFENCE, IDLE, etc. |
| count | Integer | Number of alerts of this type |
| percentage | Double | Percentage of total (0-100) |

### TruckRankingResponse

Response DTO for truck ranking (bar chart).

| Field | Type | Description |
|-------|------|-------------|
| period | PeriodInfo | Selected period |
| metric | String | Metric used for ranking: DISTANCE, DRIVING_TIME, ALERTS |
| ranking | List\<TruckRankEntry\> | Top trucks |
| limit | Integer | Number of trucks returned |

### TruckRankEntry

| Field | Type | Description |
|-------|------|-------------|
| rank | Integer | Position (1 = top) |
| truckId | UUID | Truck ID |
| truckName | String | Truck display name |
| licensePlate | String | License plate |
| value | Double | Metric value |
| unit | String | Unit (km, hours, count) |

---

## Frontend Models (TypeScript)

### analytics.model.ts

```typescript
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

export interface TruckRanking {
  period: PeriodInfo;
  metric: 'DISTANCE' | 'DRIVING_TIME' | 'ALERTS';
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
```

---

## Database Views (PostgreSQL)

### daily_truck_metrics (Materialized View)

Pre-computed daily aggregates for performance.

| Column | Type | Description |
|--------|------|-------------|
| truck_id | UUID | Reference to trucks table |
| day | DATE | Aggregation date |
| total_distance_km | DOUBLE PRECISION | Sum of distances |
| driving_minutes | INTEGER | Minutes with status ACTIVE |
| idle_minutes | INTEGER | Minutes with status IDLE |
| max_speed | DOUBLE PRECISION | Maximum speed recorded |
| avg_speed | DOUBLE PRECISION | Average speed (when > 0) |
| position_count | INTEGER | Number of GPS points |

**Indexes**:
- `idx_daily_metrics_truck_day` on (truck_id, day)
- `idx_daily_metrics_day` on (day)

**Refresh Schedule**: Nightly at 02:00 UTC

---

## Relationships

```text
┌─────────────────┐
│  AnalyticsAPI   │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐      ┌──────────────────┐
│ AnalyticsService│─────▶│ AnalyticsRepo    │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        ▼
         │               ┌──────────────────┐
         │               │ daily_truck_     │
         │               │ metrics (view)   │
         │               └────────┬─────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│ Group/Truck     │      │ gps_positions    │
│ Permissions     │      │ (partitioned)    │
└─────────────────┘      └──────────────────┘
```

---

## Validation Rules

| DTO | Field | Rule |
|-----|-------|------|
| PeriodInfo | startDate | Must not be in the future |
| PeriodInfo | endDate | Must be >= startDate |
| PeriodInfo | daysCount | Max 365 days for performance |
| EntityInfo | id | Required if type != FLEET |
| TruckRanking | limit | Default 10, max 50 |

---

## Caching Keys (Redis)

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `analytics:kpi:{userId}:{entityType}:{entityId}:{start}:{end}` | 5min (today) / 1hr (historical) | Full KPI response |
| `analytics:daily:{userId}:{entityType}:{entityId}:{start}:{end}` | 5min / 1hr | Daily metrics |
| `analytics:alerts:{userId}:{entityType}:{entityId}:{start}:{end}` | 5min / 1hr | Alert breakdown |
| `analytics:ranking:{userId}:{metric}:{start}:{end}:{limit}` | 5min / 1hr | Truck ranking |
