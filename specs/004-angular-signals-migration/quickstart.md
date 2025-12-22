# Quickstart: Angular Modern Patterns Migration

**Feature**: Angular Modern Patterns Migration
**Date**: 2025-12-22

## Prerequisites

- Node.js 18+ installed
- Angular CLI 17.3+ (`npm install -g @angular/cli`)
- Frontend dependencies installed (`cd frontend && npm install`)

## Development Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# or
ng serve

# Open browser at http://localhost:4200
```

## Migration Commands Reference

### Testing After Migration

```bash
# Run all tests
npm test

# Run tests for specific module
ng test --include="**/core/**"       # Core module
ng test --include="**/features/**"   # Features module
ng test --include="**/admin/**"      # Admin module

# Run tests in CI mode (headless)
npm run test:ci
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Build

```bash
# Development build
ng build

# Production build
ng build --configuration=production
```

## Migration Pattern Reference

### Input Migration

```typescript
// Step 1: Update imports
import { input } from '@angular/core';  // Add
// Remove: Input from imports if no longer used

// Step 2: Convert property
// Before:
@Input() name: string = '';

// After:
name = input<string>('');

// Step 3: Update template access
// Before: {{ name }}
// After:  {{ name() }}
```

### Output Migration

```typescript
// Step 1: Update imports
import { output } from '@angular/core';  // Add
// Remove: Output, EventEmitter from imports if no longer used

// Step 2: Convert property
// Before:
@Output() clicked = new EventEmitter<void>();

// After:
clicked = output<void>();

// Usage unchanged:
this.clicked.emit();
```

### Template Migration

```html
<!-- ngIf to @if -->
<!-- Before -->
<div *ngIf="condition">Content</div>

<!-- After -->
@if (condition) {
  <div>Content</div>
}

<!-- ngFor to @for -->
<!-- Before -->
<div *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</div>

<!-- After -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div>No items</div>
}
```

## Files to Migrate

### Priority 1 (Core Components)

| File | Task |
|------|------|
| `core/components/sidenav/sidenav.component.ts` | Convert @Input/@Output to signals |

### Priority 2 (Admin Components)

| File | Task |
|------|------|
| `admin/shared/data-table/data-table.component.ts` | Convert @Input/@Output to signals |
| `admin/shared/data-table/data-table.component.html` | Convert *ngIf/*ngFor to @if/@for |

### Priority 3 (Features Components)

| File | Task |
|------|------|
| `features/map/geofence-panel/geofence-panel.component.ts` | Harmonize mixed patterns |

## Validation Checklist

After migrating each component:

- [ ] Component compiles without errors
- [ ] All existing tests pass
- [ ] Component renders correctly in browser
- [ ] Parent component bindings work unchanged
- [ ] Output events emit correctly
- [ ] No console errors in development mode

## Troubleshooting

### Common Issues

**Error: Property 'x' does not exist on type 'Signal<T>'**
- You're accessing a signal without calling it
- Fix: Change `this.input` to `this.input()`

**Error: Cannot assign to 'x' because it is a read-only property**
- Signals are read-only; use `.set()` or `.update()`
- Fix: Change `this.signal = value` to `this.signal.set(value)`

**Error: ExpressionChangedAfterItHasBeenCheckedError**
- Signal change during template rendering
- Fix: Wrap mutation in `afterNextRender()` or move to effect()

**Test failing: Cannot read property of undefined**
- Input not set in test
- Fix: Use `fixture.componentRef.setInput('inputName', value)`

## Resources

- [Angular Signal Inputs RFC](https://github.com/angular/angular/discussions/49682)
- [Angular Control Flow](https://angular.dev/guide/templates/control-flow)
- [Angular Signals Guide](https://angular.dev/guide/signals)
