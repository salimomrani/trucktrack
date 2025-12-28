# Implementation Plan: Modern UI Redesign

**Branch**: `017-modern-ui-redesign` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-modern-ui-redesign/spec.md`

## Summary

Visual refresh of the TruckTrack web frontend with a modern flat design approach using professional blue (#1976D2) as primary color. Focus on consistent design tokens, improved typography and spacing, subtle micro-interactions, and WCAG 2.1 AA compliance. No dark mode, no navigation changes, no new features - purely visual styling updates.

## Technical Context

**Language/Version**: TypeScript 5.9 with Angular 21.0.6
**Primary Dependencies**: Angular Material 21.0.5, NgRx 21.x, RxJS 7.8.2, Leaflet 1.9.4, ngx-charts 23.1.0
**Storage**: N/A (visual styling only, no data model changes)
**Testing**: Jasmine, Karma (component tests), visual regression testing recommended
**Target Platform**: Web - Chrome, Firefox, Safari, Edge (latest 2 versions)
**Project Type**: web (frontend only)
**Performance Goals**: CLS < 0.1, animations < 300ms, LCP < 2.5s, FCP < 1.5s
**Constraints**: WCAG 2.1 AA color contrast, light theme only, no navigation changes
**Scale/Scope**: All frontend modules (~15 feature components, ~10 admin components)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | N/A | Visual redesign only, no data flow changes |
| II. Microservices Architecture | N/A | Frontend only, no backend changes |
| III. Code Quality & Testing | ✅ ALIGNED | Component tests for styled components required |
| IV. Performance Requirements | ✅ ALIGNED | CLS < 0.1, LCP < 2.5s targets match constitution |
| V. Security & Privacy | N/A | No security implications in visual redesign |
| VI. User Experience Consistency | ✅ ALIGNED | Design tokens, WCAG 2.1 AA, consistent components |

**Gate Status**: ✅ PASSED - No violations detected

## Project Structure

### Documentation (this feature)

```text
specs/017-modern-ui-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output - design system research
├── data-model.md        # Phase 1 output - design tokens specification
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output - component style contracts
│   ├── color-palette.md
│   ├── typography.md
│   ├── spacing.md
│   └── components.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── styles/
│   │   ├── _theme.scss          # Design tokens (PRIMARY UPDATE)
│   │   └── _navigation.scss     # Navigation styles
│   ├── styles.scss              # Global styles & Material theme (MAJOR UPDATE)
│   └── app/
│       ├── core/components/     # Layout components
│       │   ├── header/          # Header component styles
│       │   └── sidenav/         # Navigation styles
│       ├── features/            # Feature page styles
│       │   ├── analytics/
│       │   ├── map/
│       │   ├── alerts/
│       │   └── history/
│       ├── admin/               # Admin page styles
│       │   ├── dashboard/
│       │   ├── trips/
│       │   ├── trucks/
│       │   ├── users/
│       │   └── shared/          # Shared admin components
│       └── shared/              # Shared UI components
└── angular.json                 # Build configuration
```

**Structure Decision**: Existing Angular 21 structure with centralized theming via `/src/styles/_theme.scss`. Design tokens already exist and will be updated in place. Component-level styles in separate `.scss` files follow established patterns.

## Complexity Tracking

> No Constitutional violations identified - section not applicable.

## Key Files to Modify

| File | Purpose | Impact |
|------|---------|--------|
| `src/styles/_theme.scss` | Design tokens (colors, spacing, typography) | HIGH - Foundation |
| `src/styles.scss` | Global styles, Material theme overrides | HIGH - Global |
| `src/app/core/components/header/*.scss` | Header navigation | MEDIUM |
| `src/app/core/components/sidenav/*.scss` | Side navigation | MEDIUM |
| `src/app/features/analytics/*.scss` | Analytics dashboard | MEDIUM |
| `src/app/features/map/*.scss` | Map interface | MEDIUM |
| `src/app/admin/shared/data-table/*.scss` | Data tables | MEDIUM |
| All component `.scss` files | Component-specific styles | LOW-MEDIUM |

## Design Decisions

1. **Color Migration**: Current purple (#667eea) → Professional blue (#1976D2)
2. **Design Style**: Flat design with subtle accents (light shadows, thin borders)
3. **Typography**: Keep Inter/Roboto, adjust sizing scale for better hierarchy
4. **Spacing**: Keep 4px base unit, refine component padding
5. **Animations**: Keep <300ms, standardize easing functions
6. **Material Overrides**: Update custom theme to match new palette
