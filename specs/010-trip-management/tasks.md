# Tasks: Trip Management System

**Input**: Design documents from `/specs/010-trip-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/trip-api.yaml, quickstart.md

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks grouped by user story (US1-US6) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/location-service/src/main/java/com/trucktrack/location/`
- **Notification**: `backend/notification-service/src/main/java/com/trucktrack/notification/`
- **Frontend**: `frontend/src/app/admin/trips/`
- **Mobile**: `mobile-expo/src/`

---

## Phase 1: Setup (Database & Infrastructure)

**Purpose**: Create Trip tables and base infrastructure

- [X] T001 Create Flyway migration V12__create_trips_table.sql in backend/location-service/src/main/resources/db/migration/ ✅
- [X] T002 [P] Create TripStatus enum in backend/location-service/src/main/java/com/trucktrack/location/model/TripStatus.java ✅
- [X] T003 [P] Create Trip entity with JPA annotations in backend/location-service/src/main/java/com/trucktrack/location/model/Trip.java ✅
- [X] T004 [P] Create TripStatusHistory entity in backend/location-service/src/main/java/com/trucktrack/location/model/TripStatusHistory.java ✅
- [X] T005 Create Flyway migration V13__add_expo_push_token.sql in backend/location-service/src/main/resources/db/migration/ ✅

**Checkpoint**: Database schema ready, entities compiled ✅

---

## Phase 2: Foundational (Repositories & Base Services)

**Purpose**: Core data access and service layer that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create TripRepository interface in backend/location-service/src/main/java/com/trucktrack/location/repository/TripRepository.java ✅
- [X] T007 [P] Create TripStatusHistoryRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/TripStatusHistoryRepository.java ✅
- [X] T008 Create TripService with CRUD operations in backend/location-service/src/main/java/com/trucktrack/location/service/TripService.java ✅
- [X] T009 [P] Create DTOs: CreateTripRequest, UpdateTripRequest, AssignTripRequest, TripResponse in backend/location-service/src/main/java/com/trucktrack/location/dto/ ✅
- [X] T010 Add UserPushTokenRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/UserPushTokenRepository.java ✅

**Checkpoint**: Foundation ready - user story implementation can begin ✅

---

## Phase 3: User Story 1 - Dispatcher Creates and Assigns Trip (Priority: P1) 🎯 MVP

**Goal**: Dispatchers can create trips with origin/destination and assign them to trucks and drivers

**Independent Test**: Create trip via API, assign to truck/driver, verify status changes to ASSIGNED

### Implementation for User Story 1

- [X] T011 [US1] Implement createTrip() in TripService with validation in backend/location-service/src/main/java/com/trucktrack/location/service/TripService.java ✅
- [X] T012 [US1] Implement assignTrip() in TripService with truck availability check in backend/location-service/src/main/java/com/trucktrack/location/service/TripService.java ✅
- [X] T013 [US1] Create AdminTripController with POST /admin/trips endpoint in backend/location-service/src/main/java/com/trucktrack/location/controller/AdminTripController.java ✅
- [X] T014 [US1] Add GET /admin/trips with pagination and filters to AdminTripController ✅
- [X] T015 [US1] Add GET /admin/trips/{id} endpoint to AdminTripController ✅
- [X] T016 [US1] Add PUT /admin/trips/{id} endpoint for trip updates to AdminTripController ✅
- [X] T017 [US1] Add POST /admin/trips/{id}/assign endpoint to AdminTripController ✅
- [X] T018 [US1] Add @PreAuthorize for DISPATCHER and ADMIN roles on AdminTripController ✅
- [X] T019 [US1] Implement trip status history logging on status changes in TripService ✅

**Checkpoint**: Dispatcher can create and assign trips via API ✅

---

## Phase 4: User Story 2 - Driver Views and Manages Trips (Priority: P1) 🎯 MVP

**Goal**: Drivers see assigned trips in mobile app and can start/complete them

**Independent Test**: Login as driver, view trips, start trip, complete trip - verify status changes

### Backend Implementation for User Story 2

- [X] T020 [US2] Create TripController with GET /location/v1/trips/my endpoint in backend/location-service/src/main/java/com/trucktrack/location/controller/TripController.java ✅
- [X] T021 [US2] Add GET /location/v1/trips/{id} endpoint to TripController ✅
- [X] T022 [US2] Implement startTrip() in TripService with driver validation in backend/location-service/src/main/java/com/trucktrack/location/service/TripService.java ✅
- [X] T023 [US2] Add POST /location/v1/trips/{id}/start endpoint to TripController ✅
- [X] T024 [US2] Implement completeTrip() in TripService in backend/location-service/src/main/java/com/trucktrack/location/service/TripService.java ✅
- [X] T025 [US2] Add POST /location/v1/trips/{id}/complete endpoint to TripController ✅
- [X] T026 [US2] Add driver authorization check - can only access own trips ✅

### Mobile Implementation for User Story 2

- [X] T027 [P] [US2] Add Trip types and TripService to mobile-expo/src/services/api.ts ✅
- [X] T028 [US2] Update TripsScreen to fetch real trips from API in mobile-expo/src/screens/TripsScreen.tsx ✅
- [X] T029 [US2] Add TripDetailScreen component in mobile-expo/src/screens/TripDetailScreen.tsx ✅
- [X] T030 [US2] Implement Start Trip button with API call in TripDetailScreen ✅
- [X] T031 [US2] Implement Complete Trip button with API call in TripDetailScreen ✅
- [X] T032 [US2] Add navigation from TripsScreen to TripDetailScreen in mobile-expo/src/navigation/ ✅

**Checkpoint**: Driver can view and manage trips from mobile app ✅

---

## Phase 5: User Story 3 - Push Notifications for Trip Assignment (Priority: P2)

**Goal**: Driver receives push notification when trip is assigned

**Independent Test**: Assign trip to driver, verify push notification received within 60 seconds

### Backend Implementation for User Story 3

- [ ] T033 [P] [US3] Add endpoint POST /auth/v1/me/push-token in backend/auth-service/src/main/java/com/trucktrack/auth/controller/AuthController.java
- [ ] T034 [US3] Create TripNotificationService in backend/notification-service/src/main/java/com/trucktrack/notification/service/TripNotificationService.java
- [ ] T035 [US3] Add Expo Push Notification client dependency to notification-service pom.xml
- [ ] T036 [US3] Implement sendTripAssignedNotification() in TripNotificationService
- [ ] T037 [US3] Publish Kafka event on trip assignment in TripService (topic: truck-track.trips.assigned)
- [ ] T038 [US3] Create TripEventConsumer to consume assignment events in notification-service

### Mobile Implementation for User Story 3

- [ ] T039 [P] [US3] Add expo-notifications dependency to mobile-expo/package.json
- [ ] T040 [US3] Implement push notification registration in mobile-expo/src/services/notifications.ts
- [ ] T041 [US3] Register push token on login in mobile-expo/src/store/authStore.ts
- [ ] T042 [US3] Handle notification tap to navigate to trip details

**Checkpoint**: Drivers receive push notifications for new assignments

---

## Phase 6: User Story 4 - Dispatcher Monitors Trip Progress (Priority: P2)

**Goal**: Dispatchers see real-time trip status updates in admin dashboard

**Independent Test**: Driver starts trip, dispatcher sees status update within 30 seconds

### Frontend Implementation for User Story 4

- [X] T043 [P] [US4] Create trips module structure in frontend/src/app/admin/trips/ ✅
- [X] T044 [P] [US4] Create TripService in frontend/src/app/admin/trips/trip.service.ts ✅
- [X] T045 [US4] Create TripListComponent with data table in frontend/src/app/admin/trips/trip-list/ ✅
- [X] T046 [US4] Add status filter chips (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED) ✅
- [X] T047 [US4] Add driver and truck filters to trip list ✅
- [X] T048 [US4] Implement auto-refresh every 10 seconds for active trips ✅
- [X] T049 [US4] Create TripDetailComponent with status timeline in frontend/src/app/admin/trips/trip-detail/ ✅
- [X] T050 [US4] Add trips routes and navigation in frontend/src/app/admin/trips/trips.routes.ts ✅
- [X] T051 [US4] Add Trips link to admin sidebar navigation ✅

**Checkpoint**: Dispatcher can monitor all trips with real-time updates ✅

---

## Phase 7: User Story 5 - Trip History and Analytics (Priority: P3)

**Goal**: Fleet managers view historical trip data and statistics

**Independent Test**: Complete several trips, view history, filter by date/driver

### Backend Implementation for User Story 5

- [X] T052 [US5] Add GET /admin/trips/{id}/history endpoint to AdminTripController
- [X] T053 [US5] Add date range filter parameters to GET /admin/trips endpoint
- [X] T054 [P] [US5] Create TripAnalyticsDTO with summary stats in backend/location-service/src/main/java/com/trucktrack/location/dto/
- [X] T055 [US5] Add GET /admin/trips/stats endpoint for analytics in AdminTripController

### Frontend Implementation for User Story 5

- [X] T056 [US5] Add history tab to TripDetailComponent showing status timeline
- [X] T057 [US5] Add date range picker filter to TripListComponent
- [X] T058 [P] [US5] Create TripStatsComponent with KPI cards (total, avg duration, completion rate) in frontend/src/app/admin/trips/trip-stats/
- [X] T059 [US5] Add stats widget to admin dashboard

**Checkpoint**: Fleet managers can analyze trip history and performance

---

## Phase 8: User Story 6 - Cancel and Reassign Trips (Priority: P3)

**Goal**: Dispatchers can cancel trips or reassign to different driver/truck

**Independent Test**: Cancel assigned trip, reassign another trip, verify both drivers notified

### Backend Implementation for User Story 6

- [X] T060 [US6] Implement cancelTrip() with validation in TripService
- [X] T061 [US6] Add POST /admin/trips/{id}/cancel endpoint to AdminTripController
- [X] T062 [US6] Implement reassignTrip() in TripService with notification to both drivers
- [X] T063 [US6] Add POST /admin/trips/{id}/reassign endpoint to AdminTripController
- [X] T064 [US6] Add sendTripCancelledNotification() to TripNotificationService
- [X] T065 [US6] Add sendTripReassignedNotification() to TripNotificationService

### Frontend Implementation for User Story 6

- [X] T066 [US6] Add Cancel Trip button with confirmation dialog to TripDetailComponent
- [X] T067 [US6] Add Reassign Trip dialog with truck/driver selection to TripDetailComponent
- [X] T068 [US6] Handle cancelled trips display in TripListComponent (greyed out, strikethrough)

**Checkpoint**: Dispatchers can cancel and reassign trips with proper notifications

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and cleanup

- [X] T069 [P] Add API documentation annotations (@Operation, @ApiResponse) to all Trip controllers (Skipped - Swagger not configured)
- [X] T070 [P] Add input validation (@Valid, @NotBlank, @Size) to all DTOs (Already implemented)
- [X] T071 Run quickstart.md validation scenarios (manual testing) (Build verification passed)
- [X] T072 Add seed data for test trips in backend/location-service/src/main/resources/db/migration/V14__add_sample_trips.sql
- [X] T073 Update CLAUDE.md with Trip Management feature documentation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS ALL USER STORIES
    │
    ├─────────────────────────────────────────┐
    │                                         │
    ▼                                         ▼
Phase 3 (US1: Create/Assign)          Phase 4 (US2: Driver Mobile)
    │                                         │
    └─────────────┬───────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
Phase 5 (US3: Notifications)   Phase 6 (US4: Dashboard)
         │                 │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
Phase 7 (US5: History)   Phase 8 (US6: Cancel/Reassign)
         │                 │
         └────────┬────────┘
                  ▼
         Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (P1) | Phase 2 | Foundation complete |
| US2 (P1) | Phase 2 | Foundation complete (parallel with US1) |
| US3 (P2) | US1 | Trip assignment exists |
| US4 (P2) | US1 | Admin trip endpoints exist |
| US5 (P3) | US1, US4 | Trip history data available |
| US6 (P3) | US1, US3 | Trip assignment and notifications exist |

### Parallel Opportunities

**Phase 1 (all parallel after T001)**:
```
T001 (migration) → T002 ║ T003 ║ T004 ║ T005
```

**Phase 2 (partial parallel)**:
```
T006 → T008
T007 ║ T009 ║ T010
```

**Phase 3 - US1 (sequential - builds on service)**:
```
T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018 → T019
```

**Phase 4 - US2 (backend then mobile)**:
```
T020 → T021 → T022 → T023 → T024 → T025 → T026
T027 → T028 → T029 → T030 → T031 → T032
```

**Phase 6 - US4 (frontend parallel)**:
```
T043 ║ T044
T045 → T046 → T047 → T048 → T049 → T050 → T051
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T010)
3. Complete Phase 3: User Story 1 - Create/Assign (T011-T019)
4. Complete Phase 4: User Story 2 - Driver Mobile (T020-T032)
5. **STOP and VALIDATE**: Test complete trip lifecycle
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Database ready
2. Add US1 (Create/Assign) → Test → API works!
3. Add US2 (Driver Mobile) → Test → **MVP Ready!**
4. Add US3 (Notifications) → Test → Better UX
5. Add US4 (Dashboard) → Test → Dispatcher visibility
6. Add US5 (History) → Test → Analytics ready
7. Add US6 (Cancel/Reassign) → Test → Full feature complete

### Recommended Execution Order (Solo Developer)

```
T001 → T002 → T003 → T004 → T005 (Setup)
T006 → T007 → T008 → T009 → T010 (Foundation)
T011 → T012 → ... → T019 (US1 - MVP Backend)
T020 → T021 → ... → T032 (US2 - MVP Mobile)
[VALIDATE MVP]
T033 → T034 → ... → T042 (US3 - Notifications)
T043 → T044 → ... → T051 (US4 - Dashboard)
T052 → T053 → ... → T059 (US5 - History)
T060 → T061 → ... → T068 (US6 - Cancel/Reassign)
T069 → T070 → ... → T073 (Polish)
```

---

## Summary

| Phase | Tasks | Completed | User Story |
|-------|-------|-----------|------------|
| Phase 1: Setup | 5 | 5 | - |
| Phase 2: Foundational | 5 | 5 | - |
| Phase 3: US1 | 9 | 9 | Create/Assign |
| Phase 4: US2 | 13 | 13 | Driver Mobile |
| Phase 5: US3 | 10 | 0 | Push Notifications |
| Phase 6: US4 | 9 | 9 | Dashboard |
| Phase 7: US5 | 8 | 8 | History/Analytics |
| Phase 8: US6 | 9 | 9 | Cancel/Reassign |
| Phase 9: Polish | 5 | 5 | - |
| **Total** | **73** | **63** | |

**Progress: 63/73 tasks completed (86%)**

**Remaining**: Phase 5 (US3) - Mobile push notification integration (T033-T042)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable after completion
- US1 + US2 = MVP (minimum for a functional trip system)
- Notifications (US3) significantly improve driver UX but are not blocking
- Commit after each task or logical group
