# Angular 21 Migration Log

**Feature**: 005-angular-21-migration
**Started**: 2025-12-23
**Status**: In Progress

## Pre-Migration Baselines (Angular 17)

### Version Information

| Package | Version |
|---------|---------|
| Angular CLI | 17.3.17 |
| @angular/core | 17.3.12 |
| @angular/material | 17.3.10 |
| @angular/cdk | 17.3.10 |
| @ngrx/store | 17.2.0 |
| TypeScript | 5.4.5 |
| RxJS | 7.8.2 |
| zone.js | 0.14.10 |
| Node.js | 22.19.0 |

### Build Metrics

| Metric | Value |
|--------|-------|
| Build Time | 7.617 seconds |
| Initial Bundle (Raw) | 944.11 kB |
| Initial Bundle (Transfer) | 210.81 kB |
| main.js | 69.25 kB |
| polyfills.js | 33.71 kB |
| styles.css | 108.10 kB |

### Test Results

- Total tests: 3
- Passed: 3 (100%)
- Failed: 0

### Build Warnings

1. Bundle initial exceeded maximum budget (500 kB limit, 944.11 kB actual)
2. Component SCSS files exceed budget (alerts.component.scss, map.component.scss)
3. CommonJS modules: leaflet, leaflet.markercluster, leaflet-draw

---

## Migration Progress

### Phase 1: Preparation
- [x] T001: Git working directory clean
- [x] T002: Tests passing (3/3)
- [x] T003: Build time baseline captured (7.617s)
- [x] T004: Bundle size baseline captured (944.11 kB)
- [x] T005: Versions documented
- [ ] T007: Git tag created

### Phase 2: Angular 17 → 18
- [ ] T008: ng update @angular/core@18 @angular/cli@18
- [ ] T009: ng update @angular/material@18
- [ ] T010: Update NgRx to v18
- [ ] T011: Fix TypeScript errors
- [ ] T012: Build succeeds
- [ ] T013: Tests pass
- [ ] T014: Smoke test
- [ ] T015: Commit
- [ ] T016: Git tag migration-v18

### Phase 3: Angular 18 → 19
- [ ] Pending Phase 2 completion

### Phase 4: Angular 19 → 20
- [ ] Pending Phase 3 completion

### Phase 5: Angular 20 → 21
- [ ] Pending Phase 4 completion

### Phase 6: Validation
- [ ] Pending Phase 5 completion

### Phase 7: Polish
- [ ] Pending Phase 6 completion

---

## Issues Encountered

### Pre-existing Test Issue (Fixed)
- **Issue**: AppComponent tests failing with "NullInjectorError: No provider for HttpClient"
- **Cause**: Missing test providers in app.component.spec.ts
- **Resolution**: Added provideHttpClient, provideHttpClientTesting, provideStore with reducers
- **File**: frontend/src/app/app.component.spec.ts

---

## Post-Migration Metrics

*To be completed after migration*

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Build Time | 7.617s | TBD | TBD |
| Initial Bundle | 944.11 kB | TBD | TBD |
| Dev Server Start | TBD | TBD | TBD |
| Hot Reload | TBD | TBD | TBD |
