# Tasks: Dashboard Real Data Integration

**Input**: Design documents from `/specs/022-dashboard-real-data/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Backend DTOs et structure NgRx store

- [x] T001 [P] Create DashboardKpiDTO in backend/location-service/src/main/java/com/trucktrack/location/dto/DashboardKpiDTO.java
- [x] T002 [P] Create FleetStatusDTO in backend/location-service/src/main/java/com/trucktrack/location/dto/FleetStatusDTO.java
- [x] T003 [P] Create ActivityEventDTO in backend/location-service/src/main/java/com/trucktrack/location/dto/ActivityEventDTO.java
- [x] T004 [P] Create PerformanceMetricsDTO in backend/location-service/src/main/java/com/trucktrack/location/dto/PerformanceMetricsDTO.java
- [x] T005 [P] Create DashboardDataDTO (aggregated response) in backend/location-service/src/main/java/com/trucktrack/location/dto/DashboardDataDTO.java
- [x] T006 [P] Create dashboard NgRx actions in frontend/src/app/store/dashboard/dashboard.actions.ts
- [x] T007 [P] Create dashboard NgRx state interface in frontend/src/app/store/dashboard/dashboard.state.ts
- [x] T008 Create dashboard NgRx reducer in frontend/src/app/store/dashboard/dashboard.reducer.ts
- [x] T009 [P] Create dashboard NgRx selectors in frontend/src/app/store/dashboard/dashboard.selectors.ts
- [x] T010 Create dashboard store index export in frontend/src/app/store/dashboard/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services et API endpoints partagés

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create DashboardService interface in backend/location-service/src/main/java/com/trucktrack/location/service/DashboardService.java
- [x] T012 Create DashboardServiceImpl skeleton in backend/location-service/src/main/java/com/trucktrack/location/service/impl/DashboardServiceImpl.java
- [x] T013 Create DashboardController with base endpoint structure in backend/location-service/src/main/java/com/trucktrack/location/controller/DashboardController.java
- [x] T014 Create DashboardApiService in frontend/src/app/services/dashboard.service.ts
- [x] T015 Create dashboard NgRx effects (skeleton) in frontend/src/app/store/dashboard/dashboard.effects.ts
- [x] T016 Register dashboard store in frontend/src/app/store/index.ts
- [x] T017 Add dashboard signals to StoreFacade in frontend/src/app/store/store.facade.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - KPIs en temps réel (Priority: P1) 🎯 MVP

**Goal**: Afficher les KPIs (Total Trucks, Active trucks, Trips today, Alerts today) avec données réelles

**Independent Test**: Vérifier que les chiffres affichés correspondent aux données réelles de la base

### Implementation for User Story 1

- [x] T018 [US1] Implement getKpis() method in DashboardServiceImpl (count trucks, trips today, alerts) in backend/location-service/src/main/java/com/trucktrack/location/service/impl/DashboardServiceImpl.java
- [x] T019 [US1] Implement GET /admin/dashboard/kpis endpoint in backend/location-service/src/main/java/com/trucktrack/location/controller/DashboardController.java
- [x] T020 [US1] Implement trend calculations (vs yesterday/last month) in DashboardServiceImpl
- [x] T021 [US1] Add loadKpis action handler in dashboard.effects.ts in frontend/src/app/store/dashboard/dashboard.effects.ts
- [x] T022 [US1] Add KPI selectors (selectKpis, selectKpisLoading, selectKpisError) in frontend/src/app/store/dashboard/dashboard.selectors.ts
- [x] T023 [US1] Update dashboard-v2.component.ts to use real KPI data from store in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.ts
- [x] T024 [US1] Add loading state for KPI cards in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T025 [US1] Add error state with retry for KPI section in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html

**Checkpoint**: KPIs section fully functional with real data

---

## Phase 4: User Story 2 - Fleet Status Chart (Priority: P2)

**Goal**: Afficher le graphique donut avec répartition Active/Idle/Offline

**Independent Test**: Comparer les pourcentages affichés avec le décompte réel des camions par statut

### Implementation for User Story 2

- [x] T026 [US2] Implement getFleetStatus() method in DashboardServiceImpl (group trucks by status) in backend/location-service/src/main/java/com/trucktrack/location/service/impl/DashboardServiceImpl.java
- [x] T027 [US2] Implement GET /admin/dashboard/fleet-status endpoint in backend/location-service/src/main/java/com/trucktrack/location/controller/DashboardController.java
- [x] T028 [US2] Add loadFleetStatus action handler in dashboard.effects.ts in frontend/src/app/store/dashboard/dashboard.effects.ts
- [x] T029 [US2] Add FleetStatus selectors in frontend/src/app/store/dashboard/dashboard.selectors.ts
- [x] T030 [US2] Update dashboard-v2.component.ts to use real Fleet Status data in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.ts
- [x] T031 [US2] Add loading state for Fleet Status chart in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T032 [US2] Add empty state handling (0 trucks) in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T033 [US2] Add error state with retry for Fleet Status in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html

**Checkpoint**: Fleet Status chart fully functional with real data

---

## Phase 5: User Story 3 - Recent Activity Feed (Priority: P3)

**Goal**: Afficher les 5 dernières activités (Trip Started, Delivery Confirmed, Alert Triggered, etc.)

**Independent Test**: Démarrer un trip et vérifier son apparition dans le feed

### Implementation for User Story 3

- [x] T034 [US3] Implement getRecentActivity() method in DashboardServiceImpl (UNION trips+alerts) in backend/location-service/src/main/java/com/trucktrack/location/service/impl/DashboardServiceImpl.java
- [x] T035 [US3] Implement GET /admin/dashboard/activity endpoint with limit parameter in backend/location-service/src/main/java/com/trucktrack/location/controller/DashboardController.java
- [x] T036 [US3] Add loadActivity action handler in dashboard.effects.ts in frontend/src/app/store/dashboard/dashboard.effects.ts
- [x] T037 [US3] Add Activity selectors in frontend/src/app/store/dashboard/dashboard.selectors.ts
- [x] T038 [US3] Update dashboard-v2.component.ts to use real Activity data in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.ts
- [x] T039 [US3] Add loading state for Activity feed in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T040 [US3] Add empty state handling (no activity) in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T041 [US3] Add error state with retry for Activity feed in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html

**Checkpoint**: Activity feed fully functional with real data

---

## Phase 6: User Story 4 - Performance Overview (Priority: P4)

**Goal**: Afficher les métriques de performance (Completion Rate, On-Time Delivery, Fleet Utilization)

**Independent Test**: Calculer manuellement les métriques et comparer avec l'affichage

### Implementation for User Story 4

- [x] T042 [US4] Implement getPerformanceMetrics() method in DashboardServiceImpl (SQL aggregations) in backend/location-service/src/main/java/com/trucktrack/location/service/impl/DashboardServiceImpl.java
- [x] T043 [US4] Implement GET /admin/dashboard/performance endpoint with period parameter in backend/location-service/src/main/java/com/trucktrack/location/controller/DashboardController.java
- [x] T044 [US4] Add loadPerformance action handler in dashboard.effects.ts in frontend/src/app/store/dashboard/dashboard.effects.ts
- [x] T045 [US4] Add Performance selectors in frontend/src/app/store/dashboard/dashboard.selectors.ts
- [x] T046 [US4] Update dashboard-v2.component.ts to use real Performance data in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.ts
- [x] T047 [US4] Add loading state for Performance section in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T048 [US4] Implement "Coming Soon" for Driver Satisfaction in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T049 [US4] Add period selector functionality (week/month) in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.ts
- [x] T050 [US4] Add error state with retry for Performance in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html

**Checkpoint**: Performance overview fully functional with real data

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Aggregated endpoint, refresh functionality, final integration

- [x] T051 Implement GET /admin/dashboard (aggregated) endpoint combining all data in backend/location-service/src/main/java/com/trucktrack/location/controller/DashboardController.java
- [x] T052 Add loadAllDashboardData action and effect for single API call in frontend/src/app/store/dashboard/dashboard.effects.ts
- [x] T053 Implement manual refresh button functionality in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.ts
- [x] T054 Add refresh loading indicator in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.html
- [x] T055 [P] Add error styling for widget error states in frontend/src/app/core/components/dashboard-v2/dashboard-v2.component.scss
- [x] T056 [P] Add i18n translation keys for dashboard labels in frontend/src/assets/i18n/en.json
- [x] T057 [P] Add i18n translation keys for dashboard labels in frontend/src/assets/i18n/fr.json
- [x] T058 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - Can proceed sequentially (P1 → P2 → P3 → P4)
  - Or in parallel if multiple developers available
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories ✅ MVP
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P4)**: Can start after Foundational - Independent of US1/US2/US3

### Within Each User Story

- Backend service method first
- Backend endpoint second
- Frontend effects third
- Frontend selectors fourth
- Frontend component update last
- Error/loading states after core implementation

### Parallel Opportunities

**Phase 1 (all [P]):**
```
T001, T002, T003, T004, T005 (backend DTOs) - all parallel
T006, T007, T009 (frontend store files) - all parallel
```

**Within User Stories:**
- Backend and frontend can progress in parallel once backend endpoints are defined
- Multiple user stories can be worked by different developers simultaneously

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T017)
3. Complete Phase 3: User Story 1 - KPIs (T018-T025)
4. **STOP and VALIDATE**: Test KPIs independently
5. Deploy/demo if ready - **Dashboard shows real KPI data!**

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (KPIs) → Test → Deploy (**MVP!**)
3. Add US2 (Fleet Status) → Test → Deploy
4. Add US3 (Activity Feed) → Test → Deploy
5. Add US4 (Performance) → Test → Deploy
6. Polish phase → Final release

### Task Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Phase 1: Setup | T001-T010 (10 tasks) | 8 parallel |
| Phase 2: Foundational | T011-T017 (7 tasks) | 2 parallel |
| Phase 3: US1 - KPIs | T018-T025 (8 tasks) | - |
| Phase 4: US2 - Fleet Status | T026-T033 (8 tasks) | - |
| Phase 5: US3 - Activity | T034-T041 (8 tasks) | - |
| Phase 6: US4 - Performance | T042-T050 (9 tasks) | - |
| Phase 7: Polish | T051-T058 (8 tasks) | 3 parallel |
| **Total** | **58 tasks** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable
- Error handling per widget (FR-014) - one failure doesn't block others
- No frontend cache (FR-015) - always fresh data
- Driver Satisfaction = "Coming Soon" (FR-016)
- Commit after each task or logical group
