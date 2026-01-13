# Quickstart: Dashboard Real Data Integration

**Feature**: 022-dashboard-real-data
**Date**: 2026-01-13

## Overview

Guide rapide pour tester l'intégration des données réelles du dashboard après implémentation.

## Prerequisites

- Backend services running (location-service, notification-service)
- Frontend dev server running (`npm start`)
- User authenticated with access to at least one truck group
- Some test data: trucks, trips, alerts

## Test Scenarios

### Scenario 1: KPIs Display

**Setup**:
1. Have 5 trucks in user's groups
2. Have 2 trucks with status=ACTIVE
3. Have 3 trips created today
4. Have 2 unread alerts

**Steps**:
1. Navigate to Dashboard (`/admin/dashboard`)
2. Observe KPI cards

**Expected**:
- "Total Trucks" shows "5"
- "Active trucks" shows "2"
- "Trips today" shows "3"
- "Alerts today" shows "2"
- Trend indicators show appropriate values

### Scenario 2: Fleet Status Chart

**Setup**:
- 10 trucks total: 5 ACTIVE, 3 IDLE, 2 OFFLINE

**Steps**:
1. Navigate to Dashboard
2. Observe Fleet Status donut chart

**Expected**:
- Chart shows 50% green (active), 30% yellow (idle), 20% gray (offline)
- Legend shows correct counts and percentages
- Total shows "10 total"

### Scenario 3: Recent Activity Feed

**Setup**:
1. Start a trip (creates TRIP_STARTED event)
2. Trigger an alert (creates ALERT_TRIGGERED event)
3. Complete a delivery (creates DELIVERY_CONFIRMED event)

**Steps**:
1. Navigate to Dashboard
2. Observe Recent Activity section

**Expected**:
- Shows 5 most recent events
- Each event has: title, truck ID, timestamp
- Events ordered by most recent first
- "View All" link visible if more than 5 events exist

### Scenario 4: Performance Overview

**Setup**:
- This week: 20 trips, 18 completed, 16 on-time
- Fleet: 10 trucks, total possible hours: 100h, actual usage: 72h

**Steps**:
1. Navigate to Dashboard
2. Observe Performance Overview section
3. Change period selector to "This Month"

**Expected**:
- "Trip Completion Rate": 90% (18/20)
- "On-Time Delivery": 89% (16/18)
- "Fleet Utilization": 72%
- "Driver Satisfaction": "Coming Soon"
- Period selector changes metrics accordingly

### Scenario 5: Error Handling (Widget Independence)

**Setup**:
1. Stop notification-service (alerts will fail)
2. Keep location-service running

**Steps**:
1. Navigate to Dashboard
2. Observe behavior

**Expected**:
- KPIs section loads (except alerts shows error)
- Fleet Status loads normally
- Activity feed shows error state
- Performance loads normally
- Each error has retry button
- Non-errored widgets remain functional

### Scenario 6: Empty State

**Setup**:
- User with no trucks in their groups

**Steps**:
1. Navigate to Dashboard

**Expected**:
- All KPIs show "0"
- Fleet Status shows empty state message
- Activity shows "No recent activity"
- Performance shows "N/A" or similar

### Scenario 7: Manual Refresh

**Steps**:
1. Navigate to Dashboard (data loads)
2. In another tab, create a new trip
3. Click refresh button on Dashboard

**Expected**:
- Loading indicator appears briefly
- "Trips today" count increases by 1
- New trip appears in Recent Activity

## API Testing (cURL)

```bash
# Get all dashboard data
curl -X GET "http://localhost:8081/api/location/v1/admin/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Get KPIs only
curl -X GET "http://localhost:8081/api/location/v1/admin/dashboard/kpis" \
  -H "Authorization: Bearer $TOKEN"

# Get fleet status
curl -X GET "http://localhost:8081/api/location/v1/admin/dashboard/fleet-status" \
  -H "Authorization: Bearer $TOKEN"

# Get recent activity (limit 10)
curl -X GET "http://localhost:8081/api/location/v1/admin/dashboard/activity?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Get performance (this month)
curl -X GET "http://localhost:8081/api/location/v1/admin/dashboard/performance?period=month" \
  -H "Authorization: Bearer $TOKEN"
```

## Checklist

- [ ] KPIs show correct counts
- [ ] KPIs trends show +/- indicators
- [ ] Fleet Status donut renders correctly
- [ ] Fleet Status legend matches chart
- [ ] Activity feed shows recent events
- [ ] Activity feed limited to 5 items
- [ ] Performance metrics calculate correctly
- [ ] Driver Satisfaction shows "Coming Soon"
- [ ] Period selector works for performance
- [ ] Loading states appear during fetch
- [ ] Error states appear on failure
- [ ] Retry buttons work
- [ ] Refresh button reloads all data
- [ ] Empty states display correctly
- [ ] Widget errors are independent

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| All KPIs show 0 | User has no truck groups | Assign user to truck group |
| 401 Unauthorized | Token expired | Re-login, get new token |
| Activity empty | No trips/alerts in system | Create test data |
| Performance N/A | No completed trips this week | Create and complete trips |
