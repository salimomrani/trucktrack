# Data Model: Angular Modern Patterns Migration

**Feature**: Angular Modern Patterns Migration
**Date**: 2025-12-22
**Status**: Complete

## Overview

This migration is a frontend refactoring effort. There are no new data entities or API changes. This document captures the **component interface changes** from decorator-based to signal-based patterns.

---

## Component Interface Changes

### 1. SidenavComponent

**Location**: `frontend/src/app/core/components/sidenav/sidenav.component.ts`

#### Current Interface (Decorator-based)
```typescript
// Inputs
@Input() navItems: NavItem[] = [];
@Input() isOpen = false;
@Input() miniMode = false;

// Outputs
@Output() closed = new EventEmitter<void>();
@Output() itemClicked = new EventEmitter<NavItem>();
```

#### Target Interface (Signal-based)
```typescript
// Inputs
navItems = input<NavItem[]>([]);
isOpen = input<boolean>(false);
miniMode = input<boolean>(false);

// Outputs
closed = output<void>();
itemClicked = output<NavItem>();
```

#### Template Access Changes
| Property | Before | After |
|----------|--------|-------|
| navItems | `navItems` | `navItems()` |
| isOpen | `isOpen` | `isOpen()` |
| miniMode | `miniMode` | `miniMode()` |

#### Required Imports Change
```typescript
// Before
import { Input, Output, EventEmitter } from '@angular/core';

// After
import { input, output } from '@angular/core';
```

---

### 2. DataTableComponent

**Location**: `frontend/src/app/admin/shared/data-table/data-table.component.ts`

#### Current Interface (Decorator-based)
```typescript
// Inputs (16 total)
@Input() columns: TableColumn[] = [];
@Input() data: T[] = [];
@Input() loading = false;
@Input() pageSizeOptions: number[] = [5, 10, 25, 50];
@Input() pageSize = 10;
@Input() totalElements = 0;
@Input() pageIndex = 0;
@Input() sortActive = '';
@Input() sortDirection: SortDirection = '';
@Input() selectable = false;
@Input() selectedItems: T[] = [];
@Input() rowActions: RowAction<T>[] = [];
@Input() emptyMessage = 'Aucune donnée disponible';
@Input() stickyHeader = true;
@Input() showPaginator = true;
@Input() trackBy: TrackByFunction<T> = (index, item) => item;

// Outputs (6 total)
@Output() pageChange = new EventEmitter<PageEvent>();
@Output() sortChange = new EventEmitter<Sort>();
@Output() selectionChange = new EventEmitter<T[]>();
@Output() rowClick = new EventEmitter<T>();
@Output() actionClick = new EventEmitter<{action: RowAction<T>, item: T}>();
@Output() refresh = new EventEmitter<void>();
```

#### Target Interface (Signal-based)
```typescript
// Inputs
columns = input<TableColumn[]>([]);
data = input<T[]>([]);
loading = input<boolean>(false);
pageSizeOptions = input<number[]>([5, 10, 25, 50]);
pageSize = input<number>(10);
totalElements = input<number>(0);
pageIndex = input<number>(0);
sortActive = input<string>('');
sortDirection = input<SortDirection>('');
selectable = input<boolean>(false);
selectedItems = input<T[]>([]);
rowActions = input<RowAction<T>[]>([]);
emptyMessage = input<string>('Aucune donnée disponible');
stickyHeader = input<boolean>(true);
showPaginator = input<boolean>(true);
trackBy = input<TrackByFunction<T>>((index, item) => item);

// Outputs
pageChange = output<PageEvent>();
sortChange = output<Sort>();
selectionChange = output<T[]>();
rowClick = output<T>();
actionClick = output<{action: RowAction<T>, item: T}>();
refresh = output<void>();
```

---

### 3. GeofencePanelComponent

**Location**: `frontend/src/app/features/map/geofence-panel/geofence-panel.component.ts`

#### Current State
Mixed patterns - some signals, some decorators. Needs harmonization.

#### Target State
Full signal-based inputs/outputs consistent with other components.

---

## Signal Type Reference

### Input Signal Types

| Pattern | TypeScript Signature | Use Case |
|---------|---------------------|----------|
| Optional with default | `input<T>(defaultValue)` | Most inputs |
| Required | `input.required<T>()` | Mandatory inputs |
| With transform | `input(default, { transform: fn })` | Boolean attributes, etc. |
| Aliased | `input<T>({ alias: 'name' })` | Different external name |

### Output Signal Types

| Pattern | TypeScript Signature | Use Case |
|---------|---------------------|----------|
| Typed output | `output<T>()` | Events with payload |
| Void output | `output<void>()` | Events without payload |
| Aliased | `output<T>({ alias: 'name' })` | Different external name |

---

## Template Syntax Reference

### Control Flow Mapping

| Legacy | Modern | Notes |
|--------|--------|-------|
| `*ngIf="cond"` | `@if (cond) { }` | Simple condition |
| `*ngIf="cond; else tmpl"` | `@if (cond) { } @else { }` | With else branch |
| `*ngIf="val as item"` | `@if (val; as item) { }` | With alias |
| `*ngFor="let x of xs"` | `@for (x of xs; track x.id) { }` | Track required |
| `*ngFor="...; index as i"` | `@for (x of xs; track x.id; let i = $index) { }` | With index |
| `*ngSwitch="val"` | `@switch (val) { }` | Switch block |
| `*ngSwitchCase="'x'"` | `@case ('x') { }` | Case block |
| `*ngSwitchDefault` | `@default { }` | Default block |

### Built-in Variables in @for

| Variable | Description |
|----------|-------------|
| `$index` | Current iteration index |
| `$first` | Boolean - is first item |
| `$last` | Boolean - is last item |
| `$even` | Boolean - even index |
| `$odd` | Boolean - odd index |
| `$count` | Total number of items |

---

## Impact Analysis

### Breaking Changes
**None** - Signal-based APIs are backward compatible:
- Parent templates use same binding syntax: `[input]="value"`, `(output)="handler($event)"`
- Output `.emit()` method unchanged

### Non-Breaking Internal Changes
- Property access in component class: `this.input` → `this.input()`
- Setting values: Direct assignment → `this.signal.set(value)`

### Test Impact
- Unit tests accessing component inputs need update
- Use `fixture.componentRef.setInput('name', value)` for setting
- Use `component.inputName()` for reading signal values
