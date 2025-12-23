# Quickstart: Angular 21 Migration

**Feature**: 005-angular-21-migration
**Estimated Duration**: 2-4 hours (incremental, can be paused)

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Git working directory clean
- [ ] All tests passing (`npm test`)
- [ ] Performance baselines captured

## Pre-Migration Checklist

```bash
# 1. Ensure clean state
cd frontend
git status  # Should be clean

# 2. Capture baselines
npm run build 2>&1 | tee ../build-baseline.log
time npm run build  # Note the time

# 3. Verify tests pass
npm test

# 4. Note current versions
ng version
```

## Migration Steps

### Phase 1: Angular 17 → 18

```bash
# Update Angular
ng update @angular/core@18 @angular/cli@18 --force
ng update @angular/material@18 --force

# Update NgRx
npm install @ngrx/store@18 @ngrx/effects@18 @ngrx/entity@18

# Validate
npm run build
npm test

# Commit
git add -A
git commit -m "chore: upgrade to Angular 18"
```

### Phase 2: Angular 18 → 19

```bash
# Update Angular
ng update @angular/core@19 @angular/cli@19 --force
ng update @angular/material@19 --force

# Update NgRx
npm install @ngrx/store@19 @ngrx/effects@19 @ngrx/entity@19

# Validate
npm run build
npm test

# Commit
git add -A
git commit -m "chore: upgrade to Angular 19"
```

### Phase 3: Angular 19 → 20

```bash
# Update Angular (Esbuild becomes default)
ng update @angular/core@20 @angular/cli@20 --force
ng update @angular/material@20 --force

# Update NgRx
npm install @ngrx/store@20 @ngrx/effects@20 @ngrx/entity@20

# Validate
npm run build
npm test

# Commit
git add -A
git commit -m "chore: upgrade to Angular 20 with Esbuild"
```

### Phase 4: Angular 20 → 21

```bash
# Update Angular (Zoneless default)
ng update @angular/core@21 @angular/cli@21 --force
ng update @angular/material@21 --force

# Update NgRx
npm install @ngrx/store@21 @ngrx/effects@21 @ngrx/entity@21

# Remove zone.js if not needed
npm uninstall zone.js

# Validate
npm run build
npm test

# Commit
git add -A
git commit -m "chore: upgrade to Angular 21 with zoneless"
```

## Post-Migration Validation

### Performance Comparison

```bash
# Build time
time npm run build

# Bundle analysis
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json

# Lighthouse
npx lighthouse http://localhost:4200 --view
```

### Functional Testing

- [ ] Login flow works
- [ ] Map displays correctly
- [ ] Real-time GPS updates work
- [ ] Geofence CRUD operations work
- [ ] Alerts display in real-time
- [ ] Admin panel functions work

### Expected Improvements

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Build time | TBD | TBD | -40% |
| Dev server start | TBD | TBD | -50% |
| Bundle size | TBD | TBD | -10% |
| Hot reload | TBD | TBD | <2s |

## Troubleshooting

### Common Issues

#### 1. Peer dependency conflicts
```bash
npm install --legacy-peer-deps
# or
npm install --force
```

#### 2. TypeScript errors after upgrade
```bash
# Check for deprecated APIs
ng update @angular/core@XX --next
# Review and fix deprecated usage
```

#### 3. Tests fail with zoneless
```typescript
// In test configuration, add zone support
import { provideZoneChangeDetection } from '@angular/core';

TestBed.configureTestingModule({
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true })
  ]
});
```

#### 4. Third-party component issues
```typescript
// Wrap problematic components
@Component({
  providers: [provideZoneChangeDetection()]
})
```

### Rollback Procedure

```bash
# If any step fails, rollback to previous commit
git reset --hard HEAD~1
npm install
```

## Success Criteria Checklist

- [ ] Angular version is 21.x (`ng version`)
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Build time reduced by ≥40%
- [ ] Bundle size reduced by ≥10%
- [ ] Lighthouse performance score ≥80
- [ ] No functional regressions
