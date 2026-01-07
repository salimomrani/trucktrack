# Research: Frontend i18n FR/EN

**Feature**: 021-frontend-i18n
**Date**: 2026-01-06
**Status**: Complete

## Research Tasks

### 1. i18n Library Selection for Angular 21

**Decision**: ngx-translate (v16.x)

**Rationale**:
- Runtime translation without app rebuild
- Large community and mature ecosystem
- Works with Angular 21 standalone components
- Simple JSON-based translation files
- Supports interpolation, pluralization, and lazy loading
- Pipe and directive approach integrates well with Angular templates

**Alternatives Considered**:

| Library | Pros | Cons | Why Not |
|---------|------|------|---------|
| Angular i18n (@angular/localize) | Official, compile-time, good perf | Requires rebuild per language, no runtime switch | User story requires instant switch without reload |
| Transloco | Modern, lazy loading, good DX | Less mature than ngx-translate | ngx-translate has better Angular 21 support |
| i18next-angular | Feature-rich, namespaces | Heavier, more complex setup | Overkill for 2 languages |

**Installation**:
```bash
npm install @ngx-translate/core @ngx-translate/http-loader
```

### 2. Translation File Structure

**Decision**: Flat JSON with nested keys for organization

**Rationale**:
- Easy to maintain and search
- Works well with ngx-translate
- Allows grouping by feature/component
- ~200 strings manageable in single file per language

**File Structure**:
```json
{
  "COMMON": {
    "SAVE": "Enregistrer",
    "CANCEL": "Annuler",
    "DELETE": "Supprimer",
    "EDIT": "Modifier",
    "SEARCH": "Rechercher",
    "LOADING": "Chargement...",
    "NO_DATA": "Aucune donnée"
  },
  "NAV": {
    "DASHBOARD": "Tableau de bord",
    "MAP": "Carte",
    "TRUCKS": "Camions",
    "TRIPS": "Trajets",
    "USERS": "Utilisateurs",
    "GROUPS": "Groupes",
    "CONFIG": "Configuration",
    "ALERTS": "Alertes"
  },
  "AUTH": {
    "LOGIN": "Connexion",
    "LOGOUT": "Déconnexion",
    "PROFILE": "Profil"
  },
  "DASHBOARD": {
    "TITLE": "Tableau de bord",
    "ACTIVE_TRUCKS": "Camions actifs",
    "TRIPS_TODAY": "Trajets aujourd'hui"
  },
  "TRUCKS": {
    "TITLE": "Gestion des camions",
    "ADD": "Ajouter un camion",
    "PLATE_NUMBER": "Numéro de plaque",
    "STATUS": "Statut"
  },
  "TRIPS": {
    "TITLE": "Gestion des trajets",
    "STATUS": {
      "PENDING": "En attente",
      "ASSIGNED": "Assigné",
      "IN_PROGRESS": "En cours",
      "COMPLETED": "Terminé",
      "CANCELLED": "Annulé"
    }
  },
  "ERRORS": {
    "GENERIC": "Une erreur est survenue",
    "NETWORK": "Erreur de connexion",
    "VALIDATION": "Veuillez vérifier les champs"
  },
  "SUCCESS": {
    "SAVED": "Enregistré avec succès",
    "DELETED": "Supprimé avec succès"
  }
}
```

### 3. Language Service Design

**Decision**: Angular service with signals for reactive state

**Rationale**:
- Signals are Angular 21 best practice
- Easy integration with existing StoreFacade pattern
- localStorage persistence for user preference
- Single source of truth for current language

**API Design**:
```typescript
@Injectable({ providedIn: 'root' })
export class LanguageService {
  // Supported languages
  readonly supportedLanguages = ['fr', 'en'] as const;
  readonly defaultLanguage = 'fr';

  // Current language signal
  readonly currentLanguage = signal<string>(this.defaultLanguage);

  // Initialize from localStorage
  init(): void;

  // Switch language and persist
  setLanguage(lang: string): void;

  // Get browser language (for future auto-detect)
  getBrowserLanguage(): string;
}
```

### 4. Date/Number Formatting

**Decision**: Use Angular DatePipe and DecimalPipe with locale

**Rationale**:
- Angular pipes support locale out of the box
- No additional library needed
- Consistent with existing codebase
- Formats: FR (01/06/2026, 1 234,56) vs EN (06/01/2026, 1,234.56)

**Implementation**:
```typescript
// Register locales in app.config.ts
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeFr, 'fr');
registerLocaleData(localeEn, 'en');

// Use LOCALE_ID provider that updates with language change
```

### 5. Language Selector UI

**Decision**: Dropdown in top-header next to theme toggle

**Rationale**:
- Consistent placement with other settings (theme toggle)
- Visible on all pages
- Simple dropdown with flag icons

**Design**:
```
[🇫🇷 FR ▼]  [🌙]  [🔔]  [👤]
```

- Flag emoji + language code
- Dropdown shows both options
- Active language highlighted

### 6. Missing Translation Handling

**Decision**: Show key in dev, fallback text in prod

**Rationale**:
- Developers need to see missing keys during development
- Users should see graceful fallback in production
- ngx-translate supports this via MissingTranslationHandler

**Implementation**:
```typescript
export class CustomMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    if (isDevMode()) {
      console.warn(`Missing translation: ${params.key}`);
      return `[${params.key}]`;
    }
    // Production: return key without brackets or fallback
    return params.key.split('.').pop() || params.key;
  }
}
```

## Summary

| Topic | Decision |
|-------|----------|
| i18n Library | ngx-translate v16.x |
| File Format | JSON with nested keys |
| State Management | LanguageService with signals |
| Persistence | localStorage |
| Date/Number Format | Angular pipes with locale |
| Default Language | French (fr) |
| Missing Keys | Dev: show key, Prod: fallback |
