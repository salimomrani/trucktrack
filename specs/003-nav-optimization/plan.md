# Implementation Plan: Optimisation du Menu de Navigation

**Branch**: `003-nav-optimization` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-nav-optimization/spec.md`

## Summary

Améliorer l'ergonomie du menu de navigation header pour une meilleure expérience utilisateur. L'approche consiste à proposer plusieurs patterns de navigation (hamburger menu unique, sidebar persistante, navigation hybride) et sélectionner le plus adapté au contexte d'une application de tracking de flotte.

## Technical Context

**Language/Version**: TypeScript 5.4 with Angular 17
**Primary Dependencies**: Angular Material 17.3.10, RxJS, NgRx (store/signals)
**Storage**: N/A (frontend state only, consumes existing APIs)
**Testing**: Jasmine/Karma for unit tests, component testing with Angular TestBed
**Target Platform**: Web application - Desktop browsers (Chrome, Firefox, Safari, Edge), Mobile browsers (320px-2560px)
**Project Type**: Web application (frontend only for this feature)
**Performance Goals**: Menu renders < 100ms, transitions < 300ms, Lighthouse accessibility > 90
**Constraints**: Must work offline, support keyboard navigation, WCAG 2.1 AA compliance
**Scale/Scope**: 5-7 navigation items, 5 user roles, responsive breakpoints at 768px/1024px/1920px

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | ✅ PASS | Navigation displays real-time notification badge from WebSocket |
| II. Microservices Architecture | ✅ N/A | Frontend-only feature, no backend changes |
| III. Code Quality & Testing | ⚠️ VERIFY | Must include component tests, E2E tests for navigation flows |
| IV. Performance Requirements | ✅ PASS | Menu load < 100ms, transitions < 300ms, Core Web Vitals targets |
| V. Security & Privacy | ✅ PASS | Role-based menu filtering already implemented via NavigationService |
| VI. User Experience Consistency | ⚠️ KEY | This feature's primary goal - must meet WCAG 2.1 AA, responsive design |

**Gate Status**: ✅ PASS - No blocking violations. Key focus areas identified for UX consistency.

## Project Structure

### Documentation (this feature)

```text
specs/003-nav-optimization/
├── plan.md              # This file
├── research.md          # Phase 0 output - UX patterns research
├── data-model.md        # Phase 1 output - Navigation data structures
├── quickstart.md        # Phase 1 output - Development guide
├── contracts/           # Phase 1 output - Component contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── components/
│   │   │   │   ├── header/           # Header component (modify)
│   │   │   │   │   ├── header.component.ts
│   │   │   │   │   ├── header.component.html
│   │   │   │   │   └── header.component.scss
│   │   │   │   └── sidenav/          # Mobile sidenav (modify/enhance)
│   │   │   │       ├── sidenav.component.ts
│   │   │   │       ├── sidenav.component.html
│   │   │   │       └── sidenav.component.scss
│   │   │   ├── services/
│   │   │   │   └── navigation.service.ts  # Role-based nav config (exists)
│   │   │   └── models/
│   │   │       └── navigation.model.ts    # Nav item interfaces (exists)
│   │   ├── store/
│   │   │   └── auth/                 # Auth state for role (exists)
│   │   └── app.component.ts          # Root layout management
│   └── styles/
│       └── _navigation.scss          # Shared navigation styles (modify)
└── tests/
    └── core/
        └── components/
            ├── header.component.spec.ts
            └── sidenav.component.spec.ts
```

**Structure Decision**: Web application frontend-only modification. All changes in `frontend/src/app/core/components/` with shared styles in `frontend/src/styles/`.

## Complexity Tracking

> No violations identified - feature aligns with constitutional principles.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Pattern Choice | TBD in research | Will evaluate hamburger menu vs hybrid vs sidebar |
| Animation Library | Native CSS | Angular Material provides sufficient animation support |
| State Management | Existing NgRx | No new store modules needed |
