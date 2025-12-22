# Tasks: Angular Modern Patterns Migration

**Input**: Design documents from `/specs/004-angular-signals-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are run after each module migration per clarification (FR-011). No new test tasks generated; existing tests validate the migration.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project preparation and verification

- [ ] T001 Verify Angular version is 17+ by checking `frontend/package.json`
- [ ] T002 [P] Create git branch `004-angular-signals-migration` if not already on it
- [ ] T003 [P] Run `npm install` in `frontend/` to ensure all dependencies are up to date

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Verify codebase readiness - MUST be complete before ANY user story migration

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Run `npm test` in `frontend/` to establish baseline - all tests must pass
- [ ] T005 Run `ng build` in `frontend/` to verify build succeeds before migration
- [ ] T006 Document current @Input/@Output usage by grepping `frontend/src/app/` for `@Input()` and `@Output()` decorators

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Migrate Component Inputs to Signal Inputs (Priority: P1) 🎯 MVP

**Goal**: Convert all `@Input()` decorators to `input()` function for signal-based reactivity

**Independent Test**: Run `npm test` after migration - all existing tests pass, component bindings work unchanged

### Implementation for User Story 1

**Module: Core (SidenavComponent)**

- [ ] T007 [US1] Update imports in `frontend/src/app/core/components/sidenav/sidenav.component.ts` - add `input` from `@angular/core`, remove `Input` if unused
- [ ] T008 [US1] Convert `@Input() navItems` to `navItems = input<NavItem[]>([])` in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T009 [US1] Convert `@Input() isOpen` to `isOpen = input<boolean>(false)` in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T010 [US1] Convert `@Input() miniMode` to `miniMode = input<boolean>(false)` in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T011 [US1] Update template references in `frontend/src/app/core/components/sidenav/sidenav.component.html` - change `miniMode` to `miniMode()`, `isOpen` to `isOpen()`
- [ ] T012 [US1] Update `getOperationsItems()` method to use `this.navItems()` in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T013 [US1] Update `onEscapeKey()` method to use `this.isOpen()` in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T014 [US1] Run `ng test --include="**/core/**"` to validate core module migration

**Module: Admin (DataTableComponent)**

- [ ] T015 [US1] Update imports in `frontend/src/app/admin/shared/data-table/data-table.component.ts` - add `input` from `@angular/core`
- [ ] T016 [US1] Convert all 16 `@Input()` decorators to `input()` functions in `frontend/src/app/admin/shared/data-table/data-table.component.ts` per data-model.md specification
- [ ] T017 [US1] Update all internal references to use signal accessor pattern (`this.property()`) in `frontend/src/app/admin/shared/data-table/data-table.component.ts`
- [ ] T018 [US1] Run `ng test --include="**/admin/**"` to validate admin module migration

**Module: Features (GeofencePanelComponent - if has @Input)**

- [ ] T019 [US1] Audit `frontend/src/app/features/map/geofence-panel/geofence-panel.component.ts` for any remaining `@Input()` decorators
- [ ] T020 [US1] Convert any found `@Input()` decorators to `input()` functions in `frontend/src/app/features/map/geofence-panel/geofence-panel.component.ts`
- [ ] T021 [US1] Run `ng test --include="**/features/**"` to validate features module migration

**Checkpoint**: At this point, User Story 1 should be fully functional - all @Input() converted to input()

---

## Phase 4: User Story 2 - Migrate Component Outputs to Output Function (Priority: P1)

**Goal**: Convert all `@Output()` with EventEmitter to `output()` function

**Independent Test**: Run `npm test` after migration - event emissions work unchanged, parent bindings function correctly

### Implementation for User Story 2

**Module: Core (SidenavComponent)**

- [ ] T022 [US2] Update imports in `frontend/src/app/core/components/sidenav/sidenav.component.ts` - add `output` from `@angular/core`, remove `Output`, `EventEmitter` if unused
- [ ] T023 [US2] Convert `@Output() closed = new EventEmitter<void>()` to `closed = output<void>()` in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T024 [US2] Convert `@Output() itemClicked = new EventEmitter<NavItem>()` to `itemClicked = output<NavItem>()` in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T025 [US2] Verify `.emit()` calls still work (no change needed) in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T026 [US2] Run `ng test --include="**/core/**"` to validate core module output migration

**Module: Admin (DataTableComponent)**

- [ ] T027 [US2] Update imports in `frontend/src/app/admin/shared/data-table/data-table.component.ts` - add `output`, remove `Output`, `EventEmitter` if unused
- [ ] T028 [US2] Convert all 6 `@Output()` with EventEmitter to `output()` functions in `frontend/src/app/admin/shared/data-table/data-table.component.ts` per data-model.md specification
- [ ] T029 [US2] Verify all `.emit()` calls still work (no change needed) in `frontend/src/app/admin/shared/data-table/data-table.component.ts`
- [ ] T030 [US2] Run `ng test --include="**/admin/**"` to validate admin module output migration

**Module: Features (GeofencePanelComponent - if has @Output)**

- [ ] T031 [US2] Audit `frontend/src/app/features/map/geofence-panel/geofence-panel.component.ts` for any remaining `@Output()` decorators
- [ ] T032 [US2] Convert any found `@Output()` decorators to `output()` functions in `frontend/src/app/features/map/geofence-panel/geofence-panel.component.ts`
- [ ] T033 [US2] Run `ng test --include="**/features/**"` to validate features module output migration

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - all inputs and outputs use signal-based APIs

---

## Phase 5: User Story 3 - Adopt Modern Control Flow Syntax (Priority: P2)

**Goal**: Convert all `*ngIf`, `*ngFor`, `*ngSwitch` to `@if`, `@for`, `@switch`

**Independent Test**: Run `npm test` after migration - templates render identical content with new syntax

### Implementation for User Story 3

**Module: Admin (DataTableComponent template)**

- [ ] T034 [US3] Convert all `*ngIf` directives to `@if` blocks in `frontend/src/app/admin/shared/data-table/data-table.component.html` (or inline template)
- [ ] T035 [US3] Convert all `*ngFor` directives to `@for` blocks with explicit `track` in `frontend/src/app/admin/shared/data-table/data-table.component.html`
- [ ] T036 [US3] Add `@empty` blocks where appropriate for empty list handling in `frontend/src/app/admin/shared/data-table/data-table.component.html`
- [ ] T037 [US3] Convert any `*ngSwitch` directives to `@switch` blocks in `frontend/src/app/admin/shared/data-table/data-table.component.html`
- [ ] T038 [US3] Run `ng test --include="**/admin/**"` to validate template migration

**Module: Features (any remaining legacy templates)**

- [ ] T039 [US3] Audit `frontend/src/app/features/` templates for any remaining `*ngIf`, `*ngFor`, `*ngSwitch`
- [ ] T040 [US3] Convert any found legacy directives to modern control flow in feature templates
- [ ] T041 [US3] Run `ng test --include="**/features/**"` to validate feature template migration

**Module: Core (any remaining legacy templates)**

- [ ] T042 [US3] Audit `frontend/src/app/core/` templates for any remaining `*ngIf`, `*ngFor`, `*ngSwitch`
- [ ] T043 [US3] Convert any found legacy directives to modern control flow in core templates
- [ ] T044 [US3] Run `ng test --include="**/core/**"` to validate core template migration

**Checkpoint**: At this point, User Story 3 should be complete - all templates use modern control flow

---

## Phase 6: User Story 4 - Convert Properties to Signals (Priority: P2)

**Goal**: Convert reactive properties (that trigger UI updates) to `signal()` and `computed()`

**Independent Test**: Verify UI updates correctly when signal values change

### Implementation for User Story 4

- [ ] T045 [US4] Audit `frontend/src/app/admin/shared/data-table/data-table.component.ts` for reactive properties that could use `signal()`
- [ ] T046 [US4] Convert internal state properties (selection, expanded rows, etc.) to signals if they trigger UI updates in `frontend/src/app/admin/shared/data-table/data-table.component.ts`
- [ ] T047 [US4] Audit `frontend/src/app/features/map/geofence-panel/geofence-panel.component.ts` for reactive properties
- [ ] T048 [US4] Convert any reactive properties to signals in `frontend/src/app/features/map/geofence-panel/geofence-panel.component.ts`
- [ ] T049 [US4] Run `npm test` to validate all signal property conversions

**Checkpoint**: At this point, User Story 4 should be complete - reactive properties use signals

---

## Phase 7: User Story 5 - NgRx Signal Store Integration (Priority: P3)

**Goal**: Document Signal Store pattern for future state management needs (no migration of existing StoreFacade)

**Independent Test**: Verify StoreFacade continues to work unchanged alongside any new Signal Store examples

### Implementation for User Story 5

- [ ] T050 [US5] Create documentation file `frontend/src/app/store/SIGNAL_STORE_GUIDE.md` with Signal Store usage patterns
- [ ] T051 [US5] Document coexistence strategy with existing StoreFacade in `frontend/src/app/store/SIGNAL_STORE_GUIDE.md`
- [ ] T052 [US5] Add example Signal Store skeleton for reference in documentation
- [ ] T053 [US5] Verify StoreFacade still works by running `ng test --include="**/store/**"`

**Checkpoint**: User Story 5 complete - Signal Store documented for future use, StoreFacade unchanged

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and validation across all migrated components

- [ ] T054 Remove unused imports (`Input`, `Output`, `EventEmitter`, `CommonModule` where applicable) from all migrated files
- [ ] T055 [P] Remove `CommonModule` from imports array in components that only use new control flow (verify no NgClass, NgStyle, pipes needed)
- [ ] T056 Run full test suite `npm test` in `frontend/` - all tests must pass
- [ ] T057 Run production build `ng build --configuration=production` - verify no build errors
- [ ] T058 Manual smoke test - verify application starts and functions correctly
- [ ] T059 Verify no console errors in browser developer tools
- [ ] T060 Run `npm run lint` to check for any linting issues introduced

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (different API areas)
  - US3 depends on US1 completion (templates use signal accessors)
  - US4 can run in parallel with US3
  - US5 can run independently (documentation only)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can run in parallel with US1
- **User Story 3 (P2)**: Best to start after US1 (templates need signal accessor syntax)
- **User Story 4 (P2)**: Can start after Foundational - Independent of US1-3
- **User Story 5 (P3)**: Can start anytime after Foundational - Documentation only

### Within Each User Story

- Module order: Core → Admin → Features (allows incremental validation)
- Test after each module to catch issues early
- Commit after each module completion

### Parallel Opportunities

- T002, T003 can run in parallel (Setup phase)
- T007-T014 (Core input migration) independent from T015-T018 (Admin input migration)
- T022-T026 (Core output migration) independent from T027-T030 (Admin output migration)
- US1 and US2 can be worked on in parallel by different developers
- US4 and US5 can run independently in parallel

---

## Parallel Example: User Story 1 (Core and Admin modules)

```bash
# Launch Core and Admin input migrations in parallel:
Task: "Convert @Input() decorators in frontend/src/app/core/components/sidenav/sidenav.component.ts"
Task: "Convert @Input() decorators in frontend/src/app/admin/shared/data-table/data-table.component.ts"

# Then validate each module:
Task: "Run ng test --include='**/core/**'"
Task: "Run ng test --include='**/admin/**'"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Signal Inputs)
4. Complete Phase 4: User Story 2 (Signal Outputs)
5. **STOP and VALIDATE**: Run full test suite, manual smoke test
6. Deploy/demo if ready - core modernization complete

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → MVP ready (inputs modernized)
3. Add User Story 2 → Test → Inputs + Outputs complete
4. Add User Story 3 → Test → Templates modernized
5. Add User Story 4 → Test → Full signal patterns
6. Add User Story 5 → Documentation complete

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Inputs)
   - Developer B: User Story 2 (Outputs)
3. After US1 + US2:
   - Developer A: User Story 3 (Templates)
   - Developer B: User Story 4 (Signal properties)
4. Either developer: User Story 5 (Documentation)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Run tests after each module (FR-011 requirement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- External libraries (Angular Material, Leaflet) are out of scope (FR-012)
