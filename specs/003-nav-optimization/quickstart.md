# Quickstart Guide: Navigation Menu Optimization

**Feature**: 003-nav-optimization
**Date**: 2025-12-22 (Updated)
**Pattern**: Header compact + Mini-sidenav hybride

## Prerequisites

- [x] Node 18+ (`node --version`)
- [x] Angular CLI 17+ (`ng version`)
- [x] Backend services running (for auth and truck data)

## Development Setup

### 1. Start Backend Services

```bash
cd /Users/salimomrani/code/java/kafka/truck_track
./start-all.sh

# Verify services
./status.sh
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm start
```

Access: http://localhost:4200

---

## Implementation Order

### Phase 1: Foundation (DONE)

1. **Update UserRole Enum** ✅
   - `ADMIN` and `DRIVER` already in `auth.model.ts`

2. **Navigation Model** ✅
   - `navigation.model.ts` with `NavItem` interface exists

3. **Navigation Service** ✅
   - `navigation.service.ts` with role-based filtering exists

### Phase 2: Header Compact (TO DO)

4. **Refactor Header Component**
   - Simplifier le header : Logo + Indicateurs + User menu only
   - Déplacer la navigation dans la sidenav
   - Ajouter BreakpointObserver pour responsive
   - Émettre `toggleSidenavEvent` au clic hamburger

5. **Header Compact Template**
   ```html
   <mat-toolbar>
     <button mat-icon-button (click)="toggleSidenav()">menu</button>
     <a routerLink="/map">Truck Track</a>
     <spacer />
     <button [matBadge]="alertCount">notifications</button>
     <button [matMenuTriggerFor]="userMenu">account_circle</button>
   </mat-toolbar>
   ```

### Phase 3: Mini-Sidenav (TO DO)

6. **Créer ou modifier Sidenav Component**
   - Support mode `mini` (56px, icônes only)
   - Support mode `full` (240px, icônes + labels)
   - Tooltip sur hover en mode mini
   - Catégories : Opérations / Administration

7. **Layout Responsive**
   ```
   Desktop: sidenav mode='side', miniMode=true, opened=true
   Tablet:  sidenav mode='over', miniMode=false, opened=false
   Mobile:  sidenav mode='over', miniMode=false, opened=false
   ```

### Phase 4: App Layout (TO DO)

8. **Update App Component**
   - Intégrer `mat-sidenav-container`
   - Gérer état via signals
   - BreakpointObserver pour transitions auto

9. **Skip Link Accessibilité**
   - Ajouter skip link "Aller au contenu"

### Phase 5: Testing & Polish

10. **Tests Unitaires**
    - Header: badge, hamburger event
    - Sidenav: filtrage par rôle, mode mini

11. **Tests E2E**
    - Navigation complète par rôle
    - Responsive breakpoints
    - Accessibilité clavier

---

## Testing

### Manual Testing Checklist

#### Role-Based Navigation

```bash
# Test with different users
# ADMIN user: admin@trucktrack.com / AdminPass123!
# FLEET_MANAGER: manager@trucktrack.com / ManagerPass123!
# DRIVER: driver@trucktrack.com / DriverPass123!
# VIEWER: viewer@trucktrack.com / ViewerPass123!
```

| Role | Expected Menu Items |
|------|---------------------|
| ADMIN | Carte, Historique, Alertes, Geofences, Administration, Profil |
| FLEET_MANAGER | Carte, Historique, Alertes, Geofences, Profil |
| DRIVER | Carte, Profil |
| VIEWER | Carte, Historique, Alertes, Geofences, Profil |

#### Responsive Testing

| Viewport | Expected Behavior |
|----------|-------------------|
| < 768px (mobile) | Hamburger menu, sidenav |
| 768-1024px (tablet) | Full desktop navbar |
| > 1024px (desktop) | Full desktop navbar |

#### Badges Testing

1. **Alerts Badge**:
   - Create alerts via the alert system
   - Badge should show count
   - Count > 99 should show "99+"

2. **Offline Trucks Badge**:
   - Stop a truck simulator for > 5 minutes
   - Badge should appear with count
   - Click should filter to offline trucks

---

## Key Files Reference

### Core Changes

| File | Purpose |
|------|---------|
| `core/models/auth.model.ts` | MODIFY - add ADMIN, DRIVER roles |
| `core/models/navigation.model.ts` | NEW - NavItem interface |
| `core/services/navigation.service.ts` | NEW - role-based nav logic |
| `core/components/header/header.component.ts` | MODIFY - dynamic navigation |
| `core/components/header/header.component.html` | MODIFY - restructure template |
| `core/components/header/header.component.scss` | MODIFY - responsive styles |
| `core/components/sidenav/sidenav.component.ts` | NEW - mobile sidenav |
| `app.component.ts` | MODIFY - integrate sidenav |
| `app.routes.ts` | MODIFY - add geofences route |

### Test Files

| File | Purpose |
|------|---------|
| `navigation.service.spec.ts` | Unit tests for navigation service |
| `header.component.spec.ts` | Unit tests for header |
| `navigation.cy.ts` | E2E tests for navigation |

---

## Common Issues

### Menu not filtering by role

- Check that `currentUser()` signal returns user with correct role
- Verify `NavigationService.getNavigationItems()` is called reactively
- Inspect browser console for role value

### Mobile menu not appearing

- Check viewport width is actually < 768px
- Verify `@media` query in SCSS is correct
- Check that hamburger button is visible

### Badges not updating

- Verify WebSocket connection is active
- Check `NotificationService.unreadCount` signal
- Verify `TruckService` offline count endpoint

### Geofences link not working

- Check that `/geofences` route exists in `app.routes.ts`
- Verify lazy-loaded component path is correct
- Check user has ADMIN or FLEET_MANAGER role

---

## Accessibility Testing

Run Lighthouse audit targeting navigation:

```bash
# In Chrome DevTools
# 1. Open Lighthouse tab
# 2. Select "Accessibility" category
# 3. Run audit
# Target: Score > 90
```

Manual checks:
- [ ] Tab through all menu items
- [ ] Press Enter to activate links
- [ ] Press Escape to close mobile menu
- [ ] Screen reader announces menu items correctly
- [ ] Focus visible on all interactive elements

---

## Next Steps

After implementation, run:
```bash
/speckit.tasks  # Generate task breakdown for implementation
```
