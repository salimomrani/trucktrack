# Implementation Plan: Dashboard Real Data Integration

**Branch**: `022-dashboard-real-data` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-dashboard-real-data/spec.md`

## Summary

Remplacer les données mock du dashboard par des données réelles en connectant les widgets existants aux APIs backend et au store NgRx. Le dashboard affichera: KPIs (Total Trucks, Active trucks, Trips today, Alerts today), Fleet Status chart, Recent Activity feed, et Performance Overview metrics.

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.9.3 with Angular 21.0.6 (frontend)
**Primary Dependencies**: Spring Boot 3.2.x (backend), NgRx 21.x, Angular Material 21.0.5 (frontend)
**Storage**: PostgreSQL 15+ (existing), données trucks/trips/alerts existantes
**Testing**: JUnit 5 (backend), Jasmine/Karma (frontend)
**Target Platform**: Web application (Chrome, Firefox, Safari, Edge)
**Project Type**: web (frontend + backend)
**Performance Goals**: Dashboard load <3s, API response <200ms
**Constraints**: Pas de cache frontend, erreurs indépendantes par widget
**Scale/Scope**: Support 500 utilisateurs concurrents, flottes jusqu'à 100+ trucks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | ✅ PASS | Données réelles avec refresh manuel |
| II. Microservices Architecture | ✅ PASS | Utilise services existants (location-service, notification-service) |
| III. Code Quality & Testing | ✅ PASS | Tests requis pour nouveaux endpoints et composants |
| IV. Performance Requirements | ✅ PASS | <3s load time, <200ms API response |
| V. Security & Privacy | ✅ PASS | Filtrage par groupes de l'utilisateur (FR-013) |
| VI. User Experience Consistency | ✅ PASS | Loading states (FR-010), error handling (FR-011, FR-014) |

**Gate Result**: PASS - Aucune violation constitutionnelle.

## Project Structure

### Documentation (this feature)

```text
specs/022-dashboard-real-data/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
│   └── dashboard-api.yaml
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── location-service/
│   └── src/main/java/com/trucktrack/location/
│       ├── controller/
│       │   └── DashboardController.java      # NEW: Dashboard API endpoints
│       ├── service/
│       │   └── DashboardService.java         # NEW: KPI aggregation logic
│       └── dto/
│           ├── DashboardKpiDTO.java          # NEW
│           ├── FleetStatusDTO.java           # NEW
│           ├── ActivityEventDTO.java         # NEW
│           └── PerformanceMetricsDTO.java    # NEW

frontend/
├── src/app/
│   ├── core/components/
│   │   └── dashboard-v2/
│   │       ├── dashboard-v2.component.ts     # UPDATE: Connect to real data
│   │       ├── dashboard-v2.component.html   # UPDATE: Loading/error states
│   │       └── dashboard-v2.component.scss   # UPDATE: Error styling
│   ├── store/
│   │   └── dashboard/                        # NEW: Dashboard NgRx store
│   │       ├── dashboard.actions.ts
│   │       ├── dashboard.reducer.ts
│   │       ├── dashboard.effects.ts
│   │       ├── dashboard.selectors.ts
│   │       └── index.ts
│   └── services/
│       └── dashboard.service.ts              # NEW: Dashboard API service
```

**Structure Decision**: Web application (Option 2) - Backend API endpoints dans location-service, Frontend Angular avec NgRx store dédié pour le dashboard.

## Complexity Tracking

> Aucune violation constitutionnelle - section vide.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |
