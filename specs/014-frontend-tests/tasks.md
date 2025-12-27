# Tasks: Frontend Unit Tests

**Input**: Design documents from `/specs/014-frontend-tests/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: This feature IS about creating tests. Each task creates a test file.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/app/`
- Tests colocated with source files (Angular standard pattern)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify test infrastructure is ready

- [X] T001 Verify Karma/Jasmine configuration in frontend/karma.conf.js ✅
- [X] T002 Verify test scripts in frontend/package.json (npm test) ✅
- [X] T003 Run existing tests to confirm test infrastructure works ✅

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Understand existing code structure before writing tests

**⚠️ CRITICAL**: Must understand source files before writing tests

- [X] T004 Review auth.service.ts structure in frontend/src/app/core/services/auth.service.ts ✅
- [X] T005 [P] Review token-storage.service.ts in frontend/src/app/core/services/token-storage.service.ts ✅
- [X] T006 [P] Review permission.service.ts in frontend/src/app/core/services/permission.service.ts ✅
- [X] T007 [P] Review guards structure in frontend/src/app/core/guards/ ✅
- [X] T008 [P] Review interceptors in frontend/src/app/core/interceptors/ ✅

**Checkpoint**: Foundation ready - test file creation can now begin ✅

---

## Phase 3: User Story 1 - Core Services Testing (Priority: P1) 🎯 MVP

**Goal**: Test critical services (auth, permissions, token storage) that are core to application security

**Independent Test**: Run `npm test -- --include=**/*service.spec.ts` in frontend/

### Implementation for User Story 1

- [X] T009 [P] [US1] Create token-storage.service.spec.ts with direct instantiation (NO TestBed) in frontend/src/app/core/services/token-storage.service.spec.ts ✅
- [X] T010 [P] [US1] Create permission.service.spec.ts with direct instantiation (NO TestBed) in frontend/src/app/core/services/permission.service.spec.ts ✅
- [X] T011 [US1] Create auth.service.spec.ts with TestBed + HttpClientTestingModule in frontend/src/app/core/services/auth.service.spec.ts ✅
- [X] T012 [US1] Verify US1 tests pass and execution time < 5 seconds total ✅

**Checkpoint**: Core services are now tested - authentication logic verified ✅

---

## Phase 4: User Story 2 - Guards Testing (Priority: P1)

**Goal**: Test route protection guards using direct instantiation (NO TestBed for performance)

**Independent Test**: Run `npm test -- --include=**/*guard.spec.ts` in frontend/

### Implementation for User Story 2

- [X] T013 [P] [US2] Create auth.guard.spec.ts with direct instantiation in frontend/src/app/core/guards/auth.guard.spec.ts ✅
- [X] T014 [P] [US2] Create admin.guard.spec.ts with direct instantiation in frontend/src/app/core/guards/admin.guard.spec.ts ✅
- [X] T015 [P] [US2] Create page.guard.spec.ts with direct instantiation in frontend/src/app/core/guards/page.guard.spec.ts ✅
- [X] T016 [US2] Verify US2 tests pass and execution time < 3 seconds total ✅

**Checkpoint**: All guards are tested - route protection verified ✅

---

## Phase 5: User Story 3 - Interceptors Testing (Priority: P2)

**Goal**: Test HTTP interceptor for authentication headers and 401 handling (TestBed required)

**Independent Test**: Run `npm test -- --include=**/*interceptor.spec.ts` in frontend/

### Implementation for User Story 3

- [X] T017 [US3] Create auth.interceptor.spec.ts with TestBed + HttpClientTestingModule in frontend/src/app/core/interceptors/auth.interceptor.spec.ts ✅
- [X] T018 [US3] Verify US3 tests pass and execution time < 2 seconds ✅

**Checkpoint**: Interceptor tested - HTTP authentication flow verified ✅

---

## Phase 6: User Story 4 - Feature Services Testing (Priority: P2)

**Goal**: Test business logic services (trucks, geofences, notifications) with HttpClient mocking

**Independent Test**: Run `npm test -- --include=**/services/*.spec.ts` in frontend/

### Implementation for User Story 4

- [X] T019 [P] [US4] Create truck.service.spec.ts with TestBed + HttpClientTestingModule in frontend/src/app/services/truck.service.spec.ts ✅
- [X] T020 [P] [US4] Create geofence.service.spec.ts with TestBed + HttpClientTestingModule in frontend/src/app/services/geofence.service.spec.ts ✅
- [X] T021 [P] [US4] Create notification.service.spec.ts with TestBed + HttpClientTestingModule in frontend/src/app/services/notification.service.spec.ts ✅
- [X] T022 [US4] Verify US4 tests pass and execution time < 6 seconds total ✅

**Checkpoint**: Feature services tested - business logic verified ✅

---

## Phase 7: User Story 5 - Navigation Service Testing (Priority: P3)

**Goal**: Test navigation menu generation based on user permissions (NO TestBed)

**Independent Test**: Run `npm test -- --include=**/navigation.service.spec.ts` in frontend/

### Implementation for User Story 5

- [X] T023 [US5] Create navigation.service.spec.ts with direct instantiation in frontend/src/app/core/services/navigation.service.spec.ts ✅
- [X] T024 [US5] Verify US5 tests pass and execution time < 2 seconds ✅

**Checkpoint**: Navigation tested - dynamic menu generation verified ✅

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and performance optimization

- [X] T025 Run full test suite and verify total execution time < 30 seconds (Actual: 0.211s ✅)
- [X] T026 Verify code coverage meets 80% target for critical services (Guards: 100%, Interceptors: 100%, Core Services: 89.28% ✅)
- [X] T027 Fix any flaky tests discovered during full suite run (None found ✅)
- [X] T028 Update CI configuration if needed for new tests in .github/workflows/ci.yml (Added coverage reporting ✅)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - verify test infra first
- **Foundational (Phase 2)**: Depends on Setup - understand code before testing
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 - can run in parallel
  - US3 and US4 are both P2 - can run in parallel (after US1/US2 if sequential)
  - US5 is P3 - can run after others or in parallel
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational - May reference auth patterns from US1
- **User Story 4 (P2)**: Can start after Foundational - Independent of other stories
- **User Story 5 (P3)**: Can start after Foundational - Uses PermissionService tested in US1

### Within Each User Story

- Review source code before writing tests (already done in Phase 2)
- Tests for services without HTTP deps: direct instantiation (NO TestBed)
- Tests for services with HttpClient: TestBed + HttpClientTestingModule
- Verify tests pass before moving to next story

### Parallel Opportunities

- **Phase 2**: All review tasks [P] can run in parallel
- **US1**: T009 and T010 can run in parallel (different files, no TestBed)
- **US2**: T013, T014, T015 can ALL run in parallel (all direct instantiation)
- **US4**: T019, T020, T021 can ALL run in parallel (different services)
- **Cross-Story**: US1 and US2 can run in parallel (both P1)
- **Cross-Story**: US3 and US4 can run in parallel (both P2)

---

## Parallel Example: User Story 2 (Guards)

```bash
# Launch all guard tests together (all direct instantiation, no conflicts):
Task: "Create auth.guard.spec.ts in frontend/src/app/core/guards/auth.guard.spec.ts"
Task: "Create admin.guard.spec.ts in frontend/src/app/core/guards/admin.guard.spec.ts"
Task: "Create page.guard.spec.ts in frontend/src/app/core/guards/page.guard.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: Code review
3. Complete Phase 3: US1 - Core Services (auth, permissions, token)
4. Complete Phase 4: US2 - Guards
5. **STOP and VALIDATE**: Run `npm test` - should pass with < 10 seconds
6. This covers the most critical security code

### Incremental Delivery

1. Complete Setup + Foundational → Ready to write tests
2. Add US1 + US2 (P1) → Test and verify → **MVP Complete!**
3. Add US3 + US4 (P2) → Test and verify → Interceptors + Feature services covered
4. Add US5 (P3) → Test and verify → Navigation covered
5. Polish → Full suite < 30 seconds, 80% coverage

### Test Count Summary

| User Story | Files | Estimated Tests | TestBed |
|------------|-------|-----------------|---------|
| US1: Core Services | 3 | 19-24 | 1 file (auth.service) |
| US2: Guards | 3 | 11-14 | None |
| US3: Interceptor | 1 | 5-6 | Yes |
| US4: Feature Services | 3 | 16-20 | All 3 files |
| US5: Navigation | 1 | 4-5 | None |
| **Total** | **11** | **55-69** | **5 files** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- **NO TestBed** for: TokenStorageService, PermissionService, all Guards, NavigationService
- **TestBed required** for: AuthService, AuthInterceptor, TruckService, GeofenceService, NotificationService
- Performance target: < 30 seconds total, < 2 seconds per file
- Follow patterns from quickstart.md and research.md
