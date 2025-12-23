# Implementation Plan: Fleet Analytics Dashboard

**Branch**: `006-fleet-analytics` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-fleet-analytics/spec.md`

## Summary

Dashboard analytics avec KPIs de flotte (distance, temps de conduite, vitesse, alertes, geofences). Filtres par période et par entité (camion/groupe/flotte). Graphiques interactifs et export PDF/Excel. Utilise les données GPS existantes avec agrégation côté backend et visualisation Angular avec ngx-charts.

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.9 with Angular 21 (frontend)
**Primary Dependencies**:
- Backend: Spring Boot 3.2.1, Spring Data JPA, PostGIS
- Frontend: Angular 21, Angular Material 21, ngx-charts, jsPDF, xlsx
**Storage**: PostgreSQL 15+ with PostGIS (existing), Redis 7+ (cache KPIs)
**Testing**: JUnit 5, Mockito (backend), Jasmine/Karma (frontend)
**Target Platform**: Web application (responsive)
**Project Type**: Web application (backend API + frontend SPA)
**Performance Goals**:
- Dashboard load < 3 seconds for 30 days / 50 trucks
- API response < 500ms for aggregation queries
- Export PDF < 10 seconds
**Constraints**:
- Leverage existing gps_positions table (partitioned by timestamp)
- Use existing auth/permissions system
- No new infrastructure (Kafka, Redis already in place)
**Scale/Scope**: 50-100 trucks, 12 months of historical data, 500 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | ✅ PASS | Uses existing GPS data, no real-time streaming needed for analytics |
| II. Microservices Architecture | ✅ PASS | New endpoints in existing location-service |
| III. Code Quality & Testing | ✅ PASS | TDD for aggregation queries, contract tests for API |
| IV. Performance Requirements | ✅ PASS | Targets defined: <3s dashboard, <500ms API |
| V. Security & Privacy | ✅ PASS | Uses existing auth, respects group permissions |
| VI. User Experience Consistency | ✅ PASS | Angular Material design system, consistent with admin panel |

**Gate Result**: ✅ PASS - No violations, proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/006-fleet-analytics/
├── plan.md              # This file
├── research.md          # Technology decisions
├── data-model.md        # DTOs and aggregation models
├── quickstart.md        # Test scenarios
├── contracts/           # API endpoints (OpenAPI)
│   └── analytics-api.yaml
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code (repository root)

```text
backend/
└── location-service/
    └── src/main/java/com/trucktrack/location/
        ├── controller/
        │   └── AnalyticsController.java      # New REST endpoints
        ├── service/
        │   └── AnalyticsService.java         # KPI aggregation logic
        ├── dto/
        │   ├── FleetKPIResponse.java         # KPIs response
        │   ├── DailyMetricsResponse.java     # Chart data
        │   ├── AlertBreakdownResponse.java   # Pie chart data
        │   └── TruckRankingResponse.java     # Bar chart data
        └── repository/
            └── AnalyticsRepository.java      # Custom SQL queries

frontend/
└── src/app/
    ├── features/
    │   └── analytics/
    │       ├── analytics.component.ts        # Dashboard page
    │       ├── analytics.component.html
    │       ├── analytics.component.scss
    │       ├── components/
    │       │   ├── kpi-card/                 # KPI display widget
    │       │   ├── period-filter/            # Date range picker
    │       │   ├── entity-filter/            # Truck/Group selector
    │       │   ├── distance-chart/           # Line chart
    │       │   ├── alerts-chart/             # Pie chart
    │       │   └── trucks-ranking/           # Bar chart
    │       └── services/
    │           ├── analytics.service.ts      # API calls
    │           └── export.service.ts         # PDF/Excel generation
    └── core/
        └── models/
            └── analytics.model.ts            # TypeScript interfaces
```

**Structure Decision**: Extends existing location-service for backend (no new microservice needed). New Angular feature module for frontend dashboard.

## Complexity Tracking

> No violations - table not needed.
