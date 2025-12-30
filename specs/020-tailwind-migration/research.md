# Research: Migration Angular Material vers Tailwind CSS

**Feature**: 020-tailwind-migration
**Date**: 2025-12-30

## 1. Tailwind CSS with Angular 21

### Decision
Utiliser Tailwind CSS 3.4+ avec le plugin officiel `@tailwindcss/forms` pour les inputs et `@tailwindcss/typography` pour le texte formaté.

### Rationale
- Tailwind 3.4 supporte nativement Angular 21 via PostCSS
- Le plugin `@tailwindcss/forms` fournit un reset CSS propre pour tous les éléments de formulaire, éliminant les artefacts visuels
- JIT (Just-In-Time) compilation réduit drastiquement la taille du bundle CSS
- Design tokens via `tailwind.config.js` permettent une cohérence globale

### Alternatives Considered
| Alternative | Raison du rejet |
|-------------|-----------------|
| CSS Modules | Pas de design system intégré, plus verbeux |
| Styled Components | Non adapté à Angular, pattern React |
| Bootstrap 5 | Encore des overrides complexes comme Material |
| Pure CSS | Maintenance difficile, pas de design tokens |

### Implementation Notes
```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
npx tailwindcss init
```

Configuration requise dans `angular.json`:
```json
{
  "styles": ["src/styles.scss"],
  "stylePreprocessorOptions": {
    "includePaths": ["src/styles"]
  }
}
```

## 2. Flatpickr Integration with Angular

### Decision
Utiliser `flatpickr` directement avec un wrapper Angular custom plutôt qu'une librairie wrapper tierce.

### Rationale
- Flatpickr est léger (~6kb gzipped) vs mat-datepicker (~50kb+)
- Hautement personnalisable via CSS (compatible Tailwind)
- API simple et bien documentée
- Pas de dépendance Angular Material

### Alternatives Considered
| Alternative | Raison du rejet |
|-------------|-----------------|
| ngx-flatpickr | Wrapper non maintenu activement |
| Native HTML5 `<input type="date">` | UX inconsistante entre navigateurs, pas de range picker |
| date-fns-picker | Dépendances supplémentaires, moins flexible |
| Garder mat-datepicker | Contre l'objectif de la migration |

### Implementation Notes
```typescript
// Wrapper Angular pour Flatpickr
@Component({
  selector: 'app-datepicker',
  standalone: true,
  template: `<input #dateInput class="..." />`
})
export class DatepickerComponent implements AfterViewInit, OnDestroy {
  private flatpickrInstance: flatpickr.Instance;

  readonly value = model<Date | null>(null);
  readonly placeholder = input<string>('Select date');

  ngAfterViewInit() {
    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      dateFormat: 'Y-m-d',
      onChange: (dates) => this.value.set(dates[0])
    });
  }
}
```

## 3. CDK Overlay & A11y Usage

### Decision
Conserver `@angular/cdk/overlay` pour les modales/dialogues et `@angular/cdk/a11y` pour la gestion du focus.

### Rationale
- CDK Overlay gère correctement le stacking context, scroll blocking, et backdrop
- CDK A11y fournit `FocusTrap`, `LiveAnnouncer`, et `FocusMonitor` - critiques pour l'accessibilité
- Évite de réimplémenter des patterns complexes déjà bien testés
- CDK est indépendant de Material UI (pas de styles Material)

### Alternatives Considered
| Alternative | Raison du rejet |
|-------------|-----------------|
| Headless UI | Non disponible pour Angular |
| Custom portal service | Réinvention de la roue, risque de bugs a11y |
| HTML `<dialog>` natif | Support navigateur incomplet, moins de contrôle |

### Implementation Notes
```typescript
// Dialog service utilisant CDK Overlay
@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private overlay: Overlay) {}

  open<T>(component: ComponentType<T>, config?: DialogConfig): DialogRef<T> {
    const overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'bg-black/50',
      panelClass: 'dialog-panel',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically()
    });
    // ...
  }
}
```

## 4. Migration Strategy: Page by Page

### Decision
Migrer page par page dans l'ordre: Login → History → Map → Analytics → Admin pages.

### Rationale
- Permet de valider chaque migration indépendamment
- Réduit les risques de régression massive
- Facilite le rollback si problème
- Les composants partagés sont créés au fur et à mesure des besoins réels

### Migration Order
| Phase | Page/Feature | Composants créés |
|-------|--------------|------------------|
| 1 | Login | Input, Button, Card |
| 2 | History | Datepicker, Select, Table |
| 3 | Map | Sidenav, Filter panel |
| 4 | Analytics | Charts container, KPI cards |
| 5 | Admin (users, trucks, trips) | Dialog, Toast, Form layouts |
| 6 | Cleanup | Remove Material, optimize bundle |

### Coexistence Strategy
Pendant la migration, Material et Tailwind coexisteront:
- Préfixer les classes Tailwind si conflit
- Isoler les nouveaux composants dans `shared/components/`
- Tests visuels pour détecter les régressions

## 5. Design Tokens Structure

### Decision
Définir les design tokens dans `tailwind.config.js` basés sur les couleurs et espacements actuels de l'application.

### Token Categories
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',  // Current blue
          600: '#2563eb',
          700: '#1d4ed8',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
        success: {
          500: '#22c55e',
          600: '#16a34a',
        },
        gray: {
          50: '#f9fafb',
          200: '#e5e7eb',
          500: '#6b7280',
          800: '#1f2937',
        }
      },
      spacing: {
        // Consistent with current design
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.1)',
      }
    }
  }
}
```

## 6. Accessibility Preservation

### Decision
Maintenir WCAG 2.1 AA compliance en utilisant les patterns ARIA existants et CDK a11y.

### Key Requirements
- **Focus visible**: Ring visible sur tous les éléments interactifs (`focus:ring-2 focus:ring-primary-500`)
- **Keyboard navigation**: Tab order logique, Escape pour fermer les modales
- **Screen readers**: ARIA labels sur tous les inputs, live regions pour les toasts
- **Color contrast**: Minimum 4.5:1 pour le texte, 3:1 pour les éléments UI

### Testing Strategy
- Lighthouse accessibility audit après chaque phase
- Tests manuels avec VoiceOver/NVDA
- Automated a11y tests avec axe-core

## 7. Bundle Size Optimization

### Decision
Target: réduction de 30% minimum de la taille du bundle CSS.

### Current State (estimated)
- Angular Material CSS: ~250kb (before tree-shaking)
- Custom overrides: ~50kb
- **Total**: ~300kb

### Target State
- Tailwind (JIT purged): ~30-50kb
- Component styles: ~20kb
- **Total**: ~50-70kb (75-80% reduction)

### Optimization Techniques
1. Tailwind JIT mode (default in 3.x)
2. PurgeCSS configuration pour Angular templates
3. Suppression progressive des imports Material inutilisés
4. CSS minification en production

## Research Completion

All technical decisions have been made. No NEEDS CLARIFICATION items remain.

| Topic | Decision | Confidence |
|-------|----------|------------|
| CSS Framework | Tailwind CSS 3.4+ | High |
| Datepicker | Flatpickr (custom wrapper) | High |
| CDK Usage | Minimal (overlay + a11y) | High |
| Migration Strategy | Page by page | High |
| Design Tokens | tailwind.config.js | High |
| Accessibility | WCAG 2.1 AA + CDK a11y | High |
| Bundle Optimization | JIT + PurgeCSS | High |
