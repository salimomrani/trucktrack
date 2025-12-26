# Tasks: Driver Mobile App

**Input**: Design documents from `/specs/009-driver-mobile-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests included per constitution requirements (TDD approach, 80% coverage target)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `mobile/` directory at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: React Native project initialization and basic structure

- [x] T001 Initialize React Native project with TypeScript template in mobile/
- [x] T002 Install core dependencies (React Navigation, Axios, Zustand, AsyncStorage) in mobile/package.json
- [x] T003 [P] Install map dependencies (react-native-maps) in mobile/package.json
- [x] T004 [P] Install GPS dependencies (react-native-background-geolocation) in mobile/package.json
- [x] T005 [P] Install Firebase dependencies (@react-native-firebase/app, messaging) in mobile/package.json
- [x] T006 [P] Install WatermelonDB for offline storage in mobile/package.json
- [x] T007 [P] Install react-native-keychain for secure storage in mobile/package.json
- [x] T008 Configure TypeScript in mobile/tsconfig.json
- [x] T009 [P] Configure ESLint and Prettier in mobile/.eslintrc.js and mobile/.prettierrc
- [x] T010 [P] Configure Jest testing in mobile/jest.config.js
- [x] T011 [P] Configure Detox E2E testing in mobile/detox.config.js
- [x] T012 Create folder structure per plan.md in mobile/src/
- [x] T013 Configure iOS project with required permissions in mobile/ios/Info.plist
- [x] T014 Configure Android project with required permissions in mobile/android/app/src/main/AndroidManifest.xml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T015 Create TypeScript interfaces for all entities in mobile/src/types/entities.ts
- [x] T016 Create TypeScript interfaces for API responses in mobile/src/types/api.ts
- [x] T017 Create app constants and configuration in mobile/src/constants/config.ts
- [x] T018 [P] Create color tokens and theme in mobile/src/constants/theme.ts
- [x] T019 Setup Axios API client with base configuration in mobile/src/services/api/client.ts
- [x] T020 Implement JWT interceptor for auth headers in mobile/src/services/api/interceptors.ts
- [x] T021 Implement token refresh interceptor in mobile/src/services/api/interceptors.ts
- [x] T022 Setup Zustand store structure in mobile/src/store/index.ts
- [x] T023 [P] Create auth store slice in mobile/src/store/authStore.ts
- [x] T024 [P] Create status store slice in mobile/src/store/statusStore.ts
- [x] T025 [P] Create trips store slice in mobile/src/store/tripsStore.ts
- [x] T026 [P] Create messages store slice in mobile/src/store/messagesStore.ts
- [x] T027 Setup WatermelonDB schema in mobile/src/services/storage/schema.ts
- [x] T028 Create database initialization in mobile/src/services/storage/database.ts
- [x] T029 Setup React Navigation container in mobile/src/navigation/AppNavigator.tsx
- [x] T030 Create auth navigation stack in mobile/src/navigation/AuthNavigator.tsx
- [x] T031 Create main tab navigator in mobile/src/navigation/MainNavigator.tsx
- [x] T032 [P] Create reusable Button component in mobile/src/components/common/Button.tsx
- [x] T033 [P] Create reusable TextInput component in mobile/src/components/common/TextInput.tsx
- [x] T034 [P] Create reusable Card component in mobile/src/components/common/Card.tsx
- [x] T035 [P] Create reusable LoadingSpinner component in mobile/src/components/common/LoadingSpinner.tsx
- [x] T036 [P] Create reusable StatusBadge component in mobile/src/components/common/StatusBadge.tsx
- [x] T037 Create network connectivity hook in mobile/src/hooks/useNetworkStatus.ts
- [x] T038 Create App entry point with providers in mobile/App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Driver Authentication & Status Management (Priority: P1) 🎯 MVP

**Goal**: Driver can login, see profile, and change status

**Independent Test**: Login with credentials, view profile, change status from "Disponible" to "En pause"

### Tests for User Story 1

- [x] T039 [P] [US1] Unit test for auth service in mobile/__tests__/unit/services/authService.test.ts
- [x] T040 [P] [US1] Unit test for status service in mobile/__tests__/unit/services/statusService.test.ts
- [x] T041 [P] [US1] Integration test for login flow in mobile/__tests__/integration/auth.test.ts

### Implementation for User Story 1

- [x] T042 [P] [US1] Implement auth service (login, logout, refresh) in mobile/src/services/auth/authService.ts
- [x] T043 [P] [US1] Implement secure token storage in mobile/src/services/auth/tokenStorage.ts
- [x] T044 [US1] Implement status service (get, update) in mobile/src/services/auth/statusService.ts
- [x] T045 [US1] Create SplashScreen component in mobile/src/screens/auth/SplashScreen.tsx
- [x] T046 [US1] Create LoginScreen component in mobile/src/screens/auth/LoginScreen.tsx
- [x] T047 [US1] Create HomeScreen with status selector in mobile/src/screens/home/HomeScreen.tsx
- [x] T048 [P] [US1] Create StatusSelector component in mobile/src/components/common/StatusSelector.tsx
- [x] T049 [P] [US1] Create ProfileCard component in mobile/src/components/common/ProfileCard.tsx
- [x] T050 [US1] Implement useAuth hook in mobile/src/hooks/useAuth.ts
- [x] T051 [US1] Connect auth store to login flow in mobile/src/store/authStore.ts
- [x] T052 [US1] Add auth guard navigation logic in mobile/src/navigation/AppNavigator.tsx

**Checkpoint**: US1 complete - Driver can login and change status

---

## Phase 4: User Story 2 - GPS Position & Real-time Tracking (Priority: P1) 🎯 MVP

**Goal**: GPS tracking every 10s when in service, displayed on map

**Independent Test**: Enable tracking, verify positions sent to server, view position on map

### Tests for User Story 2

- [x] T053 [P] [US2] Unit test for GPS service in mobile/__tests__/unit/services/gpsService.test.ts
- [x] T054 [P] [US2] Unit test for position queue in mobile/__tests__/unit/services/positionQueue.test.ts
- [x] T055 [P] [US2] Integration test for GPS tracking flow in mobile/__tests__/integration/gps.test.ts

### Implementation for User Story 2

- [x] T056 [US2] Configure react-native-background-geolocation in mobile/src/services/gps/gpsConfig.ts
- [x] T057 [US2] Implement GPS service (start, stop, configure) in mobile/src/services/gps/gpsService.ts
- [x] T058 [US2] Implement position queue for offline buffering in mobile/src/services/gps/positionQueue.ts
- [x] T059 [US2] Implement position sync service in mobile/src/services/gps/positionSync.ts
- [x] T060 [US2] Create GPS position API calls in mobile/src/services/api/gpsApi.ts
- [x] T061 [US2] Create MapScreen with driver position in mobile/src/screens/map/MapScreen.tsx
- [x] T062 [P] [US2] Create DriverMarker component in mobile/src/components/map/DriverMarker.tsx
- [x] T063 [P] [US2] Create MapControls component in mobile/src/components/map/MapControls.tsx
- [x] T064 [US2] Implement useGpsTracking hook in mobile/src/hooks/useGpsTracking.ts
- [x] T065 [US2] Connect GPS to status changes (pause when OFF_DUTY) in mobile/src/services/gps/gpsService.ts
- [x] T066 [US2] Add battery optimization (30s interval when <15%) in mobile/src/services/gps/gpsService.ts
- [x] T067 [US2] Handle location permission requests in mobile/src/services/gps/permissions.ts

**Checkpoint**: US2 complete - GPS tracking works in foreground and background

---

## Phase 5: User Story 3 - Push Notifications for Alerts (Priority: P2)

**Goal**: Receive and display push notifications for alerts

**Independent Test**: Receive alert notification, tap to view details

### Tests for User Story 3

- [x] T068 [P] [US3] Unit test for notification service in mobile/__tests__/unit/services/notificationService.test.ts
- [x] T069 [P] [US3] Integration test for notification handling in mobile/__tests__/integration/notifications.test.ts

### Implementation for User Story 3

- [x] T070 [US3] Configure Firebase Cloud Messaging in mobile/src/services/notifications/fcmConfig.ts
- [x] T071 [US3] Implement notification service in mobile/src/services/notifications/notificationService.ts
- [x] T072 [US3] Implement FCM token registration API in mobile/src/services/api/notificationApi.ts
- [x] T073 [US3] Create notification handler for different types in mobile/src/services/notifications/notificationHandler.ts
- [x] T074 [US3] Implement notification storage in WatermelonDB in mobile/src/services/storage/notificationModel.ts
- [x] T075 [US3] Create NotificationsScreen in mobile/src/screens/settings/NotificationsScreen.tsx
- [x] T076 [P] [US3] Create NotificationItem component in mobile/src/components/common/NotificationItem.tsx
- [x] T077 [US3] Add deep linking for notification taps in mobile/src/navigation/linking.ts
- [x] T078 [US3] Implement useNotifications hook in mobile/src/hooks/useNotifications.ts
- [x] T079 [US3] Connect notifications to store in mobile/src/store/notificationsStore.ts

**Checkpoint**: US3 complete - Push notifications received and displayed

---

## Phase 6: User Story 4 - View Assigned Trips (Priority: P2)

**Goal**: View trip list, trip details, launch navigation

**Independent Test**: View trips list, tap trip for details, launch navigation to destination

### Tests for User Story 4

- [x] T080 [P] [US4] Unit test for trip service in mobile/__tests__/unit/services/tripService.test.ts
- [x] T081 [P] [US4] Integration test for trip flow in mobile/__tests__/integration/trips.test.ts

### Implementation for User Story 4

- [x] T082 [US4] Implement trip service (fetch, cache) in mobile/src/services/trips/tripService.ts
- [x] T083 [US4] Create trip API calls in mobile/src/services/api/tripApi.ts
- [x] T084 [US4] Implement trip storage in WatermelonDB in mobile/src/services/storage/tripModel.ts
- [x] T085 [US4] Create TripsScreen (list view) in mobile/src/screens/trips/TripsScreen.tsx
- [x] T086 [US4] Create TripDetailScreen in mobile/src/screens/trips/TripDetailScreen.tsx
- [x] T087 [P] [US4] Create TripCard component in mobile/src/components/trips/TripCard.tsx
- [x] T088 [P] [US4] Create TripStatusBadge component in mobile/src/components/trips/TripStatusBadge.tsx
- [x] T089 [US4] Implement navigation launch (Google Maps/Apple Maps) in mobile/src/utils/navigation.ts
- [x] T090 [US4] Implement useTrips hook in mobile/src/hooks/useTrips.ts
- [x] T091 [US4] Add trip start/complete actions in mobile/src/services/trips/tripService.ts
- [x] T092 [US4] Connect trips to store in mobile/src/store/tripsStore.ts

**Checkpoint**: US4 complete - Trips visible and navigable

---

## Phase 7: User Story 5 - Messaging with Dispatch (Priority: P3)

**Goal**: Send and receive messages with dispatch

**Independent Test**: Send message, receive reply, view conversation history

### Tests for User Story 5

- [x] T093 [P] [US5] Unit test for message service in mobile/__tests__/unit/services/messageService.test.ts
- [x] T094 [P] [US5] Integration test for messaging flow in mobile/__tests__/integration/messages.test.ts

### Implementation for User Story 5

- [x] T095 [US5] Implement message service in mobile/src/services/messages/messageService.ts
- [x] T096 [US5] Create message API calls in mobile/src/services/api/messageApi.ts
- [x] T097 [US5] Implement message storage in WatermelonDB in mobile/src/services/storage/messageModel.ts
- [x] T098 [US5] Implement message queue for offline in mobile/src/services/messages/messageQueue.ts
- [x] T099 [US5] Create MessagesScreen (conversation view) in mobile/src/screens/messages/MessagesScreen.tsx
- [x] T100 [P] [US5] Create MessageBubble component in mobile/src/components/messages/MessageBubble.tsx
- [x] T101 [P] [US5] Create MessageInput component in mobile/src/components/messages/MessageInput.tsx
- [x] T102 [US5] Implement useMessages hook in mobile/src/hooks/useMessages.ts
- [x] T103 [US5] Add unread message badge to tab bar in mobile/src/navigation/MainNavigator.tsx
- [x] T104 [US5] Connect messages to store in mobile/src/store/messagesStore.ts

**Checkpoint**: US5 complete - Messaging works with offline queue

---

## Phase 8: User Story 6 - Offline Mode (Priority: P3)

**Goal**: App works without internet, syncs when connection returns

**Independent Test**: Go offline, view cached data, make changes, verify sync when online

### Tests for User Story 6

- [x] T105 [P] [US6] Unit test for offline service in mobile/__tests__/unit/services/offlineService.test.ts
- [x] T106 [P] [US6] Unit test for sync manager in mobile/__tests__/unit/services/syncManager.test.ts
- [x] T107 [P] [US6] Integration test for offline/online flow in mobile/__tests__/integration/offline.test.ts

### Implementation for User Story 6

- [x] T108 [US6] Implement offline detection service in mobile/src/services/offline/offlineService.ts
- [x] T109 [US6] Implement sync manager in mobile/src/services/offline/syncManager.ts
- [x] T110 [US6] Add offline indicator component in mobile/src/components/common/OfflineIndicator.tsx
- [x] T111 [US6] Implement stale data warning logic in mobile/src/services/offline/staleDataChecker.ts
- [x] T112 [US6] Add offline banner to main screens in mobile/src/components/navigation/OfflineBanner.tsx
- [x] T113 [US6] Connect sync manager to app lifecycle in mobile/App.tsx
- [x] T114 [US6] Implement optimistic updates for status changes in mobile/src/store/statusStore.ts
- [x] T115 [US6] Add retry logic for failed API calls in mobile/src/services/api/retryManager.ts

**Checkpoint**: US6 complete - App works offline with sync

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting all user stories

- [x] T116 [P] Add app icons and splash screen assets in mobile/assets/
- [x] T117 [P] Configure app versioning in mobile/package.json
- [x] T118 Implement error boundary in mobile/src/components/ErrorBoundary.tsx
- [x] T119 [P] Add loading states to all screens
- [x] T120 [P] Add empty states to list screens
- [x] T121 Implement analytics/logging service in mobile/src/services/analytics/analyticsService.ts
- [x] T122 [P] Create SettingsScreen in mobile/src/screens/settings/SettingsScreen.tsx
- [x] T123 Add language selection (fr/en) in mobile/src/services/i18n/
- [x] T124 Run E2E tests with Detox for all critical flows
- [x] T125 Performance profiling and optimization
- [x] T126 Security audit (certificate pinning, secure storage verification)
- [x] T127 Update README with build and run instructions in mobile/README.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - MVP critical path
- **US2 (Phase 4)**: Depends on Foundational + US1 (status integration)
- **US3 (Phase 5)**: Depends on Foundational - can parallel with US4
- **US4 (Phase 6)**: Depends on Foundational - can parallel with US3
- **US5 (Phase 7)**: Depends on Foundational - can parallel with US3/US4
- **US6 (Phase 8)**: Depends on US1-US5 (enhances all features)
- **Polish (Phase 9)**: Depends on all user stories

### User Story Dependencies

```
Setup (Phase 1)
    │
    ▼
Foundational (Phase 2)
    │
    ├──► US1: Auth & Status (P1) ──► MVP Ready!
    │         │
    │         ▼
    ├──► US2: GPS Tracking (P1) ──► Core Feature!
    │
    ├──► US3: Notifications (P2) ─┐
    │                              ├──► Can run in parallel
    ├──► US4: Trips (P2) ─────────┘
    │
    ├──► US5: Messaging (P3) ──► Enhanced feature
    │
    └──► US6: Offline Mode (P3) ──► Requires others first
              │
              ▼
         Polish (Phase 9)
```

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T003, T004, T005, T006, T007 (npm installs)
- T009, T010, T011 (config files)
- T013, T014 (native configs)

**Within Foundational (Phase 2)**:
- T018 (theme) parallel with all
- T023, T024, T025, T026 (store slices)
- T032, T033, T034, T035, T036 (UI components)

**User Stories in Parallel (after Foundational)**:
- US3 + US4 can run in parallel
- US3 + US4 + US5 can all run in parallel if team capacity allows

---

## Parallel Example: User Story 1

```bash
# Tests can run in parallel:
T039: "Unit test for auth service"
T040: "Unit test for status service"
T041: "Integration test for login flow"

# Implementation - sequential then parallel:
T042: "auth service" ─┐
T043: "token storage" ┴── can parallel (different files)
T044: "status service" ── depends on auth
T045-T046: "screens" ── sequential (share navigation)
T048, T049: "components" ── can parallel (different files)
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (~2-3 hours)
2. Complete Phase 2: Foundational (~4-6 hours)
3. Complete Phase 3: US1 Auth & Status (~4-6 hours)
4. **STOP and VALIDATE**: Driver can login and change status
5. Complete Phase 4: US2 GPS Tracking (~6-8 hours)
6. **MVP COMPLETE**: Core tracking functionality ready

### Incremental Delivery

1. **MVP**: Setup + Foundational + US1 + US2 → Deploy alpha
2. **v1.1**: Add US3 (Notifications) + US4 (Trips) → Deploy beta
3. **v1.2**: Add US5 (Messaging) → Enhanced communication
4. **v1.3**: Add US6 (Offline) → Production ready

### Task Count Summary

| Phase | Task Count | Parallel Tasks |
|-------|------------|----------------|
| Setup | 14 | 9 |
| Foundational | 24 | 12 |
| US1 (P1) | 14 | 7 |
| US2 (P1) | 15 | 4 |
| US3 (P2) | 12 | 4 |
| US4 (P2) | 13 | 4 |
| US5 (P3) | 12 | 4 |
| US6 (P3) | 11 | 4 |
| Polish | 12 | 5 |
| **Total** | **127** | **53** |

---

## Notes

- [P] tasks can run in parallel (different files, no dependencies)
- [Story] label maps task to specific user story
- Each user story independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
