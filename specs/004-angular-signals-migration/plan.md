# Implementation Plan: Angular Modern Patterns Migration

**Branch**: `004-angular-signals-migration` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-angular-signals-migration/spec.md`

## Summary

Migrate remaining Angular components from decorator-based patterns (`@Input()`, `@Output()`) to signal-based functions (`input()`, `output()`) and update any remaining legacy template syntax (`*ngIf`, `*ngFor`, `*ngSwitch`) to modern control flow (`@if`, `@for`, `@switch`). The codebase is approximately 80% modernized; this migration targets the remaining ~20% of hybrid components.

## Technical Context

**Language/Version**: TypeScript 5.4.2 with Angular 17.3.0
**Primary Dependencies**: Angular Material 17.3.10, NgRx 17.2.0, RxJS 7.8.0, Leaflet 1.9.4
**Storage**: N/A (frontend state only, consumes existing APIs)
**Testing**: Jasmine 5.1.0 + Karma 6.4.0
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web frontend application (standalone components)
**Performance Goals**: Core Web Vitals - LCP <2.5s, CLS <0.1, FID <100ms
**Constraints**: Must maintain backward compatibility with existing tests, no breaking changes to component APIs
**Scale/Scope**: ~23 major components, ~10 templates to migrate, 3 core services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | ✅ PASS | Migration preserves all real-time functionality |
| II. Microservices Architecture | ✅ N/A | Frontend-only changes, no backend impact |
| III. Code Quality & Testing | ✅ PASS | Tests run after each module migration per clarification |
| IV. Performance Requirements | ✅ PASS | Signal-based patterns improve change detection |
| V. Security & Privacy | ✅ N/A | No security changes in this migration |
| VI. User Experience Consistency | ✅ PASS | No UI/UX changes, only internal refactoring |

**Result**: All gates PASS. No constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-angular-signals-migration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/src/app/
├── core/                          # Module 1: Core components
│   ├── components/
│   │   ├── header/               # ✅ Already modern
│   │   ├── sidenav/              # ⚠️ NEEDS MIGRATION: @Input/@Output
│   │   └── search-bar/           # ✅ Already modern
│   ├── services/                 # ✅ Already modern
│   ├── guards/                   # ✅ Already modern
│   └── models/                   # ✅ Already modern
├── features/                      # Module 2: Feature components
│   ├── auth/                     # ✅ Already modern
│   ├── map/                      # ✅ Already modern
│   │   └── geofence-panel/       # ⚠️ NEEDS REVIEW: Mixed patterns
│   ├── alerts/                   # ✅ Already modern
│   └── history/                  # ✅ Already modern
├── admin/                        # Module 3: Admin components
│   └── shared/
│       ├── data-table/           # ⚠️ NEEDS MIGRATION: @Input/@Output
│       ├── confirm-dialog/       # ✅ Already modern
│       └── audit-log/            # ✅ Already modern
├── store/                        # ✅ Already uses toSignal() pattern
└── services/                     # ✅ Already modern
```

**Structure Decision**: Existing frontend structure maintained. Migration is internal refactoring only.

## Migration Scope Analysis

### Components Requiring Migration

| Component | Location | Current Pattern | Target Pattern | Priority |
|-----------|----------|-----------------|----------------|----------|
| SidenavComponent | core/components/sidenav/ | @Input/@Output | input()/output() | P1 |
| DataTableComponent | admin/shared/data-table/ | @Input/@Output | input()/output() | P1 |
| GeofencePanelComponent | features/map/geofence-panel/ | Mixed | Full signals | P2 |

### Templates Requiring Update

| Template | Current Syntax | Target Syntax | Priority |
|----------|---------------|---------------|----------|
| data-table.component.html | *ngIf, *ngFor | @if, @for | P2 |

### Already Modernized (No Action Required)

- AppComponent, MapComponent, AlertsComponent, LoginComponent
- HeaderComponent, FilterPanelComponent, SearchBarComponent
- UserListComponent, TruckListComponent, HistoryComponent
- Store/Facade patterns using toSignal()

## Complexity Tracking

> No constitutional violations requiring justification. Migration is straightforward refactoring.

| Aspect | Assessment |
|--------|------------|
| Risk Level | LOW - Well-documented Angular patterns |
| Test Coverage | HIGH - Existing tests cover functionality |
| Rollback Strategy | Git revert per module if needed |

---

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion*

| Principle | Status | Validation |
|-----------|--------|------------|
| I. Real-Time Data First | ✅ PASS | Signal migration preserves all WebSocket subscriptions and real-time updates |
| II. Microservices Architecture | ✅ N/A | No backend changes |
| III. Code Quality & Testing | ✅ PASS | Test strategy defined in research.md; module-by-module validation |
| IV. Performance Requirements | ✅ PASS | Signals enable OnPush change detection optimization |
| V. Security & Privacy | ✅ N/A | No security-related changes |
| VI. User Experience Consistency | ✅ PASS | Internal refactoring only; UI unchanged |

**Post-Design Result**: All gates PASS. Ready for task generation.

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/004-angular-signals-migration/plan.md` | ✅ Complete |
| Research | `specs/004-angular-signals-migration/research.md` | ✅ Complete |
| Data Model | `specs/004-angular-signals-migration/data-model.md` | ✅ Complete |
| Contracts | `specs/004-angular-signals-migration/contracts/` | ✅ Complete |
| Quickstart | `specs/004-angular-signals-migration/quickstart.md` | ✅ Complete |
| Agent Context | `CLAUDE.md` | ✅ Updated |

---

## Next Steps

Run `/speckit.tasks` to generate the implementation task list.
