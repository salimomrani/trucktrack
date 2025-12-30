# Implementation Plan: Migration Angular Material vers Tailwind CSS

**Branch**: `020-tailwind-migration` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-tailwind-migration/spec.md`

## Summary

Migration complète du frontend Angular de la bibliothèque Angular Material vers Tailwind CSS. L'objectif est d'éliminer les problèmes de styling (artefacts visuels sur les inputs) et d'obtenir un contrôle total sur le design. La migration se fera page par page (login → history → admin), en utilisant Flatpickr pour le datepicker et en conservant le CDK Angular minimal (overlay/a11y).

## Technical Context

**Language/Version**: TypeScript 5.9 with Angular 21.0.6
**Primary Dependencies**: Tailwind CSS 3.4+, @tailwindcss/forms, Flatpickr, @angular/cdk (overlay, a11y)
**Storage**: N/A (frontend only - no backend changes)
**Testing**: Jasmine/Karma (unit), Playwright (e2e visual regression)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Web application (frontend Angular)
**Performance Goals**: Initial page load <3s, LCP <2.5s, CLS <0.1
**Constraints**: Maintain WCAG 2.1 AA accessibility, no visual regressions
**Scale/Scope**: ~40 components across 15+ pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | ✅ N/A | Frontend styling only, no impact on data flow |
| II. Microservices Architecture | ✅ N/A | Frontend only, no backend changes |
| III. Code Quality & Testing | ✅ Pass | Visual regression tests required, ESLint/Prettier enforced |
| IV. Performance Requirements | ✅ Pass | LCP <2.5s, bundle size reduction target 30% |
| V. Security & Privacy | ✅ N/A | No auth/data changes |
| VI. User Experience Consistency | ✅ Pass | Design tokens, accessibility, responsive design |

**Gate Result**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/020-tailwind-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (component inventory)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (component API specs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── shared/
│   │   │   └── components/       # NEW: Tailwind UI components
│   │   │       ├── button/
│   │   │       ├── input/
│   │   │       ├── card/
│   │   │       ├── table/
│   │   │       ├── dialog/
│   │   │       ├── toast/
│   │   │       └── datepicker/
│   │   ├── core/
│   │   │   └── components/       # Migrate: header, sidenav
│   │   ├── features/             # Migrate page by page
│   │   │   ├── auth/login/
│   │   │   ├── history/
│   │   │   ├── map/
│   │   │   └── analytics/
│   │   └── admin/                # Migrate last
│   ├── styles/
│   │   └── tailwind/             # NEW: Tailwind config & base styles
│   └── styles.scss               # Update: remove Material, add Tailwind
├── tailwind.config.js            # NEW: Tailwind configuration
└── tests/
    └── visual/                   # NEW: Visual regression tests
```

**Structure Decision**: Existing Angular structure preserved. New shared components created in `shared/components/`. Tailwind configuration added at frontend root.

## Complexity Tracking

> No Constitution violations requiring justification.

| Item | Status |
|------|--------|
| CDK minimal (overlay/a11y) | Justified in spec - reduces dialog/modal implementation complexity |
| Flatpickr external dependency | Justified - native HTML5 date inputs insufficient for UX requirements |
