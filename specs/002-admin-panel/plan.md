# Implementation Plan: Admin Panel

**Branch**: `002-admin-panel` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-admin-panel/spec.md`

## Summary

Interface d'administration pour gérer les utilisateurs, les camions, les configurations système et visualiser les statistiques globales de la flotte. Extension du système existant avec nouvelles entités (AuditLog, SystemConfig, UserGroup) et modifications des relations existantes (Truck many-to-many TruckGroup).

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.4 with Angular 17 (frontend)
**Primary Dependencies**: Spring Boot 3.2.1, Spring Security, Spring Data JPA, Angular Material
**Storage**: PostgreSQL 15+ with PostGIS, Redis 7+ (cache sessions)
**Testing**: JUnit 5, Mockito, TestContainers, Jasmine/Karma (frontend)
**Target Platform**: Linux server (Docker/Kubernetes), Web browsers
**Project Type**: Web application (microservices backend + SPA frontend)
**Performance Goals**: Dashboard <3s load, API <200ms p95, 500 concurrent users
**Constraints**: <200ms p95 API response, audit logs 90 days retention
**Scale/Scope**: ~100 trucks, ~50 users, ~10 groups

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | ✅ PASS | Dashboard stats use existing Kafka streams, no new real-time requirements |
| II. Microservices Architecture | ✅ PASS | Admin endpoints extend auth-service (users) and location-service (trucks/groups) |
| III. Code Quality & Testing | ✅ PASS | Will follow TDD, contract tests for new APIs, 80% coverage target |
| IV. Performance Requirements | ✅ PASS | Stats aggregation <3s (SC-003), API <200ms for CRUD ops |
| V. Security & Privacy | ✅ PASS | JWT auth, role-based access (ADMIN only), audit logging (FR-005) |
| VI. User Experience Consistency | ✅ PASS | Angular Material components, pagination (FR-021), consistent with existing UI |

**Gate Status**: ✅ PASSED - No violations

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-panel/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── admin-users.yaml
│   ├── admin-trucks.yaml
│   ├── admin-groups.yaml
│   ├── admin-config.yaml
│   └── admin-stats.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── auth-service/
│   └── src/main/java/com/trucktrack/auth/
│       ├── model/
│       │   ├── User.java           # Existing - extend with group relations
│       │   └── UserGroup.java      # NEW - many-to-many pivot
│       ├── controller/
│       │   └── AdminUserController.java  # NEW - user CRUD admin
│       ├── service/
│       │   ├── AdminUserService.java     # NEW
│       │   └── AuditService.java         # NEW
│       ├── repository/
│       │   └── AuditLogRepository.java   # NEW
│       └── dto/
│           ├── CreateUserRequest.java    # NEW
│           └── UserAdminResponse.java    # NEW
│
├── location-service/
│   └── src/main/java/com/trucktrack/location/
│       ├── model/
│       │   ├── Truck.java          # Modify - many-to-many groups
│       │   ├── TruckGroup.java     # Existing
│       │   ├── SystemConfig.java   # NEW
│       │   └── AuditLog.java       # NEW - shared entity
│       ├── controller/
│       │   ├── AdminTruckController.java   # NEW
│       │   ├── AdminGroupController.java   # NEW
│       │   ├── AdminConfigController.java  # NEW
│       │   └── AdminStatsController.java   # NEW
│       ├── service/
│       │   ├── AdminTruckService.java      # NEW
│       │   ├── AdminGroupService.java      # NEW
│       │   ├── SystemConfigService.java    # NEW
│       │   └── FleetStatisticsService.java # NEW
│       └── repository/
│           ├── SystemConfigRepository.java # NEW
│           └── AuditLogRepository.java     # NEW
│
└── shared/
    └── src/main/java/com/trucktrack/shared/
        ├── dto/
        │   └── PageResponse.java   # NEW - pagination wrapper
        └── audit/
            └── AuditEvent.java     # NEW - Kafka event

frontend/
└── src/app/
    ├── admin/                      # NEW - admin module
    │   ├── admin.module.ts
    │   ├── admin-routing.module.ts
    │   ├── users/
    │   │   ├── user-list/
    │   │   ├── user-form/
    │   │   └── user.service.ts
    │   ├── trucks/
    │   │   ├── truck-list/
    │   │   ├── truck-form/
    │   │   └── truck-admin.service.ts
    │   ├── groups/
    │   │   ├── group-list/
    │   │   ├── group-form/
    │   │   └── group.service.ts
    │   ├── config/
    │   │   ├── config-page/
    │   │   └── config.service.ts
    │   ├── dashboard/
    │   │   ├── stats-dashboard/
    │   │   └── stats.service.ts
    │   └── shared/
    │       ├── data-table/         # Reusable paginated table
    │       └── audit-log/          # Audit log viewer
    │
    └── core/
        └── guards/
            └── admin.guard.ts      # NEW - ADMIN role guard
```

**Structure Decision**: Extend existing microservices (auth-service for users, location-service for trucks/config/stats). New Angular admin module with lazy loading.

## Complexity Tracking

> No violations to justify - all design decisions align with constitution.

| Decision | Rationale |
|----------|-----------|
| Stats calculated on-demand | V1 simplicity, can add caching/pre-aggregation if needed |
| Audit logs in each service DB | Avoids new service, follows data locality |
| Email via existing SMTP config | Reuse notification-service patterns |
