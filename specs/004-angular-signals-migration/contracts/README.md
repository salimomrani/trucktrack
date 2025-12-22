# Contracts: Angular Modern Patterns Migration

**Feature**: Angular Modern Patterns Migration
**Date**: 2025-12-22

## Overview

This migration is a **frontend-only refactoring** with no API changes. There are no new HTTP endpoints, WebSocket contracts, or backend service modifications.

## Contract Status

| Type | Status | Notes |
|------|--------|-------|
| REST API | ✅ No changes | Existing APIs unchanged |
| WebSocket | ✅ No changes | Existing subscriptions unchanged |
| GraphQL | N/A | Not used in project |
| Component Inputs/Outputs | ⚠️ Internal change | Same external API, different internal implementation |

## Component Contract Compatibility

### External Contract (Parent → Child)

**No changes required for parent components:**

```html
<!-- Works identically before and after migration -->
<app-sidenav
  [navItems]="items"
  [isOpen]="true"
  [miniMode]="false"
  (closed)="onClose()"
  (itemClicked)="onItemClick($event)">
</app-sidenav>
```

### Internal Contract (Child implementation)

**Change is internal only:**

```typescript
// Before (decorator-based)
@Input() navItems: NavItem[] = [];

// After (signal-based)
navItems = input<NavItem[]>([]);

// External binding syntax unchanged
// Only internal access changes: this.navItems → this.navItems()
```

## Validation Checklist

- [ ] All parent component bindings work unchanged after migration
- [ ] All output event handlers receive same event payloads
- [ ] Test fixtures can set inputs using `setInput()` API
- [ ] No runtime errors in production build
