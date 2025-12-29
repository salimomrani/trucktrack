# Implementation Plan: Modern UI Redesign

**Branch**: `017-modern-ui-redesign` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-modern-ui-redesign/spec.md`

## Summary

Visual refresh of the TruckTrack web frontend with modern, minimalist design focusing on professional blue palette (#1976D2), flat design approach with subtle accents, improved typography and spacing, and WCAG 2.1 AA compliance. No dark mode, minimal animations (<300ms), light theme only.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with Angular 21.0.6
**Primary Dependencies**: Angular Material 21.0.5, NgRx 21.x, RxJS 7.8.2, SCSS
**Storage**: N/A (frontend styling only)
**Testing**: Karma + Jasmine for unit tests, visual regression testing for UI
**Target Platform**: Web (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web frontend (Angular SPA)
**Performance Goals**: LCP <2.5s, CLS <0.1, FCP <1.5s, animations <300ms
**Constraints**: WCAG 2.1 AA compliance, no dark mode, existing component structure preserved
**Scale/Scope**: ~50+ components to restyle, 10 major page layouts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | N/A | UI-only changes, no data flow impact |
| II. Microservices Architecture | N/A | Frontend only |
| III. Code Quality & Testing | ✅ Pass | SCSS follows coding standards, lint passing |
| IV. Performance Requirements | ✅ Pass | LCP <2.5s, CLS <0.1, animations <300ms |
| V. Security & Privacy | N/A | No auth/data changes |
| VI. User Experience Consistency | ✅ Pass | Design tokens ensure consistency, WCAG 2.1 AA met |

**Gate Status**: ✅ PASS - All applicable principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/017-modern-ui-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output (Design Tokens) ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/           # Phase 1 output ✅
│   ├── color-palette.md
│   ├── components.md
│   ├── spacing.md
│   └── typography.md
└── tasks.md             # Phase 2 output ✅
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── styles/
│   │   ├── _theme.scss        # Design tokens (colors, spacing, typography)
│   │   ├── _navigation.scss   # Navigation component styles
│   │   └── README.md          # Style system documentation
│   ├── styles.scss            # Global styles & Material overrides
│   └── app/
│       ├── core/components/   # Layout components (header, sidenav)
│       ├── admin/             # Admin feature components
│       └── features/          # Feature modules (analytics, map, etc.)
└── angular.json               # Build configuration
```

**Structure Decision**: Web application with SCSS design token system. All styling changes are applied through:
1. Design tokens in `_theme.scss` (foundation)
2. Global Material overrides in `styles.scss`
3. Component-specific SCSS refinements

## Complexity Tracking

> No constitutional violations. Design is straightforward styling refresh.

| Area | Complexity | Justification |
|------|------------|---------------|
| Design tokens | Low | Standard SCSS variables + CSS custom properties |
| Material overrides | Medium | Angular Material 21 theming API, global overrides |
| Component updates | Low | Incremental styling changes, no structural changes |

## Phase Status

| Phase | Status | Artifacts |
|-------|--------|-----------|
| Phase 0: Research | ✅ Complete | research.md |
| Phase 1: Design & Contracts | ✅ Complete | data-model.md, contracts/, quickstart.md |
| Phase 2: Tasks | ✅ Complete | tasks.md (81 tasks) |
| Implementation | 🔄 In Progress | _theme.scss, styles.scss updated |

## Implementation Progress

### Completed
- Design token foundation (`_theme.scss`)
- Angular Material theme palette
- Button, card, form-field, table, snackbar, dialog overrides
- Global utility classes (badges, empty-state, spinner, skeleton)
- Navigation styling

### Remaining
- Component-specific refinements (Phase 3-6 in tasks.md)
- Final accessibility validation
- Performance validation
- Visual consistency audit
