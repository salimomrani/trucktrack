# Research: Trip Management System

**Date**: 2025-12-26
**Status**: Complete
**Feature**: 010-trip-management

## Overview

This document captures technical decisions and research for the Trip Management System feature. Since the feature integrates with an existing, well-established architecture, most decisions follow established patterns.

---

## Decision 1: Service Placement

**Question**: Which microservice should own the Trip entity?

**Decision**: Location Service

**Rationale**:
- Trips are inherently location-related (origin/destination addresses)
- Trip status correlates with truck location updates
- Location service already manages Truck entities which trips reference
- Avoids creating a new microservice for a single entity

**Alternatives Considered**:
- **New Trip Service**: Rejected - would add unnecessary operational complexity for one entity
- **Auth Service**: Rejected - auth service handles users, not business operations

---

## Decision 2: Driver-Trip Relationship

**Question**: How should drivers be linked to trips?

**Decision**: Reference driver by userId (from auth-service), not a separate driver entity

**Rationale**:
- Existing User entity in auth-service has role=DRIVER
- No need for a separate Driver table
- Consistent with how trucks are assigned (truckId reference)
- Simplifies queries by using existing JWT user context

**Data Model Implication**:
```
Trip {
  assignedDriverId: UUID  // References User.id from auth-service
  assignedTruckId: UUID   // References Truck.id from location-service
}
```

---

## Decision 3: Trip Status Transitions

**Question**: What state machine governs trip status?

**Decision**: Linear state machine with cancel from any non-terminal state

**Rationale**:
- Simple, predictable workflow
- Matches real-world delivery operations
- Easy to implement and understand

**State Diagram**:
```
PENDING ──(assign)──> ASSIGNED ──(start)──> IN_PROGRESS ──(complete)──> COMPLETED
    │                     │                      │
    └──────(cancel)───────┴──────(cancel)────────┘
                          │
                          v
                      CANCELLED
```

**Validation Rules**:
- PENDING → ASSIGNED: Requires truckId and driverId
- ASSIGNED → IN_PROGRESS: Only assigned driver can start
- IN_PROGRESS → COMPLETED: Only assigned driver can complete
- Cancel: Dispatcher/Admin only (not driver)

---

## Decision 4: Push Notification Strategy

**Question**: How to implement push notifications for trip assignments?

**Decision**: Extend existing notification-service with Expo Push Notifications

**Rationale**:
- notification-service already exists for alert rules
- Expo provides built-in push notification support
- No additional infrastructure needed

**Implementation Approach**:
1. Store Expo push token in User entity (mobile app registration)
2. TripService publishes event to Kafka topic `truck-track.trips.assigned`
3. notification-service consumes event and sends push via Expo
4. Fallback: Driver sees trip on next app refresh if push fails

**Expo Push Token Storage**:
- Add `expoPushToken` field to User entity in auth-service
- Mobile app calls `/auth/v1/me/push-token` on login

---

## Decision 5: Real-Time Updates

**Question**: How should trip status updates propagate to admin dashboard?

**Decision**: Polling with 10-second interval (MVP), WebSocket upgrade path for v2

**Rationale**:
- Simpler implementation for MVP
- 10-second delay acceptable per success criteria
- WebSocket infrastructure not currently in place
- Can upgrade to WebSocket in future iteration

**MVP Implementation**:
- Admin dashboard polls `GET /trips?status=IN_PROGRESS` every 10 seconds
- Trip list component uses Angular timer/interval

**V2 Enhancement** (out of scope):
- Add WebSocket endpoint for trip status changes
- Use Server-Sent Events (SSE) as lighter alternative

---

## Decision 6: Trip History & Audit

**Question**: How to track trip status changes for audit purposes?

**Decision**: Dedicated TripStatusHistory table with immutable records

**Rationale**:
- Compliance requirement (FR-007: record timestamps for all status transitions)
- Enables trip timeline view in UI
- Supports future analytics and reporting

**Data Model**:
```
TripStatusHistory {
  id: UUID
  tripId: UUID
  previousStatus: TripStatus
  newStatus: TripStatus
  changedBy: UUID (userId)
  changedAt: Instant
  notes: String (optional)
}
```

---

## Decision 7: API Design Pattern

**Question**: Single controller or split by actor?

**Decision**: Split controllers by role/use case

**Rationale**:
- Clear separation of concerns
- Different authorization requirements
- Easier to maintain and test

**Controllers**:
| Controller | Endpoint Prefix | Actors | Purpose |
|------------|-----------------|--------|---------|
| AdminTripController | `/admin/trips` | ADMIN, DISPATCHER | CRUD operations, reassignment |
| TripController | `/location/v1/trips` | DRIVER | View assigned trips, update status |

---

## Decision 8: Mobile Offline Support

**Question**: How to handle trip status updates when driver is offline?

**Decision**: Queue status updates locally, sync when online

**Rationale**:
- Drivers may have intermittent connectivity
- Trip completion should never be blocked by network
- Matches existing GPS position buffering pattern

**Implementation**:
- Use AsyncStorage to queue pending status updates
- Sync queue on app foreground or network restore
- Show "pending sync" indicator in UI
- Server uses `startedAt`/`completedAt` from client, not server timestamp

---

## Technology Stack Summary

| Component | Technology | Justification |
|-----------|------------|---------------|
| Trip Entity | JPA + PostgreSQL | Existing stack, relational data |
| Trip API | Spring REST | Existing pattern |
| Trip Events | Kafka | Async notification delivery |
| Push Notifications | Expo Push API | Native Expo support, no FCM/APNs setup |
| Admin UI | Angular + Material | Existing admin panel stack |
| Mobile UI | React Native + Expo | Existing mobile app stack |
| Caching | Redis (optional) | For active trip counts if needed |

---

## Open Items (Deferred to Future Iterations)

1. **WebSocket real-time updates** - Upgrade from polling for dashboard
2. **Trip geocoding** - Convert addresses to coordinates for map display
3. **ETA calculation** - Estimate arrival time based on route
4. **Multi-stop trips** - Support multiple destinations per trip
5. **Proof of delivery** - Signature capture, photo upload

---

## References

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Spring Boot Kafka Integration](https://spring.io/projects/spring-kafka)
- Existing codebase patterns in `backend/location-service/`
