# Tasks: Gestion des Droits et Permissions (RBAC)

**Input**: Design documents from `/specs/008-rbac-permissions/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/permissions-api.yaml

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks grouped by user story (P1 → P4) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/{service}/src/main/java/com/trucktrack/{module}/`
- **Frontend**: `frontend/src/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create foundational permission structures used by all stories

- [x] T001 [P] Create Page enum in backend/shared/src/main/java/com/trucktrack/common/security/Page.java
- [x] T002 [P] Create RolePermissions static class with permission matrix in backend/shared/src/main/java/com/trucktrack/common/security/RolePermissions.java
- [x] T003 [P] Create UserPermissions DTO in backend/shared/src/main/java/com/trucktrack/common/dto/UserPermissions.java
- [x] T004 [P] Create permission.model.ts with Page enum and interfaces in frontend/src/app/core/models/permission.model.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core permission infrastructure that MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create PermissionService in backend/auth-service/src/main/java/com/trucktrack/auth/service/PermissionService.java
- [x] T006 Create PermissionController with endpoints in backend/auth-service/src/main/java/com/trucktrack/auth/controller/PermissionController.java
- [x] T007 Add groupIds to JWT claims in backend/auth-service/src/main/java/com/trucktrack/auth/service/JwtTokenService.java (already implemented)
- [x] T008 [P] Create permission.service.ts in frontend/src/app/core/services/permission.service.ts
- [x] T009 [P] Update auth.model.ts to include groupIds in User interface in frontend/src/app/core/models/auth.model.ts

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Contrôle d'accès aux pages selon le rôle (Priority: P1) 🎯 MVP

**Goal**: Users only see and access pages allowed by their role. Direct URL access to unauthorized pages is blocked.

**Independent Test**: Login with different roles (ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER) and verify each can only access their allowed pages.

### Implementation for User Story 1

- [x] T010 [P] [US1] Create pageGuard factory function in frontend/src/app/core/guards/page.guard.ts
- [x] T011 [P] [US1] Add @PreAuthorize annotations to AdminController in backend/auth-service/src/main/java/com/trucktrack/auth/controller/AdminUserController.java (already done)
- [x] T012 [P] [US1] Add @PreAuthorize annotations to AdminTruckController in backend/location-service/src/main/java/com/trucktrack/location/controller/AdminTruckController.java (already done)
- [x] T013 [P] [US1] Add @PreAuthorize annotations to AnalyticsController in backend/location-service/src/main/java/com/trucktrack/location/controller/AnalyticsController.java
- [x] T014 [US1] Update app.routes.ts with pageGuard on protected routes in frontend/src/app/app.routes.ts
- [x] T015 [US1] Update analytics routes with role guard in frontend/src/app/features/analytics/analytics.routes.ts (via app.routes.ts)
- [x] T016 [US1] Update admin routes with role guard in frontend/src/app/admin/admin.routes.ts

**Checkpoint**: Page access control by role is functional

---

## Phase 4: User Story 2 - Filtrage des données par groupe assigné (Priority: P2)

**Goal**: Users only see trucks/data from their assigned groups. ADMIN sees all, DRIVER sees only assigned truck.

**Independent Test**: Login as FLEET_MANAGER assigned to "Équipe Nord", verify only Nord trucks visible in list and map.

### Implementation for User Story 2

- [ ] T017 [P] [US2] Add findByGroupIds query method in backend/location-service/src/main/java/com/trucktrack/location/repository/TruckRepository.java
- [ ] T018 [P] [US2] Add findByAssignedDriverId query method in backend/location-service/src/main/java/com/trucktrack/location/repository/TruckRepository.java
- [ ] T019 [US2] Create DataFilterService for group-based filtering in backend/location-service/src/main/java/com/trucktrack/location/service/DataFilterService.java
- [ ] T020 [US2] Update TruckService to use DataFilterService for filtering in backend/location-service/src/main/java/com/trucktrack/location/service/TruckService.java
- [ ] T021 [US2] Update TruckController to extract groupIds from JWT in backend/location-service/src/main/java/com/trucktrack/location/controller/TruckController.java
- [ ] T022 [US2] Update AlertRepository with group filtering in backend/notification-service/src/main/java/com/trucktrack/notification/repository/AlertRepository.java
- [ ] T023 [US2] Update AlertService to filter by user groups in backend/notification-service/src/main/java/com/trucktrack/notification/service/AlertService.java
- [ ] T024 [US2] Update AnalyticsRepository to filter by groups in backend/location-service/src/main/java/com/trucktrack/location/repository/AnalyticsRepository.java

**Checkpoint**: Data filtering by group is functional for trucks, alerts, and analytics

---

## Phase 5: User Story 3 - Navigation dynamique selon les permissions (Priority: P3)

**Goal**: Navigation menu shows only links to pages the user can access based on their role.

**Independent Test**: Login as DISPATCHER, verify menu shows Dashboard, Carte, Alertes, Profil (NOT Admin, NOT Analytics).

### Implementation for User Story 3

- [ ] T025 [P] [US3] Update NavigationService to filter menu items by role in frontend/src/app/core/services/navigation.service.ts
- [ ] T026 [P] [US3] Update navigation.model.ts with role-based visibility in frontend/src/app/core/models/navigation.model.ts
- [ ] T027 [US3] Update header.component.ts to use filtered navigation in frontend/src/app/core/components/header/header.component.ts
- [ ] T028 [US3] Update header.component.html to render dynamic menu in frontend/src/app/core/components/header/header.component.html
- [ ] T029 [US3] Update sidenav component (if exists) with filtered navigation in frontend/src/app/core/components/sidenav/sidenav.component.ts

**Checkpoint**: Navigation adapts to user role

---

## Phase 6: User Story 4 - Feedback clair sur les accès refusés (Priority: P4)

**Goal**: Clear "Access Denied" message when users attempt to access unauthorized resources.

**Independent Test**: As DISPATCHER, navigate to /analytics URL, verify redirect to Access Denied page with clear message.

### Implementation for User Story 4

- [ ] T030 [P] [US4] Create AccessDeniedComponent in frontend/src/app/shared/components/access-denied/access-denied.component.ts
- [ ] T031 [P] [US4] Create access-denied.component.html template in frontend/src/app/shared/components/access-denied/access-denied.component.html
- [ ] T032 [P] [US4] Create access-denied.component.scss styles in frontend/src/app/shared/components/access-denied/access-denied.component.scss
- [ ] T033 [US4] Add /access-denied route in frontend/src/app/app.routes.ts
- [ ] T034 [US4] Update pageGuard to redirect to /access-denied in frontend/src/app/core/guards/page.guard.ts
- [ ] T035 [US4] Add audit logging for access denials in backend/auth-service/src/main/java/com/trucktrack/auth/service/PermissionService.java

**Checkpoint**: Access denied feedback is clear and user-friendly

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, logging, and validation

- [ ] T036 [P] Add WARN logging for all 403 responses in backend services
- [ ] T037 [P] Verify all sensitive endpoints have @PreAuthorize annotations
- [ ] T038 Run quickstart.md validation scenarios
- [ ] T039 Update seed data with test users for each role in backend/auth-service/src/main/resources/db/migration/

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS ALL USER STORIES
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
Phase 3 (US1: Page Access)          Phase 4 (US2: Data Filtering)
    │                                      │
    └──────────────┬───────────────────────┘
                   │
                   ▼
            Phase 5 (US3: Navigation)
                   │
                   ▼
            Phase 6 (US4: Access Denied)
                   │
                   ▼
            Phase 7 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (P1) | Phase 2 | Foundation complete |
| US2 (P2) | Phase 2 | Foundation complete (parallel with US1) |
| US3 (P3) | US1 | Page guards must exist |
| US4 (P4) | US1 | Page guards must exist for redirect |

### Parallel Opportunities

**Phase 1 (all parallel)**:
```
T001 ║ T002 ║ T003 ║ T004
```

**Phase 2 (partial parallel)**:
```
T005 → T006 → T007   (sequential - service before controller before JWT)
T008 ║ T009          (parallel - different files)
```

**Phase 3 - US1 (partial parallel)**:
```
T010 ║ T011 ║ T012 ║ T013   (parallel - different files)
     ↓
T014 → T015 → T016          (sequential - routes depend on guard)
```

**Phase 4 - US2 (partial parallel)**:
```
T017 ║ T018                 (parallel - same file but different methods)
     ↓
T019 → T020 → T021          (sequential - service then integration)
T022 → T023                 (sequential - repo then service)
T024                        (independent)
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all setup tasks together:
Task: "Create Page enum in backend/shared/.../Page.java"
Task: "Create RolePermissions in backend/shared/.../RolePermissions.java"
Task: "Create UserPermissions DTO in backend/shared/.../UserPermissions.java"
Task: "Create permission.model.ts in frontend/.../permission.model.ts"
```

## Parallel Example: User Story 1 Guards

```bash
# Launch all @PreAuthorize tasks together:
Task: "Add @PreAuthorize to AdminController"
Task: "Add @PreAuthorize to AdminTruckController"
Task: "Add @PreAuthorize to AnalyticsController"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T009)
3. Complete Phase 3: User Story 1 (T010-T016)
4. **STOP and VALIDATE**: Test page access with different roles
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Page Access) → Test → **MVP Ready!**
3. Add US2 (Data Filtering) → Test → Enhanced security
4. Add US3 (Navigation) → Test → Better UX
5. Add US4 (Access Denied) → Test → Complete feature

### Recommended Order

For solo developer:
```
T001 → T002 → T003 → T004 (Setup)
T005 → T006 → T007 → T008 → T009 (Foundation)
T010 → T011 → T012 → T013 → T014 → T015 → T016 (US1 - MVP)
[VALIDATE MVP]
T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 (US2)
T025 → T026 → T027 → T028 → T029 (US3)
T030 → T031 → T032 → T033 → T034 → T035 (US4)
T036 → T037 → T038 → T039 (Polish)
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable
- Existing guards (authGuard, adminGuard, roleGuard) are reused where possible
- RolePermissions.java is the single source of truth for permission matrix
- JWT enrichment with groupIds is critical for data filtering (US2)
- Commit after each task or logical group
