# Baseline Metrics - Angular Frontend Cleanup

**Date**: 2025-12-30
**Branch**: 019-angular-frontend-cleanup

## Build Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Total JS (uncompressed) | 3.1 MB | N/A |
| Main bundle (gzipped) | 20.4 KB | < 500 KB |
| Polyfills (gzipped) | 12.1 KB | N/A |
| Initial load (gzipped) | ~32.5 KB | < 500 KB |

## Test Results

| Metric | Value |
|--------|-------|
| Total tests | 136 |
| Passed | 136 |
| Failed | 0 |
| Success rate | 100% |

## Build Warnings

- CommonJS dependencies (canvg, leaflet, html2canvas) - expected, not blocking

## Memory Baseline

> Manual testing required via Chrome DevTools Memory tab
>
> Instructions:
> 1. Open app in Chrome
> 2. Open DevTools → Memory tab
> 3. Take heap snapshot
> 4. Navigate through: /admin/trips → /admin/users → /admin/trucks → /admin/groups → /map
> 5. Repeat 10 times
> 6. Take heap snapshot
> 7. Record: Initial heap size, Final heap size, Delta %

**To be filled after manual testing**:
- Initial heap size: _____ MB
- Final heap size: _____ MB
- Delta: _____ %
- Detached DOM nodes: _____

## Notes

- Build completed successfully with Angular 21.0.6
- All CommonJS warnings are from third-party libraries (leaflet, canvg)
- Lazy loading is already in place for all feature modules
