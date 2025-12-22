# Tasks: Navigation Menu Optimization - Ergonomic Hybrid Pattern

**Input**: Design documents from `/specs/003-nav-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Pattern**: Header compact + Mini-sidenav hybride

**Tests**: Not explicitly requested - included in Polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/app/` for Angular application
- **Core**: `frontend/src/app/core/` for shared services and components
- **Styles**: `frontend/src/styles/` for global SCSS

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared models

- [x] T001 [P] Verify UserRole enum has ADMIN, DRIVER in `frontend/src/app/core/models/auth.model.ts`
- [x] T002 [P] Verify NavItem interface exists in `frontend/src/app/core/models/navigation.model.ts`
- [ ] T003 [P] Add NavigationState interface to `frontend/src/app/core/models/navigation.model.ts`
- [ ] T004 [P] Add NavigationConfig interface and DEFAULT_NAV_CONFIG to `frontend/src/app/core/models/navigation.model.ts`
- [ ] T005 [P] Add HeaderIndicator interface to `frontend/src/app/core/models/navigation.model.ts`
- [ ] T006 Import BreakpointObserver from @angular/cdk/layout in `frontend/src/app/app.component.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services and layout structure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Verify NavigationService exists with role filtering in `frontend/src/app/core/services/navigation.service.ts`
- [ ] T008 Add BreakpointObserver logic to AppComponent for responsive detection in `frontend/src/app/app.component.ts`
- [ ] T009 Create navigation state signals (sidenavOpen, sidenavMode, miniMode, currentBreakpoint) in `frontend/src/app/app.component.ts`
- [ ] T010 Update app.component.html with mat-sidenav-container layout structure in `frontend/src/app/app.component.html`
- [ ] T011 Add skip link for accessibility in `frontend/src/app/app.component.html`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Navigation principale optimisée (Priority: P1) 🎯 MVP

**Goal**: Header compact avec logo + indicateurs + sidenav pour navigation

**Independent Test**: Le header affiche logo, badge alertes, menu user. Le hamburger ouvre la sidenav avec toutes les sections.

### Implementation for User Story 1

- [ ] T012 [US1] Refactor header to compact layout (logo + spacer + indicators + user menu) in `frontend/src/app/core/components/header/header.component.html`
- [ ] T013 [US1] Remove inline navigation links from header in `frontend/src/app/core/components/header/header.component.html`
- [ ] T014 [US1] Add hamburger button that emits toggleSidenavEvent in `frontend/src/app/core/components/header/header.component.ts`
- [ ] T015 [US1] Update header SCSS for compact layout (.header-container, .spacer, .indicators) in `frontend/src/app/core/components/header/header.component.scss`
- [ ] T016 [US1] Enhance sidenav to display navigation by category (operations, administration) in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [ ] T017 [US1] Add category labels and dividers to sidenav in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [ ] T018 [US1] Add active route highlighting with routerLinkActive in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [ ] T019 [US1] Style active state with left border indicator in `frontend/src/app/core/components/sidenav/sidenav.component.scss`

**Checkpoint**: Navigation displays correctly with header compact and sidenav

---

## Phase 4: User Story 2 - Menu adapté au rôle utilisateur (Priority: P1)

**Goal**: Sidenav affiche uniquement les items autorisés par rôle

**Independent Test**: Connectez-vous avec ADMIN, FLEET_MANAGER, DRIVER et vérifiez les items visibles

### Implementation for User Story 2

- [ ] T020 [US2] Add navItemsByCategory computed signal to sidenav in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T021 [US2] Inject NavigationService and StoreFacade into sidenav in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T022 [US2] Filter navigation items by current user role in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T023 [US2] Ensure Administration category only shows for ADMIN in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [ ] T024 [US2] Verify DRIVER sees only Carte and Profil in sidenav in `frontend/src/app/core/services/navigation.service.ts`

**Checkpoint**: Each role sees exactly the menu items they're authorized to access

---

## Phase 5: User Story 3 - Navigation responsive (Priority: P2)

**Goal**: Mini-sidenav sur desktop, overlay sur mobile/tablet

**Independent Test**: Redimensionnez: desktop=mini-sidenav, tablet/mobile=hamburger overlay

### Implementation for User Story 3

- [ ] T025 [US3] Add miniMode input to sidenav component in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T026 [US3] Implement mini mode layout (56px width, icons only) in `frontend/src/app/core/components/sidenav/sidenav.component.scss`
- [ ] T027 [US3] Add tooltips on hover in mini mode using matTooltip in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [ ] T028 [US3] Implement mode='side' for desktop, mode='over' for tablet/mobile in `frontend/src/app/app.component.ts`
- [ ] T029 [US3] Wire BreakpointObserver to update sidenavMode and miniMode signals in `frontend/src/app/app.component.ts`
- [ ] T030 [US3] Add smooth slide animation (250ms cubic-bezier) in `frontend/src/app/core/components/sidenav/sidenav.component.scss`
- [ ] T031 [US3] Auto-close sidenav on navigation in mobile mode in `frontend/src/app/app.component.ts`
- [ ] T032 [US3] Add backdrop overlay for mode='over' in `frontend/src/app/core/components/sidenav/sidenav.component.html`

**Checkpoint**: Desktop shows mini-sidenav, mobile/tablet shows hamburger + overlay

---

## Phase 6: User Story 4 - Raccourcis et accès rapides (Priority: P2)

**Goal**: Indicateurs critiques (alertes, offline) dans le header

**Independent Test**: Créez des alertes et vérifiez le badge dans le header

### Implementation for User Story 4

- [ ] T033 [US4] Add alerts badge to header indicators section in `frontend/src/app/core/components/header/header.component.html`
- [ ] T034 [US4] Format badge to show "99+" when count > 99 in `frontend/src/app/core/components/header/header.component.ts`
- [ ] T035 [US4] Add pulse animation to alerts badge when count > 0 in `frontend/src/app/core/components/header/header.component.scss`
- [ ] T036 [P] [US4] Add getOfflineTrucksCount() signal to truck service in `frontend/src/app/services/truck.service.ts`
- [ ] T037 [US4] Add offline trucks indicator badge in header when count > 0 in `frontend/src/app/core/components/header/header.component.html`
- [ ] T038 [US4] Make offline indicator clickable to filter map view in `frontend/src/app/core/components/header/header.component.ts`
- [ ] T039 [US4] Style user menu dropdown with name, role display in `frontend/src/app/core/components/header/header.component.html`

**Checkpoint**: Alerts badge works, offline indicator shows when trucks are offline

---

## Phase 7: User Story 5 - Geofences dans la navigation (Priority: P3)

**Goal**: Lien Geofences visible dans sidenav pour ADMIN/FLEET_MANAGER

**Independent Test**: Connectez-vous en ADMIN, vérifiez Geofences dans sidenav

### Implementation for User Story 5

- [x] T040 [US5] Verify /geofences route exists in `frontend/src/app/app.routes.ts`
- [x] T041 [US5] Verify Geofences item in ALL_NAV_ITEMS with roles [ADMIN, FLEET_MANAGER] in `frontend/src/app/core/services/navigation.service.ts`
- [ ] T042 [US5] Verify geofences link appears in sidenav operations category in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [ ] T043 [US5] Add fence icon for geofences in navigation items config in `frontend/src/app/core/services/navigation.service.ts`

**Checkpoint**: Geofences link visible for ADMIN/FLEET_MANAGER in sidenav

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance, edge cases

- [ ] T044 [P] Add role="banner" to header, role="navigation" to sidenav in `frontend/src/app/core/components/header/header.component.html`
- [ ] T045 [P] Add aria-label attributes to all interactive elements in `frontend/src/app/core/components/sidenav/sidenav.component.html`
- [ ] T046 Add keyboard navigation (Tab, Enter, Escape to close) in `frontend/src/app/core/components/sidenav/sidenav.component.ts`
- [ ] T047 Handle edge case: no role shows only Profil and Logout in `frontend/src/app/core/services/navigation.service.ts`
- [ ] T048 Add z-index stack (header=1000, backdrop=1100, sidenav=1200) in `frontend/src/styles/_navigation.scss`
- [ ] T049 [P] Add CSS transitions for hover states (150ms) in `frontend/src/app/core/components/sidenav/sidenav.component.scss`
- [ ] T050 Test responsive breakpoints: 320px, 768px, 1024px, 1920px, 2560px
- [ ] T051 Run Lighthouse accessibility audit - target score > 90
- [ ] T052 Verify performance: menu render < 100ms, transitions < 300ms
- [ ] T053 Update quickstart.md with final validation in `specs/003-nav-optimization/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel
  - US3 depends on US1 (sidenav structure)
  - US4 can proceed in parallel with US3
  - US5 can proceed in parallel
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

```
Setup → Foundational → US1 (Header compact + Sidenav)
                     ↘
                       US2 (Role filtering) → US5 (Geofences)
                     ↘
                       US3 (Responsive mini/overlay)
                     ↘
                       US4 (Indicators/badges)
                                              ↘
                                                Polish
```

### Parallel Opportunities

**Phase 1 (all parallel)**:
- T001, T002, T003, T004, T005

**Phase 3-7 models (parallel where marked [P])**:
- T036 (truck service) can run parallel to header changes

**Phase 8 (parallel where marked [P])**:
- T044, T045, T049

---

## Summary

| Phase | Tasks | Story | Priority |
|-------|-------|-------|----------|
| Phase 1: Setup | 6 | - | Required |
| Phase 2: Foundational | 5 | - | Required |
| Phase 3: US1 | 8 | Navigation principale | P1 MVP |
| Phase 4: US2 | 5 | Menu adapté au rôle | P1 |
| Phase 5: US3 | 8 | Navigation responsive | P2 |
| Phase 6: US4 | 7 | Raccourcis et badges | P2 |
| Phase 7: US5 | 4 | Geofences | P3 |
| Phase 8: Polish | 10 | Accessibilité | Final |
| **TOTAL** | **53** | **5 user stories** | - |

---

## Implementation Strategy

### MVP First (User Stories 1-2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Header compact + Sidenav)
4. Complete Phase 4: User Story 2 (Role filtering)
5. **STOP and VALIDATE**: Test navigation with different roles

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Header compact) → Test header/sidenav → MVP!
3. US2 (Role filtering) → Test roles → Deploy
4. US3 (Responsive) → Test breakpoints → Deploy
5. US4 (Indicators) → Test badges → Deploy
6. US5 (Geofences) → Test link → Deploy
7. Polish → Accessibility audit → Final release

---

## Notes

- Pattern: Header compact + Mini-sidenav hybride
- Desktop: Mini-sidenav (56px) persistante, labels on hover
- Tablet/Mobile: Sidenav overlay via hamburger
- Indicators critiques (alertes, offline) toujours visibles dans header
- Navigation complète dans sidenav avec catégories
