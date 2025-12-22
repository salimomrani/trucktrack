# Feature Specification: Angular Modern Patterns Migration

**Feature Branch**: `004-angular-signals-migration`
**Created**: 2025-12-22
**Status**: Draft
**Input**: User description: "je veux une spec pour mettre a jour mon code base front, pour qu'il utilise les recommandation angular, utiliser signal et ngrx, (input, output etc et template)"

## Clarifications

### Session 2025-12-22

- Q: Quelle stratégie de migration adopter? → A: Par module fonctionnel (ex: features/map, features/alerts, core)
- Q: Quelle portée pour NgRx Signal Store? → A: Conserver StoreFacade existant, utiliser Signal Store uniquement pour nouveaux besoins
- Q: Comment gérer les composants de librairies externes? → A: Migrer uniquement le code applicatif (ignorer les librairies)
- Q: Quelles propriétés qualifient comme "réactives candidates"? → A: Uniquement les propriétés modifiées qui déclenchent des mises à jour UI
- Q: Quand exécuter les tests de validation? → A: Après chaque module fonctionnel migré

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Migrate Component Inputs to Signal Inputs (Priority: P1)

En tant que développeur, je veux que tous les composants utilisent les signal inputs (`input()`) au lieu des décorateurs `@Input()` pour bénéficier d'une meilleure réactivité et d'une détection de changement optimisée.

**Why this priority**: Les signal inputs sont la base de la migration vers les patterns modernes Angular. Ils permettent une meilleure intégration avec les autres APIs signals et améliorent les performances de détection de changement.

**Independent Test**: Peut être testé en vérifiant que chaque composant migré conserve son comportement fonctionnel existant tout en utilisant la nouvelle syntaxe signal input.

**Acceptance Scenarios**:

1. **Given** un composant avec `@Input() name: string`, **When** je migre vers signal input, **Then** le composant utilise `name = input<string>()` et l'application fonctionne identiquement
2. **Given** un composant avec `@Input({ required: true })`, **When** je migre vers signal input, **Then** le composant utilise `input.required<T>()` avec la même validation
3. **Given** un composant avec `@Input({ transform })`, **When** je migre vers signal input, **Then** le composant utilise `input<T, U>({ transform })` avec la même transformation

---

### User Story 2 - Migrate Component Outputs to Output Function (Priority: P1)

En tant que développeur, je veux que tous les composants utilisent la fonction `output()` au lieu du décorateur `@Output()` avec EventEmitter pour une API plus cohérente avec les signals.

**Why this priority**: La migration des outputs complète la modernisation des composants et unifie l'API d'entrée/sortie des composants.

**Independent Test**: Peut être testé en vérifiant que chaque événement émis par les composants migrés est correctement capté par les composants parents.

**Acceptance Scenarios**:

1. **Given** un composant avec `@Output() clicked = new EventEmitter<void>()`, **When** je migre vers output function, **Then** le composant utilise `clicked = output<void>()`
2. **Given** un composant avec `@Output() valueChange = new EventEmitter<T>()`, **When** je migre vers output function, **Then** le composant utilise `valueChange = output<T>()` et émet correctement les valeurs
3. **Given** un composant parent écoutant `(clicked)="onClicked()"`, **When** le composant enfant est migré, **Then** le binding parent continue de fonctionner sans modification

---

### User Story 3 - Adopt Modern Control Flow Syntax (Priority: P2)

En tant que développeur, je veux que tous les templates utilisent la nouvelle syntaxe de contrôle de flux (`@if`, `@for`, `@switch`) au lieu des directives structurelles (`*ngIf`, `*ngFor`, `*ngSwitch`).

**Why this priority**: La nouvelle syntaxe offre de meilleures performances (pas de directive overhead), une meilleure lisibilité et des fonctionnalités avancées comme `@empty` pour les boucles vides.

**Independent Test**: Peut être testé en vérifiant que chaque template migré affiche le même contenu avec la nouvelle syntaxe.

**Acceptance Scenarios**:

1. **Given** un template avec `*ngIf="condition"`, **When** je migre vers la nouvelle syntaxe, **Then** le template utilise `@if (condition) { }` avec le même comportement
2. **Given** un template avec `*ngIf="condition; else elseBlock"`, **When** je migre, **Then** le template utilise `@if (condition) { } @else { }` correctement
3. **Given** un template avec `*ngFor="let item of items; trackBy: trackFn"`, **When** je migre, **Then** le template utilise `@for (item of items; track item.id) { }` avec un tracking approprié
4. **Given** une liste vide avec `*ngIf="items.length"`, **When** je migre, **Then** le template utilise `@for (...) { } @empty { }` pour gérer le cas vide

---

### User Story 4 - Convert Properties to Signals (Priority: P2)

En tant que développeur, je veux que les propriétés réactives des composants utilisent des signals (`signal()`, `computed()`) pour une gestion d'état locale plus explicite et performante.

**Why this priority**: Les signals simplifient la gestion d'état local et permettent une détection de changement plus fine sans dépendre de Zone.js.

**Independent Test**: Peut être testé en vérifiant que les propriétés réactives migrées déclenchent correctement les mises à jour de l'interface utilisateur.

**Acceptance Scenarios**:

1. **Given** une propriété `count = 0` modifiée programmatiquement, **When** je migre vers signal, **Then** j'utilise `count = signal(0)` avec `count.set()` ou `count.update()`
2. **Given** une propriété dérivée calculée manuellement, **When** je migre vers computed, **Then** j'utilise `computed(() => ...)` qui se met à jour automatiquement
3. **Given** un composant avec `ngOnChanges` pour réagir aux inputs, **When** je migre vers signals, **Then** j'utilise `effect()` ou `computed()` à la place

---

### User Story 5 - NgRx Signal Store Integration (Priority: P3)

En tant que développeur, je veux intégrer NgRx Signal Store pour les nouveaux besoins de gestion d'état, tout en conservant le StoreFacade existant intact.

**Why this priority**: NgRx Signal Store offre une API plus simple et moderne. La coexistence avec StoreFacade permet une adoption progressive sans risque de régression.

**Independent Test**: Peut être testé en vérifiant que les nouveaux stores Signal Store fonctionnent indépendamment du StoreFacade existant.

**Acceptance Scenarios**:

1. **Given** le StoreFacade existant, **When** j'ajoute un nouveau besoin d'état, **Then** j'utilise NgRx Signal Store sans modifier StoreFacade
2. **Given** un nouveau Signal Store créé, **When** un composant consomme son état, **Then** le composant utilise les signaux exposés par le store
3. **Given** StoreFacade et Signal Store coexistent, **When** l'application s'exécute, **Then** les deux systèmes fonctionnent sans conflit

---

### Edge Cases

- Que se passe-t-il si un composant a des inputs avec des valeurs par défaut complexes (objets, tableaux)?
- Comment gérer les composants avec des inputs qui ont des setters personnalisés?
- Comment migrer les templates avec des pipes imbriqués dans les directives structurelles?
- Que faire si un composant utilise `@ViewChild` avec des inputs dynamiques?
- Comment gérer les composants avec des outputs qui émettent des événements dans `ngOnInit` ou `ngOnDestroy`?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT migrer tous les décorateurs `@Input()` vers la fonction `input()` avec typage approprié
- **FR-002**: Le système DOIT migrer tous les décorateurs `@Output()` avec EventEmitter vers la fonction `output()`
- **FR-003**: Le système DOIT convertir toutes les directives `*ngIf` vers la syntaxe `@if`
- **FR-004**: Le système DOIT convertir toutes les directives `*ngFor` vers la syntaxe `@for` avec tracking explicite
- **FR-005**: Le système DOIT convertir toutes les directives `*ngSwitch` vers la syntaxe `@switch`
- **FR-006**: Le système DOIT identifier et convertir en signals les propriétés modifiées qui déclenchent des mises à jour UI
- **FR-007**: Le système DOIT préserver le comportement fonctionnel existant après chaque migration
- **FR-008**: Le système DOIT supprimer les imports CommonModule des composants standalone utilisant uniquement la nouvelle syntaxe de contrôle de flux
- **FR-009**: Le système DOIT documenter les patterns de migration appliqués pour référence future
- **FR-010**: Le système DOIT maintenir la compatibilité avec les tests unitaires existants
- **FR-011**: Le système DOIT exécuter et valider les tests après chaque module fonctionnel migré
- **FR-012**: Le système DOIT migrer uniquement le code applicatif (les librairies externes sont hors scope)

### Key Entities

- **Component**: Unité de base à migrer, contenant inputs, outputs, propriétés et template
- **Signal Input**: Nouvelle API pour les propriétés d'entrée réactives
- **Signal Output**: Nouvelle API pour les événements de sortie
- **Control Flow Block**: Nouvelle syntaxe de template (@if, @for, @switch)
- **Signal**: Primitive réactive pour la gestion d'état local

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des composants utilisent les signal inputs au lieu de `@Input()` decorator
- **SC-002**: 100% des composants utilisent la fonction `output()` au lieu de `@Output()` avec EventEmitter
- **SC-003**: 100% des templates utilisent la nouvelle syntaxe de contrôle de flux (`@if`, `@for`, `@switch`)
- **SC-004**: Tous les tests existants passent après la migration
- **SC-005**: L'application démarre et fonctionne identiquement avant et après migration
- **SC-006**: Le temps de build ne dépasse pas 120% du temps actuel
- **SC-007**: Aucune régression fonctionnelle détectée lors des tests manuels

## Assumptions

- Le projet utilise Angular 17+ qui supporte toutes ces fonctionnalités
- Les composants sont standalone (pattern déjà adopté dans le projet)
- Les tests unitaires existants couvrent les fonctionnalités critiques
- La migration peut être effectuée composant par composant de manière incrémentale
- Le store NgRx existant (StoreFacade) reste fonctionnel pendant la migration
