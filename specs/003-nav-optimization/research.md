# Research: Optimisation du Menu de Navigation

**Feature**: 003-nav-optimization
**Date**: 2025-12-22 (Updated)
**Focus**: Améliorer l'ergonomie du header avec pattern hybride

## Research Decisions

### R1: Mobile Menu Component Strategy

**Decision**: Utiliser Angular Material Sidenav (`mat-sidenav`) pour le menu mobile

**Rationale**:
- Déjà inclus dans les dépendances du projet (Angular Material 17)
- Support natif des animations slide-in/slide-out
- Accessibilité intégrée (ARIA, keyboard navigation)
- Support du backdrop click pour fermeture

**Alternatives considérées**:
- Custom CSS drawer: Plus de contrôle mais temps de développement plus long, accessibilité à implémenter
- CDK Overlay: Plus bas niveau, nécessite plus de code boilerplate
- Third-party (ngx-sidenav): Dépendance supplémentaire non nécessaire

### R2: Role-Based Navigation Filtering

**Decision**: Créer un NavigationService centralisé avec logique de filtrage

**Rationale**:
- Centralise la logique de permissions en un seul endroit
- Facilement testable unitairement
- Peut être réutilisé dans d'autres composants si nécessaire
- Utilise les signaux Angular 17 pour la réactivité

**Alternatives considérées**:
- Directive *ngIf inline: Logique dispersée, difficile à maintenir
- Guard-based avec route data: Trop couplé au routing, pas adapté pour le menu
- Store selector: Ajoute de la complexité NgRx non nécessaire pour cette feature

### R3: Offline Trucks Indicator Data Source

**Decision**: Consommer l'endpoint existant `/trucks/summary` ou WebSocket pour le compteur

**Rationale**:
- L'API de location-service expose déjà les statuts des camions
- Le WebSocket de truck positions peut être utilisé pour calculer les offline (> 5 min sans signal)
- Évite de créer un nouvel endpoint backend

**Alternatives considérées**:
- Nouvel endpoint `/trucks/offline-count`: Overhead backend non nécessaire
- Calcul côté client uniquement: Moins précis, dépend de la présence des trucks dans le viewport

### R4: Responsive Breakpoint Strategy

**Decision**: Single breakpoint à 768px avec Media Queries CSS

**Rationale**:
- 768px est le standard pour la transition mobile/desktop
- Simplifie la logique (2 états: mobile/desktop)
- Tablettes (768-1024px) utilisent le menu desktop complet
- Angular Material BreakpointObserver disponible si besoin de logique TypeScript

**Alternatives considérées**:
- Multiple breakpoints (320, 768, 1024, 1920): Trop complexe pour cette feature
- Container queries: Support navigateur encore limité
- JavaScript-based resize observer: Overhead inutile, CSS suffit

### R5: UserRole Enum Extension

**Decision**: Ajouter ADMIN et DRIVER au enum UserRole existant

**Rationale**:
- Le backend auth-service supporte déjà ces rôles
- Le frontend doit les refléter pour le filtrage
- Modification mineure du modèle existant

**Code Pattern**:
```typescript
export enum UserRole {
  ADMIN = 'ADMIN',           // NEW
  FLEET_MANAGER = 'FLEET_MANAGER',
  DRIVER = 'DRIVER',         // NEW
  DISPATCHER = 'DISPATCHER',
  VIEWER = 'VIEWER'
}
```

### R6: Navigation Item Model

**Decision**: Créer une interface NavItem pour structurer les éléments de menu

**Rationale**:
- Typage fort pour les items de navigation
- Support des badges, icônes, rôles requis
- Facilite l'extension future

**Code Pattern**:
```typescript
export interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles: UserRole[];        // Rôles autorisés
  badge?: () => number;     // Signal pour badge dynamique
  badgeColor?: 'primary' | 'accent' | 'warn';
  children?: NavItem[];     // Pour sous-menus futurs
}
```

### R7: Animation Timing

**Decision**: 250ms pour les animations d'ouverture/fermeture du sidenav

**Rationale**:
- Sous le seuil de 300ms spécifié dans les exigences
- Perçu comme fluide mais pas lent
- Correspond aux defaults d'Angular Material

**Alternatives considérées**:
- 200ms: Trop rapide, peut sembler brusque
- 300ms: Exactement au seuil, préférable d'avoir une marge

### R8: Badge Display Format

**Decision**: Utiliser MatBadge pour les badges de notification

**Rationale**:
- Composant Angular Material existant
- Support du "99+" automatique configurable
- Style cohérent avec le reste de l'UI

**Alternatives considérées**:
- Custom span avec CSS: Plus de travail, moins accessible
- Third-party badge library: Dépendance inutile

## Existing Code Analysis

### Current Header Component

Le header actuel (`header.component.ts`) a déjà:
- ✅ Logo et titre
- ✅ Badge d'alertes non lues avec WebSocket
- ✅ Menu utilisateur avec logout
- ❌ Pas de filtrage par rôle
- ❌ Pas de menu hamburger mobile
- ❌ Pas d'indicateur offline trucks
- ❌ Pas de lien Geofences

### Routes Existantes

`app.routes.ts` contient:
- `/map` - Live Map
- `/history` - History
- `/alerts` - Alerts
- `/login` - Login
- `/unauthorized` - Unauthorized

**Manquant**: `/geofences`, `/admin/*`

### UserRole Enum

Actuellement défini avec seulement: `FLEET_MANAGER`, `DISPATCHER`, `VIEWER`
**Manquant**: `ADMIN`, `DRIVER`

## Implementation Dependencies

| Dépendance | Status | Action |
|------------|--------|--------|
| Angular Material Sidenav | ✅ Installé | Importer MatSidenavModule |
| NgRx Store (user role) | ✅ Disponible | Utiliser currentUser signal |
| WebSocket notifications | ✅ Fonctionnel | Réutiliser pour offline trucks |
| Geofences page | ✅ Existe | Ajouter route et lien |
| Admin pages | 🔶 002-admin-panel | Conditionnel si branch mergée |

---

## R9: Pattern de Navigation Ergonomique (2025-12-22)

### Decision

**Navigation Hybride** : Header compact + Mini-sidenav expandable sur desktop, Sidenav overlay sur mobile

### Rationale

Pour une application de tracking de flotte temps réel, les best practices 2025 recommandent :

1. **Indicateurs critiques toujours visibles** dans le header (alertes, offline trucks)
2. **Navigation en sidenav** pour accès 1-clic sans encombrer le header
3. **Mode mini (icônes)** sur desktop pour maximiser l'espace carte
4. **Overlay sur mobile** pour priorité absolue au contenu

### Sources

- [Fleet Management Dashboard Design | Hicron Software](https://hicronsoftware.com/blog/fleet-management-dashboard-design/)
- [UX Strategies for Real-Time Dashboards | Smashing Magazine](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)
- [Dashboard UX Best Practices | UXPin](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Responsive Sidebar with Angular Material | DEV Community](https://dev.to/davidihl/how-to-create-a-responsive-sidebar-and-mini-navigation-with-material-angular-o5l)

### Implementation Pattern

```text
Desktop (>= 1024px):  Header compact + Mini-sidenav (icônes 56px, labels on hover)
Tablet (768-1023px):  Header compact + Sidenav over (on-demand)
Mobile (< 768px):     Header minimal + Sidenav over (full-width)
```

### Hiérarchie Visuelle

| Zone | Éléments | Comportement |
|------|----------|--------------|
| Header | Logo, Badge alertes, Badge offline, Menu user | Toujours visible |
| Sidenav | Carte, Alertes, Historique, Geofences, Admin | Expandable/Collapsible |
| User Menu | Profil, Paramètres, Logout | Dropdown |

---

## R10: Accessibilité WCAG 2.1 AA

### Decision

Implémenter les patterns d'accessibilité standards :

| Requirement | Implementation |
|-------------|----------------|
| Navigation clavier | Tab order, Enter/Space, Escape |
| Lecteurs d'écran | role="navigation", aria-label, aria-current="page" |
| Contraste | 4.5:1 texte, 3:1 composants |
| Focus visible | Outline 2px (Angular Material) |
| Skip links | "Skip to main content" |

### Sources

- [Navigation in UX Design | IxDF](https://www.interaction-design.org/literature/topics/navigation)
- [Accessible Dashboard Design | DesignRush](https://www.designrush.com/agency/ui-ux-design/dashboard/trends/dashboard-ux)
