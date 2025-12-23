# Tasks: Fix Inline Components Across Codebase

**Input**: Design documents from `/specs/007-inline-components-fix/`
**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Tasks are grouped by module for logical grouping. All component refactoring tasks are parallelizable since each affects different files.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Admin Shared Components (4 components)

**Purpose**: Refactor shared admin UI components used across the admin module

- [ ] T001 [P] Refactor confirm-dialog to external files: extract template to `frontend/src/app/admin/shared/confirm-dialog/confirm-dialog.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T002 [P] Refactor audit-log to external files: extract template to `frontend/src/app/admin/shared/audit-log/audit-log.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T003 [P] Refactor breadcrumb to external files: extract template to `frontend/src/app/admin/shared/breadcrumb/breadcrumb.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T004 [P] Refactor data-table to external files: extract template to `frontend/src/app/admin/shared/data-table/data-table.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls

**Checkpoint**: All admin shared components use external files

---

## Phase 2: Admin Dashboard & Config (2 components)

**Purpose**: Refactor admin dashboard and configuration page components

- [ ] T005 [P] Refactor stats-dashboard to external files: extract template to `frontend/src/app/admin/dashboard/stats-dashboard.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T006 [P] Refactor config-page to external files: extract template to `frontend/src/app/admin/config/config-page.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls

**Checkpoint**: Admin dashboard and config use external files

---

## Phase 3: Admin Users Module (2 components)

**Purpose**: Refactor user management components

- [ ] T007 [P] Refactor user-list to external files: extract template to `frontend/src/app/admin/users/user-list/user-list.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T008 [P] Refactor user-form to external files: extract template to `frontend/src/app/admin/users/user-form/user-form.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls

**Checkpoint**: User management components use external files

---

## Phase 4: Admin Trucks Module (2 components)

**Purpose**: Refactor truck management components

- [ ] T009 [P] Refactor truck-list to external files: extract template to `frontend/src/app/admin/trucks/truck-list/truck-list.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T010 [P] Refactor truck-form to external files: extract template to `frontend/src/app/admin/trucks/truck-form/truck-form.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls

**Checkpoint**: Truck management components use external files

---

## Phase 5: Admin Groups Module (2 components)

**Purpose**: Refactor group management components

- [ ] T011 [P] Refactor group-list to external files: extract template to `frontend/src/app/admin/groups/group-list/group-list.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T012 [P] Refactor group-form to external files: extract template to `frontend/src/app/admin/groups/group-form/group-form.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls

**Checkpoint**: Group management components use external files

---

## Phase 6: Features Module (2 components)

**Purpose**: Refactor feature module components (error pages)

- [ ] T013 [P] Refactor not-found to external files: extract template to `frontend/src/app/features/not-found/not-found.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls
- [ ] T014 [P] Refactor unauthorized to external files: extract template to `frontend/src/app/features/auth/unauthorized/unauthorized.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls

**Checkpoint**: Feature module error pages use external files

---

## Phase 7: Examples (1 component)

**Purpose**: Refactor example/demo components

- [ ] T015 [P] Refactor truck-list-modern to external files: extract template to `frontend/src/app/examples/truck-list-modern.component.html`, styles to `.scss`, update `.ts` to use templateUrl/styleUrls

**Checkpoint**: Example component uses external files

---

## Phase 8: Validation & Cleanup

**Purpose**: Verify all refactoring is complete and functional

- [ ] T016 Run build verification: execute `npm run build` in frontend directory and ensure no template-related errors
- [ ] T017 Verify zero inline templates remain: run `grep -r "template:" --include="*.component.ts" frontend/src/` and confirm 0 results
- [ ] T018 Verify zero inline styles remain: run `grep -r "styles:" --include="*.component.ts" frontend/src/` and confirm 0 results

**Checkpoint**: All components use external files, build passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phases 1-7**: No dependencies between phases - all can run in parallel
- **Phase 8**: Depends on ALL previous phases being complete

### Within Each Phase

- All tasks marked [P] can run in parallel (different component files)

### Parallel Opportunities

Since each component is in its own directory with its own files, **ALL 15 refactoring tasks (T001-T015) can run in parallel**.

```bash
# Maximum parallelism - launch all component refactoring together:
T001, T002, T003, T004  # Admin shared
T005, T006              # Dashboard & config
T007, T008              # Users
T009, T010              # Trucks
T011, T012              # Groups
T013, T014              # Features
T015                    # Examples
```

---

## Implementation Strategy

### Quick Execution (Recommended)

Since this is purely mechanical refactoring with no dependencies:

1. Run all T001-T015 in parallel (or sequentially if single developer)
2. Run T016-T018 validation tasks
3. Done

### Per-Task Pattern

For each component (T001-T015), the refactoring follows this pattern:

1. Read the `.component.ts` file
2. Extract inline `template` content to new `.component.html` file
3. Extract inline `styles` array content to new `.component.scss` file (or create empty if none)
4. Update `.component.ts`:
   - Replace `template:` with `templateUrl: './component-name.component.html'`
   - Replace `styles:` with `styleUrls: ['./component-name.component.scss']`
5. Verify the component still builds

---

## Notes

- All [P] tasks can run in parallel - different files, no conflicts
- Each task creates 2 new files (.html, .scss) and modifies 1 file (.ts)
- No logic changes - purely structural refactoring
- Empty .scss files are acceptable if component had no inline styles
- Commit after each phase or after all refactoring complete
