# Quickstart: Trip Management System

**Date**: 2025-12-26
**Feature**: 010-trip-management

This document provides step-by-step test scenarios to validate the Trip Management System.

---

## Prerequisites

1. All backend services running (use `./start-all.sh`)
2. Frontend running (`cd frontend && npm start`)
3. Mobile app running (`cd mobile-expo && npx expo start`)
4. Test users available:
   - Admin: `admin@trucktrack.com` / `admin123`
   - Dispatcher: `dispatcher@trucktrack.com` / `dispatcher123`
   - Driver: `driver@trucktrack.com` / `driver123`

---

## Scenario 1: Complete Trip Lifecycle (Happy Path)

**Objective**: Validate the full trip workflow from creation to completion.

### Step 1.1: Dispatcher Creates a Trip

```bash
# Login as dispatcher
TOKEN=$(curl -s -X POST http://localhost:8000/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dispatcher@trucktrack.com","password":"dispatcher123"}' \
  | jq -r '.token')

# Create trip
curl -X POST http://localhost:8000/admin/trips \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Entrepôt Paris Nord, 93200 Saint-Denis",
    "destination": "Centre Distribution Lyon, 69007 Lyon",
    "scheduledAt": "2025-12-27T08:00:00Z",
    "notes": "Livraison prioritaire - 3 palettes"
  }'
```

**Expected**: Trip created with status `PENDING`, returns trip ID.

### Step 1.2: Dispatcher Assigns Trip

```bash
# Get available trucks (status IDLE or ACTIVE)
curl -X GET "http://localhost:8000/location/v1/trucks?status=IDLE" \
  -H "Authorization: Bearer $TOKEN"

# Assign trip (replace UUIDs with actual values)
curl -X POST http://localhost:8000/admin/trips/{tripId}/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "truck-uuid-here",
    "driverId": "driver-uuid-here"
  }'
```

**Expected**: Trip status changes to `ASSIGNED`, truck and driver linked.

### Step 1.3: Driver Views Assigned Trips (Mobile)

```bash
# Login as driver
DRIVER_TOKEN=$(curl -s -X POST http://localhost:8000/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@trucktrack.com","password":"driver123"}' \
  | jq -r '.token')

# Get my trips
curl -X GET http://localhost:8000/location/v1/trips/my \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected**: Returns list containing the assigned trip.

### Step 1.4: Driver Starts Trip

```bash
curl -X POST http://localhost:8000/location/v1/trips/{tripId}/start \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected**: Trip status changes to `IN_PROGRESS`, `startedAt` is set.

### Step 1.5: Driver Completes Trip

```bash
curl -X POST http://localhost:8000/location/v1/trips/{tripId}/complete \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected**: Trip status changes to `COMPLETED`, `completedAt` is set.

### Step 1.6: Verify Trip History

```bash
curl -X GET http://localhost:8000/admin/trips/{tripId}/history \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Returns 4 history entries:
1. NULL → PENDING (creation)
2. PENDING → ASSIGNED
3. ASSIGNED → IN_PROGRESS
4. IN_PROGRESS → COMPLETED

---

## Scenario 2: Trip Cancellation

**Objective**: Validate trip cancellation at different stages.

### Step 2.1: Cancel PENDING Trip

```bash
# Create and immediately cancel
curl -X POST http://localhost:8000/admin/trips/{tripId}/cancel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer cancelled order"}'
```

**Expected**: Trip status → `CANCELLED`, reason stored in history.

### Step 2.2: Cancel ASSIGNED Trip

```bash
# Cancel an assigned trip
curl -X POST http://localhost:8000/admin/trips/{tripId}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Trip status → `CANCELLED`, driver notified (push notification).

### Step 2.3: Cancel IN_PROGRESS Trip (Warning)

```bash
curl -X POST http://localhost:8000/admin/trips/{tripId}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Success with warning in response, driver notified.

### Step 2.4: Cannot Cancel COMPLETED Trip

```bash
curl -X POST http://localhost:8000/admin/trips/{tripId}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: 400 Bad Request - "Cannot cancel completed trips"

---

## Scenario 3: Trip Reassignment

**Objective**: Validate reassigning a trip to different driver/truck.

### Step 3.1: Reassign to Different Driver

```bash
curl -X POST http://localhost:8000/admin/trips/{tripId}/reassign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "same-truck-uuid",
    "driverId": "different-driver-uuid"
  }'
```

**Expected**:
- Trip updated with new driver
- Original driver notified (trip removed)
- New driver notified (trip assigned)
- History entry added

---

## Scenario 4: Access Control Validation

**Objective**: Verify role-based access restrictions.

### Step 4.1: Driver Cannot Create Trips

```bash
curl -X POST http://localhost:8000/admin/trips \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"origin": "Test", "destination": "Test"}'
```

**Expected**: 403 Forbidden

### Step 4.2: Driver Cannot Cancel Trips

```bash
curl -X POST http://localhost:8000/admin/trips/{tripId}/cancel \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected**: 403 Forbidden

### Step 4.3: Driver Cannot View Other Driver's Trips

```bash
# Trip assigned to driver A
curl -X GET http://localhost:8000/location/v1/trips/{tripId} \
  -H "Authorization: Bearer $DRIVER_B_TOKEN"
```

**Expected**: 403 Forbidden

### Step 4.4: Driver Can Only Start Own Trips

```bash
curl -X POST http://localhost:8000/location/v1/trips/{otherDriverTripId}/start \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected**: 403 Forbidden

---

## Scenario 5: Validation Rules

**Objective**: Verify business rule enforcement.

### Step 5.1: Cannot Assign to MAINTENANCE Truck

```bash
# Try to assign to truck with status MAINTENANCE
curl -X POST http://localhost:8000/admin/trips/{tripId}/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "maintenance-truck-uuid",
    "driverId": "driver-uuid"
  }'
```

**Expected**: 400 Bad Request - "Truck is not available for assignment"

### Step 5.2: Cannot Start Non-Assigned Trip

```bash
# Try to start PENDING trip
curl -X POST http://localhost:8000/location/v1/trips/{pendingTripId}/start \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected**: 400 Bad Request - "Trip must be ASSIGNED to start"

### Step 5.3: Cannot Complete Non-Started Trip

```bash
# Try to complete ASSIGNED trip
curl -X POST http://localhost:8000/location/v1/trips/{assignedTripId}/complete \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

**Expected**: 400 Bad Request - "Trip must be IN_PROGRESS to complete"

---

## Scenario 6: Filtering and Search

**Objective**: Verify trip list filtering capabilities.

### Step 6.1: Filter by Status

```bash
curl -X GET "http://localhost:8000/admin/trips?status=IN_PROGRESS" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Only trips with status IN_PROGRESS returned.

### Step 6.2: Filter by Driver

```bash
curl -X GET "http://localhost:8000/admin/trips?driverId={driverUuid}" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Only trips assigned to specified driver.

### Step 6.3: Filter by Date Range

```bash
curl -X GET "http://localhost:8000/admin/trips?fromDate=2025-12-01&toDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: Trips created within date range.

---

## Scenario 7: Push Notifications (Manual Test)

**Objective**: Verify push notification delivery.

### Setup
1. Open mobile app on physical device
2. Login as driver
3. Note: Must have allowed notifications

### Step 7.1: New Trip Assignment Notification

1. As dispatcher, assign a trip to the driver
2. Driver should receive push notification within 60 seconds
3. Tapping notification opens trip details

### Step 7.2: Trip Cancelled Notification

1. As dispatcher, cancel an assigned trip
2. Driver should receive cancellation notification

---

## Scenario 8: Mobile Offline Sync (Manual Test)

**Objective**: Verify offline status updates sync when online.

### Steps
1. Login to mobile app as driver with assigned trip
2. Enable airplane mode
3. Tap "Start Trip" - should show "pending sync" indicator
4. Disable airplane mode
5. Trip status should sync to server within 30 seconds

**Expected**: Trip shows IN_PROGRESS on admin dashboard after sync.

---

## Performance Validation

### API Response Times

All API calls should respond within these thresholds:

| Endpoint | Target | Method |
|----------|--------|--------|
| GET /admin/trips | <200ms | List with pagination |
| POST /admin/trips | <500ms | Create trip |
| POST /trips/{id}/assign | <500ms | Assign trip |
| GET /location/v1/trips/my | <200ms | Driver's trips |
| POST /trips/{id}/start | <500ms | Start trip |

### Load Test

```bash
# Install k6 if needed: brew install k6

# Run load test (requires k6 script)
k6 run --vus 50 --duration 30s trip-load-test.js
```

**Target**: 100 concurrent trips, <200ms p95 response time.

---

## Troubleshooting

### Trip not appearing for driver
1. Verify trip status is ASSIGNED
2. Check assignedDriverId matches driver's user ID
3. Check driver's JWT token is valid

### Push notification not received
1. Verify expoPushToken is stored for user
2. Check notification-service logs
3. Verify device has notifications enabled

### Status update fails
1. Check trip is in correct state for transition
2. Verify user has permission for operation
3. Check backend logs for validation errors
