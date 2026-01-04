# Tasks: Migration Angular Material vers Tailwind CSS

**Input**: Design documents from `/specs/020-tailwind-migration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested - no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app frontend**: `frontend/src/`
- **Shared components**: `frontend/src/app/shared/components/`
- **Core components**: `frontend/src/app/core/components/`
- **Feature pages**: `frontend/src/app/features/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install and configure Tailwind CSS

- [x] T001 Install Tailwind CSS and plugins: `npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography`
- [x] T002 Install Flatpickr for datepicker: `npm install flatpickr`
- [x] T003 Create Tailwind configuration in `frontend/tailwind.config.js` per contracts/tailwind-config.md
- [x] T004 Create PostCSS configuration in `frontend/postcss.config.js`
- [x] T005 Update `frontend/src/styles.scss` with Tailwind directives and base component classes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and shared component structure

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create shared components directory structure in `frontend/src/app/shared/components/`
- [x] T007 [P] Create component barrel export in `frontend/src/app/shared/components/index.ts`
- [x] T008 [P] Create shared types file in `frontend/src/app/shared/components/types.ts` with SelectOption, TableColumn, etc.

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 4 - Boutons et actions (Priority: P2) 🎯 MVP-Foundation

**Goal**: Create reusable Button component with all variants (primary, secondary, danger, ghost)

**Independent Test**: Visit any form page and verify buttons display correctly with hover/focus states

**Why first**: Buttons are used by ALL other user stories - creating them first enables parallel work

### Implementation for User Story 4

- [x] T009 [US4] Create Button component TypeScript in `frontend/src/app/shared/components/button/button.component.ts`
- [x] T010 [US4] Create Button component template in `frontend/src/app/shared/components/button/button.component.html`
- [x] T011 [US4] Create Button component styles in `frontend/src/app/shared/components/button/button.component.scss`
- [x] T012 [US4] Export Button component from `frontend/src/app/shared/components/index.ts`

**Checkpoint**: Button component ready for use in other stories

---

## Phase 4: User Story 1 - Formulaires avec inputs personnalisés (Priority: P1) 🎯 MVP

**Goal**: Create form components (Input, Select, Datepicker) and migrate Login + History pages

**Independent Test**: Visit Login page and History page, verify inputs have clean borders without artifacts

### Implementation for User Story 1

- [x] T013 [P] [US1] Create Input component TypeScript in `frontend/src/app/shared/components/input/input.component.ts`
- [x] T014 [P] [US1] Create Input component template in `frontend/src/app/shared/components/input/input.component.html`
- [x] T015 [P] [US1] Create Input component styles in `frontend/src/app/shared/components/input/input.component.scss`
- [x] T016 [P] [US1] Create Select component TypeScript in `frontend/src/app/shared/components/select/select.component.ts`
- [x] T017 [P] [US1] Create Select component template in `frontend/src/app/shared/components/select/select.component.html`
- [x] T018 [P] [US1] Create Select component styles in `frontend/src/app/shared/components/select/select.component.scss`
- [x] T019 [US1] Create Datepicker component TypeScript with Flatpickr wrapper in `frontend/src/app/shared/components/datepicker/datepicker.component.ts`
- [x] T020 [US1] Create Datepicker component template in `frontend/src/app/shared/components/datepicker/datepicker.component.html`
- [x] T021 [US1] Create Datepicker component styles (Flatpickr theme) in `frontend/src/app/shared/components/datepicker/datepicker.component.scss`
- [x] T022 [US1] Export Input, Select, Datepicker from `frontend/src/app/shared/components/index.ts`
- [x] T023 [US1] Migrate Login page to use new Input and Button components in `frontend/src/app/features/auth/login/login.component.ts`
- [x] T024 [US1] Update Login page template in `frontend/src/app/features/auth/login/login.component.html`
- [x] T025 [US1] Migrate History page to use new Input, Select, Datepicker in `frontend/src/app/features/history/history.component.ts`
- [x] T026 [US1] Update History page template in `frontend/src/app/features/history/history.component.html`

**Checkpoint**: Login and History pages fully migrated with Tailwind form components

---

## Phase 5: User Story 2 - Navigation et layout responsive (Priority: P1)

**Goal**: Migrate Sidenav and Header to Tailwind with responsive behavior

**Independent Test**: Resize browser from desktop to mobile, verify sidenav collapses correctly

### Implementation for User Story 2

- [x] T027 [US2] Update Sidenav component with Tailwind in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [x] T028 [US2] Create responsive Sidenav template in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [x] T029 [US2] Create Sidenav Tailwind styles in `frontend/src/app/core/components/sidenav/sidenav.component.scss`
- [x] T030 [US2] Update Header component with Tailwind in `frontend/src/app/core/components/header/header.component.ts`
- [x] T031 [US2] Update Header template in `frontend/src/app/core/components/header/header.component.html`
- [x] T032 [US2] Update Header styles in `frontend/src/app/core/components/header/header.component.scss`
- [x] T033 [US2] Update AppComponent layout for Tailwind sidenav integration in `frontend/src/app/app.component.ts`
- [x] T034 [US2] Update AppComponent template in `frontend/src/app/app.component.html`

**Checkpoint**: Navigation fully responsive with Tailwind, Material sidenav removed

---

## Phase 6: User Story 5 - Cartes et conteneurs (Priority: P2)

**Goal**: Create Card component and migrate dashboard/detail pages

**Independent Test**: Visit dashboard and trip detail pages, verify cards display with shadows and hover effects

### Implementation for User Story 5

- [x] T035 [P] [US5] Create Card component TypeScript in `frontend/src/app/shared/components/card/card.component.ts`
- [x] T036 [P] [US5] Create Card component template in `frontend/src/app/shared/components/card/card.component.html`
- [x] T037 [P] [US5] Create Card component styles in `frontend/src/app/shared/components/card/card.component.scss`
- [x] T038 [US5] Export Card from `frontend/src/app/shared/components/index.ts`
- [x] T039 [US5] Migrate Map page cards in `frontend/src/app/features/map/map.component.html`
- [x] T040 [US5] Migrate Analytics KPI cards in `frontend/src/app/features/analytics/analytics.component.html`
- [x] T041 [US5] Migrate Trip detail cards in `frontend/src/app/admin/trips/trip-detail/trip-detail.component.html`

**Checkpoint**: All card-based layouts migrated to Tailwind

---

## Phase 7: User Story 3 - Tableaux de données et listes (Priority: P2)

**Goal**: Create Table and Pagination components, migrate admin list pages

**Independent Test**: Visit truck list page, verify table sorting and pagination work

### Implementation for User Story 3

- [x] T042 [P] [US3] Create Table component TypeScript in `frontend/src/app/shared/components/table/table.component.ts` (existing DataTableComponent in admin/shared/)
- [x] T043 [P] [US3] Create Table component template in `frontend/src/app/shared/components/table/table.component.html` (existing DataTableComponent)
- [x] T044 [P] [US3] Create Table component styles in `frontend/src/app/shared/components/table/table.component.scss` (existing DataTableComponent with Tailwind)
- [x] T045 [P] [US3] Create Pagination component TypeScript in `frontend/src/app/shared/components/pagination/pagination.component.ts` (built into DataTableComponent)
- [x] T046 [P] [US3] Create Pagination component template in `frontend/src/app/shared/components/pagination/pagination.component.html` (built into DataTableComponent)
- [x] T047 [P] [US3] Create Pagination component styles in `frontend/src/app/shared/components/pagination/pagination.component.scss` (built into DataTableComponent)
- [x] T048 [US3] Export Table, Pagination from `frontend/src/app/shared/components/index.ts` (DataTableComponent already exported)
- [x] T049 [US3] Migrate Truck list page in `frontend/src/app/admin/trucks/truck-list/truck-list.component.ts` (already uses DataTableComponent)
- [x] T050 [US3] Update Truck list template in `frontend/src/app/admin/trucks/truck-list/truck-list.component.html` (already Tailwind)
- [x] T051 [US3] Migrate User list page in `frontend/src/app/admin/users/user-list/user-list.component.ts` (already uses DataTableComponent)
- [x] T052 [US3] Update User list template in `frontend/src/app/admin/users/user-list/user-list.component.html` (already Tailwind)
- [x] T053 [US3] Migrate Trip list page in `frontend/src/app/admin/trips/trip-list/trip-list.component.ts` (already uses DataTableComponent)
- [x] T054 [US3] Update Trip list template in `frontend/src/app/admin/trips/trip-list/trip-list.component.html` (already Tailwind)

**Checkpoint**: All admin list pages using Tailwind Table component

---

## Phase 8: User Story 6 - Dialogues et modales (Priority: P3)

**Goal**: Create Dialog component using CDK Overlay, migrate confirmation dialogs

**Independent Test**: Click delete button on any item, verify dialog opens with overlay and closes correctly

### Implementation for User Story 6

- [x] T055 [US6] Create DialogService using CDK Overlay in `frontend/src/app/shared/components/dialog/dialog.service.ts` (existing ConfirmDialogService)
- [x] T056 [US6] Create DialogRef class in `frontend/src/app/shared/components/dialog/dialog-ref.ts` (built into ConfirmDialogService)
- [x] T057 [US6] Create Dialog container component in `frontend/src/app/shared/components/dialog/dialog.component.ts` (ConfirmDialogOverlayComponent)
- [x] T058 [US6] Create Dialog template in `frontend/src/app/shared/components/dialog/dialog.component.html` (already Tailwind)
- [x] T059 [US6] Create Dialog styles in `frontend/src/app/shared/components/dialog/dialog.component.scss` (already Tailwind)
- [x] T060 [US6] Create ConfirmDialog component in `frontend/src/app/shared/components/dialog/confirm-dialog.component.ts` (existing)
- [x] T061 [US6] Create ConfirmDialog template in `frontend/src/app/shared/components/dialog/confirm-dialog.component.html` (already Tailwind)
- [x] T062 [US6] Export Dialog components and service from `frontend/src/app/shared/components/index.ts` (exported from admin/shared/)
- [x] T063 [US6] Replace MatDialog usage in ConfirmDialogComponent at `frontend/src/app/admin/shared/confirm-dialog/confirm-dialog.component.ts` (uses CDK Overlay)
- [x] T064 [US6] Update all dialog invocations in admin components (already using ConfirmDialogService)

**Checkpoint**: All dialogs using Tailwind-styled CDK Overlay implementation

---

## Phase 9: User Story 7 - Notifications et feedback (Priority: P3)

**Goal**: Create Toast component, replace MatSnackBar usages

**Independent Test**: Perform a save action, verify toast appears and auto-dismisses

### Implementation for User Story 7

- [x] T065 [US7] Create ToastService in `frontend/src/app/shared/components/toast/toast.service.ts` (already exists with Tailwind)
- [x] T066 [US7] Create Toast component TypeScript in `frontend/src/app/shared/components/toast/toast.component.ts` (inline in ToastContainerComponent)
- [x] T067 [US7] Create Toast template in `frontend/src/app/shared/components/toast/toast.component.html` (inline with Tailwind)
- [x] T068 [US7] Create Toast styles with animations in `frontend/src/app/shared/components/toast/toast.component.scss` (Tailwind transitions)
- [x] T069 [US7] Create ToastContainer component in `frontend/src/app/shared/components/toast/toast-container.component.ts` (already exists with Tailwind)
- [x] T070 [US7] Export Toast components and service from `frontend/src/app/shared/components/index.ts` (already exported)
- [x] T071 [US7] Replace MatSnackBar with ToastService in `frontend/src/app/app.component.ts` (already using ToastService)
- [x] T072 [US7] Update all MatSnackBar usages in admin components to use ToastService (all use ToastService)

**Checkpoint**: All notifications using Tailwind Toast component

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, optimization, and final validation

- [x] T073 Remove unused Angular Material imports from all migrated components (verified: no @angular/material imports in source)
- [x] T074 Remove Angular Material package: update `frontend/package.json` to remove `@angular/material` (keep `@angular/cdk`) - already removed, only @angular/cdk remains
- [x] T075 [P] Clean up old Material theme imports from `frontend/src/styles.scss` (verified: styles.scss is clean Tailwind)
- [x] T076 [P] Verify all Material Icons still work (independent of Material UI) - verified: fonts.googleapis.com/icon?family=Material+Icons in index.html
- [x] T077 Run production build and measure bundle size reduction - build success: main=72K, total=2.7MB
- [x] T078 Run unit tests to verify migration - 131 tests pass ✅
- [x] T079 [P] Component documentation exists in shared/components/ (Button, Card, Input, Select, Toast, etc.)
- [x] T080 Final visual regression check on all pages (Card spacing fix with host: { class: 'block' })

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 4 (Phase 3)**: FIRST story - Button component used by all others
- **User Stories 1,2,5,3 (Phases 4-7)**: Depend on Foundational + US4 (Button)
  - US1 and US2 are both P1 and can run in parallel
  - US5 and US3 are P2 and can run in parallel after P1 stories
- **User Stories 6,7 (Phases 8-9)**: P3 priority, can run in parallel
- **Polish (Phase 10)**: Depends on ALL user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Components Created |
|-------|----------|------------|-------------------|
| US4 | P2 | Foundational | Button |
| US1 | P1 | US4 | Input, Select, Datepicker |
| US2 | P1 | US4 | Sidenav, Header |
| US5 | P2 | US4 | Card |
| US3 | P2 | US4 | Table, Pagination |
| US6 | P3 | US4, US5 | Dialog, ConfirmDialog |
| US7 | P3 | US4 | Toast |

### Parallel Opportunities

**Within Setup (Phase 1)**: T003, T004, T005 after T001, T002

**Within Foundational (Phase 2)**: T007, T008 can run in parallel

**Within User Story 1 (Phase 4)**:
- T013, T014, T015 (Input) parallel with T016, T017, T018 (Select)
- T023, T024 (Login) parallel with T025, T026 (History) after components ready

**Within User Story 3 (Phase 7)**:
- T042-T044 (Table) parallel with T045-T047 (Pagination)
- T049-T050, T051-T052, T053-T054 can run in parallel after components ready

**Across User Stories**:
- US1 and US2 can run in parallel (both P1)
- US5 and US3 can run in parallel (both P2)
- US6 and US7 can run in parallel (both P3)

---

## Parallel Example: User Story 1

```bash
# Launch all component creations together:
Task: "Create Input component TypeScript in frontend/src/app/shared/components/input/input.component.ts"
Task: "Create Input component template in frontend/src/app/shared/components/input/input.component.html"
Task: "Create Select component TypeScript in frontend/src/app/shared/components/select/select.component.ts"
Task: "Create Select component template in frontend/src/app/shared/components/select/select.component.html"

# After components ready, migrate pages in parallel:
Task: "Migrate Login page to use new components"
Task: "Migrate History page to use new components"
```

---

## Implementation Strategy

### MVP First (Button + Forms)

1. Complete Phase 1: Setup (Tailwind install)
2. Complete Phase 2: Foundational (structure)
3. Complete Phase 3: User Story 4 (Button) - enables all other stories
4. Complete Phase 4: User Story 1 (Forms)
5. **STOP and VALIDATE**: Test Login and History pages
6. Deploy/demo if ready - forms are the main pain point to solve

### Incremental Delivery

1. Setup + Foundational + US4 (Button) → Foundation ready
2. Add US1 (Forms) → Test → **MVP deployed** (fixes input artifacts)
3. Add US2 (Navigation) → Test → Navigation migrated
4. Add US5 (Cards) + US3 (Tables) → Test → Admin pages migrated
5. Add US6 (Dialogs) + US7 (Toasts) → Test → Full migration
6. Polish phase → Remove Material → **Final deployment**

### Suggested MVP Scope

**Minimal MVP**: Phases 1-4 (Setup + Foundational + Button + Forms)
- Fixes the immediate pain point (input artifacts)
- Login and History pages fully migrated
- ~26 tasks

---

## Summary

| Phase | User Story | Tasks | Parallel Tasks |
|-------|------------|-------|----------------|
| 1 | Setup | 5 | 3 |
| 2 | Foundational | 3 | 2 |
| 3 | US4 - Buttons | 4 | 0 |
| 4 | US1 - Forms (P1) | 14 | 6 |
| 5 | US2 - Navigation (P1) | 8 | 0 |
| 6 | US5 - Cards (P2) | 7 | 3 |
| 7 | US3 - Tables (P2) | 13 | 6 |
| 8 | US6 - Dialogs (P3) | 10 | 0 |
| 9 | US7 - Toasts (P3) | 8 | 0 |
| 10 | Polish | 8 | 3 |
| **Total** | | **80** | **23** |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Material and Tailwind coexist during migration - no big-bang removal
