# Tasks: Fleet Analytics Dashboard

**Input**: Design documents from `/specs/006-fleet-analytics/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/analytics-api.yaml

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, create project structure, configure libraries

- [x] T001 Install ngx-charts dependency in frontend/package.json: `npm install @swimlane/ngx-charts`
- [x] T002 [P] Install jspdf and html2canvas in frontend/package.json: `npm install jspdf html2canvas @types/jspdf`
- [x] T003 [P] Install xlsx (SheetJS) in frontend/package.json: `npm install xlsx`
- [x] T004 Create TypeScript models in frontend/src/app/core/models/analytics.model.ts
- [x] T005 [P] Create analytics feature module structure: frontend/src/app/features/analytics/
- [x] T006 Add analytics route in frontend/src/app/app.routes.ts

---

## Phase 2: Foundational (Backend API Infrastructure)

**Purpose**: Database views and shared backend components - MUST complete before user stories

**⚠️ CRITICAL**: No frontend dashboard work should begin until API endpoints exist

- [x] T007 Create migration V9__add_analytics_materialized_view.sql in backend/location-service/src/main/resources/db/migration/
- [x] T008 Create AnalyticsRepository.java with custom SQL queries in backend/location-service/src/main/java/com/trucktrack/location/repository/
- [x] T009 [P] Create FleetKPIResponse.java DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/
- [x] T010 [P] Create DailyMetricsResponse.java DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/
- [x] T011 [P] Create AlertBreakdownResponse.java DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/
- [x] T012 [P] Create TruckRankingResponse.java DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/
- [x] T013 [P] Create PeriodInfo.java and EntityInfo.java embedded DTOs in backend/location-service/src/main/java/com/trucktrack/location/dto/
- [x] T014 Create AnalyticsService.java with core aggregation logic in backend/location-service/src/main/java/com/trucktrack/location/service/
- [x] T015 Create AnalyticsController.java with 4 endpoints in backend/location-service/src/main/java/com/trucktrack/location/controller/
- [x] T016 Configure Redis caching for analytics endpoints in AnalyticsService.java

**Checkpoint**: Backend API ready - run `curl` tests from quickstart.md to verify

---

## Phase 3: User Story 1 - Consulter les KPIs de la flotte (Priority: P1) 🎯 MVP

**Goal**: Display dashboard with fleet KPIs (distance, driving time, speed, alerts, geofence events)

**Independent Test**: Login as FLEET_MANAGER, navigate to /analytics, verify 7 KPIs display with default "WEEK" period

### Implementation for User Story 1

- [x] T017 [US1] Create analytics.service.ts with getFleetKPIs() method in frontend/src/app/features/analytics/services/
- [x] T018 [US1] Create kpi-card component in frontend/src/app/features/analytics/components/kpi-card/
- [x] T019 [US1] Create analytics.component.ts (main dashboard) in frontend/src/app/features/analytics/
- [x] T020 [US1] Create analytics.component.html with KPI card grid layout
- [x] T021 [US1] Create analytics.component.scss with responsive grid (4 cols desktop, 2 tablet, 1 mobile)
- [x] T022 [US1] Add loading and empty state handling in analytics.component.ts
- [x] T023 [US1] Add navigation link to analytics in header component frontend/src/app/core/components/header/

**Checkpoint**: User Story 1 complete - Dashboard displays 7 KPIs for full fleet with WEEK period

---

## Phase 4: User Story 2 - Filtrer par camion ou groupe (Priority: P1)

**Goal**: Filter analytics by truck, group, or entire fleet with permission-based visibility

**Independent Test**: Select different entities (truck/group/fleet), verify KPIs update accordingly

### Implementation for User Story 2

- [x] T024 [US2] Create period-filter component in frontend/src/app/features/analytics/components/period-filter/
- [x] T025 [US2] Create entity-filter component in frontend/src/app/features/analytics/components/entity-filter/
- [x] T026 [US2] Add getAccessibleTrucks() and getAccessibleGroups() methods to analytics.service.ts
- [x] T027 [US2] Integrate filters with dashboard in analytics.component.ts
- [x] T028 [US2] Implement permission-based filtering in AnalyticsService.java backend
- [x] T029 [US2] Add filter persistence using URL query params in analytics.component.ts

**Checkpoint**: User Story 2 complete - Filters work, respect permissions, persist in URL

---

## Phase 5: User Story 3 - Visualiser les tendances avec des graphiques (Priority: P2)

**Goal**: Interactive charts showing daily distance, alert breakdown, and truck ranking

**Independent Test**: Verify line chart shows daily points, pie chart shows alert types, bar chart shows top 10 trucks

### Implementation for User Story 3

- [x] T030 [US3] Add getDailyMetrics(), getAlertBreakdown(), getTruckRanking() to analytics.service.ts
- [x] T031 [P] [US3] Create distance-chart component (line chart) in frontend/src/app/features/analytics/components/distance-chart/
- [x] T032 [P] [US3] Create alerts-chart component (pie chart) in frontend/src/app/features/analytics/components/alerts-chart/
- [x] T033 [P] [US3] Create trucks-ranking component (bar chart) in frontend/src/app/features/analytics/components/trucks-ranking/
- [x] T034 [US3] Add chart section to analytics.component.html with 2x2 grid layout
- [x] T035 [US3] Implement tooltip formatting and hover interactions in chart components
- [x] T036 [US3] Add responsive chart sizing using BreakpointObserver

**Checkpoint**: User Story 3 complete - All 3 chart types display with interactivity

---

## Phase 6: User Story 4 - Exporter les rapports (Priority: P2)

**Goal**: Export dashboard as PDF or Excel with current filters applied

**Independent Test**: Click export buttons, verify downloaded files contain correct data

### Implementation for User Story 4

- [x] T037 [US4] Create export.service.ts with exportToPdf() and exportToExcel() in frontend/src/app/features/analytics/services/
- [x] T038 [US4] Implement PDF generation using jsPDF + html2canvas in export.service.ts
- [x] T039 [US4] Implement Excel generation using xlsx in export.service.ts
- [x] T040 [US4] Add export buttons to analytics.component.html
- [x] T041 [US4] Handle export loading state and disable during generation
- [x] T042 [US4] Add "no data" validation before export (show message if empty)

**Checkpoint**: User Story 4 complete - PDF and Excel exports work with filtered data

---

## Phase 7: User Story 5 - Période personnalisée (Priority: P3)

**Goal**: Allow custom date range selection with validation

**Independent Test**: Select "Personnalisé", pick dates, verify dashboard updates

### Implementation for User Story 5

- [x] T043 [US5] Add custom date picker to period-filter component
- [x] T044 [US5] Implement date validation (end >= start, not future, max 365 days)
- [x] T045 [US5] Update analytics.service.ts to handle CUSTOM period type
- [x] T046 [US5] Add date range display in filter summary

**Checkpoint**: User Story 5 complete - Custom period selection works with validation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Performance, edge cases, and final touches

- [x] T047 [P] Add error handling for API failures in analytics.component.ts
- [x] T048 [P] Implement "Aucune donnée" empty state for no-data periods
- [x] T049 [P] Add skeleton loaders for KPI cards and charts during loading
- [x] T050 Optimize chart data transformation for large datasets
- [x] T051 [P] Add aria labels for accessibility on charts and KPI cards
- [x] T052 Run quickstart.md validation scenarios
- [x] T053 Performance testing: verify <3s dashboard load for 50 trucks / 30 days

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ────────────────────────────────────────┐
                                                         │
Phase 2 (Foundational/Backend) ─────────────────────────┼──► BLOCKS all frontend work
                                                         │
                    ┌────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3 (US1) ──► Phase 4 (US2) ──► Phase 5 (US3) ──► Phase 6 (US4) ──► Phase 7 (US5) │
│   KPIs              Filters          Charts            Export          Custom Period  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                                         │
                                                         ▼
                                              Phase 8 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (KPIs) | Phase 2 complete | Backend API ready |
| US2 (Filters) | US1 (needs dashboard) | US1 complete |
| US3 (Charts) | US2 (uses filters) | US2 complete |
| US4 (Export) | US3 (exports charts) | US3 complete |
| US5 (Custom) | US2 (extends filter) | US2 complete |

### Parallel Opportunities

**Phase 1 - Setup (3 parallel)**:
```
T001 (ngx-charts) ║ T002 (jspdf) ║ T003 (xlsx)
```

**Phase 2 - DTOs (5 parallel)**:
```
T009 ║ T010 ║ T011 ║ T012 ║ T013
```

**Phase 5 - Charts (3 parallel)**:
```
T031 (distance-chart) ║ T032 (alerts-chart) ║ T033 (trucks-ranking)
```

**Phase 8 - Polish (3 parallel)**:
```
T047 (errors) ║ T048 (empty state) ║ T049 (skeletons) ║ T051 (a11y)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (npm install + module structure)
2. Complete Phase 2: Backend API (migration, DTOs, service, controller)
3. Complete Phase 3: User Story 1 (KPI cards dashboard)
4. **STOP and VALIDATE**: Test KPIs display for fleet with WEEK period
5. Deploy/demo if ready - basic analytics dashboard functional

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 | Dashboard with KPIs |
| +Filters | US1 + US2 | Entity filtering |
| +Charts | US1-3 | Full visualization |
| +Export | US1-4 | PDF/Excel reports |
| Complete | US1-5 | Custom periods |

### Estimated Task Count

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 6 | 3 |
| Foundational | 10 | 6 |
| US1 (P1) | 7 | 0 |
| US2 (P1) | 6 | 0 |
| US3 (P2) | 7 | 3 |
| US4 (P2) | 6 | 0 |
| US5 (P3) | 4 | 0 |
| Polish | 7 | 4 |
| **Total** | **53** | **16** |

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story
- Backend Phase 2 MUST complete before any frontend US work
- Each user story builds on previous (sequential by design)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
