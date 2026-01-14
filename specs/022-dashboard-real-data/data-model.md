# Data Model: Dashboard Real Data Integration

**Feature**: 022-dashboard-real-data
**Date**: 2026-01-13

## Overview

Ce document définit les structures de données pour l'intégration des données réelles du dashboard. Pas de nouvelles tables - utilisation des entités existantes avec des DTOs pour l'agrégation.

## Entities (Existing - Reference Only)

### Truck (existing)
```
trucks
├── id: UUID (PK)
├── truck_identifier: VARCHAR
├── status: ENUM (ACTIVE, IDLE, OFFLINE, OUT_OF_SERVICE)
├── group_id: UUID (FK → truck_groups)
└── last_location_update: TIMESTAMP
```

### Trip (existing)
```
trips
├── id: UUID (PK)
├── truck_id: UUID (FK → trucks)
├── status: ENUM (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
├── scheduled_start: TIMESTAMP
├── scheduled_end: TIMESTAMP
├── actual_start: TIMESTAMP
├── actual_end: TIMESTAMP
└── created_at: TIMESTAMP
```

### Alert/Notification (existing)
```
notifications
├── id: UUID (PK)
├── user_id: UUID
├── type: VARCHAR
├── title: VARCHAR
├── message: TEXT
├── read: BOOLEAN
└── created_at: TIMESTAMP
```

## DTOs (New)

### DashboardKpiDTO
```typescript
interface DashboardKpiDTO {
  totalTrucks: number;           // Count of trucks in user's groups
  activeTrucks: number;          // Trucks with status=ACTIVE
  tripsToday: number;            // Trips created today
  alertsUnread: number;          // Unread alerts count

  // Trend indicators (vs previous period)
  totalTrucksTrend: number;      // % change vs last month
  activeTrucksTrend: number;     // % change vs yesterday
  tripsTodayTrend: number;       // % change vs yesterday
  alertsTrend: number;           // % change vs yesterday
}
```

### FleetStatusDTO
```typescript
interface FleetStatusDTO {
  total: number;
  active: number;
  idle: number;
  offline: number;

  // Percentages for chart
  activePercent: number;
  idlePercent: number;
  offlinePercent: number;
}
```

### ActivityEventDTO
```typescript
interface ActivityEventDTO {
  id: string;
  type: ActivityType;            // TRIP_STARTED, DELIVERY_CONFIRMED, ALERT_TRIGGERED, etc.
  title: string;                 // Display title
  truckId: string;               // Reference truck identifier (e.g., "TRK-001")
  timestamp: string;             // ISO 8601 format
  metadata?: Record<string, any>; // Additional context (alert type, etc.)
}

enum ActivityType {
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED'
}
```

### PerformanceMetricsDTO
```typescript
interface PerformanceMetricsDTO {
  tripCompletionRate: number;    // 0-100 percentage
  onTimeDelivery: number;        // 0-100 percentage
  fleetUtilization: number;      // 0-100 percentage
  driverSatisfaction: number | null; // null = "Coming Soon"

  // Period info
  periodStart: string;           // ISO 8601 date
  periodEnd: string;             // ISO 8601 date
  periodLabel: string;           // "This Week", "This Month"
}
```

### DashboardDataDTO (Aggregated Response)
```typescript
interface DashboardDataDTO {
  kpis: DashboardKpiDTO;
  fleetStatus: FleetStatusDTO;
  recentActivity: ActivityEventDTO[];
  performance: PerformanceMetricsDTO;

  // Metadata
  generatedAt: string;           // ISO 8601 timestamp
  userId: string;                // For audit/debugging
}
```

## State Model (Frontend NgRx)

### DashboardState
```typescript
interface DashboardState {
  // KPIs Section
  kpis: {
    data: DashboardKpiDTO | null;
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };

  // Fleet Status Section
  fleetStatus: {
    data: FleetStatusDTO | null;
    loading: boolean;
    error: string | null;
  };

  // Activity Section
  activity: {
    data: ActivityEventDTO[];
    loading: boolean;
    error: string | null;
  };

  // Performance Section
  performance: {
    data: PerformanceMetricsDTO | null;
    loading: boolean;
    error: string | null;
    selectedPeriod: 'week' | 'month';
  };

  // Global
  refreshing: boolean;
}
```

## Validation Rules

| Field | Rule |
|-------|------|
| All percentages | 0 ≤ value ≤ 100 |
| All counts | value ≥ 0 |
| Timestamps | Valid ISO 8601 format |
| Activity list | Max 5 items (limit enforced) |
| Truck IDs | Format: TRK-XXX |

## Relationships

```
User (authenticated)
  └── has access to → TruckGroups
                        └── contains → Trucks
                                        ├── has → Trips
                                        └── triggers → Alerts

Dashboard aggregates:
  - KPIs: COUNT(trucks), COUNT(trips WHERE today), COUNT(alerts WHERE unread)
  - FleetStatus: GROUP BY truck.status
  - Activity: UNION(trip_events, alert_events) ORDER BY timestamp DESC LIMIT 5
  - Performance: Calculated metrics over trips in period
```

## Notes

- Pas de nouvelles tables créées - toutes les données proviennent des entités existantes
- Les calculs d'agrégation sont effectués côté backend pour optimiser les performances
- Le frontend stocke les données dans NgRx pour permettre le refresh manuel
