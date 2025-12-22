# Component Contract: HeaderComponent

**Path**: `frontend/src/app/core/components/header/header.component.ts`

## Overview

Composant header compact affichant le logo, les indicateurs critiques et le menu utilisateur.

---

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| N/A | - | - | Aucun input - utilise injection de dépendances |

---

## Outputs

| Name | Type | Description |
|------|------|-------------|
| `toggleSidenavEvent` | `EventEmitter<void>` | Émis quand l'utilisateur clique sur le bouton hamburger |

---

## Injected Dependencies

| Service | Usage |
|---------|-------|
| `StoreFacade` | Accès à `currentUser`, `isAuthenticated` |
| `Router` | Navigation programmatique (logout) |
| `NotificationService` | `unreadCount` signal pour badge alertes |
| `NavigationService` | `hasAdminAccess()` pour visibilité bouton admin |

---

## Computed Signals

| Signal | Type | Description |
|--------|------|-------------|
| `currentUser` | `Signal<User \| null>` | Utilisateur courant depuis le store |
| `isAuthenticated` | `Signal<boolean>` | État d'authentification |
| `unreadCount` | `Signal<number>` | Nombre d'alertes non lues |
| `hasAdminAccess` | `Signal<boolean>` | true si role === ADMIN |
| `currentUserRole` | `Signal<UserRole \| null>` | Rôle de l'utilisateur courant |

---

## Template Structure

```html
<mat-toolbar color="primary" class="app-header">
  <div class="header-container">
    <!-- Hamburger button (toggle sidenav) -->
    <button mat-icon-button (click)="toggleSidenav()">
      <mat-icon>menu</mat-icon>
    </button>

    <!-- Logo -->
    <a routerLink="/map" class="logo-section">
      <mat-icon>local_shipping</mat-icon>
      <span class="app-title">Truck Track</span>
    </a>

    <div class="spacer"></div>

    <!-- Critical indicators -->
    <div class="indicators">
      <!-- Alerts badge -->
      <a mat-icon-button routerLink="/alerts" [matBadge]="unreadCount()">
        <mat-icon>notifications</mat-icon>
      </a>

      <!-- Offline trucks badge (optional) -->
      @if (offlineCount() > 0) {
        <a mat-icon-button routerLink="/map" [matBadge]="offlineCount()">
          <mat-icon>signal_wifi_off</mat-icon>
        </a>
      }
    </div>

    <!-- User menu -->
    <button mat-icon-button [matMenuTriggerFor]="userMenu">
      <mat-icon>account_circle</mat-icon>
    </button>
    <mat-menu #userMenu="matMenu">
      <!-- User info, profile, logout -->
    </mat-menu>
  </div>
</mat-toolbar>
```

---

## SCSS Classes

| Class | Purpose |
|-------|---------|
| `.app-header` | Sticky positioning, shadow, z-index |
| `.header-container` | Flexbox layout, max-width |
| `.logo-section` | Logo + title alignment |
| `.spacer` | Flex: 1 to push right elements |
| `.indicators` | Badges container |

---

## Accessibility

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `role` | `banner` | Identifies toolbar as page header |
| `aria-label` | "Navigation principale" | Screen reader context |
| `aria-label` (hamburger) | "Ouvrir le menu" | Button description |
| `aria-label` (user menu) | "Menu utilisateur" | Button description |

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 768px) | Hide app title, keep icon |
| Tablet (768-1023px) | Full header visible |
| Desktop (>= 1024px) | Full header, sidenav in mini mode |

---

## State Transitions

```
User clicks hamburger → emit toggleSidenavEvent
User clicks logo → navigate to /map
User clicks alerts → navigate to /alerts
User clicks logout → call facade.logout(), navigate to /login
```

---

## Testing Requirements

| Test | Description |
|------|-------------|
| Unit | `toggleSidenavEvent` emits on hamburger click |
| Unit | Badge shows correct `unreadCount` |
| Unit | Admin button hidden for non-ADMIN roles |
| E2E | Click hamburger opens sidenav |
| E2E | Click logout redirects to login |
| A11y | Keyboard navigation works (Tab, Enter) |
