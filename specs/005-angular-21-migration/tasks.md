# Tasks: Angular 21 Migration

**Input**: Design documents from `/specs/005-angular-21-migration/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Tests are NOT explicitly requested. Focus on existing test suite validation at each migration step.

**Organization**: Tasks organized by migration phases to enable incremental validation.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different concerns, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/` at repository root
- Key files: `frontend/package.json`, `frontend/angular.json`, `frontend/tsconfig.json`

---

## Phase 1: Preparation (Pre-Migration)

**Purpose**: Capture baselines and ensure clean starting state

- [ ] T001 Verify git working directory is clean in frontend/
- [ ] T002 Run existing tests to confirm baseline (`npm test` in frontend/)
- [ ] T003 Capture build time baseline (`npm run build` in frontend/)
- [ ] T004 Capture bundle size baseline (main.js, vendor.js sizes in frontend/dist/)
- [ ] T005 [P] Document current versions in migration-log.md
- [ ] T006 [P] Run Lighthouse audit and save baseline score
- [ ] T007 Create migration branch checkpoint: `git tag pre-migration-v17`

**Checkpoint**: Baselines captured, ready to start migration

---

## Phase 2: Angular 17 → 18

**Purpose**: First incremental upgrade

- [ ] T008 Run `ng update @angular/core@18 @angular/cli@18` in frontend/
- [ ] T009 Run `ng update @angular/material@18` in frontend/
- [ ] T010 Update NgRx packages to v18 in frontend/package.json
- [ ] T011 Resolve any TypeScript errors after upgrade
- [ ] T012 Run `npm run build` and fix any build errors in frontend/
- [ ] T013 Run `npm test` and fix any test failures in frontend/
- [ ] T014 Manual smoke test: login, map, geofences, alerts
- [ ] T015 Commit: `git commit -m "chore: upgrade to Angular 18"`
- [ ] T016 Create checkpoint: `git tag migration-v18`

**Checkpoint**: Angular 18 stable, all tests pass

---

## Phase 3: Angular 18 → 19

**Purpose**: Signal-based reactivity improvements

- [ ] T017 Run `ng update @angular/core@19 @angular/cli@19` in frontend/
- [ ] T018 Run `ng update @angular/material@19` in frontend/
- [ ] T019 Update NgRx packages to v19 in frontend/package.json
- [ ] T020 Resolve any deprecated API warnings
- [ ] T021 Run `npm run build` and fix any build errors in frontend/
- [ ] T022 Run `npm test` and fix any test failures in frontend/
- [ ] T023 Manual smoke test: login, map, geofences, alerts
- [ ] T024 Commit: `git commit -m "chore: upgrade to Angular 19"`
- [ ] T025 Create checkpoint: `git tag migration-v19`

**Checkpoint**: Angular 19 stable, all tests pass

---

## Phase 4: Angular 19 → 20

**Purpose**: Esbuild becomes default build system

- [ ] T026 Run `ng update @angular/core@20 @angular/cli@20` in frontend/
- [ ] T027 Run `ng update @angular/material@20` in frontend/
- [ ] T028 Update NgRx packages to v20 in frontend/package.json
- [ ] T029 Verify angular.json uses @angular/build (Esbuild)
- [ ] T030 Run `npm run build` and fix any build errors in frontend/
- [ ] T031 Run `npm test` and fix any test failures in frontend/
- [ ] T032 Measure build time improvement vs baseline
- [ ] T033 Manual smoke test: login, map, geofences, alerts
- [ ] T034 Commit: `git commit -m "chore: upgrade to Angular 20 with Esbuild"`
- [ ] T035 Create checkpoint: `git tag migration-v20`

**Checkpoint**: Angular 20 with Esbuild stable, build time improved

---

## Phase 5: Angular 20 → 21

**Purpose**: Zoneless change detection becomes default

- [ ] T036 Run `ng update @angular/core@21 @angular/cli@21` in frontend/
- [ ] T037 Run `ng update @angular/material@21` in frontend/
- [ ] T038 Update NgRx packages to v21 in frontend/package.json
- [ ] T039 Configure zoneless change detection in frontend/src/main.ts
- [ ] T040 Remove zone.js from frontend/package.json (if applicable)
- [ ] T041 Update test configuration for zoneless in frontend/src/test.ts
- [ ] T042 Run `npm run build` and fix any build errors in frontend/
- [ ] T043 Run `npm test` and fix any test failures in frontend/
- [ ] T044 Manual smoke test: login, map, geofences, alerts
- [ ] T045 Commit: `git commit -m "chore: upgrade to Angular 21 with zoneless"`
- [ ] T046 Create checkpoint: `git tag migration-v21`

**Checkpoint**: Angular 21 with zoneless stable, all tests pass

---

## Phase 6: Validation & Metrics

**Purpose**: Verify all success criteria are met

- [ ] T047 Measure final build time and compare to baseline (-40% target)
- [ ] T048 Measure dev server startup time (-50% target)
- [ ] T049 Measure hot-reload time (<2s target)
- [ ] T050 Measure bundle sizes and compare to baseline (-10% target)
- [ ] T051 Run Lighthouse audit (>80 performance target)
- [ ] T052 Run full E2E test suite (if exists)
- [ ] T053 Verify Angular version is 21.x with `ng version`
- [ ] T054 Document all metrics in migration-report.md

**Checkpoint**: All success criteria validated

---

## Phase 7: Polish & Cleanup

**Purpose**: Final cleanup and documentation

- [ ] T055 [P] Remove any temporary migration workarounds
- [ ] T056 [P] Update frontend/README.md with new Angular 21 info
- [ ] T057 [P] Update frontend/ANGULAR_CONVENTIONS.md if needed
- [ ] T058 Clean up migration checkpoints: keep only pre-migration and final
- [ ] T059 Final commit: `git commit -m "feat: complete Angular 21 migration"`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Preparation)
    ↓
Phase 2 (17→18) → Phase 3 (18→19) → Phase 4 (19→20) → Phase 5 (20→21)
    ↓                                                        ↓
    └─────────────────────────────────────────────────────────┘
                              ↓
                    Phase 6 (Validation)
                              ↓
                    Phase 7 (Polish)
```

### Critical Path

1. **MUST be sequential**: Phases 2-5 (migration steps cannot be parallelized)
2. **Rollback available**: Each phase ends with a git tag for rollback
3. **Validation blocking**: Phase 6 must complete before Phase 7

### Parallel Opportunities

Within each migration phase:
- T005, T006 can run in parallel (different outputs)
- T055, T056, T057 can run in parallel (different files)

---

## Rollback Procedures

### If Any Phase Fails

```bash
# Rollback to previous checkpoint
git reset --hard migration-v{previous}
npm install

# Example: Rollback from v20 to v19
git reset --hard migration-v19
cd frontend && npm install
```

### Full Rollback to Start

```bash
git reset --hard pre-migration-v17
cd frontend && npm install
```

---

## Implementation Strategy

### Incremental Migration

1. Complete Phase 1: Capture baselines
2. Complete Phase 2: Angular 18 → **VALIDATE**
3. Complete Phase 3: Angular 19 → **VALIDATE**
4. Complete Phase 4: Angular 20 → **VALIDATE** (Esbuild gains)
5. Complete Phase 5: Angular 21 → **VALIDATE** (Zoneless gains)
6. Complete Phase 6: Verify all metrics
7. Complete Phase 7: Cleanup

### Time Estimates

- Phase 1: ~15 minutes
- Phases 2-5: ~30 minutes each (2 hours total)
- Phase 6: ~30 minutes
- Phase 7: ~15 minutes

**Total**: ~3-4 hours (uninterrupted)

---

## Success Criteria Checklist

- [ ] Angular version is 21.x
- [ ] All existing tests pass (100%)
- [ ] Build time reduced by ≥40%
- [ ] Dev server startup reduced by ≥50%
- [ ] Hot-reload <2 seconds
- [ ] Bundle size reduced by ≥10%
- [ ] Lighthouse performance ≥80
- [ ] No functional regressions
- [ ] Clean git history with migration commits

---

## Notes

- Each phase MUST complete successfully before proceeding
- Keep migration-log.md updated with issues encountered
- If stuck >30 minutes on any issue, rollback and investigate
- Commit frequently with descriptive messages
- Test manually after each major version jump
