# Data Model: Navigation Optimization

**Feature**: 003-nav-optimization | **Date**: 2025-12-22

## Overview

Ce document définit les modèles de données pour l'optimisation de la navigation. Les modèles existants sont déjà en place et fonctionnels.

---

## Existing Models (Already Implemented)

### NavItem Interface

```typescript
// frontend/src/app/core/models/navigation.model.ts
export interface NavItem {
  label: string;           // Display label
  route: string;           // Router link path
  icon: string;            // Material icon name
  roles: UserRole[];       // Allowed roles (empty = all)
  badge?: Signal<number>;  // Dynamic badge count
  badgeColor?: 'primary' | 'accent' | 'warn';
  divider?: boolean;       // Separator flag
  children?: NavItem[];    // Sub-menu items
  category?: string;       // Grouping category
}
```

### NavCategory Interface

```typescript
export interface NavCategory {
  label: string;
  items: NavItem[];
}
```

### UserRole Enum

```typescript
// frontend/src/app/core/models/auth.model.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  DISPATCHER = 'DISPATCHER',
  DRIVER = 'DRIVER',
  VIEWER = 'VIEWER'
}
```

---

## New Models (To Add)

### NavigationState Interface

État du système de navigation pour gérer le responsive et l'état de la sidenav.

```typescript
// frontend/src/app/core/models/navigation.model.ts

/**
 * Navigation layout state for responsive behavior
 */
export interface NavigationState {
  /** Sidenav open/closed state */
  sidenavOpen: boolean;

  /** Sidenav mode: 'side' (push), 'over' (overlay), 'push' */
  sidenavMode: 'side' | 'over' | 'push';

  /** Mini mode (icons only) on desktop */
  miniMode: boolean;

  /** Current breakpoint */
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}
```

### NavigationConfig Interface

Configuration statique pour les breakpoints et comportements.

```typescript
/**
 * Navigation configuration constants
 */
export interface NavigationConfig {
  /** Breakpoint thresholds in pixels */
  breakpoints: {
    mobile: number;   // < 768px
    tablet: number;   // 768-1023px
    desktop: number;  // >= 1024px
  };

  /** Sidenav dimensions */
  dimensions: {
    miniWidth: number;  // 56px
    fullWidth: number;  // 240px
  };

  /** Animation timing in ms */
  animationDuration: number;  // 250ms
}

/** Default configuration */
export const DEFAULT_NAV_CONFIG: NavigationConfig = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1024
  },
  dimensions: {
    miniWidth: 56,
    fullWidth: 240
  },
  animationDuration: 250
};
```

### HeaderIndicator Interface

Indicateurs affichés dans le header (alertes, offline trucks).

```typescript
/**
 * Header indicator for critical information
 */
export interface HeaderIndicator {
  /** Unique identifier */
  id: string;

  /** Material icon name */
  icon: string;

  /** Badge count (0 = hidden) */
  count: number;

  /** Badge display text (e.g., "99+") */
  displayText: string;

  /** Badge color */
  color: 'primary' | 'accent' | 'warn';

  /** Click route */
  route: string;

  /** Tooltip text */
  tooltip: string;

  /** Pulse animation enabled */
  pulse: boolean;
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Component                            │
│  ┌─────────────────┐                    ┌────────────────────┐  │
│  │  NavigationState │◀──────────────────│  BreakpointObserver│  │
│  └────────┬────────┘                    └────────────────────┘  │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Header Component                      │    │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐   │    │
│  │  │   Logo   │  │  Indicators  │  │   User Menu     │   │    │
│  │  └──────────┘  └──────────────┘  └─────────────────┘   │    │
│  │                       │                                  │    │
│  │                       ▼                                  │    │
│  │        ┌─────────────────────────────┐                  │    │
│  │        │  NotificationService        │                  │    │
│  │        │  (unreadCount signal)       │                  │    │
│  │        └─────────────────────────────┘                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Sidenav Component                      │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │           NavigationService                        │  │    │
│  │  │  - getNavigationItemsForRole(role)                │  │    │
│  │  │  - getNavigationItemsByCategory(role)             │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  │                          │                               │    │
│  │                          ▼                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │  Operations  │  │ Administration│  │   Profile    │  │    │
│  │  │  - Map       │  │ - Users       │  │              │  │    │
│  │  │  - History   │  │ - Trucks      │  │              │  │    │
│  │  │  - Alerts    │  │ - Config      │  │              │  │    │
│  │  │  - Geofences │  │               │  │              │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation Items by Role

| Item | ADMIN | FLEET_MANAGER | DISPATCHER | DRIVER | VIEWER |
|------|-------|---------------|------------|--------|--------|
| Carte | ✅ | ✅ | ✅ | ✅ | ✅ |
| Historique | ✅ | ✅ | ✅ | ❌ | ✅ |
| Alertes | ✅ | ✅ | ✅ | ❌ | ✅ |
| Geofences | ✅ | ✅ | ❌ | ❌ | ❌ |
| Utilisateurs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Camions | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configuration | ✅ | ❌ | ❌ | ❌ | ❌ |
| Profil | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## State Management

### Existing Store (NgRx)

L'état utilisateur est déjà géré via NgRx :

```typescript
// frontend/src/app/store/store.facade.ts
currentUser: Signal<User | null>
isAuthenticated: Signal<boolean>
```

### Navigation State (Local)

L'état de navigation sera géré localement dans le composant avec Angular signals :

```typescript
// Dans app.component.ts ou navigation-layout.component.ts
sidenavOpen = signal(false);
sidenavMode = signal<'side' | 'over'>('side');
miniMode = signal(false);
currentBreakpoint = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
```

---

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| NavItem.route | Must start with '/' | "Route must be absolute path" |
| NavItem.icon | Must be valid Material icon | "Invalid icon name" |
| NavItem.roles | Array, can be empty | N/A (empty = all roles) |
| Badge count | >= 0 | N/A (default 0) |
| Badge displayText | "99+" if count > 99 | N/A |
