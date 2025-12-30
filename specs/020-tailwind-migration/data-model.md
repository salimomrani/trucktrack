# Data Model: UI Component Inventory

**Feature**: 020-tailwind-migration
**Date**: 2025-12-30

## Overview

Ce document définit l'inventaire des composants UI à créer pour remplacer Angular Material. Chaque composant est défini avec ses inputs, outputs, et variantes.

## Component Entities

### 1. Button Component

**Path**: `shared/components/button/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Style visuel |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Taille |
| disabled | `boolean` | `false` | État désactivé |
| loading | `boolean` | `false` | Affiche spinner |
| icon | `string` | `null` | Nom icône Material |
| iconPosition | `'left' \| 'right'` | `'left'` | Position icône |
| fullWidth | `boolean` | `false` | Largeur 100% |
| type | `'button' \| 'submit' \| 'reset'` | `'button'` | Type HTML |

**Events**: `clicked: EventEmitter<MouseEvent>`

**CSS Classes**:
```
Base: px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
Primary: bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500
Secondary: bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500
Danger: bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500
Ghost: text-gray-600 hover:bg-gray-100 focus:ring-gray-500
```

---

### 2. Input Component

**Path**: `shared/components/input/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| type | `'text' \| 'email' \| 'password' \| 'number' \| 'tel'` | `'text'` | Type input |
| label | `string` | `''` | Label flottant |
| placeholder | `string` | `''` | Placeholder |
| value | `string` | `''` | Valeur (two-way binding) |
| disabled | `boolean` | `false` | État désactivé |
| readonly | `boolean` | `false` | Lecture seule |
| required | `boolean` | `false` | Champ requis |
| error | `string` | `null` | Message d'erreur |
| hint | `string` | `null` | Texte d'aide |
| prefixIcon | `string` | `null` | Icône préfixe |
| suffixIcon | `string` | `null` | Icône suffixe |

**Events**: `valueChange: EventEmitter<string>`, `blur: EventEmitter<FocusEvent>`

**States**:
- Default: `border-gray-200`
- Focus: `border-primary-500 ring-2 ring-primary-500/20`
- Error: `border-danger-500`
- Disabled: `bg-gray-50 text-gray-400`

---

### 3. Select Component

**Path**: `shared/components/select/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| options | `SelectOption[]` | `[]` | Liste des options |
| value | `any` | `null` | Valeur sélectionnée |
| label | `string` | `''` | Label |
| placeholder | `string` | `'Select...'` | Placeholder |
| multiple | `boolean` | `false` | Sélection multiple |
| searchable | `boolean` | `false` | Avec recherche |
| disabled | `boolean` | `false` | Désactivé |
| error | `string` | `null` | Message d'erreur |

```typescript
interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}
```

---

### 4. Datepicker Component

**Path**: `shared/components/datepicker/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| value | `Date \| null` | `null` | Date sélectionnée |
| label | `string` | `''` | Label |
| placeholder | `string` | `'Select date'` | Placeholder |
| minDate | `Date` | `null` | Date minimum |
| maxDate | `Date` | `null` | Date maximum |
| dateFormat | `string` | `'Y-m-d'` | Format d'affichage |
| enableTime | `boolean` | `false` | Avec heure |
| mode | `'single' \| 'range' \| 'multiple'` | `'single'` | Mode sélection |
| disabled | `boolean` | `false` | Désactivé |

**Implementation**: Wrapper autour de Flatpickr

---

### 5. Card Component

**Path**: `shared/components/card/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| title | `string` | `null` | Titre de la carte |
| subtitle | `string` | `null` | Sous-titre |
| elevated | `boolean` | `true` | Avec ombre |
| hoverable | `boolean` | `false` | Effet hover |
| padding | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Padding interne |

**Slots**: `header`, `content`, `footer`, `actions`

**CSS Classes**:
```
Base: bg-white rounded-lg
Elevated: shadow-card
Hoverable: hover:shadow-card-hover transition-shadow
```

---

### 6. Table Component

**Path**: `shared/components/table/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| columns | `TableColumn[]` | `[]` | Définition colonnes |
| data | `any[]` | `[]` | Données |
| sortable | `boolean` | `true` | Tri activé |
| sortColumn | `string` | `null` | Colonne triée |
| sortDirection | `'asc' \| 'desc'` | `'asc'` | Direction tri |
| loading | `boolean` | `false` | État chargement |
| emptyMessage | `string` | `'No data'` | Message vide |
| striped | `boolean` | `false` | Lignes alternées |
| hoverable | `boolean` | `true` | Highlight hover |

```typescript
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  template?: TemplateRef<any>;
}
```

**Events**: `sortChange: EventEmitter<{column: string, direction: 'asc' | 'desc'}>`

---

### 7. Pagination Component

**Path**: `shared/components/pagination/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| totalItems | `number` | `0` | Total items |
| pageSize | `number` | `10` | Items par page |
| currentPage | `number` | `1` | Page actuelle |
| pageSizeOptions | `number[]` | `[10, 25, 50]` | Options taille |
| showPageSize | `boolean` | `true` | Sélecteur taille |
| showInfo | `boolean` | `true` | Info "1-10 of 100" |

**Events**: `pageChange: EventEmitter<number>`, `pageSizeChange: EventEmitter<number>`

---

### 8. Dialog Component

**Path**: `shared/components/dialog/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| title | `string` | `''` | Titre dialogue |
| size | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Taille |
| closable | `boolean` | `true` | Bouton fermer |
| closeOnBackdrop | `boolean` | `true` | Fermer sur backdrop |
| closeOnEscape | `boolean` | `true` | Fermer sur Escape |

**Service API**:
```typescript
interface DialogService {
  open<T, R>(component: ComponentType<T>, config?: DialogConfig): DialogRef<R>;
  confirm(message: string, options?: ConfirmOptions): Observable<boolean>;
  alert(message: string, options?: AlertOptions): Observable<void>;
}
```

**Implementation**: Utilise CDK Overlay

---

### 9. Toast Component

**Path**: `shared/components/toast/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| message | `string` | `''` | Message |
| type | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Type |
| duration | `number` | `5000` | Durée ms (0 = permanent) |
| dismissible | `boolean` | `true` | Bouton fermer |
| action | `{label: string, callback: () => void}` | `null` | Action optionnelle |

**Service API**:
```typescript
interface ToastService {
  success(message: string, duration?: number): void;
  error(message: string, duration?: number): void;
  warning(message: string, duration?: number): void;
  info(message: string, duration?: number): void;
  show(config: ToastConfig): ToastRef;
}
```

---

### 10. Sidenav Component

**Path**: `core/components/sidenav/`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| items | `NavItem[]` | `[]` | Items navigation |
| collapsed | `boolean` | `false` | Mode réduit |
| mobileOpen | `boolean` | `false` | Overlay mobile |

```typescript
interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  badge?: number;
  roles?: string[];
}
```

**Responsive Behavior**:
- Desktop (>1024px): Expanded with labels
- Tablet (768-1024px): Collapsed icons only
- Mobile (<768px): Hidden, overlay on menu click

---

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         AppComponent                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────────────────────────────────────┐   │
│  │ Sidenav │  │              Content Area               │   │
│  │         │  │  ┌─────────────────────────────────┐    │   │
│  │ NavItem │  │  │           Card                  │    │   │
│  │ NavItem │  │  │  ┌─────────┐ ┌─────────┐       │    │   │
│  │ NavItem │  │  │  │  Input  │ │ Select  │       │    │   │
│  │         │  │  │  └─────────┘ └─────────┘       │    │   │
│  │         │  │  │  ┌──────────────────────┐      │    │   │
│  │         │  │  │  │   Datepicker         │      │    │   │
│  │         │  │  │  └──────────────────────┘      │    │   │
│  │         │  │  │  ┌─────────┐ ┌─────────┐       │    │   │
│  │         │  │  │  │ Button  │ │ Button  │       │    │   │
│  │         │  │  │  └─────────┘ └─────────┘       │    │   │
│  │         │  │  └─────────────────────────────────┘    │   │
│  │         │  │                                         │   │
│  │         │  │  ┌─────────────────────────────────┐    │   │
│  │         │  │  │           Table                 │    │   │
│  │         │  │  │  ┌─────────────────────────┐    │    │   │
│  │         │  │  │  │     Pagination          │    │    │   │
│  │         │  │  │  └─────────────────────────┘    │    │   │
│  │         │  │  └─────────────────────────────────┘    │   │
│  └─────────┘  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Overlay Layer:
┌─────────────────┐  ┌─────────────────┐
│     Dialog      │  │     Toast       │
│  (CDK Overlay)  │  │  (Position:     │
│                 │  │   bottom-right) │
└─────────────────┘  └─────────────────┘
```

## State Management

Les composants UI sont **stateless** et communiquent via:
- `@Input()` / `input()` pour les données entrantes
- `@Output()` / `output()` pour les événements
- Services pour Dialog et Toast (singleton pattern)

Pas de nouveau state NgRx requis pour cette migration.
