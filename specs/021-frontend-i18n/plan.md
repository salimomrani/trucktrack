# Implementation Plan: Frontend Internationalisation (i18n) FR/EN

**Branch**: `021-frontend-i18n` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-frontend-i18n/spec.md`

## Summary

Add multilingual support (French/English) to the TruckTrack Angular frontend using ngx-translate. Users will be able to switch between languages via a selector in the header, with their preference persisted in localStorage. All admin interface texts (sidebar, pages, forms, messages) will be translated.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with Angular 21.0.6
**Primary Dependencies**: @ngx-translate/core, @ngx-translate/http-loader, Angular Material 21.0.5
**Storage**: localStorage (language preference persistence)
**Testing**: Jasmine/Karma (existing setup)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: web (frontend only)
**Performance Goals**: Language switch <500ms, no page reload
**Constraints**: Runtime translation (not compile-time), 2 languages only (FR, EN)
**Scale/Scope**: ~17 admin components, ~30 template files, ~200 translatable strings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | N/A | i18n doesn't affect GPS/real-time features |
| II. Microservices Architecture | PASS | Frontend-only change, no backend impact |
| III. Code Quality & Testing | PASS | Will add unit tests for i18n service |
| IV. Performance Requirements | PASS | <500ms switch, lazy load JSON files |
| V. Security & Privacy | PASS | No sensitive data involved |
| VI. User Experience Consistency | PASS | Constitution explicitly requires i18n support |

**Constitution Reference (VI. User Experience Consistency)**:
> "Internationalization: UI MUST support multiple languages via i18n framework"

## Project Structure

### Documentation (this feature)

```text
specs/021-frontend-i18n/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── components/
│   │   │   │   ├── top-header/          # Add language selector
│   │   │   │   └── sidebar/             # Translate navigation labels
│   │   │   └── services/
│   │   │       └── language.service.ts  # NEW: Language management
│   │   ├── admin/                       # All pages to translate
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── trucks/
│   │   │   ├── trips/
│   │   │   ├── groups/
│   │   │   └── config/
│   │   ├── features/                    # Pages to translate
│   │   │   ├── map/
│   │   │   ├── analytics/
│   │   │   └── alerts/
│   │   └── shared/
│   │       └── components/              # Shared components to translate
│   └── assets/
│       └── i18n/                        # NEW: Translation files
│           ├── fr.json                  # French translations
│           └── en.json                  # English translations
└── tests/
    └── unit/
        └── language.service.spec.ts     # NEW: i18n tests
```

**Structure Decision**: Frontend-only modification. Translation files stored in `assets/i18n/`, loaded at runtime via HTTP. New `LanguageService` in `core/services/` for centralized language management with signals.

## Complexity Tracking

> No constitution violations. Feature is explicitly required by Constitution VI.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Runtime vs Compile-time | Runtime (ngx-translate) | Allows instant language switch without rebuild |
| Storage | localStorage | Simple, works offline, no backend sync needed |
| Default language | French | Primary market as per spec assumptions |
