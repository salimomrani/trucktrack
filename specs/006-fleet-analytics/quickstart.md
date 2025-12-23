# Quickstart: Fleet Analytics Dashboard

**Feature**: 006-fleet-analytics
**Date**: 2025-12-23

---

## Prerequisites

1. **Docker**: Running PostgreSQL, Redis, Kafka
2. **Backend**: auth-service and location-service running
3. **Frontend**: Angular dev server running
4. **Test Data**: GPS positions and alerts in database

---

## Quick Setup

```bash
# 1. Start infrastructure
cd /Users/salimomrani/code/java/kafka/truck_track
./start-docker.sh

# 2. Start backend services
cd backend/auth-service && mvn spring-boot:run &
cd backend/location-service && mvn spring-boot:run &

# 3. Start frontend
cd frontend && npm start
```

---

## Test Scenarios

### Scenario 1: View Fleet KPIs (US1)

**Goal**: Verify dashboard displays correct KPIs for the entire fleet.

**Steps**:
1. Login as `admin@trucktrack.com` (FLEET_MANAGER)
2. Navigate to `/analytics`
3. Select period: "7 derniers jours"
4. Verify filter is set to "Toute la flotte"

**Expected Results**:
- Dashboard loads in < 3 seconds
- KPIs displayed:
  - Distance totale (km)
  - Temps de conduite (heures)
  - Temps d'inactivité (heures)
  - Vitesse moyenne (km/h)
  - Vitesse maximale (km/h)
  - Nombre d'alertes
  - Entrées/sorties geofence

**API Call**:
```bash
curl -X GET "http://localhost:8082/api/v1/analytics/kpis?period=WEEK&entityType=FLEET" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario 2: Filter by Truck (US2)

**Goal**: Verify filtering by individual truck.

**Steps**:
1. From dashboard, click entity filter dropdown
2. Select "Camion" type
3. Choose a specific truck (e.g., "Truck-001")
4. Observe KPIs update

**Expected Results**:
- Filter dropdown shows only accessible trucks
- KPIs update within 2 seconds
- All values reflect selected truck only

**API Call**:
```bash
curl -X GET "http://localhost:8082/api/v1/analytics/kpis?period=WEEK&entityType=TRUCK&entityId=<truck-uuid>" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario 3: Filter by Group (US2)

**Goal**: Verify filtering by truck group.

**Steps**:
1. Select "Groupe" in entity filter
2. Choose a group (e.g., "Paris Fleet")
3. Verify KPIs aggregate all trucks in group

**Expected Results**:
- Only user's accessible groups shown
- Aggregated values for group trucks
- Truck count displayed in entity info

---

### Scenario 4: View Line Chart (US3)

**Goal**: Verify daily distance chart displays correctly.

**Steps**:
1. Set period to "30 derniers jours"
2. Look at distance line chart
3. Hover over data points

**Expected Results**:
- Chart shows one point per day
- Tooltip shows exact date and value
- Chart is responsive (resize window)

**API Call**:
```bash
curl -X GET "http://localhost:8082/api/v1/analytics/daily-metrics?period=MONTH&entityType=FLEET" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario 5: View Alert Pie Chart (US3)

**Goal**: Verify alert breakdown pie chart.

**Steps**:
1. Look at "Répartition des alertes" section
2. Hover over pie segments

**Expected Results**:
- Pie chart shows alert types
- Each segment has label and percentage
- Tooltip shows count on hover

**API Call**:
```bash
curl -X GET "http://localhost:8082/api/v1/analytics/alert-breakdown?period=WEEK&entityType=FLEET" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario 6: View Truck Ranking Bar Chart (US3)

**Goal**: Verify top trucks by distance bar chart.

**Steps**:
1. Look at "Top 10 Camions" section
2. Verify bars are sorted descending

**Expected Results**:
- Bar chart shows top 10 trucks
- Sorted by distance (highest first)
- Truck names displayed

**API Call**:
```bash
curl -X GET "http://localhost:8082/api/v1/analytics/truck-ranking?period=WEEK&metric=DISTANCE&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario 7: Export PDF (US4)

**Goal**: Verify PDF export contains dashboard data.

**Steps**:
1. Configure filters (period, entity)
2. Click "Exporter PDF"
3. Wait for download

**Expected Results**:
- PDF downloads within 10 seconds
- Contains all visible KPIs
- Contains chart snapshots
- Reflects applied filters

---

### Scenario 8: Export Excel (US4)

**Goal**: Verify Excel export contains raw data.

**Steps**:
1. Configure filters
2. Click "Exporter Excel"
3. Open downloaded file

**Expected Results**:
- .xlsx file downloads
- Columns: Date, Camion, Distance, Durée, Vitesse, Alertes
- Data matches applied filters
- Can be opened in Excel

---

### Scenario 9: Custom Period (US5)

**Goal**: Verify custom date range selection.

**Steps**:
1. Select "Personnalisé" in period filter
2. Choose start date: 2025-01-01
3. Choose end date: 2025-01-15
4. Apply filter

**Expected Results**:
- Date pickers appear
- Validation prevents end < start
- Dashboard updates with custom range

**API Call**:
```bash
curl -X GET "http://localhost:8082/api/v1/analytics/kpis?period=CUSTOM&startDate=2025-01-01&endDate=2025-01-15&entityType=FLEET" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario 10: No Data Period

**Goal**: Verify handling of periods with no data.

**Steps**:
1. Select a custom period in the distant past
2. Observe dashboard behavior

**Expected Results**:
- KPIs show "0" or "N/A"
- Message: "Aucune donnée pour cette période"
- Export buttons disabled or show message

---

### Scenario 11: Permission Filtering

**Goal**: Verify users only see accessible data.

**Steps**:
1. Login as user with limited group access
2. Open entity filter dropdown
3. Verify restricted visibility

**Expected Results**:
- Only assigned groups visible
- Only trucks from those groups visible
- "Toute la flotte" aggregates only accessible trucks

---

### Scenario 12: Responsive Layout

**Goal**: Verify mobile and tablet layouts.

**Steps**:
1. Open dashboard on desktop
2. Resize browser to tablet width (768px)
3. Resize to mobile width (375px)

**Expected Results**:
- Desktop: 4-column KPI grid, 2x2 chart grid
- Tablet: 2-column KPI grid, 2-column charts
- Mobile: 1-column stacked layout

---

## Test Data Setup

```sql
-- Create test trucks with positions
INSERT INTO trucks (id, name, license_plate, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Truck-001', 'AB-123-CD', 'ACTIVE'),
  ('22222222-2222-2222-2222-222222222222', 'Truck-002', 'EF-456-GH', 'ACTIVE');

-- Insert GPS positions for last 30 days
INSERT INTO gps_positions (id, truck_id, latitude, longitude, speed, timestamp, status)
SELECT
  gen_random_uuid(),
  t.id,
  48.8566 + random() * 0.1,
  2.3522 + random() * 0.1,
  30 + random() * 70,
  NOW() - (random() * interval '30 days'),
  CASE WHEN random() > 0.3 THEN 'ACTIVE' ELSE 'IDLE' END
FROM trucks t, generate_series(1, 1000);

-- Insert test alerts
INSERT INTO notifications (id, truck_id, type, timestamp, is_read)
SELECT
  gen_random_uuid(),
  t.id,
  (ARRAY['SPEED_VIOLATION', 'GEOFENCE_EXIT', 'IDLE_TOO_LONG'])[floor(random() * 3 + 1)],
  NOW() - (random() * interval '30 days'),
  false
FROM trucks t, generate_series(1, 50);
```

---

## Performance Benchmarks

| Scenario | Target | Acceptance |
|----------|--------|------------|
| Dashboard load (30 days, 50 trucks) | < 3s | MUST |
| API response (aggregation query) | < 500ms | MUST |
| Filter change update | < 2s | MUST |
| Chart interaction (hover) | < 100ms | SHOULD |
| PDF export | < 10s | MUST |
| Excel export | < 5s | SHOULD |

---

## Troubleshooting

### Dashboard loads slowly
1. Check Redis cache is running: `docker ps | grep redis`
2. Verify materialized view exists: `SELECT * FROM daily_truck_metrics LIMIT 1`
3. Check for missing indexes on gps_positions

### Charts don't display
1. Verify ngx-charts is installed: `npm list @swimlane/ngx-charts`
2. Check browser console for errors
3. Verify API returns data (not empty arrays)

### Export fails
1. Check browser console for errors
2. Verify jsPDF and xlsx packages installed
3. Test with smaller data set first
