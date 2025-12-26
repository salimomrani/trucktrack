# Tasks: DevOps CI/CD Pipelines

**Input**: Design documents from `/specs/011-cicd-pipelines/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, quickstart.md ✓

**Tests**: Not applicable - this is DevOps infrastructure, validation is done via workflow runs.

**Organization**: Tasks are grouped by user story (pipeline domain) to enable independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create GitHub Actions directory structure and shared configurations

- [x] T001 Create .github/workflows/ directory structure
- [x] T002 [P] Create reusable workflow for Java/Maven setup in .github/workflows/setup-java.yml (embedded in ci-backend.yml)
- [x] T003 [P] Create reusable workflow for Node.js setup in .github/workflows/setup-node.yml (embedded in ci-frontend.yml, ci-mobile.yml)

---

## Phase 2: User Story 1 - Backend Tests Automation (Priority: P1) 🎯 MVP

**Goal**: Execute Maven tests automatically for all 5 backend microservices on push/PR

**Independent Test**: Create a PR with a failing test - pipeline should block merge

### Implementation for User Story 1

- [x] T004 [US1] Create backend CI workflow in .github/workflows/ci.yml (consolidated)
- [x] T005 [US1] Configure matrix strategy for 5 microservices (api-gateway, auth-service, gps-ingestion-service, location-service, notification-service)
- [x] T006 [US1] Add Maven dependency caching with hash-based keys
- [x] T007 [US1] Configure path filters for backend/** changes only
- [x] T008 [US1] Add JaCoCo coverage report artifact upload
- [x] T009 [US1] Configure workflow triggers (push, pull_request, workflow_dispatch)

**Checkpoint**: Backend tests run automatically on every push/PR to backend code

---

## Phase 3: User Story 2 - Frontend Tests Automation (Priority: P2)

**Goal**: Execute Angular/Jest tests automatically on push/PR

**Independent Test**: Modify an Angular component and verify tests run

### Implementation for User Story 2

- [x] T010 [P] [US2] Create frontend CI workflow in .github/workflows/ci.yml (consolidated)
- [x] T011 [US2] Configure npm ci with built-in caching
- [x] T012 [US2] Add Jest test execution with coverage
- [x] T013 [US2] Add ESLint check step
- [x] T014 [US2] Configure path filters for frontend/** changes only
- [x] T015 [US2] Add coverage report artifact upload

**Checkpoint**: Frontend tests run automatically on every push/PR to frontend code

---

## Phase 4: User Story 3 - Docker Image Build (Priority: P3)

**Goal**: Build and push Docker images to ghcr.io after tests pass on master

**Independent Test**: Merge to master and verify images appear in GitHub Container Registry

### Implementation for User Story 3

- [x] T016 [P] [US3] Create Docker build workflow in .github/workflows/docker-build.yml
- [x] T017 [US3] Configure trigger on push to master only (after tests pass)
- [x] T018 [US3] Setup GHCR authentication using GITHUB_TOKEN
- [x] T019 [US3] Create matrix strategy for all 5 backend services
- [x] T020 [US3] Configure Docker buildx for multi-platform builds
- [x] T021 [US3] Add image tagging (sha-{commit}, latest, version)
- [x] T022 [US3] Configure build caching for faster rebuilds
- [x] T022b [US3] Create Dockerfiles for all 5 microservices

**Checkpoint**: Docker images are built and pushed to ghcr.io on master merge

---

## Phase 5: User Story 4 - Mobile Tests Automation (Priority: P4)

**Goal**: Execute Expo/Jest tests automatically on push/PR

**Independent Test**: Modify mobile-expo code and verify tests run

### Implementation for User Story 4

- [x] T023 [P] [US4] Create mobile CI workflow in .github/workflows/ci.yml (consolidated)
- [x] T024 [US4] Configure npm ci with caching for mobile-expo
- [x] T025 [US4] Add Jest test execution with coverage
- [x] T026 [US4] Configure path filters for mobile-expo/** changes only
- [x] T027 [US4] Add coverage report artifact upload

**Checkpoint**: Mobile tests run automatically on every push/PR to mobile code

---

## Phase 6: User Story 5 - Failure Notifications (Priority: P5)

**Goal**: Send notifications on pipeline failures

**Independent Test**: Force a pipeline failure and verify notification is received

### Implementation for User Story 5

- [x] T028 [P] [US5] Add failure notification step to ci-backend.yml (via job summary)
- [x] T029 [P] [US5] Add failure notification step to ci-frontend.yml (via job summary)
- [x] T030 [P] [US5] Add failure notification step to ci-mobile.yml (via job summary)
- [x] T031 [P] [US5] Add failure notification step to docker-build.yml (via job summary)
- [x] T032 [US5] Configure GitHub Actions job summary for clear status

**Checkpoint**: Team receives notifications on any pipeline failure

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and documentation

- [x] T033 [P] Consolidate all CI into single .github/workflows/ci.yml
- [x] T034 [P] Add status badges to README.md
- [x] T035 Update quickstart.md with actual workflow paths
- [x] T036 Test all workflows end-to-end
- [ ] T037 Configure branch protection rules (manual step - documented)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup - MVP target
- **User Story 2-5 (Phases 3-6)**: Can run in parallel after Setup
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (Backend)**: Independent - can start after Setup
- **User Story 2 (Frontend)**: Independent - can run in parallel with US1
- **User Story 3 (Docker)**: Can start after Setup, but should be tested after US1 works
- **User Story 4 (Mobile)**: Independent - can run in parallel with others
- **User Story 5 (Notifications)**: Depends on US1-US4 workflows existing

### Parallel Opportunities

All setup tasks marked [P] can run in parallel:
- T002 (Java setup) || T003 (Node setup)

User stories can be worked in parallel:
- T004-T009 (Backend) || T010-T015 (Frontend) || T023-T027 (Mobile)

Notification steps can be added in parallel:
- T028 || T029 || T030 || T031

---

## Parallel Example: Setup Phase

```bash
# Launch all setup tasks together:
Task: "Create reusable workflow for Java/Maven setup"
Task: "Create reusable workflow for Node.js setup"
```

## Parallel Example: All CI Workflows

```bash
# After setup, launch all CI workflows in parallel:
Task: "Create backend CI workflow"
Task: "Create frontend CI workflow"
Task: "Create mobile CI workflow"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Backend Tests (US1)
3. **STOP and VALIDATE**: Verify pipeline runs on PR
4. Merge to master and confirm it works

### Incremental Delivery

1. Setup → Backend Tests → Working MVP
2. Add Frontend Tests → Both domains covered
3. Add Docker Build → Images ready for deployment
4. Add Mobile Tests → Full test coverage
5. Add Notifications → Team awareness
6. Polish → Production ready

### Recommended Order

Since workflows are independent files, the fastest approach:
1. T001-T003 (Setup)
2. T004-T009 (Backend - MVP)
3. T010-T015, T016-T022, T023-T027 (Frontend, Docker, Mobile - parallel)
4. T028-T032 (Notifications)
5. T033-T037 (Polish)

---

## Notes

- All workflow files go in `.github/workflows/`
- Use `actions/checkout@v4`, `actions/setup-java@v4`, `actions/setup-node@v4`
- GITHUB_TOKEN is auto-provided for ghcr.io authentication
- Test workflows by creating a test branch and pushing changes
- Branch protection configuration is manual via GitHub UI
