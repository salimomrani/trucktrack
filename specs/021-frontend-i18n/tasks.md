# Tasks: Frontend Internationalisation (i18n) FR/EN

**Input**: Design documents from `/specs/021-frontend-i18n/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No TDD requested - tests are not included in this task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for Angular frontend

---

## Phase 1: Setup (Shared Infrastructure) ✅

**Purpose**: Install dependencies and create base infrastructure

- [x] T001 Install ngx-translate dependencies: `npm install @ngx-translate/core @ngx-translate/http-loader` in frontend/
- [x] T002 [P] Create i18n directory structure: `frontend/src/assets/i18n/`
- [x] T003 [P] Register French and English locales in `frontend/src/app/app.config.ts`
- [x] T004 Configure TranslateModule in `frontend/src/app/app.config.ts` with HttpLoader and MissingTranslationHandler

---

## Phase 2: Foundational (Blocking Prerequisites) ✅

**Purpose**: Core i18n infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create LanguageService with signals in `frontend/src/app/core/services/language.service.ts`
- [x] T006 [P] Create French translation file with base structure in `frontend/src/assets/i18n/fr.json`
- [x] T007 [P] Create English translation file with base structure in `frontend/src/assets/i18n/en.json`
- [x] T008 Create CustomMissingTranslationHandler in `frontend/src/app/core/services/missing-translation.handler.ts`
- [x] T009 Export LanguageService from core barrel file `frontend/src/app/core/services/index.ts` (create if needed)

**Checkpoint**: Foundation ready - user story implementation can now begin ✅

---

## Phase 3: User Story 1 - Changer la Langue de l'Interface (Priority: P1) 🎯 MVP ✅

**Goal**: Users can switch between French and English via a language selector in the header, and see all interface texts change immediately without page reload.

**Independent Test**: Click language selector in header → all visible text switches to selected language instantly.

### Implementation for User Story 1

- [x] T010 [US1] Add COMMON translations (SAVE, CANCEL, DELETE, EDIT, SEARCH, LOADING, NO_DATA) to `frontend/src/assets/i18n/fr.json`
- [x] T011 [P] [US1] Add COMMON translations to `frontend/src/assets/i18n/en.json`
- [x] T012 [US1] Add NAV translations (DASHBOARD, MAP, TRUCKS, TRIPS, USERS, GROUPS, CONFIG, ALERTS) to `frontend/src/assets/i18n/fr.json`
- [x] T013 [P] [US1] Add NAV translations to `frontend/src/assets/i18n/en.json`
- [x] T014 [US1] Add AUTH translations (LOGIN, LOGOUT, PROFILE) to `frontend/src/assets/i18n/fr.json`
- [x] T015 [P] [US1] Add AUTH translations to `frontend/src/assets/i18n/en.json`
- [x] T016 [US1] Create language-selector component in `frontend/src/app/core/components/language-selector/language-selector.component.ts`
- [x] T017 [P] [US1] Create language-selector template in `frontend/src/app/core/components/language-selector/language-selector.component.html`
- [x] T018 [P] [US1] Create language-selector styles in `frontend/src/app/core/components/language-selector/language-selector.component.scss`
- [x] T019 [US1] Add language-selector to top-header component in `frontend/src/app/core/components/top-header/top-header.component.html`
- [x] T020 [US1] Update top-header component to inject LanguageService in `frontend/src/app/core/components/top-header/top-header.component.ts`
- [x] T021 [US1] Apply translate pipe to sidebar navigation labels in `frontend/src/app/core/components/sidebar/sidebar.component.html`
- [x] T022 [US1] Update sidebar component to use TranslateModule in `frontend/src/app/core/components/sidebar/sidebar.component.ts`

**Checkpoint**: Language switching works - users can toggle FR/EN and see navigation change ✅

---

## Phase 4: User Story 2 - Persistance de la Préférence de Langue (Priority: P2) ✅

**Goal**: User's language preference is saved and restored automatically on next visit.

**Independent Test**: Change language to English → close browser → reopen app → interface displays in English.

### Implementation for User Story 2

- [x] T023 [US2] Add localStorage persistence to LanguageService.setLanguage() in `frontend/src/app/core/services/language.service.ts`
- [x] T024 [US2] Add init() method to load from localStorage in LanguageService in `frontend/src/app/core/services/language.service.ts`
- [x] T025 [US2] Call LanguageService.init() in AppComponent ngOnInit in `frontend/src/app/app.component.ts`
- [x] T026 [US2] Set default language to French if no preference stored in `frontend/src/app/core/services/language.service.ts`

**Checkpoint**: Language preference persists across browser sessions ✅

---

## Phase 5: User Story 3 - Traduction des Pages Administration (Priority: P3) ✅

**Goal**: All admin pages (Dashboard, Users, Trucks, Trips, Groups, Config) are fully translated.

**Independent Test**: Navigate through all admin sections in English → all titles, buttons, table headers, form labels are in English.

### Implementation for User Story 3

- [x] T027 [P] [US3] Add DASHBOARD translations (TITLE, ACTIVE_TRUCKS, TRIPS_TODAY, OFFLINE_TRUCKS, ALERTS_TODAY) to both `frontend/src/assets/i18n/fr.json` and `en.json`
- [x] T028 [US3] Apply translate pipe to dashboard component in `frontend/src/app/admin/dashboard/stats-dashboard.component.html`
- [x] T029 [P] [US3] Add TRUCKS translations (TITLE, ADD, PLATE_NUMBER, STATUS, DRIVER, GROUP, ACTIONS, EDIT, DELETE, CONFIRM_DELETE) to both JSON files
- [x] T030 [US3] Apply translate pipe to truck-list component in `frontend/src/app/admin/trucks/truck-list/truck-list.component.html`
- [x] T031 [US3] Apply translate pipe to truck-form component in `frontend/src/app/admin/trucks/truck-form/truck-form.component.html`
- [x] T032 [P] [US3] Add TRIPS translations (TITLE, ADD, STATUS.*, ORIGIN, DESTINATION, DRIVER, TRUCK, FILTERS, DATE_RANGE) to both JSON files
- [x] T033 [US3] Apply translate pipe to trip-list component in `frontend/src/app/admin/trips/trip-list/trip-list.component.html`
- [x] T034 [US3] Apply translate pipe to trip-detail component in `frontend/src/app/admin/trips/trip-detail/trip-detail.component.html`
- [x] T035 [P] [US3] Add USERS translations (TITLE, ADD, EMAIL, ROLE, GROUP, STATUS, ACTIONS) to both JSON files
- [x] T036 [US3] Apply translate pipe to user-list component in `frontend/src/app/admin/users/user-list/user-list.component.html`
- [x] T037 [US3] Apply translate pipe to user-form component in `frontend/src/app/admin/users/user-form/user-form.component.html`
- [x] T038 [P] [US3] Add GROUPS translations (TITLE, ADD, NAME, DESCRIPTION, MEMBERS) to both JSON files
- [x] T039 [US3] Apply translate pipe to group-list component in `frontend/src/app/admin/groups/group-list/group-list.component.html`
- [x] T040 [US3] Apply translate pipe to group-form component in `frontend/src/app/admin/groups/group-form/group-form.component.html`
- [x] T041 [P] [US3] Add CONFIG translations (TITLE, ALERT_RULES, GEOFENCES, SETTINGS) to both JSON files
- [x] T042 [US3] Apply translate pipe to config-page component in `frontend/src/app/admin/config/config-page.component.html`
- [x] T043 [US3] Add TranslateModule to all admin components that need it (update imports in each .ts file)

**Checkpoint**: All admin pages display correctly in both FR and EN ✅

---

## Phase 6: User Story 4 - Traduction des Messages et Notifications (Priority: P4) ✅

**Goal**: All toast messages (success, error) and validation messages are translated.

**Independent Test**: Create a trip → see success toast in selected language; submit invalid form → see validation errors in selected language.

### Implementation for User Story 4

- [x] T044 [P] [US4] Add SUCCESS translations (SAVED, DELETED, CREATED, UPDATED) to both JSON files
- [x] T045 [P] [US4] Add ERRORS translations (GENERIC, NETWORK, VALIDATION, NOT_FOUND, UNAUTHORIZED, REQUIRED, INVALID_FORMAT) to both JSON files
- [x] T046 [US4] Update ToastService to use TranslateService for messages in `frontend/src/app/shared/components/toast/toast.service.ts`
- [x] T047 [US4] Update form validation messages to use translate pipe in truck-form in `frontend/src/app/admin/trucks/truck-form/truck-form.component.html`
- [x] T048 [US4] Update form validation messages in user-form in `frontend/src/app/admin/users/user-form/user-form.component.html`
- [x] T049 [US4] Update form validation messages in trip-detail in `frontend/src/app/admin/trips/trip-detail/trip-detail.component.html`
- [x] T050 [US4] Update form validation messages in group-form in `frontend/src/app/admin/groups/group-form/group-form.component.html`
- [x] T051 [P] [US4] Add NOTIFICATIONS translations (NEW_ALERT, TRIP_ASSIGNED, TRUCK_OFFLINE) to both JSON files
- [x] T052 [US4] Update notifications-dropdown to use translate pipe in `frontend/src/app/shared/components/notifications-dropdown/notifications-dropdown.component.html`

**Checkpoint**: All dynamic messages (toasts, validation, notifications) appear in the selected language ✅

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Date formatting, edge cases, and final validation

- [x] T053 [P] Configure LOCALE_ID provider to update with language changes in `frontend/src/app/app.config.ts`
- [x] T054 [P] Update date pipes to use locale-aware formatting across components
- [x] T055 Verify all translate pipes work with missing translation handler
- [ ] T056 Run quickstart.md validation scenarios (language switch, persistence, admin pages, toast messages)
- [x] T057 Update login component to use translate pipe in `frontend/src/app/features/auth/login/login.component.html`
- [x] T058 Update profile component to use translate pipe in `frontend/src/app/features/profile/profile.component.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Creates language selector
- **User Story 2 (P2)**: Depends on US1 (needs LanguageService from US1)
- **User Story 3 (P3)**: Can start after Foundational - Uses translation files from US1
- **User Story 4 (P4)**: Can start after Foundational - Uses translation files from US1

### Within Each User Story

- JSON file updates before component updates
- Service updates before component consumption
- Core components before admin components

### Parallel Opportunities

**Phase 2 (Foundational)**:
```
T006 (fr.json) || T007 (en.json) - different files
```

**Phase 3 (US1)**:
```
T010/T011 (COMMON fr/en) || T012/T013 (NAV fr/en) || T014/T015 (AUTH fr/en)
T016/T017/T018 (language-selector component files)
```

**Phase 5 (US3)**:
```
T027 (DASHBOARD) || T029 (TRUCKS) || T032 (TRIPS) || T035 (USERS) || T038 (GROUPS) || T041 (CONFIG)
```

---

## Parallel Example: User Story 1

```bash
# Launch all JSON translations together:
Task: "Add COMMON translations to frontend/src/assets/i18n/fr.json"
Task: "Add COMMON translations to frontend/src/assets/i18n/en.json"

# Launch language-selector component files together:
Task: "Create language-selector.component.ts"
Task: "Create language-selector.component.html"
Task: "Create language-selector.component.scss"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install ngx-translate)
2. Complete Phase 2: Foundational (LanguageService, base JSON files)
3. Complete Phase 3: User Story 1 (language selector, sidebar navigation)
4. **STOP and VALIDATE**: Test language switching in header
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Language selector works → Demo MVP
3. Add User Story 2 → Persistence works → Deploy
4. Add User Story 3 → All admin pages translated → Deploy
5. Add User Story 4 → All messages translated → Complete feature

### Suggested MVP Scope

**User Story 1 only** (T001-T022):
- Language selector in header
- Navigation labels translated
- Instant language switch without reload

This delivers the core i18n functionality and can be demo'd immediately.

---

## Notes

- Translation files (JSON) should be updated incrementally per user story
- All components using translate pipe must import TranslateModule
- Use `{{ 'KEY.PATH' | translate }}` in templates
- Use `this.translate.instant('KEY.PATH')` in TypeScript
- Test language switch performance (<500ms requirement)
- Verify localStorage persistence with browser dev tools

---

## Summary

| Metric | Count | Completed |
|--------|-------|-----------|
| **Total Tasks** | 58 | 57 (98%) |
| **Phase 1 (Setup)** | 4 | 4 ✅ |
| **Phase 2 (Foundational)** | 5 | 5 ✅ |
| **US1 (Language Switching)** | 13 | 13 ✅ |
| **US2 (Persistence)** | 4 | 4 ✅ |
| **US3 (Admin Pages)** | 17 | 17 ✅ |
| **US4 (Messages)** | 9 | 9 ✅ |
| **Phase 7 (Polish)** | 6 | 5 🔄 |
| **Parallel Opportunities** | 18 tasks marked [P] |

### Remaining Tasks (1 total)

**Polish (1 remaining)**:
- T056: Quickstart validation scenarios (manual testing)
