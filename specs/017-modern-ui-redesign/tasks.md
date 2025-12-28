# Tasks: Modern UI Redesign

**Input**: Design documents from `/specs/017-modern-ui-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `frontend/` directory.

---

## Phase 1: Setup (Design Token Foundation)

**Purpose**: Create the design token foundation that all visual changes depend on

- [x] T001 Backup current theme file by creating `frontend/src/styles/_theme.backup.scss`
- [x] T002 Update color palette in `frontend/src/styles/_theme.scss` - Replace purple (#667eea) with blue (#1976D2) palette
- [x] T003 [P] Update typography tokens in `frontend/src/styles/_theme.scss` - Apply new type scale from data-model.md
- [x] T004 [P] Update spacing tokens in `frontend/src/styles/_theme.scss` - Verify 4px base unit consistency
- [x] T005 [P] Update shadow tokens in `frontend/src/styles/_theme.scss` - Apply flat design shadows (sm/md/lg only)
- [x] T006 [P] Update border and radius tokens in `frontend/src/styles/_theme.scss` - 6px for inputs/buttons, 8px for cards
- [x] T007 [P] Update transition tokens in `frontend/src/styles/_theme.scss` - 150ms ease-out as default
- [x] T008 Export all tokens as CSS custom properties in `frontend/src/styles/_theme.scss`

---

## Phase 2: Foundational (Global Theme & Material Overrides)

**Purpose**: Core theme infrastructure that MUST be complete before component updates

**⚠️ CRITICAL**: No component styling can begin until this phase is complete

- [x] T009 Update Angular Material theme palette in `frontend/src/styles.scss` - Define new blue primary palette
- [x] T010 Update Material button overrides in `frontend/src/styles.scss` - Flat design (no elevation, 6px radius)
- [x] T011 [P] Update Material card overrides in `frontend/src/styles.scss` - 1px border, shadow-sm, 8px radius
- [x] T012 [P] Update Material form-field overrides in `frontend/src/styles.scss` - New input styling per contracts/components.md
- [x] T013 [P] Update Material table overrides in `frontend/src/styles.scss` - Header styling, row hover
- [x] T014 [P] Update Material snackbar overrides in `frontend/src/styles.scss` - Severity classes with new colors
- [x] T015 [P] Update Material dialog overrides in `frontend/src/styles.scss` - 12px radius, flat shadow
- [x] T016 Add global utility classes in `frontend/src/styles.scss` - .badge variants, .empty-state, .spinner
- [x] T017 Verify WCAG 2.1 AA color contrast compliance - Run contrast checker on all text/background combinations
- [x] T018 Build and verify no SCSS compilation errors - Run `npm run build`

**Checkpoint**: Global theme ready - component updates can now begin

---

## Phase 3: User Story 1 & 2 - Visual Hierarchy and Consistency (Priority: P1) 🎯 MVP

**Goal**: Establish clear visual hierarchy on dashboards and tables, ensure consistency across all sections

**US1 - Independent Test**: Primary KPIs and critical alerts distinguishable within 3 seconds, data tables scannable

**US2 - Independent Test**: Navigate between sections and verify consistent colors, typography, buttons, spacing

### Layout Components (Header & Navigation)

- [x] T019 [US2] Update header styles in `frontend/src/app/core/components/header/header.component.scss` - Apply new theme
- [x] T020 [US2] Update sidenav styles in `frontend/src/app/core/components/sidenav/sidenav.component.scss` - Apply new nav-item styling
- [x] T021 [US2] Update search-bar styles in `frontend/src/app/core/components/search-bar/search-bar.component.scss`

### Dashboard & Analytics (Primary Hierarchy)

- [x] T022 [US1] Update analytics page in `frontend/src/app/features/analytics/analytics.component.scss` - KPI card hierarchy
- [x] T023 [P] [US1] Update dashboard stats styles in `frontend/src/app/admin/dashboard/stats-dashboard.component.scss`
- [x] T024 [P] [US1] Update chart container styles - Consistent card styling across all chart components

### Data Tables (Readability)

- [x] T025 [US1] Update data-table styles in `frontend/src/app/admin/shared/data-table/data-table.component.scss` - Header emphasis, row hover
- [x] T026 [P] [US1] Update trip-list table in `frontend/src/app/admin/trips/trip-list/trip-list.component.scss`
- [x] T027 [P] [US1] Update truck-list table in `frontend/src/app/admin/trucks/truck-list/truck-list.component.scss`
- [x] T028 [P] [US1] Update user-list table in `frontend/src/app/admin/users/user-list/user-list.component.scss`

### Button Hierarchy (Action Visibility)

- [x] T029 [US1] Verify primary/secondary/tertiary button distinction across all components
- [x] T030 [US2] Audit and fix any inconsistent button styles in feature components

### Cards and Panels (Consistency)

- [x] T031 [P] [US2] Update trip-detail card styles in `frontend/src/app/admin/trips/trip-detail/trip-detail.component.scss`
- [x] T032 [P] [US2] Update trip-stats card styles in `frontend/src/app/admin/trips/trip-stats/trip-stats.component.scss`
- [x] T033 [P] [US2] Update truck-form card styles in `frontend/src/app/admin/trucks/truck-form/truck-form.component.scss`
- [x] T034 [P] [US2] Update user-form card styles in `frontend/src/app/admin/users/user-form/user-form.component.scss`
- [x] T035 [P] [US2] Update group management cards in `frontend/src/app/admin/groups/`

**Checkpoint**: Visual hierarchy established, consistency across navigation and data views

---

## Phase 4: User Story 3 - Enhanced Form Experience (Priority: P2)

**Goal**: Clear input fields with proper spacing, readable labels, visible feedback states

**Independent Test**: Complete a form workflow and verify focus, error, and success states are visible and helpful

### Form Input Styling

- [x] T036 [US3] Update form input base styles in global theme - Focus ring, error/success borders
- [x] T037 [P] [US3] Update truck-form inputs in `frontend/src/app/admin/trucks/truck-form/truck-form.component.scss`
- [x] T038 [P] [US3] Update user-form inputs in `frontend/src/app/admin/users/user-form/user-form.component.scss`
- [x] T039 [P] [US3] Update trip-form inputs in `frontend/src/app/admin/trips/` (if applicable)
- [x] T040 [P] [US3] Update group-form inputs in `frontend/src/app/admin/groups/group-form/group-form.component.scss`

### Form Labels and Hints

- [x] T041 [US3] Ensure all form labels use consistent typography (14px, 500 weight, gray-700)
- [x] T042 [US3] Add/update error message styling - 12px, danger-500, 4px margin-top

### Form Layout Spacing

- [x] T043 [US3] Verify 16px vertical gap between form fields across all forms
- [x] T044 [US3] Verify 6px label-to-input spacing across all forms

### Login and Settings Forms

- [x] T045 [P] [US3] Update login form in `frontend/src/app/features/auth/login/login.component.scss`
- [x] T046 [P] [US3] Update profile form in `frontend/src/app/features/profile/profile.component.scss`
- [x] T047 [P] [US3] Update settings forms in `frontend/src/app/features/settings/settings.component.scss`

**Checkpoint**: All forms have consistent, accessible input styling

---

## Phase 5: User Story 4 - Modern Typography and Spacing (Priority: P2)

**Goal**: Comfortable typography with appropriate line heights, font sizes, and spacing

**Independent Test**: Scan data tables and mixed content pages - text should not feel cramped, hierarchy should be clear

### Typography Application

- [x] T048 [US4] Apply heading styles (H1-H4) consistently across all page titles in admin and features
- [x] T049 [P] [US4] Update body text line-height to 1.5 in content-heavy components
- [x] T050 [P] [US4] Update table cell line-height and row spacing in data-table component

### Component Spacing Refinement

- [x] T051 [US4] Audit card padding - ensure 16px consistent padding in all card components
- [x] T052 [P] [US4] Audit modal padding - ensure 24px consistent padding in dialog components
- [x] T053 [P] [US4] Audit section spacing - ensure 32px between major sections

### Page-Level Spacing

- [x] T054 [US4] Update analytics page spacing in `frontend/src/app/features/analytics/analytics.component.scss`
- [x] T055 [P] [US4] Update map page spacing in `frontend/src/app/features/map/map.component.scss`
- [x] T056 [P] [US4] Update alerts page spacing in `frontend/src/app/features/alerts/alerts.component.scss`
- [x] T057 [P] [US4] Update history page spacing in `frontend/src/app/features/history/history.component.scss`

### Responsive Typography

- [x] T058 [US4] Verify text remains readable on tablet breakpoints (768px-1024px)
- [x] T059 [US4] Verify no horizontal scrolling or text truncation issues on smaller screens

**Checkpoint**: Typography and spacing provide comfortable, readable experience

---

## Phase 6: User Story 5 - Subtle Micro-interactions (Priority: P3)

**Goal**: Subtle visual feedback for user actions without being distracting

**Independent Test**: Hover over elements, click buttons, submit forms - feedback should be present but not flashy

### Hover States

- [x] T060 [US5] Verify all buttons have 150ms ease-out hover transition
- [x] T061 [P] [US5] Verify all navigation items have smooth hover background transition
- [x] T062 [P] [US5] Verify table row hover is subtle (gray-50 background, 100ms)
- [x] T063 [P] [US5] Verify card hover (interactive cards) has subtle shadow lift

### Focus States

- [x] T064 [US5] Verify focus-visible outlines (2px primary-500) on all interactive elements
- [x] T065 [US5] Verify focus transitions smoothly between form fields

### Loading States

- [x] T066 [US5] Update spinner animation in global styles (0.8s linear spin)
- [x] T067 [P] [US5] Add skeleton loading styles for content placeholders
- [x] T068 [P] [US5] Verify button loading state (btn-loading class) works correctly

### Confirmation Feedback

- [x] T069 [US5] Verify snackbar/toast notifications appear with subtle entrance animation
- [x] T070 [US5] Verify success messages draw attention without being flashy (< 300ms animation)

**Checkpoint**: All micro-interactions are present, subtle, and complete within 300ms

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

### Accessibility Validation

- [x] T071 Run WCAG 2.1 AA contrast check on all pages - Document any failures
- [x] T072 [P] Verify focus indicators visible on all interactive elements
- [x] T073 [P] Test keyboard navigation through major workflows

### Performance Validation

- [x] T074 Measure Cumulative Layout Shift (CLS) - Target < 0.1
- [x] T075 [P] Verify animation durations are within 300ms limit
- [x] T076 [P] Measure Largest Contentful Paint (LCP) - Target < 2.5s

### Visual Consistency Audit

- [x] T077 Navigate all major pages and verify consistent styling - Document any inconsistencies
- [x] T078 Compare analytics, map, admin sections - Ensure unified look

### Cleanup

- [x] T079 Remove backup file `frontend/src/styles/_theme.backup.scss` (after confirming all works)
- [x] T080 Remove any deprecated/unused style classes
- [x] T081 Run `npm run build` and verify production build succeeds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T008) - BLOCKS all component updates
- **US1/US2 (Phase 3)**: Depends on Foundational - Can start once T018 complete
- **US3 (Phase 4)**: Depends on Foundational - Can run parallel with Phase 3
- **US4 (Phase 5)**: Depends on Foundational - Can run parallel with Phase 3/4
- **US5 (Phase 6)**: Depends on Foundational - Can run parallel or after Phase 3-5
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 + US2 (P1)**: Grouped as MVP - Can start after Foundational complete
- **US3 (P2)**: Independent - Can run in parallel with US1/US2 if needed
- **US4 (P2)**: Independent - Can run in parallel with US1/US2/US3
- **US5 (P3)**: Independent - Micro-interactions can be added to completed components

### Parallel Opportunities

```text
Phase 1 (Setup):
  T003 + T004 + T005 + T006 + T007 can run in parallel

Phase 2 (Foundational):
  T011 + T012 + T013 + T014 + T015 can run in parallel

Phase 3 (US1/US2):
  T023 + T024 can run in parallel (dashboard stats)
  T026 + T027 + T028 can run in parallel (tables)
  T031 + T032 + T033 + T034 + T035 can run in parallel (cards)

Phase 4 (US3):
  T037 + T038 + T039 + T040 can run in parallel (form inputs)
  T045 + T046 + T047 can run in parallel (auth/settings forms)

Phase 5 (US4):
  T049 + T050 can run in parallel (line-height)
  T052 + T053 can run in parallel (spacing audits)
  T054 + T055 + T056 + T057 can run in parallel (page spacing)

Phase 6 (US5):
  T061 + T062 + T063 can run in parallel (hover states)
  T067 + T068 can run in parallel (loading states)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (design tokens)
2. Complete Phase 2: Foundational (global theme)
3. Complete Phase 3: US1/US2 (visual hierarchy & consistency)
4. **STOP and VALIDATE**: Test navigation, dashboards, tables
5. Deploy/demo if acceptable

### Incremental Delivery

1. Setup + Foundational → Core theme ready
2. Add US1/US2 → Visual hierarchy MVP → Test → Deploy
3. Add US3 → Forms enhanced → Test → Deploy
4. Add US4 → Typography polished → Test → Deploy
5. Add US5 → Micro-interactions added → Test → Deploy
6. Polish → Final validation → Production release

---

## Task Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 8 | 5 |
| Phase 2: Foundational | 10 | 6 |
| Phase 3: US1/US2 (P1) | 17 | 12 |
| Phase 4: US3 (P2) | 12 | 7 |
| Phase 5: US4 (P2) | 12 | 8 |
| Phase 6: US5 (P3) | 11 | 7 |
| Phase 7: Polish | 11 | 5 |
| **Total** | **81** | **50** |

---

## Notes

- No backend changes required - frontend styling only
- All changes use existing SCSS structure - no new file creation needed (except backup)
- Material components are overridden globally - component-level changes are refinements
- WCAG 2.1 AA compliance is mandatory - accessibility failures must be fixed
- Performance targets: CLS < 0.1, LCP < 2.5s, animations < 300ms
