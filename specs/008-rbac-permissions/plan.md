# Implementation Plan: Gestion des Droits et Permissions (RBAC)

**Branch**: `008-rbac-permissions` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-rbac-permissions/spec.md`

## Summary

Implémenter un système de contrôle d'accès basé sur les rôles (RBAC) pour TruckTrack. Le système restreint l'accès aux pages et filtre les données selon le rôle de l'utilisateur (ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER) et ses groupes assignés. L'implémentation couvre les guards Angular pour le frontend, les annotations Spring Security pour le backend, et le filtrage des données au niveau des repositories.

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.x avec Angular 17 (frontend)
**Primary Dependencies**: Spring Boot 3.2.1, Spring Security, Angular Material 17, NgRx
**Storage**: PostgreSQL 15+ (tables users, user_truck_groups existantes)
**Testing**: JUnit 5, Mockito (backend), Jasmine/Karma (frontend)
**Target Platform**: Web application (Chrome, Firefox, Safari, Edge - 2 dernières versions)
**Project Type**: Web application (backend microservices + frontend SPA)
**Performance Goals**: Vérification des permissions <100ms, navigation adaptée en <1s
**Constraints**: Contrôle serveur obligatoire, pas de bypass côté client
**Scale/Scope**: 4 rôles, 6 pages principales, filtrage par groupes de camions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | ✅ PASS | Les permissions sont cachées dans le JWT, pas d'impact sur la latence GPS |
| II. Microservices Architecture | ✅ PASS | Utilise les services existants (auth-service, gateway) |
| III. Code Quality & Testing | ✅ PASS | Tests unitaires et d'intégration prévus pour tous les guards et annotations |
| IV. Performance Requirements | ✅ PASS | Vérification permissions côté gateway <100ms |
| V. Security & Privacy | ✅ PASS | Contrôle serveur obligatoire, audit logging des accès refusés |
| VI. User Experience Consistency | ✅ PASS | Navigation dynamique, messages d'erreur clairs |

**Gate Result**: ✅ PASS - Aucune violation de la constitution

## Project Structure

### Documentation (this feature)

```text
specs/008-rbac-permissions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── permissions-api.yaml
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── auth-service/
│   └── src/main/java/com/trucktrack/auth/
│       ├── model/UserRole.java           # Enum existant (à enrichir)
│       └── service/PermissionService.java # Nouveau
├── shared/
│   └── src/main/java/com/trucktrack/common/
│       ├── security/
│       │   ├── RolePermissions.java       # Nouveau - Matrice des permissions
│       │   ├── RequireRole.java           # Nouveau - Annotation
│       │   └── RoleAuthorizationFilter.java # Nouveau
│       └── dto/
│           └── UserPermissions.java       # Nouveau
├── api-gateway/
│   └── src/main/java/com/trucktrack/gateway/
│       └── filter/
│           └── JwtAuthenticationFilter.java # Modifier (ajouter role check)
└── location-service/
    └── src/main/java/com/trucktrack/location/
        └── repository/
            └── TruckRepository.java       # Modifier (filtrage par groupe)

frontend/
└── src/app/
    ├── core/
    │   ├── guards/
    │   │   ├── role.guard.ts              # Nouveau
    │   │   └── permission.guard.ts        # Nouveau
    │   ├── services/
    │   │   └── permission.service.ts      # Nouveau
    │   └── models/
    │       └── permission.model.ts        # Nouveau
    ├── shared/
    │   └── components/
    │       └── access-denied/             # Nouveau
    └── app.routes.ts                      # Modifier (ajouter guards)
```

**Structure Decision**: Web application avec backend microservices existant. Les modifications s'intègrent dans l'architecture existante sans créer de nouveaux services.

## Complexity Tracking

> Aucune violation de constitution - section vide.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |

## Phase 0: Research Summary

**Output**: [research.md](./research.md)

### Key Findings

1. **Infrastructure existante couvre ~40%**:
   - `UserRole` enum avec 5 rôles (ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER, VIEWER)
   - `roleGuard()` factory function dans Angular
   - `UserGroupAssignment` entity pour l'assignation user-groupe
   - `adminGuard` déjà implémenté

2. **Décisions techniques validées**:
   - Permissions hardcodées dans `RolePermissions.java` (pas de DB)
   - Spring Security `@PreAuthorize` pour autorisation backend
   - Filtrage au niveau Repository avec `findByGroupIds()`
   - JWT claims enrichis avec `role` et `groupIds`

3. **Aucun NEEDS CLARIFICATION** - Toutes les questions résolues.

## Phase 1: Design Artifacts

### Data Model

**Output**: [data-model.md](./data-model.md)

**Entités principales**:
- `User` (existant) - avec `role: UserRole`
- `UserRole` (existant) - enum des 5 rôles
- `UserGroupAssignment` (existant) - association user-groupe
- `RolePermissions` (nouveau) - classe statique pour matrice des permissions
- `UserPermissions` (nouveau) - DTO pour transfert frontend

### API Contracts

**Output**: [contracts/permissions-api.yaml](./contracts/permissions-api.yaml)

**Nouveaux endpoints**:
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/auth/v1/permissions/me` | GET | Permissions de l'utilisateur courant | Bearer |
| `/auth/v1/permissions/pages` | GET | Pages accessibles | Bearer |
| `/auth/v1/permissions/check` | POST | Vérifier accès à une page | Bearer |
| `/auth/v1/users/{id}/groups` | GET/PUT | Gestion des groupes (Admin) | Bearer |

### Integration Scenarios

**Output**: [quickstart.md](./quickstart.md)

**Scénarios couverts**:
1. Test page access control par rôle
2. Test data filtering par groupe
3. Test unauthorized access (403)
4. Test frontend navigation
5. Test direct URL access denial

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Header/Nav   │◄───│ Navigation   │◄───│ Permission       │  │
│  │ Component    │    │ Service      │    │ Service          │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         │                                        ▲              │
│         ▼                                        │              │
│  ┌──────────────┐    ┌──────────────┐           │              │
│  │ Routes with  │───►│ roleGuard    │───────────┘              │
│  │ Guards       │    │ permGuard    │                          │
│  └──────────────┘    └──────────────┘                          │
│         │                   │                                   │
│         │          403 ─────┴─────► AccessDeniedComponent       │
└─────────│──────────────────────────────────────────────────────┘
          │ HTTP + JWT (role, groupIds)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│  ┌────────────────────────────────────┐                         │
│  │ JwtAuthenticationFilter            │                         │
│  │ - Extract role, groupIds           │                         │
│  │ - Set SecurityContext              │                         │
│  └────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                             │
│                                                                  │
│  AUTH-SERVICE                    LOCATION-SERVICE                │
│  ┌────────────────────┐         ┌────────────────────┐          │
│  │ PermissionService  │         │ TruckRepository    │          │
│  │ - getPages()       │         │ - findByGroupIds() │          │
│  │ - checkAccess()    │         │ - findForAdmin()   │          │
│  └────────────────────┘         └────────────────────┘          │
│          │                               │                       │
│          ▼                               ▼                       │
│  ┌────────────────────┐         ┌────────────────────┐          │
│  │ @PreAuthorize      │         │ @PreAuthorize      │          │
│  │ on Controllers     │         │ + Group Filtering  │          │
│  └────────────────────┘         └────────────────────┘          │
│                                                                  │
│  SHARED MODULE                                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │ RolePermissions.java - Static permission matrix     │         │
│  │ UserPermissions.java - DTO                         │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### Phase Priority (from spec)

1. **P1 - Contrôle d'accès aux pages** (Critical)
   - Backend `@PreAuthorize` annotations
   - Frontend guards sur routes
   - Navigation dynamique

2. **P2 - Filtrage des données par groupe** (High)
   - Repository methods avec filtrage
   - JWT enrichi avec groupIds
   - Refus d'accès aux ressources hors groupe

3. **P3 - Navigation dynamique** (Medium)
   - NavigationService
   - Menu adapté au rôle

4. **P4 - Feedback accès refusé** (Low)
   - AccessDeniedComponent
   - Messages d'erreur clairs

### MVP Scope

Pour V1, focus sur P1 + P2:
- 6 pages protégées par rôle
- Filtrage camions par groupe
- Navigation de base (menu items visibles/cachés)
- Page Access Denied simple

### Files to Modify

| File | Change Type | Priority |
|------|-------------|----------|
| `auth-service/service/PermissionService.java` | Create | P1 |
| `shared/security/RolePermissions.java` | Create | P1 |
| `shared/dto/UserPermissions.java` | Create | P1 |
| `location-service/repository/TruckRepository.java` | Modify | P2 |
| `frontend/guards/permission.guard.ts` | Create | P1 |
| `frontend/services/permission.service.ts` | Create | P1 |
| `frontend/services/navigation.service.ts` | Modify | P3 |
| `frontend/components/access-denied/` | Create | P4 |
| `frontend/app.routes.ts` | Modify | P1 |

## Next Steps

1. Run `/speckit.tasks` to generate detailed task breakdown
2. Execute tasks following priority order (P1 → P4)
3. Validate with quickstart.md test scenarios

---

*Plan generated: 2025-12-23 | Ready for `/speckit.tasks`*
