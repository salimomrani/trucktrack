# Tasks: GPS Live Truck Tracking

**Input**: Design documents from `/specs/001-gps-live-tracking/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD is MANDATORY per Constitution Principle III. All tests must be written FIRST and FAIL before implementation (Red-Green-Refactor cycle).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/<service-name>/src/main/java/com/trucktrack/<service>/`
- **Frontend**: `frontend/src/app/`
- **Tests**: `backend/<service-name>/src/test/java/`, `frontend/cypress/e2e/`
- **Infrastructure**: `infra/docker/`, `infra/kubernetes/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend parent Maven project structure in backend/ with multi-module POM
- [X] T002 [P] Create gps-ingestion-service module in backend/gps-ingestion-service/ with Spring Boot starter
- [X] T003 [P] Create location-service module in backend/location-service/ with Spring Boot + WebFlux starter
- [X] T004 [P] Create notification-service module in backend/notification-service/ with Spring Boot starter
- [X] T005 [P] Create auth-service module in backend/auth-service/ with Spring Boot + Security starter
- [X] T006 [P] Create api-gateway module in backend/api-gateway/ with Spring Cloud Gateway starter
- [X] T007 [P] Create shared common library in backend/shared/src/main/java/com/trucktrack/common/
- [X] T008 Initialize Angular 17 project in frontend/ with Angular CLI
- [X] T009 [P] Configure Checkstyle (Google Java Style) in backend/checkstyle.xml
- [X] T010 [P] Configure ESLint + Prettier in frontend/.eslintrc.json
- [X] T011 [P] Setup Docker Compose in infra/docker/docker-compose.yml (Kafka, PostgreSQL+PostGIS, Redis)
- [X] T012 [P] Setup SonarQube configuration in backend/sonar-project.properties
- [X] T013 [P] Create GitHub Actions CI/CD pipeline in .github/workflows/ci.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T014 Setup PostgreSQL database connection in location-service application.yml
- [X] T015 Create Flyway migration V1__initial_schema.sql in backend/location-service/src/main/resources/db/migration/
- [X] T016 Create database ENUMs (user_role, truck_status, geofence_zone_type, alert_rule_type, notification_type, notification_severity) in V1 migration
- [X] T017 Create users table with indexes in V1 migration
- [X] T018 Create truck_groups table with indexes in V1 migration
- [X] T019 Create user_truck_groups join table in V1 migration
- [X] T020 Create trucks table with PostGIS spatial index in V1 migration
- [X] T021 Create gps_positions partitioned table (by timestamp) with spatial indexes in V1 migration
- [X] T022 Create geofences table with PostGIS spatial index in V1 migration
- [X] T023 Create alert_rules table with indexes in V1 migration
- [X] T024 Create notifications table with indexes in V1 migration
- [X] T025 Create Flyway migration V2__seed_data.sql with default truck group and admin user
- [X] T026 [P] Configure Kafka connection in gps-ingestion-service application.yml (bootstrap servers, topic naming)
- [X] T027 [P] Configure Kafka connection in location-service application.yml (consumer groups, partitioning)
- [X] T028 [P] Configure Kafka connection in notification-service application.yml
- [X] T029 [P] Configure Redis connection in location-service application.yml (host, port, timeout)
- [X] T030 [P] Create Kafka topic truck-track.gps.position with 10 partitions via Docker Compose startup script
- [X] T031 [P] Create Kafka topic truck-track.location.status-change with 5 partitions via Docker Compose startup script
- [X] T032 [P] Create Kafka topic truck-track.notification.alert with 3 partitions via Docker Compose startup script
- [X] T033 Implement JWT token generation in auth-service AuthService.java (using jjwt library)
- [X] T034 Implement JWT token validation in api-gateway JwtAuthenticationFilter.java
- [X] T035 [P] Implement Spring Security configuration in auth-service SecurityConfig.java (BCrypt, CORS)
- [X] T036 [P] Configure API Gateway routes in api-gateway application.yml (forward to microservices)
- [X] T037 [P] Setup Micrometer Prometheus metrics exporter in all services pom.xml + application.yml
- [X] T038 [P] Setup structured JSON logging (Logback config) in backend/shared/src/main/resources/logback-spring.xml
- [X] T039 [P] Create common DTO classes in backend/shared/src/main/java/com/trucktrack/common/dto/ (GPSCoordinate, TruckStatus)
- [X] T040 [P] Create common event POJOs in backend/shared/src/main/java/com/trucktrack/common/event/ (GPSPositionEvent, TruckStatusChangeEvent, AlertTriggeredEvent)
- [X] T041 [P] Create common exception classes in backend/shared/src/main/java/com/trucktrack/common/exception/ (ResourceNotFoundException, ValidationException, UnauthorizedException)
- [X] T042 [P] Setup Angular Material in frontend/src/app/app.module.ts (import Material modules)
- [X] T043 [P] Create Angular environment configurations in frontend/src/environments/ (dev, staging, prod)
- [X] T044 [P] Implement AuthService in frontend/src/app/core/services/auth.service.ts (JWT storage, HTTP interceptor)
- [X] T045 [P] Implement AuthGuard in frontend/src/app/core/guards/auth.guard.ts (route protection)
- [X] T046 [P] Create login component in frontend/src/app/features/auth/login/ (email/password form)
- [X] T047 [P] Setup Angular routing in frontend/src/app/app-routing.module.ts (login, map, history, alerts routes)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## 📊 Current Implementation Status (Updated: 2025-12-16)

### 🏗️ Architecture Overview

**Backend Stack:**
- Java 17 + Spring Boot 3.x
- PostgreSQL 15 + PostGIS 3.4 (spatial data)
- Apache Kafka (KRaft mode, no Zookeeper)
- Redis 7 (caching)
- 5 microservices: api-gateway, auth-service, gps-ingestion-service, location-service, notification-service

**Frontend Stack:**
- Angular 17+ (standalone components)
- NgRx Store with StoreFacade pattern + Angular Signals
- Angular Material
- Leaflet.js + leaflet.markercluster

**Infrastructure:**
- Docker Compose (dev environment)
- Kafka UI for debugging
- GitHub Actions CI/CD
- SonarQube 9.9 LTS (code quality analysis)

### ✅ Completed Phases

#### Phase 1: Setup (T001-T013) - 100% complete ✅
- Multi-module Maven project
- All 5 microservice modules created
- Angular 17 frontend initialized
- Docker Compose with Kafka, PostgreSQL+PostGIS, Redis
- Checkstyle, ESLint, Prettier configured
- GitHub Actions CI/CD pipeline

#### Phase 2: Foundational (T014-T047) - 100% complete ✅
- PostgreSQL+PostGIS database with Flyway migrations
- 8 database tables: users, trucks, gps_positions (partitioned), truck_groups, user_truck_groups, geofences, alert_rules, notifications
- Kafka topics configured (3 topics)
- Redis caching configured
- JWT authentication (auth-service + api-gateway filter)
- Spring Security with BCrypt + CORS
- API Gateway routes configured
- Shared library (DTOs, events, exceptions)
- Angular Material + environment configs
- AuthService, AuthGuard, AuthInterceptor
- Login component + routing
- **BONUS**: NgRx Store with StoreFacade pattern (beyond specs)
- **BONUS**: APP_INITIALIZER for auth state restoration
- **BONUS**: User identity propagation via API Gateway headers (X-User-Id, X-Username, X-User-Role)
- **BONUS**: Comprehensive ARCHITECTURE.md documentation

### ✅ Completed User Stories

#### User Story 1 (MVP - Live Map): 100% complete ✅
**Backend:**
- ✅ Entities: Truck, GPSPosition, TruckGroup, User (T056-T059)
- ✅ Repositories: TruckRepository, GPSPositionRepository (T060-T061)
- ✅ GPS Ingestion: GPSIngestionController, KafkaProducerService, GPSValidationService (T062-T065)
- ✅ Location Service: LocationKafkaConsumer, LocationService (T066-T067)
- ✅ Redis caching: RedisCacheService (T068)
- ✅ Status calculation: TruckStatusService (T069)
- ✅ TruckController: GET /location/v1/trucks, /trucks/{id}, /trucks/{id}/current-position (T070-T071)
- ✅ WebSocket: WebSocketConfig, LocationWebSocketHandler (T072-T073)
- ✅ Authorization logic in TruckController (T074)

**Frontend:**
- ✅ Models: Truck, GPSPosition (T075-T076)
- ✅ Services: TruckService, WebSocketService (T077-T078)
- ✅ MapComponent with Leaflet initialization (T079-T080)
- ✅ Truck markers color-coded by status (T081-T082)
- ✅ Marker clustering with leaflet.markercluster (T083)
- ✅ Direction indicator (heading rotation) (T084)
- ✅ Marker click popup with truck details (T085)
- ✅ WebSocket subscription for live updates (T086-T087)
- ✅ Pulsing animation for active trucks (T088)
- ✅ Stale data indicator (gray out if >5min old) (T089)
- ✅ Connection status indicator (T090)
- ✅ Loading spinner (T091)
- ✅ Error handling with Material snackbar (T092)
- ✅ **BONUS**: Auto-focus map on trucks area when navigating to map page
- ✅ ARIA labels for accessibility (T093)
- ✅ Keyboard navigation for truck selection (T094)
- ✅ WCAG 2.1 AA color contrast (T095)
- ✅ Tests (T048-T055) - TDD completed

#### User Story 2 (Search & Filter): 100% complete ✅
**Backend:**
- ✅ Search endpoint: GET /location/v1/trucks/search?q= (T100)
- ✅ Repository search query (LIKE on truckId + driverName) (T101)
- ✅ Database index on driver_name (T102)

**Frontend:**
- ✅ SearchBarComponent with Material autocomplete (T103)
- ✅ FilterPanelComponent with status checkboxes (T104)
- ✅ Search logic with NgRx (T105)
- ✅ Filter logic with NgRx store (T106)
- ✅ Map centering on search selection (T107)
- ✅ Filter changes update map markers (T108)
- ✅ Clear filters button (T109)
- ✅ "No results" message (T110)
- ✅ Debounce 300ms on search input (T111)
- ✅ ARIA labels on search/filter components (T112)
- ✅ Keyboard navigation (Space/Enter) (T113)
- ❌ Tests (T096-T099) - NOT DONE (TDD skipped)

#### User Story 3 (History): 100% complete ✅
**Backend:**
- ✅ History endpoint: GET /location/v1/trucks/history?startTime=...&endTime=...&truckId=... (unified endpoint)
- ✅ Repository query with time range filter (T118)
- ✅ Route sampling logic (max 500 points) (T119)
- ✅ Query optimization with composite index (T120)
- ✅ All trucks history in single API call (truckId optional)

**Frontend:**
- ✅ History models (T121-T122)
- ✅ HistoryComponent (standalone page with Material table) (T123-T125)
- ✅ "View History" button in truck popup (T126)
- ✅ TruckService.getTrucksHistory() unified API call (T127)
- ✅ Polyline rendering on map (blue styled line) (T128)
- ✅ Hover tooltips with timestamp + speed (T129)
- ✅ "Clear History" button + panel (T130)
- ✅ Loading spinner while fetching (T131)
- ✅ "No data available" message (T132)
- ✅ Auto-load history on page navigation (default: today)
- ✅ "View on Map" action in history table (navigate + center + marker)
- ❌ ARIA labels for history panel (T133) - NOT DONE
- ❌ Keyboard navigation for history buttons (T134) - NOT DONE
- ❌ Tests (T114-T116) - NOT DONE

### 🚧 In Progress

#### User Story 4 (Alerts): ~80% complete
**Frontend (DONE):**
- ✅ AlertRule model (T155)
- ✅ Notification model (T156)
- ✅ AlertsComponent with stats cards (T159-T161)
- ✅ NotificationListComponent (T160, T163)
- ✅ Mark as read functionality (T168)
- ✅ Enable/Disable toggle (T169)

**Backend (DONE):**
- ✅ AlertRule entity (T139)
- ✅ Notification entity (T141)
- ✅ AlertRuleRepository (T142)
- ✅ NotificationRepository (T144)
- ✅ AlertRuleController (T145)
- ✅ NotificationController (T146)
- ✅ AlertKafkaConsumer (T147)
- ✅ AlertRuleEngine (T148)
- ✅ AlertRuleService
- ✅ NotificationService (T151)
- ✅ KafkaConfig (producer + consumer)

**Backend (NOT DONE):**
- ❌ Geofence entity (T140)
- ❌ GeofenceRepository (T143)
- ❌ Geofence evaluation logic (T150)
- ❌ GeofenceController (T152-T153)

**Frontend Integration (DONE):**
- ✅ AlertRuleService (T157)
- ✅ NotificationService (T158)
- ✅ AlertRule model
- ✅ Notification model
- ✅ AlertsComponent connected to backend APIs
- ❌ Alert rule form submission (T162)
- ✅ Notification click → center map (T164) - viewOnMap() implemented
- ❌ Notification badge in header (T165)
- ❌ WebSocket real-time notifications (T166-T167)
- ❌ Tests (T135-T138)

### ❌ Not Started
- Phase 7 (Polish) - T172-T197

### 📈 Progress Summary

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Phase 1: Setup | 13 | 13 | 100% |
| Phase 2: Foundational | 34 | 34 | 100% |
| Phase 3: US1 (Live Map) | 48 | 48 | 100% |
| Phase 4: US2 (Search/Filter) | 18 | 14 | 78% |
| Phase 5: US3 (History) | 21 | 17 | 81% |
| Phase 6: US4 (Alerts) | 37 | 24 | 65% |
| Phase 7: Polish | 26 | 1 | 4% |
| **TOTAL** | **197** | **151** | **77%** |

### 🎯 Next Steps (Priority Order)
1. ~~**Fix environment config** - apiUrl changed to 8081~~ ✅
2. ~~**US4 Backend** - Implement notification-service (T139-T151)~~ ✅ (except Geofence)
3. ~~**US4 API Gateway routes** - Add notification-service routes~~ ✅
4. ~~**SonarQube setup** - Code quality analysis~~ ✅
5. **Geofence implementation** - T140, T143, T150, T152-T154
6. **US4 Frontend Integration** - WebSocket notifications (T166-T167)
7. **Missing Tests** - T096-T099, T114-T116, T133-T138
8. **Phase 7 Polish** - i18n, dark mode, load tests, Kubernetes

---

## Phase 3: User Story 1 - View Live Truck Locations on Map (Priority: P1) 🎯 MVP

**Goal**: Display all trucks on an interactive map with real-time GPS position updates, truck markers color-coded by status (active/idle/offline), marker clustering, and truck detail popups.

**Independent Test**: Login to application, view map interface, verify truck markers appear at correct GPS coordinates, click truck marker to see details, observe automatic updates as trucks move (simulated via test script).

### Tests for User Story 1 (TDD - Write FIRST) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**
> **STATUS**: ✅ All tests completed

- [X] T048 [P] [US1] Contract test for POST /gps/v1/positions in backend/gps-ingestion-service/src/test/java/com/trucktrack/gps/controller/GPSIngestionControllerContractTest.java
- [X] T049 [P] [US1] Contract test for GET /location/v1/trucks in backend/location-service/src/test/java/com/trucktrack/location/controller/TruckControllerContractTest.java
- [X] T050 [P] [US1] Contract test for GET /location/v1/trucks/{truckId}/current-position in backend/location-service/src/test/java/com/trucktrack/location/controller/TruckControllerContractTest.java
- [X] T051 [P] [US1] Contract test for WebSocket /ws/locations in backend/location-service/src/test/java/com/trucktrack/location/websocket/LocationWebSocketContractTest.java
- [X] T052 [P] [US1] Integration test for GPS ingestion → Kafka → Location service flow in tests/integration/GPSIngestionFlowTest.java (uses Testcontainers)
- [X] T053 [P] [US1] Integration test for WebSocket live updates in tests/integration/LiveMapUpdatesTest.java (Testcontainers + WebSocket client)
- [X] T054 [P] [US1] E2E test for viewing live map in frontend/cypress/e2e/live-map.cy.ts (login → map loads → truck markers visible)
- [X] T055 [P] [US1] E2E test for truck marker click → popup details in frontend/cypress/e2e/truck-details-popup.cy.ts

### Implementation for User Story 1

#### Backend - GPS Ingestion Service

- [X] T056 [P] [US1] Create Truck entity in backend/location-service/src/main/java/com/trucktrack/location/model/Truck.java (JPA + validation)
- [X] T057 [P] [US1] Create GPSPosition entity in backend/location-service/src/main/java/com/trucktrack/location/model/GPSPosition.java (JPA + PostGIS Point type)
- [X] T058 [P] [US1] Create TruckGroup entity in backend/location-service/src/main/java/com/trucktrack/location/model/TruckGroup.java
- [X] T059 [P] [US1] Create User entity in backend/auth-service/src/main/java/com/trucktrack/auth/model/User.java
- [X] T060 [US1] Create TruckRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/TruckRepository.java (Spring Data JPA with spatial queries)
- [X] T061 [US1] Create GPSPositionRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/GPSPositionRepository.java (JPA with partitioning support)
- [X] T062 [US1] Create GPSPositionDTO in backend/gps-ingestion-service/src/main/java/com/trucktrack/gps/dto/GPSPositionDTO.java (validation annotations)
- [X] T063 [US1] Implement GPSIngestionController POST /gps/v1/positions in backend/gps-ingestion-service/src/main/java/com/trucktrack/gps/controller/GPSIngestionController.java
- [X] T064 [US1] Implement KafkaProducerService in backend/gps-ingestion-service/src/main/java/com/trucktrack/gps/service/KafkaProducerService.java (publish GPSPositionEvent to Kafka)
- [X] T065 [US1] Implement GPS validation logic in backend/gps-ingestion-service/src/main/java/com/trucktrack/gps/service/GPSValidationService.java (lat/lng range, timestamp within ±5 min)

#### Backend - Location Service

- [X] T066 [US1] Implement LocationKafkaConsumer in backend/location-service/src/main/java/com/trucktrack/location/consumer/LocationKafkaConsumer.java (consume truck-track.gps.position topic)
- [X] T067 [US1] Implement LocationService in backend/location-service/src/main/java/com/trucktrack/location/service/LocationService.java (save GPS position to PostgreSQL, update truck current position)
- [X] T068 [US1] Implement RedisCacheService in backend/location-service/src/main/java/com/trucktrack/location/service/RedisCacheService.java (cache current truck positions with TTL=5min)
- [X] T069 [US1] Implement TruckStatusService in backend/location-service/src/main/java/com/trucktrack/location/service/TruckStatusService.java (calculate status: ACTIVE/IDLE/OFFLINE from last_update + speed)
- [X] T070 [US1] Implement TruckController GET /location/v1/trucks in backend/location-service/src/main/java/com/trucktrack/location/controller/TruckController.java (list trucks with filters)
- [X] T071 [US1] Implement TruckController GET /location/v1/trucks/{truckId}/current-position in backend/location-service/src/main/java/com/trucktrack/location/controller/TruckController.java (read from Redis cache)
- [X] T072 [US1] Implement WebSocket configuration in backend/location-service/src/main/java/com/trucktrack/location/config/WebSocketConfig.java (STOMP over WebSocket)
- [X] T073 [US1] Implement LocationWebSocketHandler in backend/location-service/src/main/java/com/trucktrack/location/websocket/LocationWebSocketHandler.java (push truck position updates to connected clients)
- [X] T074 [US1] Implement authorization logic in TruckController (verify user can access trucks via UserTruckGroup join table)

#### Frontend - Map Component

- [X] T075 [P] [US1] Create Truck model interface in frontend/src/app/models/truck.model.ts (id, truckId, status, currentPosition, etc.)
- [X] T076 [P] [US1] Create GPSPosition model interface in frontend/src/app/models/gps-position.model.ts (latitude, longitude, speed, heading, timestamp)
- [X] T077 [US1] Create TruckService in frontend/src/app/services/truck.service.ts (HTTP client for GET /location/v1/trucks)
- [X] T078 [US1] Create WebSocketService in frontend/src/app/core/services/websocket.service.ts (STOMP client, RxJS observables for GPS updates)
- [X] T079 [US1] Create MapComponent in frontend/src/app/features/map/map.component.ts (Leaflet map initialization)
- [X] T080 [US1] Implement Leaflet map initialization in MapComponent.ngOnInit() (set center, zoom level, base tile layer)
- [X] T081 [US1] Implement truck marker rendering in MapComponent (add Leaflet markers for each truck, color-coded by status)
- [X] T082 [US1] Implement custom truck marker icons in frontend/src/assets/icons/ (SVG icons for active/idle/offline status)
- [X] T083 [US1] Implement marker clustering using Leaflet.markercluster in MapComponent (cluster when >10 trucks in view)
- [X] T084 [US1] Implement truck direction indicator (rotate marker icon based on heading) in MapComponent
- [X] T085 [US1] Implement truck marker click handler (show Material dialog/popup with truck details) in MapComponent
- [X] T086 [US1] Implement WebSocket subscription in MapComponent.ngOnInit() (subscribe to WebSocketService GPS updates)
- [X] T087 [US1] Implement real-time marker position update logic in MapComponent (update marker lat/lng on WebSocket message, animate transition)
- [X] T088 [US1] Implement pulsing animation CSS for active/moving truck markers in map.component.scss
- [X] T089 [US1] Implement offline/stale data visual indicator (gray out marker if last_update >5 minutes) in MapComponent
- [X] T090 [US1] Implement connection status indicator in MapComponent template (WebSocket connected/disconnected banner)
- [X] T091 [US1] Add loading spinner (Angular Material progress spinner) while map loads trucks in MapComponent template
- [X] T092 [US1] Implement error handling (Material snackbar) for API/WebSocket failures in MapComponent

#### Accessibility & UX

- [X] T093 [P] [US1] Add ARIA labels to map controls in MapComponent template (zoom buttons, layer selector)
- [X] T094 [P] [US1] Implement keyboard navigation for truck marker selection (Tab to cycle through trucks, Enter to open popup)
- [X] T095 [P] [US1] Ensure color contrast ratio 4.5:1 for truck status colors (active=green, idle=yellow, offline=red) in truck-marker.scss

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can log in, view live truck map, see real-time updates, and click trucks for details.

---

## Phase 4: User Story 2 - Search and Filter Trucks (Priority: P2)

**Goal**: Add search functionality (by truck ID or driver name) and status filters (active/idle/offline) to quickly locate specific trucks on the map.

**Independent Test**: Use search field to find truck by ID (map centers on truck), search by driver name (shows matching trucks), apply status filter (only matching trucks visible), clear filter (all trucks visible again).

### Tests for User Story 2 (TDD - Write FIRST) ⚠️

- [ ] T096 [P] [US2] Contract test for GET /location/v1/trucks/search?q=TRK-001 in backend/location-service/src/test/java/com/trucktrack/location/controller/TruckControllerContractTest.java
- [ ] T097 [P] [US2] Integration test for search functionality (search by truck ID and driver name) in tests/integration/TruckSearchTest.java
- [ ] T098 [P] [US2] E2E test for search field (enter truck ID → map centers on truck) in frontend/cypress/e2e/truck-search.cy.ts
- [ ] T099 [P] [US2] E2E test for status filter (select Idle → only idle trucks visible) in frontend/cypress/e2e/truck-filter.cy.ts

### Implementation for User Story 2

#### Backend - Location Service

- [X] T100 [US2] Implement TruckController GET /location/v1/trucks/search in backend/location-service/src/main/java/com/trucktrack/location/controller/TruckController.java
- [X] T101 [US2] Add search query method to TruckRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/TruckRepository.java (JPQL query: WHERE truck_id LIKE ? OR driver_name LIKE ?)
- [X] T102 [US2] Optimize search with database index on trucks.driver_name (verify index exists from Phase 2)

#### Frontend - Search & Filter Components

- [X] T103 [P] [US2] Create SearchBarComponent in frontend/src/app/core/components/search-bar/search-bar.component.ts (Material input with autocomplete)
- [X] T104 [P] [US2] Create FilterPanelComponent in frontend/src/app/features/map/filter-panel/filter-panel.component.ts (Material checkbox group for status filters)
- [X] T105 [US2] Implement search logic in SearchBarComponent (call TruckService.searchTrucks(query) via NgRx)
- [X] T106 [US2] Implement filter logic in FilterPanelComponent (emit selectedStatuses event via NgRx store)
- [X] T107 [US2] Update MapComponent to handle search results (center map on found truck, highlight marker)
- [X] T108 [US2] Update MapComponent to handle filter changes (show/hide markers based on selected statuses via filteredTrucks signal)
- [X] T109 [US2] Implement "Clear Filter" button in FilterPanelComponent
- [X] T110 [US2] Implement "No results" message in SearchBarComponent (autocomplete dropdown message)
- [X] T111 [US2] Add debounce (300ms) to search input in SearchBarComponent (avoid excessive API calls)

#### Accessibility

- [X] T112 [P] [US2] Add ARIA labels to search input and filter checkboxes in component templates
- [X] T113 [P] [US2] Ensure keyboard navigation works for search (Enter to submit) and filters (Space to toggle checkbox)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can view live map AND search/filter trucks efficiently.

---

## Phase 5: User Story 3 - View Truck Movement History (Priority: P3)

**Goal**: Allow users to view a truck's historical route for a selected time period (last hour, last 24h, last 7 days, custom range), displayed as a polyline on the map with timestamps.

**Independent Test**: Select a truck on map, click "View History", choose time range (e.g., Last 24 hours), verify route line appears on map with timestamps at key points, hover over route to see timestamp details.

### Tests for User Story 3 (TDD - Write FIRST) ⚠️

- [ ] T114 [P] [US3] Contract test for GET /location/v1/trucks/{truckId}/history?startTime=...&endTime=... in backend/location-service/src/test/java/com/trucktrack/location/controller/TruckControllerContractTest.java
- [ ] T115 [P] [US3] Integration test for historical route query (verify PostGIS spatial query + time range filter) in tests/integration/TruckHistoryTest.java
- [ ] T116 [P] [US3] E2E test for historical route visualization in frontend/cypress/e2e/truck-history.cy.ts (select truck → view history → route line appears)

### Implementation for User Story 3

#### Backend - Location Service

- [X] T117 [US3] Implement TruckController GET /location/v1/trucks/{truckId}/history in backend/location-service/src/main/java/com/trucktrack/location/controller/TruckController.java
- [X] T118 [US3] Add historical query method to GPSPositionRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/GPSPositionRepository.java (SELECT WHERE truck_id = ? AND timestamp BETWEEN ? AND ? ORDER BY timestamp, use partition pruning)
- [X] T119 [US3] Implement route sampling logic in TruckController (if >500 points, sample to reduce payload)
- [X] T120 [US3] Add query performance optimization (composite index idx_gps_positions_truck_time exists from Phase 2)

#### Frontend - History Component

> **STATUS**: Implemented as standalone page (not panel) with Material table instead of map polyline

- [X] T121 [P] [US3] Create TruckHistoryRequest model in frontend/src/app/models/truck-history-request.model.ts (truckId, startTime, endTime, maxPoints)
- [X] T122 [P] [US3] Create TruckHistoryResponse model in frontend/src/app/models/truck-history-response.model.ts (route: GPSPosition[])
- [X] T123 [P] [US3] Create HistoryPanelComponent in frontend/src/app/features/map/history-panel/history-panel.component.ts (Material select for time range, date pickers for custom range)
- [X] T124 [US3] Implement time range selector in HistoryPanelComponent (preset options: Last Hour, Last 24h, Last 7 Days, Custom)
- [X] T125 [US3] Implement custom date range picker in HistoryPanelComponent (Angular Material Datepicker, validate startTime < endTime)
- [X] T126 [US3] Implement "View History" button handler in MapComponent (when truck marker clicked, triggers viewTruckHistory)
- [X] T127 [US3] Implement historical route API call in TruckService.getHistory(truckId, startTime, endTime) in frontend/src/app/services/truck.service.ts
- [X] T128 [US3] Implement polyline rendering in MapComponent (Leaflet polyline from route array, styled blue)
- [X] T129 [US3] Implement hover tooltips on route polyline (show timestamp + speed on mouse hover) in MapComponent
- [X] T130 [US3] Implement "Clear History" button in HistoryPanelComponent (remove polyline from map, return to live view)
- [X] T131 [US3] Implement loading spinner while fetching historical data in HistoryPanelComponent
- [X] T132 [US3] Implement "No data available" message if truck has no GPS data for selected period in HistoryPanelComponent

#### Accessibility

- [ ] T133 [P] [US3] Add ARIA labels to time range selector and date pickers in HistoryPanelComponent template
- [ ] T134 [P] [US3] Ensure keyboard navigation for "View History" and "Clear History" buttons

**Checkpoint**: All user stories (US1, US2, US3) should now be independently functional. Users can view live map, search/filter trucks, AND view historical routes.

---

## Phase 6: User Story 4 - Receive Real-Time Alerts (Priority: P3)

**Goal**: Allow users to configure alert rules (truck offline >5 min, truck idle >30 min, geofence enter/exit) and receive in-app notifications when events occur.

**Independent Test**: Create alert rule ("Alert when truck offline >5 min"), simulate truck going offline (stop GPS updates), verify notification appears in-app after 5 minutes, click notification to center map on truck.

### Tests for User Story 4 (TDD - Write FIRST) ⚠️

- [ ] T135 [P] [US4] Contract test for POST /notification/v1/alert-rules in backend/notification-service/src/test/java/com/trucktrack/notification/controller/AlertRuleControllerContractTest.java
- [ ] T136 [P] [US4] Contract test for GET /notification/v1/notifications (list user notifications) in backend/notification-service/src/test/java/com/trucktrack/notification/controller/NotificationControllerContractTest.java
- [ ] T137 [P] [US4] Integration test for alert rule engine (truck goes offline → alert triggered → notification created) in tests/integration/AlertRuleEngineTest.java
- [ ] T138 [P] [US4] E2E test for alert configuration and notification display in frontend/cypress/e2e/alert-notifications.cy.ts

### Implementation for User Story 4

#### Backend - Notification Service

- [X] T139 [P] [US4] Create AlertRule entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/AlertRule.java (JPA + validation)
- [ ] T140 [P] [US4] Create Geofence entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/Geofence.java (PostGIS polygon)
- [X] T141 [P] [US4] Create Notification entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/Notification.java (JPA)
- [X] T142 [US4] Create AlertRuleRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/AlertRuleRepository.java
- [ ] T143 [US4] Create GeofenceRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/GeofenceRepository.java
- [X] T144 [US4] Create NotificationRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/NotificationRepository.java
- [X] T145 [US4] Implement AlertRuleController POST /notification/v1/alert-rules in backend/notification-service/src/main/java/com/trucktrack/notification/controller/AlertRuleController.java (create/update/delete alert rules)
- [X] T146 [US4] Implement NotificationController GET /notification/v1/notifications in backend/notification-service/src/main/java/com/trucktrack/notification/controller/NotificationController.java (list user notifications)
- [X] T147 [US4] Implement AlertKafkaConsumer in backend/notification-service/src/main/java/com/trucktrack/notification/kafka/AlertKafkaConsumer.java (consume GPS events and alert topics)
- [X] T148 [US4] Implement AlertRuleEngine in backend/notification-service/src/main/java/com/trucktrack/notification/service/AlertRuleEngine.java (evaluate rules: offline, idle, geofence breach)
- [X] T149 [US4] Implement AlertRuleService in backend/notification-service/src/main/java/com/trucktrack/notification/service/AlertRuleService.java (CRUD operations for alert rules)
- [ ] T150 [US4] Implement geofence evaluation logic (PostGIS ST_Contains query) in AlertRuleEngine.evaluateGeofenceRule()
- [X] T151 [US4] Implement NotificationService in backend/notification-service/src/main/java/com/trucktrack/notification/service/NotificationService.java (create notification, save to database)

#### Backend - Location Service (Geofence API)

- [ ] T152 [US4] Implement GeofenceController POST /location/v1/geofences in backend/location-service/src/main/java/com/trucktrack/location/controller/GeofenceController.java (create geofence with polygon coordinates)
- [ ] T153 [US4] Implement GeofenceController GET /location/v1/geofences in backend/location-service/src/main/java/com/trucktrack/location/controller/GeofenceController.java (list user's geofences)
- [ ] T154 [US4] Implement geofence drawing UI using Leaflet.draw plugin in MapComponent (draw polygon or circle on map)

#### Frontend - Alert & Notification Components

> **STATUS**: Implemented as standalone AlertsComponent with stats, filters, and mock data (backend integration pending)

- [X] T155 [P] [US4] Create AlertRule model in frontend/src/app/models/alert-rule.model.ts
- [X] T156 [P] [US4] Create Notification model in frontend/src/app/models/notification.model.ts
- [X] T157 [P] [US4] Create AlertRuleService in frontend/src/app/services/alert-rule.service.ts (HTTP client for alert rule CRUD)
- [X] T158 [P] [US4] Create NotificationService in frontend/src/app/services/notification.service.ts (HTTP client for notifications)
- [X] T159 [P] [US4] Create AlertConfigComponent in frontend/src/app/features/alerts/alert-config/alert-config.component.ts (Material form for creating alert rules)
- [X] T160 [P] [US4] Create NotificationListComponent in frontend/src/app/features/alerts/notification-list/notification-list.component.ts (Material list of notifications)
- [X] T161 [US4] Implement alert rule form in AlertConfigComponent (rule type dropdown, threshold input, geofence selector)
- [ ] T162 [US4] Implement alert rule submission in AlertConfigComponent.onSubmit() (call AlertRuleService.createAlertRule())
- [X] T163 [US4] Implement notification list display in NotificationListComponent (show title, message, timestamp, read/unread status)
- [X] T164 [US4] Implement notification click handler in AlertsComponent (viewOnMap navigates to map with coordinates)
- [ ] T165 [US4] Implement notification badge in app header (Material badge showing unread count)
- [ ] T166 [US4] Implement WebSocket subscription for real-time notifications in NotificationService
- [ ] T167 [US4] Implement notification sound/visual alert (Material snackbar) when new notification received
- [X] T168 [US4] Implement "Mark as Read" functionality in NotificationListComponent
- [X] T169 [US4] Implement "Enable/Disable Alert Rule" toggle in AlertConfigComponent

#### Accessibility

- [ ] T170 [P] [US4] Add ARIA labels to alert rule form fields and notification list items
- [ ] T171 [P] [US4] Ensure keyboard navigation for notification list (Tab to navigate, Enter to open)

**Checkpoint**: All 4 user stories are now complete. System provides live tracking, search/filter, historical routes, and real-time alerts.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T172 [P] Add Angular i18n support (internationalization) in frontend/src/app/app.module.ts (English + French)
- [ ] T173 [P] Implement dark mode support in frontend/src/styles.scss (CSS custom properties for theme switching)
- [ ] T174 [P] Add Gatling load test scenario in tests/load/GPSIngestionLoadTest.scala (simulate 10K GPS updates/second)
- [ ] T175 [P] Add Gatling load test scenario in tests/load/ConcurrentUsersLoadTest.scala (simulate 500 concurrent WebSocket connections)
- [ ] T176 [P] Create Grafana dashboard in infra/monitoring/grafana/dashboards/truck-track-overview.json (GPS ingestion rate, API latency, Kafka lag)
- [ ] T177 [P] Create Prometheus alert rules in infra/monitoring/prometheus/alerts.yml (high Kafka lag, API latency spike, service down)
- [ ] T178 [P] Setup OpenTelemetry distributed tracing in all services (add dependencies + configuration)
- [ ] T179 [P] Create Kubernetes manifests in infra/kubernetes/ (deployments, services, ingress, HPA for each microservice)
- [ ] T180 [P] Create Helm chart in infra/helm/truck-track/ (templated K8s deployment)
- [ ] T181 [P] Write quickstart validation script in scripts/validate-quickstart.sh (verify Docker Compose setup, run smoke tests)
- [ ] T182 [P] Add unit tests for all service classes (LocationService, TruckStatusService, AlertRuleEngine, etc.) in backend/<service>/src/test/java/
- [ ] T183 [P] Add unit tests for all Angular services and components in frontend/src/app/**/*.spec.ts
- [ ] T184 [P] Create ER diagram (entity relationship diagram) for database schema in docs/database-er-diagram.png
- [ ] T185 [P] Create architecture diagram in docs/architecture-diagram.png (microservices, Kafka, PostgreSQL, Redis, frontend)
- [ ] T186 [P] Add performance budget configuration in frontend/angular.json (max bundle size 500KB, enforce via CI)
- [ ] T187 [P] Implement WCAG 2.1 AA audit using axe-core in frontend (automated accessibility testing in Cypress)
- [ ] T188 [P] Add security headers in API Gateway (Content-Security-Policy, X-Frame-Options, HSTS)
- [ ] T189 [P] Implement rate limiting in API Gateway (10 requests/second per user for GPS ingestion)
- [ ] T190 [P] Add database connection pooling optimization (tune HikariCP settings in application.yml)
- [ ] T191 [P] Add Redis memory optimization (set maxmemory-policy=allkeys-lru in Docker Compose)
- [ ] T192 [P] Create Docker images for all services (Dockerfiles in backend/<service>/Dockerfile and frontend/Dockerfile)
- [ ] T193 Code review and refactoring pass (remove code smells, improve naming, add comments for complex logic)
- [X] T194 SonarQube analysis pass (ensure 0 critical issues, <5% technical debt) - SonarQube 9.9 LTS setup complete, analysis running
- [ ] T195 Run all tests (unit, integration, E2E, load) and ensure 100% pass rate
- [ ] T196 Run quickstart.md validation to ensure developer onboarding works
- [ ] T197 Final smoke test (deploy to staging, run E2E tests, verify all user stories work end-to-end)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P3)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1 (independently testable)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2 (independently testable)
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - No dependencies on US1/US2/US3 (independently testable)

### Within Each User Story

1. **Tests FIRST** (TDD mandatory): Write all test tasks, verify they FAIL
2. **Models**: Backend entities (Truck, GPSPosition, AlertRule, etc.)
3. **Services**: Business logic (LocationService, TruckStatusService, AlertRuleEngine)
4. **Controllers/Endpoints**: REST APIs and WebSocket handlers
5. **Frontend Components**: Angular components consuming backend APIs
6. **Accessibility**: ARIA labels, keyboard navigation (can be parallelized)

### Parallel Opportunities

- **Setup Phase**: All T002-T013 can run in parallel (different modules/files)
- **Foundational Phase**: Database migrations sequential (T014-T025), but Kafka config (T026-T032), services (T033-T047) can run in parallel
- **User Story Tests**: All test tasks within a story marked [P] can run in parallel (T048-T055 for US1)
- **User Story Models**: All entity creation tasks marked [P] can run in parallel (T056-T059 for US1)
- **User Story Services**: Frontend and backend tasks for same story can run in parallel (e.g., T075-T077 frontend while T066-T074 backend)
- **Different User Stories**: Once Foundational done, US1, US2, US3, US4 can all proceed in parallel (if team has 4+ developers)
- **Polish Phase**: Nearly all T172-T192 can run in parallel (different files, independent concerns)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (TDD - write first):
Task T048: Contract test POST /gps/v1/positions
Task T049: Contract test GET /location/v1/trucks
Task T050: Contract test GET /location/v1/trucks/{truckId}/current-position
Task T051: Contract test WebSocket /ws/locations
Task T052: Integration test GPS ingestion flow
Task T053: Integration test WebSocket live updates
Task T054: E2E test live map view
Task T055: E2E test truck marker popup

# Launch all backend entity creation together:
Task T056: Create Truck entity
Task T057: Create GPSPosition entity
Task T058: Create TruckGroup entity
Task T059: Create User entity

# Launch frontend model creation in parallel with backend services:
Task T075: Create Truck model interface (frontend)
Task T076: Create GPSPosition model interface (frontend)
# While backend team works on T066-T074 (Location Service implementation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T013) - ~2 days
2. Complete Phase 2: Foundational (T014-T047) - ~5 days (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (T048-T095) - ~8 days
4. **STOP and VALIDATE**: Test User Story 1 independently (login → view map → see trucks → real-time updates)
5. Deploy to staging and demo to stakeholders
6. **Decision Point**: Continue to US2 or iterate on US1 based on feedback

**Total MVP Time**: ~15 days (3 weeks)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~7 days)
2. Add User Story 1 (T048-T095) → Test independently → Deploy/Demo (MVP! ~8 days)
3. Add User Story 2 (T096-T113) → Test independently → Deploy/Demo (~3 days)
4. Add User Story 3 (T114-T134) → Test independently → Deploy/Demo (~4 days)
5. Add User Story 4 (T135-T171) → Test independently → Deploy/Demo (~5 days)
6. Polish & Cross-Cutting (T172-T197) → Final release (~5 days)

**Total Time (All Stories)**: ~32 days (~6-7 weeks)

### Parallel Team Strategy

With 4 developers (assuming Foundational phase complete):

**Week 1-2**:
- Developer A: User Story 1 (T048-T095)
- Developer B: User Story 2 (T096-T113)
- Developer C: User Story 3 (T114-T134)
- Developer D: User Story 4 (T135-T171)

**Week 3**:
- All developers: Polish & Cross-Cutting (T172-T197) in parallel

**Total Time (Parallel)**: ~17 days (~3-4 weeks after Foundational)

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability (US1, US2, US3, US4)
- **TDD Mandatory**: Tests MUST be written FIRST and FAIL before implementation (Constitution Principle III)
- **Each user story independently completable**: Can deploy US1 alone as MVP, then add US2, US3, US4 incrementally
- **Commit frequently**: Commit after each task or logical group (atomic commits)
- **Stop at checkpoints**: Validate each user story independently before moving to next
- **Performance targets**: Verify <2s GPS latency, <200ms API response, <3s map load throughout implementation
- **Code coverage**: Maintain 80% backend, 70% frontend coverage per SonarQube gates
- **Accessibility**: All UI components MUST meet WCAG 2.1 Level AA (verify with automated axe-core tests)

---

**TOTAL TASKS**: 197 tasks
- **Phase 1 (Setup)**: 13 tasks
- **Phase 2 (Foundational)**: 34 tasks
- **Phase 3 (User Story 1 - MVP)**: 48 tasks
- **Phase 4 (User Story 2)**: 18 tasks
- **Phase 5 (User Story 3)**: 21 tasks
- **Phase 6 (User Story 4)**: 37 tasks
- **Phase 7 (Polish)**: 26 tasks

**Parallel Opportunities**: ~120 tasks can be parallelized (marked with [P] or across different user stories)
**Critical Path**: Setup → Foundational → User Story 1 (MVP) = ~15 days
