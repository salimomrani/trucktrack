# Angular Development Conventions

**Version**: Angular 17+
**Last Updated**: 2025-12-22

Ce document définit les conventions obligatoires pour tout développement frontend Angular dans ce projet.

---

## 1. Signal-Based APIs (OBLIGATOIRE)

### Inputs - Utiliser `input()` au lieu de `@Input()`

```typescript
// ❌ INTERDIT - Pattern déprécié
@Input() name: string = '';
@Input() items: Item[] = [];

// ✅ OBLIGATOIRE - Signal input
readonly name = input<string>('');
readonly items = input<Item[]>([]);

// ✅ Pour les inputs requis
readonly id = input.required<string>();

// ✅ Avec transformation
readonly disabled = input(false, { transform: booleanAttribute });
```

### Outputs - Utiliser `output()` au lieu de `@Output()`

```typescript
// ❌ INTERDIT - Pattern déprécié
@Output() clicked = new EventEmitter<void>();
@Output() valueChange = new EventEmitter<string>();

// ✅ OBLIGATOIRE - Signal output
readonly clicked = output<void>();
readonly valueChange = output<string>();

// Usage identique: this.clicked.emit();
```

### Accès aux Signals dans le Code

```typescript
// ❌ INTERDIT - Accès direct
const value = this.name;

// ✅ OBLIGATOIRE - Appel du signal
const value = this.name();
```

### Accès aux Signals dans les Templates

```html
<!-- ❌ INTERDIT -->
<div>{{ name }}</div>
<div *ngIf="isOpen">...</div>

<!-- ✅ OBLIGATOIRE -->
<div>{{ name() }}</div>
@if (isOpen()) { ... }
```

---

## 2. Modern Control Flow (OBLIGATOIRE)

### Conditions - Utiliser `@if` au lieu de `*ngIf`

```html
<!-- ❌ INTERDIT -->
<div *ngIf="condition">Content</div>
<div *ngIf="condition; else elseBlock">Content</div>
<ng-template #elseBlock>Else</ng-template>

<!-- ✅ OBLIGATOIRE -->
@if (condition) {
  <div>Content</div>
} @else {
  <div>Else</div>
}

<!-- Avec variable locale -->
@if (user(); as currentUser) {
  <div>{{ currentUser.name }}</div>
}
```

### Boucles - Utiliser `@for` au lieu de `*ngFor`

```html
<!-- ❌ INTERDIT -->
<div *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</div>

<!-- ✅ OBLIGATOIRE - track est REQUIS -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div>Aucun élément</div>
}

<!-- Variables disponibles: $index, $first, $last, $even, $odd, $count -->
@for (item of items(); track item.id; let idx = $index) {
  <div>{{ idx }}: {{ item.name }}</div>
}
```

### Switch - Utiliser `@switch` au lieu de `*ngSwitch`

```html
<!-- ❌ INTERDIT -->
<div [ngSwitch]="status">
  <span *ngSwitchCase="'active'">Actif</span>
  <span *ngSwitchCase="'inactive'">Inactif</span>
  <span *ngSwitchDefault>Inconnu</span>
</div>

<!-- ✅ OBLIGATOIRE -->
@switch (status()) {
  @case ('active') { <span>Actif</span> }
  @case ('inactive') { <span>Inactif</span> }
  @default { <span>Inconnu</span> }
}
```

---

## 3. Reactive State avec Signals

### État Local du Composant

```typescript
// ✅ Pour l'état mutable
isLoading = signal(false);
selectedItems = signal<Item[]>([]);

// ✅ Pour l'état dérivé
itemCount = computed(() => this.items().length);
hasSelection = computed(() => this.selectedItems().length > 0);

// ✅ Modification de l'état
this.isLoading.set(true);
this.selectedItems.update(items => [...items, newItem]);
```

### Effects (Utiliser avec Précaution)

```typescript
// ✅ Pour les effets de bord
constructor() {
  effect(() => {
    console.log('Items changed:', this.items());
  });
}
```

---

## 4. Imports et Structure

### Imports Angular Core

```typescript
// ✅ Imports modernes
import {
  Component,
  input,           // au lieu de Input
  output,          // au lieu de Output, EventEmitter
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';

// ❌ Ne plus importer
// Input, Output, EventEmitter (sauf cas legacy)
```

### Standalone Components (OBLIGATOIRE)

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,  // OBLIGATOIRE
  imports: [
    // Importer uniquement ce qui est utilisé
    MatButtonModule,
    RouterLink
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,  // RECOMMANDÉ
  template: `...`
})
```

### Injection de Dépendances

```typescript
// ✅ OBLIGATOIRE - inject() function
private readonly http = inject(HttpClient);
private readonly router = inject(Router);

// ❌ INTERDIT - Constructor injection
constructor(private http: HttpClient) {}
```

---

## 5. Bonnes Pratiques

### Nommage

```typescript
// Signals: pas de préfixe spécial, readonly
readonly isLoading = signal(false);
readonly items = input<Item[]>([]);

// Computed: nom descriptif
readonly activeItems = computed(() => ...);
readonly formattedDate = computed(() => ...);

// Outputs: verbe ou événement
readonly clicked = output<void>();
readonly valueChanged = output<string>();
readonly itemSelected = output<Item>();
```

### Performance

```typescript
// ✅ Utiliser OnPush avec les signals
changeDetection: ChangeDetectionStrategy.OnPush

// ✅ Track obligatoire dans @for
@for (item of items(); track item.id) { ... }

// ✅ Éviter les appels de fonction dans les templates (sauf signals)
// Les signals sont optimisés pour la détection de changement
```

### CommonModule

```typescript
// ✅ Ne pas importer CommonModule si on utilise uniquement @if/@for/@switch
imports: [MatButtonModule, RouterLink]

// ✅ Garder CommonModule uniquement si on utilise:
// - DatePipe, AsyncPipe, DecimalPipe, etc.
// - NgClass, NgStyle
// - Autres directives CommonModule
```

---

## 6. Tests

### Configuration des Inputs Signal

```typescript
// ✅ Utiliser setInput pour les signal inputs
beforeEach(() => {
  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;

  // Définir les inputs
  fixture.componentRef.setInput('items', mockItems);
  fixture.componentRef.setInput('isLoading', false);

  fixture.detectChanges();
});

// ✅ Lire les valeurs des signals
expect(component.items()).toEqual(mockItems);
expect(component.isLoading()).toBe(false);
```

---

## 7. Migration depuis Legacy

Si du code legacy est rencontré, le migrer selon ces patterns:

| Legacy | Moderne |
|--------|---------|
| `@Input() prop` | `prop = input<T>()` |
| `@Input() prop!: T` | `prop = input.required<T>()` |
| `@Output() event = new EventEmitter()` | `event = output<T>()` |
| `*ngIf="cond"` | `@if (cond) { }` |
| `*ngFor="let x of xs"` | `@for (x of xs; track x.id) { }` |
| `*ngSwitch` | `@switch (val) { }` |
| `constructor(private svc: Service)` | `svc = inject(Service)` |

---

## Références

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Control Flow](https://angular.dev/guide/templates/control-flow)
- [Signal Inputs RFC](https://github.com/angular/angular/discussions/49682)
