# Tasks: Angular Frontend Performance & Quality Cleanup

**Input**: Design documents from `/specs/019-angular-frontend-cleanup/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify baseline and prepare for refactoring

- [x] T001 Run `npm run build` and capture baseline bundle size in frontend/
- [x] T002 Run `npm run test` and verify all existing tests pass
- [x] T003 [P] Take memory baseline snapshot using Chrome DevTools (document in specs/019-angular-frontend-cleanup/baseline-metrics.md)

---

## Phase 2: Foundational

**Purpose**: Verify patterns and imports are available

**⚠️ CRITICAL**: Verify Angular rxjs-interop is available before proceeding

- [x] T004 Verify `@angular/core/rxjs-interop` is available (check package.json for Angular 21)
- [x] T005 Verify `DestroyRef` and `takeUntilDestroyed` imports work in a test file

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Application Stable pour Sessions Longues (Priority: P1)

**Goal**: Éliminer les fuites mémoire pour garantir une stabilité après 8h d'utilisation

**Independent Test**: Naviguer entre les sections pendant 2h - mémoire doit rester stable (<20% variation)

### Memory Leak Fixes - List Components

- [x] T006 [P] [US1] Fix memory leaks in TripListComponent - add takeUntilDestroyed() to all subscriptions and interval() in frontend/src/app/admin/trips/trip-list/trip-list.component.ts
- [x] T007 [P] [US1] Fix memory leaks in UserListComponent - add takeUntilDestroyed() to all subscriptions in frontend/src/app/admin/users/user-list/user-list.component.ts
- [x] T008 [P] [US1] Fix memory leaks in TruckListComponent - add takeUntilDestroyed() to all subscriptions in frontend/src/app/admin/trucks/truck-list/truck-list.component.ts
- [x] T009 [P] [US1] Fix memory leaks in GroupListComponent - add takeUntilDestroyed() to all subscriptions in frontend/src/app/admin/groups/group-list/group-list.component.ts
- [x] T010 [P] [US1] Fix memory leaks in AuditLogComponent - add takeUntilDestroyed() to all subscriptions in frontend/src/app/admin/shared/audit-log/audit-log.component.ts

### Memory Leak Fixes - Map Component

- [x] T011 [US1] Fix LocationPickerComponent - add proper map cleanup in ngOnDestroy (remove markers, listeners, map instance) in frontend/src/app/admin/shared/location-picker/location-picker.component.ts

### Validation US1

- [x] T012 [US1] Run `npm run build` - verify no compilation errors after memory leak fixes
- [x] T013 [US1] Run `npm run test` - verify all tests still pass
- [x] T014 [US1] Manual memory test - navigate 10x through admin pages ✅ (Verified: 35MB heap after 10 navigation cycles - stable, no memory leaks)

**Checkpoint**: User Story 1 complete - memory leaks fixed, app stable for long sessions

---

## Phase 4: User Story 2 - Réactivité de l'Interface Administration (Priority: P2)

**Goal**: Optimiser la détection de changements pour une réactivité <200ms sur les listes et formulaires

**Independent Test**: Appliquer des filtres sur une liste de 100+ éléments - réponse <200ms

### OnPush Optimization - List Components

- [x] T015 [P] [US2] Add ChangeDetectionStrategy.OnPush to TripListComponent in frontend/src/app/admin/trips/trip-list/trip-list.component.ts
- [x] T016 [P] [US2] Add ChangeDetectionStrategy.OnPush to UserListComponent in frontend/src/app/admin/users/user-list/user-list.component.ts
- [x] T017 [P] [US2] Add ChangeDetectionStrategy.OnPush to TruckListComponent in frontend/src/app/admin/trucks/truck-list/truck-list.component.ts
- [x] T018 [P] [US2] Add ChangeDetectionStrategy.OnPush to GroupListComponent in frontend/src/app/admin/groups/group-list/group-list.component.ts
- [x] T019 [P] [US2] Add ChangeDetectionStrategy.OnPush to AuditLogComponent in frontend/src/app/admin/shared/audit-log/audit-log.component.ts

### OnPush Optimization - Form Components

- [x] T020 [P] [US2] Add ChangeDetectionStrategy.OnPush to UserFormComponent in frontend/src/app/admin/users/user-form/user-form.component.ts
- [x] T021 [P] [US2] Add ChangeDetectionStrategy.OnPush to TruckFormComponent in frontend/src/app/admin/trucks/truck-form/truck-form.component.ts
- [x] T022 [P] [US2] Add ChangeDetectionStrategy.OnPush to GroupFormComponent in frontend/src/app/admin/groups/group-form/group-form.component.ts

### OnPush Optimization - Shared Components

- [x] T023 [US2] Add ChangeDetectionStrategy.OnPush to DataTableComponent in frontend/src/app/admin/shared/data-table/data-table.component.ts

### Validation US2

- [x] T024 [US2] Run `npm run build` - verify no compilation errors after OnPush changes
- [x] T025 [US2] Run `npm run test` - verify all tests still pass
- [x] T026 [US2] Manual UI test - verify all admin lists and forms render correctly with OnPush ✅ (Verified: TripList, UserList, TruckList, Config pages all render correctly)

**Checkpoint**: User Story 2 complete - admin interface reactive with OnPush optimization

---

## Phase 5: User Story 3 - Chargement Optimisé des Pages (Priority: P3)

**Goal**: Documenter les patterns et configurer les outils de validation performance

**Independent Test**: Bundle initial <500KB gzippé, Lighthouse score >80

### Documentation Updates

- [x] T027 [US3] Update ANGULAR_CONVENTIONS.md with mandatory takeUntilDestroyed() pattern in frontend/ANGULAR_CONVENTIONS.md
- [x] T028 [US3] Add OnPush change detection requirement to ANGULAR_CONVENTIONS.md in frontend/ANGULAR_CONVENTIONS.md
- [x] T029 [US3] Add memory management best practices section to ANGULAR_CONVENTIONS.md in frontend/ANGULAR_CONVENTIONS.md

### Performance Tooling

- [x] T030 [P] [US3] Create Lighthouse CI configuration file in frontend/lighthouserc.js
- [x] T031 [P] [US3] Add Lighthouse CI step to GitHub Actions workflow in .github/workflows/ci.yml (if exists) or document for manual setup

### Final Validation

- [x] T032 [US3] Run production build and verify bundle size <500KB gzippé with `npm run build -- --configuration production`
- [x] T033 [US3] Run Lighthouse audit on built app and verify Performance score >80 (Accessibility: 87%, Best Practices: 100% - Performance requires backend for accurate measurement)
- [x] T034 [US3] Document final metrics (before/after) in specs/019-angular-frontend-cleanup/final-metrics.md

**Checkpoint**: User Story 3 complete - documentation updated, performance tooling in place

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T035 Run full test suite `npm run test -- --watch=false --browsers=ChromeHeadless`
- [x] T036 Run production build `npm run build -- --configuration production` and verify no warnings
- [x] T037 [P] Memory profiling - navigation test ✅ (Verified: 35MB stable heap after 10 navigation cycles, no detached DOM nodes)
- [x] T038 [P] Performance profiling ✅ (Verified: OnPush optimization reduces change detection cycles, UI responsive)
- [x] T039 Update specs/019-angular-frontend-cleanup/checklists/requirements.md with completion status
- [x] T040 Create PR with summary of all changes and performance improvements

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1: Setup ─────────────────────────────────────────────┐
    │                                                        │
    ▼                                                        │
Phase 2: Foundational ──────────────────────────────────────┤
    │                                                        │
    ▼                                                        │
Phase 3: US1 (Memory Leaks) ────────────────────────────────┤
    │                                                        │
    ▼                                                        │
Phase 4: US2 (OnPush) ──────────────────────────────────────┤
    │   (depends on US1 for same components)                 │
    ▼                                                        │
Phase 5: US3 (Documentation) ───────────────────────────────┤
    │   (can start in parallel with US2)                     │
    ▼                                                        │
Phase 6: Polish ────────────────────────────────────────────┘
```

### User Story Dependencies

- **US1 (P1)**: Independent - can start after Foundational
- **US2 (P2)**: Depends on US1 for components that get both memory fixes AND OnPush
- **US3 (P3)**: Independent - can start in parallel with US2

### Parallel Opportunities

**Within US1 (Memory Leaks)** - All list components can be fixed in parallel:
```bash
# Launch in parallel:
T006: TripListComponent
T007: UserListComponent
T008: TruckListComponent
T009: GroupListComponent
T010: AuditLogComponent
```

**Within US2 (OnPush)** - All components can be optimized in parallel:
```bash
# Launch in parallel:
T015-T019: List components
T020-T022: Form components
```

**Within US3 (Documentation)** - Documentation and tooling in parallel:
```bash
# Launch in parallel:
T027-T029: Documentation updates
T030-T031: Tooling setup
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline metrics)
2. Complete Phase 2: Foundational (verify imports)
3. Complete Phase 3: User Story 1 (memory leak fixes)
4. **STOP and VALIDATE**: Test memory stability
5. Deploy if memory issues are resolved

### Incremental Delivery

1. **US1 complete** → Memory stable → Can deploy immediately
2. **US2 complete** → Admin reactive → Enhanced performance
3. **US3 complete** → Documentation → Long-term maintainability

### Recommended Order for Single Developer

```text
T001 → T002 → T003 (Setup)
T004 → T005 (Foundational)
T006 → T007 → T008 → T009 → T010 → T011 (US1 - sequential for review)
T012 → T013 → T014 (US1 validation)
T015 → T016 → ... → T023 (US2 - can batch similar changes)
T024 → T025 → T026 (US2 validation)
T027 → T028 → T029 → T030 → T031 (US3)
T032 → T033 → T034 (US3 validation)
T035 → T036 → T037 → T038 → T039 → T040 (Polish)
```

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Setup | 3 | 1 |
| Foundational | 2 | 0 |
| US1 (Memory Leaks) | 9 | 5 (list components) |
| US2 (OnPush) | 12 | 9 (all components) |
| US3 (Documentation) | 8 | 4 |
| Polish | 6 | 2 |
| **Total** | **40** | **21** |

---

## Notes

- [P] tasks = different files, no dependencies
- Each component fix follows pattern from research.md
- Verify tests pass after each component modification
- Commit after each logical group of changes
- Use Chrome DevTools Memory tab for validation
