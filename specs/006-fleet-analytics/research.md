# Research: Fleet Analytics Dashboard

**Feature**: 006-fleet-analytics
**Date**: 2025-12-23

---

## 1. Charting Library for Angular

### Decision
**ngx-charts** (Swimlane)

### Rationale
- Native Angular library with declarative components
- Good TypeScript support and Angular 21 compatibility
- Built-in responsive design
- Supports all required chart types: line, bar, pie
- Active maintenance and good documentation
- Lightweight compared to alternatives

### Alternatives Considered

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Chart.js + ng2-charts** | Popular, lightweight | Wrapper around non-Angular lib, less Angular-native | Rejected |
| **Apache ECharts** | Feature-rich, performant | Overkill for our needs, steeper learning curve | Rejected |
| **Highcharts** | Enterprise-grade | Commercial license required | Rejected |
| **D3.js** | Maximum flexibility | Too low-level, significant dev time | Rejected |

---

## 2. PDF Export Library

### Decision
**jsPDF + html2canvas**

### Rationale
- Client-side generation (no server load)
- jsPDF for PDF creation, html2canvas for chart snapshots
- Well-documented, widely used
- Free and open source
- Works with Angular

### Alternatives Considered

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **pdfmake** | Good table support | Complex API, less suited for chart capture | Rejected |
| **Puppeteer (server)** | Perfect rendering | Requires server-side Node.js, added complexity | Rejected |
| **html-pdf** | Simple | Deprecated, security issues | Rejected |

---

## 3. Excel Export Library

### Decision
**xlsx (SheetJS)**

### Rationale
- Client-side Excel file generation
- Creates native .xlsx files (not CSV)
- Supports formatting, multiple sheets
- Widely used and maintained
- Free community edition sufficient

### Alternatives Considered

| Library | Pros | Cons | Verdict |
|---------|------|------|---------|
| **ExcelJS** | Good formatting | Larger bundle size | Rejected |
| **CSV export** | Simple | Not true Excel, formatting issues | Rejected |
| **Server-side Apache POI** | Full Excel features | Adds server complexity | Rejected |

---

## 4. Distance Calculation

### Decision
**Haversine formula with PostGIS ST_DistanceSphere**

### Rationale
- PostGIS already installed (used for geofences)
- ST_DistanceSphere provides accurate great-circle distance
- Calculation at database level = better performance
- Handles edge cases (antimeridian, poles)

### Implementation
```sql
SELECT SUM(
  ST_DistanceSphere(
    ST_MakePoint(prev.longitude, prev.latitude),
    ST_MakePoint(curr.longitude, curr.latitude)
  )
) / 1000 as total_km
FROM gps_positions curr
JOIN LATERAL (
  SELECT longitude, latitude
  FROM gps_positions
  WHERE truck_id = curr.truck_id
    AND timestamp < curr.timestamp
  ORDER BY timestamp DESC
  LIMIT 1
) prev ON true
WHERE curr.truck_id = ? AND curr.timestamp BETWEEN ? AND ?
```

---

## 5. KPI Caching Strategy

### Decision
**Redis cache with time-based invalidation**

### Rationale
- Aggregation queries on large datasets are expensive
- Same KPIs requested multiple times per session
- Redis already in infrastructure
- Cache by: period + entity (truck/group/fleet) + user permissions hash

### Cache Policy
- **TTL**: 5 minutes for "today", 1 hour for historical periods
- **Key pattern**: `analytics:kpi:{userId}:{entityType}:{entityId}:{startDate}:{endDate}`
- **Invalidation**: On GPS data ingestion (optional, only for "today" cache)

---

## 6. Query Optimization for Large Datasets

### Decision
**Materialized views for common aggregations + partition pruning**

### Rationale
- gps_positions table is partitioned by timestamp (already exists)
- Daily aggregation can be pre-computed nightly
- Partition pruning reduces scan to relevant date range

### Implementation
```sql
-- Daily aggregates (materialized view, refreshed nightly)
CREATE MATERIALIZED VIEW daily_truck_metrics AS
SELECT
  truck_id,
  date_trunc('day', timestamp) as day,
  SUM(distance_km) as total_distance,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_points,
  MAX(speed) as max_speed,
  AVG(speed) FILTER (WHERE speed > 0) as avg_speed
FROM gps_positions
GROUP BY truck_id, date_trunc('day', timestamp);

-- Index for fast lookups
CREATE INDEX idx_daily_metrics_truck_day ON daily_truck_metrics(truck_id, day);
```

---

## 7. Group-Based Access Control

### Decision
**Reuse existing group permission system from auth-service**

### Rationale
- User-group-truck relationships already defined
- GatewayUserPrincipal provides user's group IDs
- Filter queries by user's accessible trucks

### Implementation
```java
// In AnalyticsService
List<UUID> accessibleTruckIds = getAccessibleTruckIds(principal);

// In SQL
WHERE truck_id IN (:accessibleTruckIds)
```

---

## 8. API Design Pattern

### Decision
**Single endpoint with query parameters for flexibility**

### Rationale
- Reduces number of API calls (one request for all KPIs)
- Query parameters for filtering (period, entity, metrics)
- Easier caching (cache full response)

### Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/analytics/kpis` | All KPIs for period/entity |
| `GET /api/v1/analytics/daily-metrics` | Daily data for charts |
| `GET /api/v1/analytics/alert-breakdown` | Alerts by type |
| `GET /api/v1/analytics/truck-ranking` | Top trucks by metric |

---

## 9. Frontend State Management

### Decision
**Local component state with signals (no NgRx for analytics)**

### Rationale
- Analytics data is ephemeral (not shared across pages)
- No need for time-travel debugging
- Signals provide reactivity with less boilerplate
- Simpler to implement and maintain

### Implementation
```typescript
// In AnalyticsComponent
readonly kpis = signal<FleetKPI | null>(null);
readonly isLoading = signal(false);
readonly selectedPeriod = signal<Period>('week');
```

---

## 10. Responsive Dashboard Layout

### Decision
**CSS Grid with Angular CDK BreakpointObserver**

### Rationale
- Already used in existing components
- Consistent with admin panel layout
- Grid provides flexibility for widget arrangement

### Breakpoints
| Screen | KPI Cards | Charts |
|--------|-----------|--------|
| Mobile (<600px) | 1 column, stacked | Full width, stacked |
| Tablet (600-1024px) | 2 columns | 2 columns |
| Desktop (>1024px) | 4 columns | 2x2 grid |

---

## Summary of Technology Choices

| Component | Technology | Justification |
|-----------|------------|---------------|
| Charts | ngx-charts | Native Angular, all chart types |
| PDF Export | jsPDF + html2canvas | Client-side, free |
| Excel Export | xlsx (SheetJS) | Client-side, native .xlsx |
| Distance Calc | PostGIS ST_DistanceSphere | DB-level, accurate |
| Caching | Redis | Already in stack, fast |
| Query Optimization | Materialized views | Pre-computed aggregates |
| State Management | Angular Signals | Simple, no Redux overhead |
