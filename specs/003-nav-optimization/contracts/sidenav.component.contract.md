# Component Contract: SidenavComponent

**Path**: `frontend/src/app/core/components/sidenav/sidenav.component.ts`

## Overview

Composant sidenav pour la navigation principale. Supporte les modes mini (icônes) et full (icônes + labels).

---

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `false` | État ouvert/fermé de la sidenav |
| `mode` | `'side' \| 'over'` | `'side'` | Mode d'affichage (push content vs overlay) |
| `miniMode` | `boolean` | `false` | Mode compact (icônes only) sur desktop |

---

## Outputs

| Name | Type | Description |
|------|------|-------------|
| `closed` | `EventEmitter<void>` | Émis quand la sidenav se ferme |
| `itemClicked` | `EventEmitter<NavItem>` | Émis quand un item est cliqué |

---

## Injected Dependencies

| Service | Usage |
|---------|-------|
| `NavigationService` | `getNavigationItemsForRole()`, `getNavigationItemsByCategory()` |
| `StoreFacade` | `currentUser` pour extraire le rôle |
| `NotificationService` | `unreadCount` pour badge Alertes |
| `Router` | Navigation et détection route active |

---

## Computed Signals

| Signal | Type | Description |
|--------|------|-------------|
| `navItems` | `Signal<NavItem[]>` | Items filtrés par rôle |
| `navItemsByCategory` | `Signal<Record<string, NavItem[]>>` | Items groupés par catégorie |
| `currentUserRole` | `Signal<UserRole \| null>` | Rôle utilisateur courant |
| `currentRoute` | `Signal<string>` | Route active pour highlighting |

---

## Template Structure

```html
<!-- Backdrop overlay for mobile -->
@if (isOpen && mode === 'over') {
  <div class="sidenav-backdrop" (click)="close()"></div>
}

<!-- Sidenav panel -->
<nav class="sidenav-panel"
     [class.open]="isOpen"
     [class.mini]="miniMode"
     role="navigation"
     aria-label="Navigation principale">

  <!-- User info header -->
  <div class="sidenav-header">
    <mat-icon class="avatar">account_circle</mat-icon>
    @if (!miniMode) {
      <div class="user-info">
        <span class="user-name">{{ getUserDisplayName() }}</span>
        <span class="user-role">{{ currentUser()?.role }}</span>
      </div>
    }
  </div>

  <mat-divider />

  <!-- Navigation items by category -->
  @for (category of ['operations', 'administration']; track category) {
    @if (navItemsByCategory()[category]?.length) {
      @if (!miniMode) {
        <div class="category-label">{{ getCategoryLabel(category) }}</div>
      }

      <mat-nav-list>
        @for (item of navItemsByCategory()[category]; track item.route) {
          <a mat-list-item
             [routerLink]="item.route"
             routerLinkActive="active"
             (click)="onItemClick(item)"
             [matTooltip]="miniMode ? item.label : ''"
             matTooltipPosition="right">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            @if (!miniMode) {
              <span matListItemTitle>{{ item.label }}</span>
            }
            @if (isAlertsRoute(item) && unreadCount() > 0) {
              <span class="nav-badge">{{ formatBadge(unreadCount()) }}</span>
            }
          </a>
        }
      </mat-nav-list>

      <mat-divider />
    }
  }

  <!-- Profile link -->
  <mat-nav-list>
    <a mat-list-item routerLink="/profile" routerLinkActive="active">
      <mat-icon matListItemIcon>person</mat-icon>
      @if (!miniMode) {
        <span matListItemTitle>Profil</span>
      }
    </a>
  </mat-nav-list>
</nav>
```

---

## SCSS Classes

| Class | Purpose |
|-------|---------|
| `.sidenav-panel` | Fixed positioning, width, background |
| `.sidenav-panel.open` | Transform translateX(0) |
| `.sidenav-panel.mini` | Width: 56px (icons only) |
| `.sidenav-backdrop` | Full-screen overlay with opacity |
| `.sidenav-header` | User info section with gradient |
| `.category-label` | Category heading style |
| `.nav-badge` | Inline notification badge |
| `.active` | Active route highlighting |

---

## Dimensions

| Mode | Width | Icon Size |
|------|-------|-----------|
| Full | 240px | 24px |
| Mini | 56px | 24px |
| Mobile | 280px (max 85vw) | 24px |

---

## Animations

| Animation | Duration | Easing |
|-----------|----------|--------|
| Slide in/out | 250ms | cubic-bezier(0.4, 0, 0.2, 1) |
| Backdrop fade | 250ms | ease-in-out |
| Hover highlight | 150ms | ease |

---

## Accessibility

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `role` | `navigation` | Identifies nav region |
| `aria-label` | "Navigation principale" | Screen reader context |
| `aria-current` | `page` (via routerLinkActive) | Current page indicator |
| `tabindex` | `0` | Keyboard focusable items |
| Escape key | Close sidenav | Keyboard dismiss |

---

## Responsive Behavior

| Breakpoint | Mode | Width | Behavior |
|------------|------|-------|----------|
| Mobile (< 768px) | `over` | 280px | Overlay, auto-close on nav |
| Tablet (768-1023px) | `over` | 240px | Overlay, click to open |
| Desktop (>= 1024px) | `side` | 56px mini / 240px full | Persistent, hover expand optional |

---

## State Transitions

```
Backdrop click → emit closed
Item click → emit itemClicked, close if mode === 'over'
Escape key → emit closed
Window resize → update mode based on breakpoint
Hover (desktop mini) → expand to show labels
```

---

## Testing Requirements

| Test | Description |
|------|-------------|
| Unit | Items filtered by role correctly |
| Unit | Badge displays formatted count |
| Unit | Active route gets `.active` class |
| Unit | `closed` emits on backdrop click |
| E2E | Click item navigates to route |
| E2E | Mobile: sidenav closes after navigation |
| E2E | Desktop mini: hover shows labels |
| A11y | Escape closes sidenav |
| A11y | Tab navigation through items |
| A11y | Screen reader announces current page |
