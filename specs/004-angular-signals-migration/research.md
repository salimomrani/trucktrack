# Research: Angular Modern Patterns Migration

**Feature**: Angular Modern Patterns Migration
**Date**: 2025-12-22
**Status**: Complete

## 1. Signal Inputs Migration

### Decision
Use Angular 17+ `input()` function to replace `@Input()` decorators.

### Rationale
- Native Angular API since v17.1
- Better type inference and IDE support
- Integrates with Angular's signal-based reactivity system
- Enables fine-grained change detection without Zone.js dependency
- Backward compatible - parent components don't need changes

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Keep @Input() decorators | Deprecated pattern, missed performance benefits |
| Custom signal wrappers | Reinventing built-in functionality |

### Migration Pattern

**Before:**
```typescript
@Input() name: string = '';
@Input({ required: true }) id!: string;
@Input({ transform: booleanAttribute }) disabled = false;
```

**After:**
```typescript
name = input<string>('');
id = input.required<string>();
disabled = input(false, { transform: booleanAttribute });
```

**Template Access:**
- Before: `{{ name }}`
- After: `{{ name() }}` (signal call)

---

## 2. Signal Outputs Migration

### Decision
Use Angular 17+ `output()` function to replace `@Output()` with EventEmitter.

### Rationale
- Consistent API with signal inputs
- No need to import EventEmitter
- Cleaner syntax with `.emit()` method
- Better tree-shaking potential

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Keep @Output() + EventEmitter | Older pattern, inconsistent with input() |
| RxJS Subject directly | Less Angular-native, manual cleanup needed |

### Migration Pattern

**Before:**
```typescript
@Output() clicked = new EventEmitter<void>();
@Output() valueChange = new EventEmitter<string>();
```

**After:**
```typescript
clicked = output<void>();
valueChange = output<string>();
```

**Usage remains the same:**
```typescript
this.clicked.emit();
this.valueChange.emit('new value');
```

---

## 3. Modern Control Flow Syntax

### Decision
Replace structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`) with built-in control flow (`@if`, `@for`, `@switch`).

### Rationale
- Better performance (no directive instantiation overhead)
- Cleaner syntax with native template blocks
- `@empty` block for empty arrays
- `track` is required, encouraging better performance
- No need to import CommonModule for these features

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Keep *ngIf/*ngFor/*ngSwitch | Older pattern, performance overhead |
| Custom structural directives | Unnecessary complexity |

### Migration Patterns

**@if (replaces *ngIf):**
```html
<!-- Before -->
<div *ngIf="condition">Content</div>
<div *ngIf="condition; else elseBlock">Content</div>

<!-- After -->
@if (condition) {
  <div>Content</div>
} @else {
  <div>Else content</div>
}
```

**@for (replaces *ngFor):**
```html
<!-- Before -->
<div *ngFor="let item of items; trackBy: trackById">{{ item.name }}</div>

<!-- After -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div>No items</div>
}
```

**@switch (replaces *ngSwitch):**
```html
<!-- Before -->
<div [ngSwitch]="status">
  <span *ngSwitchCase="'active'">Active</span>
  <span *ngSwitchDefault>Unknown</span>
</div>

<!-- After -->
@switch (status) {
  @case ('active') { <span>Active</span> }
  @default { <span>Unknown</span> }
}
```

---

## 4. Component Signal Properties

### Decision
Convert reactive component properties to signals where they trigger UI updates.

### Rationale
- Fine-grained reactivity without Zone.js
- Better performance with OnPush change detection
- Automatic template updates when signal value changes
- Clear distinction between mutable and computed state

### Candidates for Signal Conversion
Per clarification: Only properties that are **modified and trigger UI updates** should be converted.

**Convert to signal():**
- Loading states: `isLoading = signal(false)`
- UI toggle states: `isExpanded = signal(false)`
- Form state flags: `hidePassword = signal(true)`
- Pagination state: `currentPage = signal(0)`

**Convert to computed():**
- Derived values that depend on other signals
- Filtered/sorted data based on input signals

**Keep as regular properties:**
- Constants that never change
- Configuration values set once
- Values only read by services (not templates)

---

## 5. NgRx Signal Store Strategy

### Decision
Keep existing StoreFacade intact. Use NgRx Signal Store only for NEW state management needs.

### Rationale
- Existing StoreFacade already uses `toSignal()` for reactive data
- Migration risk is high for established patterns
- Signal Store is ideal for new features without legacy baggage
- Coexistence allows gradual adoption without breaking changes

### Implementation Guidelines
1. **Existing state**: Continue using StoreFacade with toSignal()
2. **New feature state**: Consider NgRx Signal Store if:
   - State is feature-local (not shared across app)
   - Simple CRUD operations
   - No complex side effects needed
3. **Avoid**: Migrating working NgRx slices just for the sake of it

---

## 6. Testing Strategy

### Decision
Run tests after each functional module is migrated (per clarification).

### Module Testing Order
1. **Core module** → `ng test --include="**/core/**"`
2. **Features module** → `ng test --include="**/features/**"`
3. **Admin module** → `ng test --include="**/admin/**"`
4. **Full suite** → `npm test`

### Test Adaptation Needs
Most tests should work unchanged because:
- Signal inputs work with same template bindings
- Signal outputs use same `.emit()` API
- Control flow produces same DOM structure

**Potential updates needed:**
- Direct property access in tests: `component.name` → `component.name()`
- Setting inputs in tests: Use `fixture.componentRef.setInput('name', value)`

---

## 7. CommonModule Removal

### Decision
Remove CommonModule import from standalone components that only use new control flow.

### Rationale
- New control flow is built-in, no import needed
- Reduces bundle size slightly
- Cleaner component imports array

### When to Keep CommonModule
- Component uses `NgClass`, `NgStyle`, `AsyncPipe`, `DatePipe`, etc.
- Component uses legacy *ngIf/*ngFor (not yet migrated)

---

## 8. Codebase Analysis Summary

### Current State
- **~80% already modernized** with signals, computed, effects
- **~20% hybrid** using @Input/@Output decorators
- Templates are **~90% modern** control flow, ~10% legacy

### Files to Migrate

| File | Type | Effort |
|------|------|--------|
| sidenav.component.ts | @Input → input(), @Output → output() | Low |
| data-table.component.ts | @Input → input(), @Output → output() | Medium |
| data-table.component.html | *ngIf/*ngFor → @if/@for | Medium |
| geofence-panel.component.ts | Mixed signals cleanup | Low |

### No Migration Needed
- External libraries (Leaflet, Angular Material)
- Third-party components
- NgRx store (already optimal pattern)
