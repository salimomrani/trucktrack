# Tasks: Admin Panel

**Input**: Design documents from `/specs/002-admin-panel/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Paths use: `backend/` for Java services, `frontend/` for Angular

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migrations and shared DTOs

- [ ] T001 [P] Create Flyway migration V20__add_user_group_assignments.sql in backend/auth-service/src/main/resources/db/migration/
- [ ] T002 [P] Create Flyway migration V21__add_audit_logs.sql in backend/auth-service/src/main/resources/db/migration/
- [ ] T003 [P] Create Flyway migration V22__migrate_truck_groups.sql in backend/location-service/src/main/resources/db/migration/
- [ ] T004 [P] Create Flyway migration V23__add_system_config.sql in backend/location-service/src/main/resources/db/migration/
- [ ] T005 [P] Create Flyway migration V24__add_location_audit_logs.sql in backend/location-service/src/main/resources/db/migration/
- [ ] T006 Create PageResponse<T> DTO in backend/shared/src/main/java/com/trucktrack/shared/dto/PageResponse.java
- [ ] T007 Create AuditAction enum in backend/shared/src/main/java/com/trucktrack/shared/audit/AuditAction.java
- [ ] T008 Run database migrations: mvn flyway:migrate -P local

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Create AuditLog entity in backend/auth-service/src/main/java/com/trucktrack/auth/model/AuditLog.java
- [ ] T010 [P] Create AuditLogRepository in backend/auth-service/src/main/java/com/trucktrack/auth/repository/AuditLogRepository.java
- [ ] T011 Create AuditService in backend/auth-service/src/main/java/com/trucktrack/auth/service/AuditService.java
- [ ] T012 [P] Create AuditLog entity in backend/location-service/src/main/java/com/trucktrack/location/model/AuditLog.java
- [ ] T013 [P] Create AuditLogRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/AuditLogRepository.java
- [ ] T014 Create AuditService in backend/location-service/src/main/java/com/trucktrack/location/service/AuditService.java
- [ ] T015 Create ValidPassword annotation in backend/auth-service/src/main/java/com/trucktrack/auth/validator/ValidPassword.java
- [ ] T016 Create PasswordValidator in backend/auth-service/src/main/java/com/trucktrack/auth/validator/PasswordValidator.java
- [ ] T017 Create AdminGuard in frontend/src/app/core/guards/admin.guard.ts
- [ ] T018 Create AdminModule with lazy loading in frontend/src/app/admin/admin.module.ts
- [ ] T019 Create AdminRoutingModule in frontend/src/app/admin/admin-routing.module.ts
- [ ] T020 Add admin route to AppRoutingModule in frontend/src/app/app-routing.module.ts
- [ ] T021 [P] Create reusable DataTableComponent in frontend/src/app/admin/shared/data-table/data-table.component.ts
- [ ] T022 [P] Create reusable AuditLogComponent in frontend/src/app/admin/shared/audit-log/audit-log.component.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Gestion des utilisateurs (Priority: P1) 🎯 MVP

**Goal**: Créer, modifier, désactiver et supprimer des comptes utilisateurs

**Independent Test**: Créer un utilisateur, modifier ses infos, changer son rôle, le désactiver. L'utilisateur désactivé ne peut plus se connecter.

### Backend - Auth Service

- [ ] T023 [P] [US1] Create UserGroupAssignment entity in backend/auth-service/src/main/java/com/trucktrack/auth/model/UserGroupAssignment.java
- [ ] T024 [P] [US1] Create UserGroupAssignmentRepository in backend/auth-service/src/main/java/com/trucktrack/auth/repository/UserGroupAssignmentRepository.java
- [ ] T025 [P] [US1] Create CreateUserRequest DTO in backend/auth-service/src/main/java/com/trucktrack/auth/dto/CreateUserRequest.java
- [ ] T026 [P] [US1] Create UpdateUserRequest DTO in backend/auth-service/src/main/java/com/trucktrack/auth/dto/UpdateUserRequest.java
- [ ] T027 [P] [US1] Create UserAdminResponse DTO in backend/auth-service/src/main/java/com/trucktrack/auth/dto/UserAdminResponse.java
- [ ] T028 [US1] Create AdminUserService in backend/auth-service/src/main/java/com/trucktrack/auth/service/AdminUserService.java
- [ ] T029 [US1] Implement createUser() with password validation and activation email in AdminUserService
- [ ] T030 [US1] Implement updateUser() with role change and audit logging in AdminUserService
- [ ] T031 [US1] Implement deactivateUser() with session invalidation and last-admin check in AdminUserService
- [ ] T032 [US1] Implement reactivateUser() in AdminUserService
- [ ] T033 [US1] Implement resendActivationEmail() in AdminUserService
- [ ] T034 [US1] Create AdminUserController in backend/auth-service/src/main/java/com/trucktrack/auth/controller/AdminUserController.java
- [ ] T035 [US1] Implement GET /admin/users with pagination, search, and filtering in AdminUserController
- [ ] T036 [US1] Implement POST /admin/users for user creation in AdminUserController
- [ ] T037 [US1] Implement PUT /admin/users/{id} for user update in AdminUserController
- [ ] T038 [US1] Implement POST /admin/users/{id}/deactivate and /reactivate in AdminUserController
- [ ] T039 [US1] Implement GET/PUT /admin/users/{id}/groups for group assignments in AdminUserController
- [ ] T040 [US1] Add @PreAuthorize("hasRole('ADMIN')") security to AdminUserController

### Frontend - User Management

- [ ] T041 [P] [US1] Create UserService in frontend/src/app/admin/users/user.service.ts
- [ ] T042 [P] [US1] Create User interface and DTOs in frontend/src/app/admin/users/user.model.ts
- [ ] T043 [US1] Create UserListComponent in frontend/src/app/admin/users/user-list/user-list.component.ts
- [ ] T044 [US1] Implement user list with DataTable (pagination, search, sort) in UserListComponent
- [ ] T045 [US1] Create UserFormComponent in frontend/src/app/admin/users/user-form/user-form.component.ts
- [ ] T046 [US1] Implement create/edit user form with password validation in UserFormComponent
- [ ] T047 [US1] Add deactivate/reactivate buttons with confirmation dialog in UserListComponent
- [ ] T048 [US1] Add group assignment dialog in UserFormComponent
- [ ] T049 [US1] Add routes for user-list and user-form in AdminRoutingModule

**Checkpoint**: User management fully functional - can create, edit, deactivate users

---

## Phase 4: User Story 2 - Gestion des camions (Priority: P1)

**Goal**: Ajouter, modifier et retirer des camions de la flotte

**Independent Test**: Ajouter un camion, vérifier qu'il apparaît sur la carte, modifier ses infos, le mettre hors service.

### Backend - Location Service

- [ ] T050 [P] [US2] Create TruckGroupAssignment entity in backend/location-service/src/main/java/com/trucktrack/location/model/TruckGroupAssignment.java
- [ ] T051 [P] [US2] Create TruckGroupAssignmentRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/TruckGroupAssignmentRepository.java
- [ ] T052 [US2] Modify Truck entity to remove truckGroupId and add groups relationship in backend/location-service/src/main/java/com/trucktrack/location/model/Truck.java
- [ ] T053 [P] [US2] Create CreateTruckRequest DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/CreateTruckRequest.java
- [ ] T054 [P] [US2] Create UpdateTruckRequest DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/UpdateTruckRequest.java
- [ ] T055 [P] [US2] Create TruckAdminResponse DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/TruckAdminResponse.java
- [ ] T056 [US2] Create AdminTruckService in backend/location-service/src/main/java/com/trucktrack/location/service/AdminTruckService.java
- [ ] T057 [US2] Implement createTruck() with license plate uniqueness check in AdminTruckService
- [ ] T058 [US2] Implement updateTruck() with audit logging in AdminTruckService
- [ ] T059 [US2] Implement markOutOfService() and activateTruck() in AdminTruckService
- [ ] T060 [US2] Implement updateTruckGroups() for group assignments in AdminTruckService
- [ ] T061 [US2] Create AdminTruckController in backend/location-service/src/main/java/com/trucktrack/location/controller/AdminTruckController.java
- [ ] T062 [US2] Implement GET /admin/trucks with pagination, search, filtering in AdminTruckController
- [ ] T063 [US2] Implement POST /admin/trucks for truck creation in AdminTruckController
- [ ] T064 [US2] Implement PUT /admin/trucks/{id} for truck update in AdminTruckController
- [ ] T065 [US2] Implement POST /admin/trucks/{id}/out-of-service and /activate in AdminTruckController
- [ ] T066 [US2] Implement GET/PUT /admin/trucks/{id}/groups in AdminTruckController
- [ ] T067 [US2] Add @PreAuthorize("hasRole('ADMIN')") security to AdminTruckController

### Frontend - Truck Management

- [ ] T068 [P] [US2] Create TruckAdminService in frontend/src/app/admin/trucks/truck-admin.service.ts
- [ ] T069 [P] [US2] Create Truck admin interfaces in frontend/src/app/admin/trucks/truck.model.ts
- [ ] T070 [US2] Create TruckListComponent in frontend/src/app/admin/trucks/truck-list/truck-list.component.ts
- [ ] T071 [US2] Implement truck list with DataTable (pagination, search, status filter) in TruckListComponent
- [ ] T072 [US2] Create TruckFormComponent in frontend/src/app/admin/trucks/truck-form/truck-form.component.ts
- [ ] T073 [US2] Implement create/edit truck form with group assignment in TruckFormComponent
- [ ] T074 [US2] Add out-of-service/activate buttons with confirmation in TruckListComponent
- [ ] T075 [US2] Add routes for truck-list and truck-form in AdminRoutingModule

**Checkpoint**: Truck management fully functional - can add, edit, manage truck status

---

## Phase 5: User Story 3 - Dashboard statistiques (Priority: P2)

**Goal**: Visualiser des statistiques globales de la flotte

**Independent Test**: Accéder au dashboard, vérifier que les métriques s'affichent et correspondent aux données.

### Backend - Statistics

- [ ] T076 [P] [US3] Create TruckStatusStats DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/TruckStatusStats.java
- [ ] T077 [P] [US3] Create MileageStats DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/MileageStats.java
- [ ] T078 [P] [US3] Create AlertStats DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/AlertStats.java
- [ ] T079 [P] [US3] Create DashboardStats DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/DashboardStats.java
- [ ] T080 [US3] Create FleetStatisticsRepository with native SQL queries in backend/location-service/src/main/java/com/trucktrack/location/repository/FleetStatisticsRepository.java
- [ ] T081 [US3] Implement getTruckStatusCounts() query in FleetStatisticsRepository
- [ ] T082 [US3] Implement getTotalKilometers() query with PostGIS in FleetStatisticsRepository
- [ ] T083 [US3] Implement getAlertsByType() query in FleetStatisticsRepository
- [ ] T084 [US3] Create FleetStatisticsService in backend/location-service/src/main/java/com/trucktrack/location/service/FleetStatisticsService.java
- [ ] T085 [US3] Implement getDashboardStats() with period filtering in FleetStatisticsService
- [ ] T086 [US3] Create AdminStatsController in backend/location-service/src/main/java/com/trucktrack/location/controller/AdminStatsController.java
- [ ] T087 [US3] Implement GET /admin/stats/dashboard with period parameters in AdminStatsController
- [ ] T088 [US3] Implement GET /admin/stats/trucks for status counts in AdminStatsController
- [ ] T089 [US3] Implement GET /admin/stats/mileage for fleet mileage in AdminStatsController
- [ ] T090 [US3] Implement GET /admin/stats/alerts for alert summary in AdminStatsController

### Frontend - Dashboard

- [ ] T091 [P] [US3] Create StatsService in frontend/src/app/admin/dashboard/stats.service.ts
- [ ] T092 [P] [US3] Create Dashboard interfaces in frontend/src/app/admin/dashboard/dashboard.model.ts
- [ ] T093 [US3] Create StatsDashboardComponent in frontend/src/app/admin/dashboard/stats-dashboard/stats-dashboard.component.ts
- [ ] T094 [US3] Implement truck status cards (active/idle/offline/out-of-service) in StatsDashboardComponent
- [ ] T095 [US3] Implement mileage stats panel with top trucks list in StatsDashboardComponent
- [ ] T096 [US3] Implement alerts summary panel by type in StatsDashboardComponent
- [ ] T097 [US3] Add period selector (today/week/month/custom) in StatsDashboardComponent
- [ ] T098 [US3] Add loading states and empty state handling in StatsDashboardComponent
- [ ] T099 [US3] Add route for dashboard in AdminRoutingModule

**Checkpoint**: Dashboard displays real-time fleet statistics with period filtering

---

## Phase 6: User Story 4 - Configuration système (Priority: P2)

**Goal**: Configurer les paramètres globaux du système

**Independent Test**: Modifier le seuil de vitesse, vérifier que les nouvelles alertes utilisent ce seuil.

### Backend - Configuration

- [ ] T100 [P] [US4] Create SystemConfig entity in backend/location-service/src/main/java/com/trucktrack/location/model/SystemConfig.java
- [ ] T101 [P] [US4] Create ConfigHistory entity in backend/location-service/src/main/java/com/trucktrack/location/model/ConfigHistory.java
- [ ] T102 [P] [US4] Create SystemConfigRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/SystemConfigRepository.java
- [ ] T103 [P] [US4] Create ConfigHistoryRepository in backend/location-service/src/main/java/com/trucktrack/location/repository/ConfigHistoryRepository.java
- [ ] T104 [P] [US4] Create ConfigResponse DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/ConfigResponse.java
- [ ] T105 [P] [US4] Create UpdateConfigRequest DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/UpdateConfigRequest.java
- [ ] T106 [US4] Create SystemConfigService in backend/location-service/src/main/java/com/trucktrack/location/service/SystemConfigService.java
- [ ] T107 [US4] Implement getAllConfig() in SystemConfigService
- [ ] T108 [US4] Implement updateConfig() with optimistic locking and history in SystemConfigService
- [ ] T109 [US4] Implement getConfigHistory() in SystemConfigService
- [ ] T110 [US4] Create AdminConfigController in backend/location-service/src/main/java/com/trucktrack/location/controller/AdminConfigController.java
- [ ] T111 [US4] Implement GET /admin/config for all configurations in AdminConfigController
- [ ] T112 [US4] Implement PUT /admin/config/{key} with version check in AdminConfigController
- [ ] T113 [US4] Implement GET /admin/config/{key}/history in AdminConfigController
- [ ] T114 [US4] Update NotificationService to read config values from SystemConfig

### Frontend - Configuration

- [ ] T115 [P] [US4] Create ConfigService in frontend/src/app/admin/config/config.service.ts
- [ ] T116 [P] [US4] Create Config interfaces in frontend/src/app/admin/config/config.model.ts
- [ ] T117 [US4] Create ConfigPageComponent in frontend/src/app/admin/config/config-page/config-page.component.ts
- [ ] T118 [US4] Implement config list with edit capability in ConfigPageComponent
- [ ] T119 [US4] Add config history viewer with AuditLogComponent in ConfigPageComponent
- [ ] T120 [US4] Add optimistic locking conflict handling in ConfigPageComponent
- [ ] T121 [US4] Add route for config in AdminRoutingModule

**Checkpoint**: System configuration editable with full history tracking

---

## Phase 7: User Story 5 - Gestion des groupes (Priority: P3)

**Goal**: Créer des groupes de camions et y assigner des utilisateurs pour segmenter l'accès

**Independent Test**: Créer un groupe, y ajouter des camions, assigner un FLEET_MANAGER, vérifier qu'il ne voit que ces camions.

### Backend - Groups

- [ ] T122 [P] [US5] Create GroupDetailResponse DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/GroupDetailResponse.java
- [ ] T123 [P] [US5] Create CreateGroupRequest DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/CreateGroupRequest.java
- [ ] T124 [P] [US5] Create UpdateGroupRequest DTO in backend/location-service/src/main/java/com/trucktrack/location/dto/UpdateGroupRequest.java
- [ ] T125 [US5] Create AdminGroupService in backend/location-service/src/main/java/com/trucktrack/location/service/AdminGroupService.java
- [ ] T126 [US5] Implement createGroup() in AdminGroupService
- [ ] T127 [US5] Implement updateGroup() with audit logging in AdminGroupService
- [ ] T128 [US5] Implement deleteGroup() with empty check in AdminGroupService
- [ ] T129 [US5] Implement getGroupWithStats() for truck/user counts in AdminGroupService
- [ ] T130 [US5] Create AdminGroupController in backend/location-service/src/main/java/com/trucktrack/location/controller/AdminGroupController.java
- [ ] T131 [US5] Implement GET /admin/groups with pagination in AdminGroupController
- [ ] T132 [US5] Implement POST /admin/groups for group creation in AdminGroupController
- [ ] T133 [US5] Implement PUT /admin/groups/{id} for group update in AdminGroupController
- [ ] T134 [US5] Implement DELETE /admin/groups/{id} with validation in AdminGroupController
- [ ] T135 [US5] Implement GET /admin/groups/{id}/trucks and /users in AdminGroupController
- [ ] T136 [US5] Update TruckController.getTrucks() to filter by user's groups for non-ADMIN roles

### Frontend - Group Management

- [ ] T137 [P] [US5] Create GroupService in frontend/src/app/admin/groups/group.service.ts
- [ ] T138 [P] [US5] Create Group interfaces in frontend/src/app/admin/groups/group.model.ts
- [ ] T139 [US5] Create GroupListComponent in frontend/src/app/admin/groups/group-list/group-list.component.ts
- [ ] T140 [US5] Implement group list with truck/user counts in GroupListComponent
- [ ] T141 [US5] Create GroupFormComponent in frontend/src/app/admin/groups/group-form/group-form.component.ts
- [ ] T142 [US5] Implement create/edit group form in GroupFormComponent
- [ ] T143 [US5] Add group detail view with assigned trucks and users in GroupFormComponent
- [ ] T144 [US5] Add delete confirmation with non-empty warning in GroupListComponent
- [ ] T145 [US5] Add routes for group-list and group-form in AdminRoutingModule

**Checkpoint**: Group management functional with visibility filtering working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and integration testing

- [ ] T146 Add admin navigation menu in frontend/src/app/admin/admin.component.ts
- [ ] T147 [P] Add breadcrumbs navigation across admin pages
- [ ] T148 [P] Implement consistent error handling with toast notifications
- [ ] T149 [P] Add loading spinners during API calls
- [ ] T150 Verify SC-001: User creation < 2 minutes
- [ ] T151 Verify SC-002: Truck creation < 1 minute
- [ ] T152 Verify SC-003: Dashboard loads < 3 seconds
- [ ] T153 Verify SC-004: All admin actions are logged
- [ ] T154 Verify SC-006: FLEET_MANAGER only sees assigned groups' trucks
- [ ] T155 Verify SC-007: Non-ADMIN users cannot access /admin routes
- [ ] T156 Create V25__drop_truck_group_id.sql after verifying migration success
- [ ] T157 Run quickstart.md validation tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Run With |
|-------|------------|--------------|
| US1 (Users) | Foundational | US2, US3, US4 |
| US2 (Trucks) | Foundational | US1, US3, US4 |
| US3 (Dashboard) | Foundational, some US2 data | US1, US4 |
| US4 (Config) | Foundational | US1, US2, US3 |
| US5 (Groups) | US1, US2 (for assignment features) | - |

### Parallel Opportunities per Phase

**Phase 1 (Setup)**:
```
Parallel: T001, T002, T003, T004, T005
Sequential: T006, T007, T008
```

**Phase 2 (Foundational)**:
```
Parallel: T009+T012, T010+T013, T021+T022
Sequential: T011, T014, T015→T016, T017→T018→T019→T020
```

**Phase 3 (US1 - Users)**:
```
Parallel: T023+T024+T025+T026+T027, T041+T042
Sequential Backend: T028→T029→T030→T031→T032→T033→T034→...→T040
Sequential Frontend: T043→T044→T045→T046→T047→T048→T049
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (migrations)
2. Complete Phase 2: Foundational (audit, guards)
3. Complete Phase 3: US1 - User Management
4. Complete Phase 4: US2 - Truck Management
5. **STOP and VALIDATE**: Core admin functionality ready
6. Deploy MVP with user and truck management

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 + US2 | Core admin: users + trucks |
| +Dashboard | +US3 | Fleet visibility |
| +Config | +US4 | System customization |
| +Groups | +US5 | Access segmentation |

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Setup | 8 | 5 |
| Foundational | 14 | 6 |
| US1 - Users | 27 | 9 |
| US2 - Trucks | 26 | 8 |
| US3 - Dashboard | 24 | 6 |
| US4 - Config | 22 | 8 |
| US5 - Groups | 24 | 4 |
| Polish | 12 | 3 |
| **Total** | **157** | **49** |
