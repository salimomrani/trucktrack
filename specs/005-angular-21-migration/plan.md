# Implementation Plan: Angular 21 Migration

**Branch**: `005-angular-21-migration` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-angular-21-migration/spec.md`

## Summary

Migration du frontend TruckTrack de Angular 17.3.0 vers Angular 21.0.6 en suivant la procédure officielle `ng update` de manière incrémentale (17→18→19→20→21). L'objectif est de bénéficier du support LTS, du nouveau build system Esbuild, et du zoneless change detection par défaut.

## Technical Context

**Language/Version**: TypeScript 5.4.2 → 5.6+ (upgraded with Angular 21)
**Primary Dependencies**:
- @angular/core 17.3.0 → 21.0.6
- @angular/cli 17.3.17 → 21.0.6
- @angular/material 17.3.10 → 21.x
- @ngrx/store 17.2.0 → 21.x
- RxJS 7.8.0 (compatible, no change needed)
- Leaflet 1.9.4 (compatible)

**Storage**: N/A (frontend only, no storage changes)
**Testing**: Karma/Jasmine (existing), may need updates for zoneless testing
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web application (frontend only)
**Performance Goals**:
- Build time: -40% minimum
- Dev server startup: -50% minimum
- Hot-reload: <2 seconds
- Bundle size: -10% minimum
- Lighthouse score: >80

**Constraints**:
- Migration incrémentale obligatoire (17→18→19→20→21)
- Rollback possible à chaque étape via git
- Zero régression fonctionnelle
- 100% tests passants

**Scale/Scope**: Single frontend application (~50 components, ~20 services)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | PASS | Migration ne modifie pas la fonctionnalité temps réel |
| II. Microservices Architecture | PASS | Frontend only, architecture backend non impactée |
| III. Code Quality & Testing | PASS | Tests existants maintenus, coverage ≥80% requis |
| IV. Performance Requirements | PASS | Objectifs de performance définis et mesurables |
| V. Security & Privacy | PASS | Pas de changement de sécurité, JWT/auth inchangés |
| VI. User Experience Consistency | PASS | Zero régression UI requise |

**Gate Result**: PASS - Aucune violation constitutionnelle.

## Project Structure

### Documentation (this feature)

```text
specs/005-angular-21-migration/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Migration research
├── data-model.md        # N/A for this migration
├── quickstart.md        # Migration steps guide
├── contracts/           # N/A for this migration
├── checklists/          # Validation checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/           # Core services, guards, interceptors
│   │   ├── shared/         # Shared components, pipes, directives
│   │   ├── features/       # Feature modules
│   │   └── admin/          # Admin panel
│   ├── assets/
│   ├── environments/
│   └── styles/
├── angular.json            # Build configuration (will be updated)
├── package.json            # Dependencies (will be updated)
├── tsconfig.json           # TypeScript config (will be updated)
└── karma.conf.js           # Test configuration (may need updates)
```

**Structure Decision**: Frontend-only migration. No structural changes to the codebase, only configuration and dependency updates through `ng update`.

## Complexity Tracking

> No constitutional violations - this section is not required.

## Migration Strategy

### Incremental Upgrade Path

```
Angular 17.3.0 → 18.x → 19.x → 20.x → 21.0.6
    │              │       │       │       │
    └──────────────┴───────┴───────┴───────┘
         Commit & validate at each step
```

### Per-Version Migration Steps

1. **17 → 18**: Minor breaking changes, deprecations
2. **18 → 19**: Signal-based reactivity improvements
3. **19 → 20**: @angular/build (Esbuild) becomes default
4. **20 → 21**: Zoneless change detection default

### Validation Checkpoints

At each version:
- [ ] `ng update` completes without errors
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (100% existing tests)
- [ ] Manual smoke test of critical flows
- [ ] Git commit with version tag
