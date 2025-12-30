# Research: Angular Memory Management & Performance Best Practices

**Feature**: 019-angular-frontend-cleanup
**Date**: 2025-12-30

## 1. Subscription Management in Angular 17+

### Decision: Use `takeUntilDestroyed()` from `@angular/core/rxjs-interop`

**Rationale**:
- Native Angular solution introduced in v16, stable in v17+
- Automatically ties to component lifecycle via `DestroyRef`
- No need for manual Subject creation or ngOnDestroy implementation
- Works with injection context (constructor, field initializers)

**Alternatives Considered**:

| Alternative | Rejected Because |
|-------------|------------------|
| Manual `Subject` + `takeUntil` | Boilerplate, easy to forget `complete()` call |
| `async` pipe only | Not always possible for side-effect subscriptions |
| `Subscription.add()` + `unsubscribe()` | Verbose, error-prone, requires ngOnDestroy |
| `@ngneat/until-destroy` | External dependency, Angular native preferred |

**Implementation Pattern**:

```typescript
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({...})
export class MyComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.someService.data$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.handleData(data));
  }
}
```

**For field initializers (cleaner)**:

```typescript
@Component({...})
export class MyComponent {
  // Works in injection context - no DestroyRef needed
  private readonly data$ = this.someService.data$
    .pipe(takeUntilDestroyed());
}
```

---

## 2. Change Detection Optimization

### Decision: Use `ChangeDetectionStrategy.OnPush` for all components

**Rationale**:
- Reduces unnecessary change detection cycles
- Forces immutable data patterns (better architecture)
- Works seamlessly with signals and observables
- Significant performance improvement for list components

**Alternatives Considered**:

| Alternative | Rejected Because |
|-------------|------------------|
| Default change detection | Performance overhead on large lists |
| Manual `detectChanges()` | Error-prone, violates Angular patterns |
| Zone.js optimization | Complex, OnPush is simpler and more effective |

**Implementation Pattern**:

```typescript
@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (user of users(); track user.id) {
      <app-user-card [user]="user" />
    }
  `
})
export class UserListComponent {
  // Use signals from store facade
  readonly users = this.facade.users;

  constructor(private facade: StoreFacade) {}
}
```

**Key Requirements for OnPush**:
1. All inputs must be immutable (no object mutation)
2. Use signals or observables with async pipe for reactive data
3. Event handlers automatically trigger change detection
4. Use `@Input({ transform })` for input transformations

---

## 3. Signal Adoption Strategy

### Decision: Prefer signals over BehaviorSubject for component state

**Rationale**:
- Native Angular 17+ feature with better performance
- Simpler API than RxJS for synchronous state
- Automatic template binding without async pipe
- Better debugging experience in DevTools

**When to Use Signals vs Observables**:

| Use Case | Recommended |
|----------|-------------|
| Component local state | Signal |
| Store selectors | Signal (via `toSignal()`) |
| HTTP responses | Observable → Signal via `toSignal()` |
| Event streams | Observable with `takeUntilDestroyed()` |
| Complex async flows | Observable (switchMap, debounce, etc.) |

**Pattern for Store Integration**:

```typescript
// In StoreFacade (already implemented correctly)
readonly trucks = toSignal(
  this.store.select(selectAllTrucks),
  { initialValue: [] }
);

// In Component
@Component({...})
export class TruckListComponent {
  readonly trucks = this.facade.trucks;  // Signal, no subscription needed

  readonly filteredTrucks = computed(() =>
    this.trucks().filter(t => t.status === 'ACTIVE')
  );
}
```

---

## 4. Interval and Timer Handling

### Decision: Always use `takeUntilDestroyed()` with interval/timer

**Rationale**:
- Intervals are the #1 cause of memory leaks in Angular apps
- They continue running after component destruction
- Can cause "ExpressionChangedAfterItHasBeenCheckedError"

**Pattern**:

```typescript
// BEFORE (memory leak)
ngOnInit() {
  interval(30000).subscribe(() => this.refresh());
}

// AFTER (correct)
private readonly destroyRef = inject(DestroyRef);

ngOnInit() {
  interval(30000)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => this.refresh());
}
```

---

## 5. Map/Leaflet Cleanup

### Decision: Explicit cleanup in ngOnDestroy for external libraries

**Rationale**:
- Leaflet/Google Maps don't integrate with Angular lifecycle
- Event listeners on map objects cause memory leaks
- DOM elements remain attached without explicit removal

**Pattern**:

```typescript
@Component({...})
export class LocationPickerComponent implements OnDestroy {
  private map?: L.Map;
  private markers: L.Marker[] = [];

  ngOnDestroy() {
    // Remove all markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    // Destroy map instance
    if (this.map) {
      this.map.off();  // Remove all event listeners
      this.map.remove();
      this.map = undefined;
    }
  }
}
```

---

## 6. NgRx Best Practices (Already Implemented)

### Current State: Well-implemented, no changes needed

The codebase already follows best practices:
- ✅ Memoized selectors with `createSelector()`
- ✅ StoreFacade pattern with `toSignal()`
- ✅ Proper action/reducer separation
- ✅ Effects for side effects

---

## 7. Performance Monitoring Tools

### Recommended Tooling:

| Tool | Purpose | Usage |
|------|---------|-------|
| Chrome DevTools Memory | Heap snapshots, leak detection | Manual testing |
| Chrome DevTools Performance | Runtime profiling, long tasks | Manual testing |
| Lighthouse CI | Automated performance budgets | CI/CD |
| Angular DevTools | Component tree, change detection | Development |

### Lighthouse CI Configuration:

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/frontend/browser',
    },
    assert: {
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
      },
    },
  },
};
```

---

## Summary of Decisions

| Topic | Decision | Confidence |
|-------|----------|------------|
| Subscription cleanup | `takeUntilDestroyed()` | High |
| Change detection | `OnPush` mandatory | High |
| Reactive state | Signals for sync, Observables for async | High |
| Store integration | Keep current pattern (already good) | High |
| Map cleanup | Explicit `ngOnDestroy` | High |
| Performance monitoring | Lighthouse CI | High |
