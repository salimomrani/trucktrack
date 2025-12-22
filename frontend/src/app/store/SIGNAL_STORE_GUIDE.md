# NgRx Signal Store Guide

## Overview

This guide documents how to use NgRx Signal Store for new state management needs in the TruckTrack application. The existing `StoreFacade` pattern with `toSignal()` remains the primary approach for established state slices.

## Current Architecture

### StoreFacade Pattern (Existing)

The application uses `StoreFacade` as the primary state management abstraction:

```typescript
// store/store.facade.ts
@Injectable({ providedIn: 'root' })
export class StoreFacade {
  private store = inject(Store);

  // Selectors exposed as signals via toSignal()
  readonly trucks = toSignal(this.store.select(selectTrucks), { initialValue: [] });
  readonly currentUser = toSignal(this.store.select(selectCurrentUser));
  readonly isAuthenticated = toSignal(this.store.select(selectIsAuthenticated), { initialValue: false });

  // Computed signals for derived state
  readonly trucksCount = computed(() => this.trucks().length);
  readonly hasActiveTrucks = computed(() => this.trucksCount() > 0);

  // Actions dispatched via facade methods
  login(credentials: LoginRequest): void {
    this.store.dispatch(AuthActions.login({ credentials }));
  }
}
```

**Why keep StoreFacade:**
- Well-tested and stable
- Integrates with NgRx DevTools
- Supports complex effects and side effects
- Already uses `toSignal()` for reactive consumption

## When to Use NgRx Signal Store

Use Signal Store for **new, feature-local state** that:
- Is scoped to a single feature or component tree
- Has simple CRUD operations
- Doesn't require complex side effects
- Benefits from simpler boilerplate

### Signal Store Example

```typescript
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface GeofenceState {
  geofences: Geofence[];
  loading: boolean;
  error: string | null;
}

const initialState: GeofenceState = {
  geofences: [],
  loading: false,
  error: null
};

export const GeofenceStore = signalStore(
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    loadGeofences() {
      patchState(store, { loading: true, error: null });
      http.get<Geofence[]>('/api/geofences').subscribe({
        next: (geofences) => patchState(store, { geofences, loading: false }),
        error: (err) => patchState(store, { error: err.message, loading: false })
      });
    },
    addGeofence(geofence: Geofence) {
      patchState(store, { geofences: [...store.geofences(), geofence] });
    },
    removeGeofence(id: string) {
      patchState(store, {
        geofences: store.geofences().filter(g => g.id !== id)
      });
    }
  }))
);
```

### Using Signal Store in Components

```typescript
@Component({
  selector: 'app-geofence-manager',
  standalone: true,
  providers: [GeofenceStore], // Scoped to this component tree
  template: `
    @if (store.loading()) {
      <mat-spinner></mat-spinner>
    } @else {
      @for (geofence of store.geofences(); track geofence.id) {
        <app-geofence-card [geofence]="geofence" />
      }
    }
  `
})
export class GeofenceManagerComponent {
  readonly store = inject(GeofenceStore);

  ngOnInit() {
    this.store.loadGeofences();
  }
}
```

## Coexistence Strategy

### 1. StoreFacade for Global State
- Authentication (user, tokens)
- Trucks (fleet-wide data)
- UI state (sidebar, theme)
- Data loaded at app startup

### 2. Signal Store for Feature State
- Feature-specific entities
- Wizard/form state
- Modal dialogs with local state
- Temporary UI state

### 3. Component Signals for Local State
- Loading indicators
- Form validation state
- Toggle states
- Animation triggers

## Migration Path (If Needed)

If migrating an existing NgRx slice to Signal Store:

1. Create new Signal Store alongside existing slice
2. Migrate consumers one component at a time
3. Remove old slice only when fully migrated
4. Test thoroughly at each step

**Recommendation:** Only migrate if there's a clear benefit. Avoid migrating working code for the sake of consistency.

## Best Practices

### DO
- Use `computed()` for derived state
- Keep stores focused on single responsibility
- Provide stores at appropriate injection scope
- Use descriptive method names

### DON'T
- Migrate working StoreFacade code without reason
- Create deeply nested signal stores
- Mix Signal Store and classic NgRx in same feature
- Use signals for non-reactive data

## Related Documentation

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [NgRx Signal Store](https://ngrx.io/guide/signals)
- [StoreFacade Pattern](./store.facade.ts)
