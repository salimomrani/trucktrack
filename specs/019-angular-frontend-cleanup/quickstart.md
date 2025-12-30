# Quickstart: Testing Angular Frontend Cleanup

**Feature**: 019-angular-frontend-cleanup
**Date**: 2025-12-30

## Prerequisites

- Node.js 18+
- Chrome browser (for DevTools)
- Angular DevTools extension installed

## Quick Validation Steps

### 1. Build & Run

```bash
cd frontend
npm install
npm run build  # Should complete without warnings
npm start      # Start dev server on http://localhost:4200
```

### 2. Memory Leak Test (Manual)

**Duration**: ~10 minutes

1. Open Chrome DevTools → Memory tab
2. Login to the application
3. Take heap snapshot (baseline)
4. Navigate through these pages 5 times each:
   - `/admin/trips`
   - `/admin/users`
   - `/admin/trucks`
   - `/admin/groups`
   - `/map`
5. Take heap snapshot (after navigation)
6. Compare snapshots:
   - **PASS**: Memory delta < 20%
   - **FAIL**: Memory delta > 20% OR detached DOM nodes > 0

### 3. Performance Test (Lighthouse)

```bash
# Build production bundle
npm run build -- --configuration production

# Run Lighthouse (requires lighthouse-ci installed)
npx lighthouse http://localhost:4200/admin/trips \
  --output=json \
  --output-path=./lighthouse-report.json

# Check results
cat lighthouse-report.json | jq '.categories.performance.score'
# Should be > 0.80 (80%)
```

### 4. Unit Tests

```bash
npm run test -- --watch=false --browsers=ChromeHeadless
# All tests should pass
```

### 5. Bundle Size Check

```bash
npm run build -- --configuration production
ls -la dist/frontend/browser/*.js | awk '{sum += $5} END {print "Total: " sum/1024 " KB"}'
# Initial bundle should be < 500KB
```

## Component-Specific Tests

### TripListComponent

1. Navigate to `/admin/trips`
2. Open DevTools → Performance tab
3. Start recording
4. Apply different filters, change date range
5. Stop recording
6. Check: No "Long Task" warnings (> 50ms)

### UserListComponent

1. Navigate to `/admin/users`
2. Open DevTools → Memory tab
3. Take snapshot
4. Navigate away to `/map`
5. Navigate back to `/admin/users`
6. Take snapshot
7. Compare: No significant memory increase

### LocationPickerComponent

1. Open any form with location picker
2. Open DevTools → Memory tab
3. Take snapshot
4. Close/open the location picker 5 times
5. Take snapshot
6. Compare: Map instances should be cleaned up

## Expected Results After Cleanup

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Memory after 1h navigation | Growing | Stable | < 20% variation |
| TripList filter response | ~300ms | <200ms | < 200ms |
| Lighthouse Performance | ~70 | > 80 | > 80 |
| Detached DOM nodes | > 0 | 0 | 0 |
| Bundle size (gzip) | ~480KB | < 500KB | < 500KB |

## Troubleshooting

### Memory still growing?

1. Check Chrome DevTools → Memory → "Detached DOM tree"
2. Look for retained objects with component names
3. Verify `takeUntilDestroyed()` is used in subscriptions

### OnPush breaking UI?

1. Check that data is coming from signals or observables
2. Verify no direct object mutation
3. Add `ChangeDetectorRef.markForCheck()` if needed (temporary fix)

### Tests failing?

1. Run `npm run test -- --include=path/to/component.spec.ts`
2. Check for async timing issues
3. Verify mocks are properly set up

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Build & Test
  run: |
    npm ci
    npm run build -- --configuration production
    npm run test -- --watch=false --browsers=ChromeHeadless

- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    configPath: './lighthouserc.js'
    uploadArtifacts: true
```
