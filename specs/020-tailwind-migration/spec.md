# Feature Specification: Migration Angular Material vers Tailwind CSS

**Feature Branch**: `020-tailwind-migration`
**Created**: 2025-12-30
**Status**: Draft
**Input**: User description: "Migration de Angular Material vers Tailwind CSS - Remplacer tous les composants Angular Material par des composants custom stylés avec Tailwind CSS pour un meilleur contrôle du design et éliminer les problèmes de styling comme les rectangles sur les inputs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Formulaires avec inputs personnalisés (Priority: P1)

En tant qu'utilisateur, je veux interagir avec des champs de formulaire (inputs, selects, datepickers) qui ont un design cohérent et sans artefacts visuels (comme les rectangles parasites sur les inputs Material).

**Why this priority**: Les formulaires sont omniprésents dans l'application (login, création de trips, filtres, etc.). Les problèmes de styling actuels avec Material affectent directement l'expérience utilisateur quotidienne.

**Independent Test**: Peut être testé en visitant la page de login ou la page history et en vérifiant que les inputs ont un style propre sans artefacts visuels.

**Acceptance Scenarios**:

1. **Given** je suis sur la page de login, **When** je vois les champs email et password, **Then** ils ont une bordure uniforme sans rectangle parasite à gauche
2. **Given** je suis sur la page history, **When** je vois les champs de date, **Then** les labels flottants s'affichent correctement sans coupure
3. **Given** je remplis un formulaire, **When** un champ est en erreur, **Then** la bordure rouge s'applique uniformément sur tout le contour
4. **Given** je clique sur un input, **When** il reçoit le focus, **Then** la bordure de focus s'affiche de manière cohérente

---

### User Story 2 - Navigation et layout responsive (Priority: P1)

En tant qu'utilisateur, je veux une navigation (header, sidenav) et un layout qui s'adaptent parfaitement à toutes les tailles d'écran avec des transitions fluides.

**Why this priority**: La navigation est le premier élément visible et utilisé. Une navigation mal stylée impacte l'impression générale de qualité de l'application.

**Independent Test**: Peut être testé en redimensionnant la fenêtre du navigateur et en vérifiant que le header et la sidenav s'adaptent correctement.

**Acceptance Scenarios**:

1. **Given** je suis sur desktop (>1024px), **When** je vois la sidenav, **Then** elle est visible en mode étendu avec icônes et labels
2. **Given** je suis sur tablette (768-1024px), **When** je vois la sidenav, **Then** elle est en mode icônes uniquement
3. **Given** je suis sur mobile (<768px), **When** j'ouvre le menu, **Then** la sidenav s'affiche en overlay avec une animation fluide
4. **Given** je clique sur un élément du menu, **When** je suis sur mobile, **Then** le menu se ferme automatiquement

---

### User Story 3 - Tableaux de données et listes (Priority: P2)

En tant qu'administrateur, je veux consulter les listes de données (trucks, users, trips) dans des tableaux bien formatés avec pagination et tri.

**Why this priority**: Les tableaux sont essentiels pour la gestion mais moins critiques que les formulaires et la navigation pour l'expérience initiale.

**Independent Test**: Peut être testé en visitant la liste des trucks ou des utilisateurs et en vérifiant l'affichage, le tri et la pagination.

**Acceptance Scenarios**:

1. **Given** je suis sur la liste des trucks, **When** la page charge, **Then** je vois un tableau avec headers cliquables pour le tri
2. **Given** j'ai plus de 10 éléments, **When** je vois le tableau, **Then** une pagination est affichée en bas
3. **Given** je clique sur un header de colonne, **When** le tri s'effectue, **Then** une icône indique la direction du tri
4. **Given** je suis sur mobile, **When** je vois la liste, **Then** elle s'affiche en format cards au lieu d'un tableau

---

### User Story 4 - Boutons et actions (Priority: P2)

En tant qu'utilisateur, je veux des boutons visuellement distincts selon leur importance (primaire, secondaire, danger) avec des états hover/focus clairs.

**Why this priority**: Les boutons guident l'utilisateur dans ses actions. Un système de boutons cohérent améliore l'utilisabilité.

**Independent Test**: Peut être testé en vérifiant les différents boutons sur une page de détail ou un formulaire.

**Acceptance Scenarios**:

1. **Given** je vois un bouton primaire (Save, Submit), **When** je le survole, **Then** il a une couleur de fond plus foncée
2. **Given** je vois un bouton danger (Delete, Cancel), **When** je le vois, **Then** il est clairement identifiable en rouge
3. **Given** je navigue au clavier, **When** un bouton reçoit le focus, **Then** un anneau de focus visible apparaît
4. **Given** un bouton est désactivé, **When** je le vois, **Then** il est grisé et le curseur indique qu'il n'est pas cliquable

---

### User Story 5 - Cartes et conteneurs (Priority: P2)

En tant qu'utilisateur, je veux voir les informations organisées dans des cartes avec ombres et bordures cohérentes.

**Why this priority**: Les cartes structurent visuellement l'information. Important mais peut être migré après les éléments interactifs.

**Independent Test**: Peut être testé en vérifiant les cartes sur le dashboard ou la page de détail d'un trip.

**Acceptance Scenarios**:

1. **Given** je vois une carte d'information, **When** elle s'affiche, **Then** elle a une ombre subtile et des coins arrondis
2. **Given** je survole une carte interactive, **When** le hover est actif, **Then** l'ombre s'intensifie légèrement
3. **Given** je vois un groupe de cartes, **When** elles sont côte à côte, **Then** elles ont un espacement uniforme

---

### User Story 6 - Dialogues et modales (Priority: P3)

En tant qu'utilisateur, je veux des dialogues de confirmation et des modales qui s'affichent avec un overlay sombre et sont faciles à fermer.

**Why this priority**: Les dialogues sont utilisés moins fréquemment que les autres composants. Peuvent être migrés en dernier.

**Independent Test**: Peut être testé en déclenchant une action de suppression et en vérifiant le dialogue de confirmation.

**Acceptance Scenarios**:

1. **Given** je clique sur supprimer un élément, **When** le dialogue s'ouvre, **Then** un overlay sombre couvre le reste de la page
2. **Given** un dialogue est ouvert, **When** je clique sur l'overlay, **Then** le dialogue se ferme
3. **Given** un dialogue est ouvert, **When** j'appuie sur Escape, **Then** le dialogue se ferme
4. **Given** je confirme une action, **When** le dialogue se ferme, **Then** une notification de succès s'affiche

---

### User Story 7 - Notifications et feedback (Priority: P3)

En tant qu'utilisateur, je veux recevoir des notifications visuelles (toasts/snackbars) pour les actions réussies ou échouées.

**Why this priority**: Les notifications sont importantes mais fonctionnent déjà. Migration moins urgente.

**Independent Test**: Peut être testé en effectuant une action (save, delete) et en vérifiant l'apparition du toast.

**Acceptance Scenarios**:

1. **Given** je sauvegarde un formulaire, **When** la sauvegarde réussit, **Then** un toast vert apparaît en bas de l'écran
2. **Given** une erreur se produit, **When** l'erreur est détectée, **Then** un toast rouge apparaît avec le message d'erreur
3. **Given** un toast est affiché, **When** 5 secondes passent, **Then** il disparaît automatiquement
4. **Given** un toast est affiché, **When** je clique sur X, **Then** il disparaît immédiatement

---

### Edge Cases

- Que se passe-t-il si un composant Material est utilisé dans une librairie tierce (ex: ngx-charts) ?
- Comment gérer les transitions entre l'ancien et le nouveau style pendant la migration progressive ?
- Que faire si certains composants Material n'ont pas d'équivalent simple en Tailwind (ex: datepicker complexe) ?
- Comment maintenir l'accessibilité (ARIA, focus management) pendant la migration ?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT remplacer tous les `mat-form-field` par des inputs stylés avec Tailwind
- **FR-002**: Le système DOIT remplacer tous les `mat-button` par des boutons stylés avec Tailwind
- **FR-003**: Le système DOIT remplacer tous les `mat-card` par des divs stylés avec Tailwind
- **FR-004**: Le système DOIT remplacer tous les `mat-table` par des tables HTML stylées avec Tailwind
- **FR-005**: Le système DOIT remplacer tous les `mat-dialog` par une solution de dialogue custom avec Tailwind
- **FR-006**: Le système DOIT remplacer tous les `mat-snackbar` par des toasts custom avec Tailwind
- **FR-007**: Le système DOIT remplacer la `mat-sidenav` par une navigation custom avec Tailwind
- **FR-008**: Le système DOIT maintenir l'accessibilité (ARIA labels, focus states, keyboard navigation)
- **FR-009**: Le système DOIT conserver toutes les fonctionnalités existantes après migration
- **FR-010**: Le système DOIT supporter le thème clair actuel (dark mode hors scope)
- **FR-011**: Le système DOIT être responsive sur desktop, tablette et mobile
- **FR-012**: Le système DOIT créer une librairie de composants réutilisables (inputs, buttons, cards, etc.)

### Key Entities

- **Design Tokens**: Variables de design (couleurs, espacements, typographie, ombres) centralisées dans la configuration Tailwind
- **Composants UI**: Ensemble de composants Angular standalone réutilisables stylés avec Tailwind
- **Layout System**: Système de grille et de conteneurs basé sur les utilitaires Tailwind

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des composants Angular Material sont remplacés par des composants Tailwind
- **SC-002**: Aucun import `@angular/material` ne subsiste dans le code source (CDK overlay/a11y conservés)
- **SC-003**: La taille du bundle CSS diminue d'au moins 30% après migration
- **SC-004**: Tous les tests e2e existants passent après migration
- **SC-005**: Le temps de chargement initial reste inférieur à 3 secondes
- **SC-006**: Score Lighthouse Accessibility reste supérieur à 90
- **SC-007**: Aucune régression visuelle signalée par les utilisateurs après 2 semaines de production
- **SC-008**: Les développeurs peuvent créer un nouveau formulaire en moins de 15 minutes en utilisant les composants

## Clarifications

### Session 2025-12-30

- Q: Quelle stratégie de migration adopter ? → A: Par fonctionnalité - Migrer page par page (login, puis history, puis admin...)
- Q: Quelle solution pour le datepicker ? → A: Flatpickr - Librairie légère et personnalisable
- Q: Utilisation du CDK Angular ? → A: CDK minimal - Garder uniquement @angular/cdk/overlay et @angular/cdk/a11y

## Assumptions

- Tailwind CSS sera configuré avec les plugins officiels (forms, typography)
- Les composants custom seront créés en Angular standalone avec signals
- La migration se fera de manière progressive, page par page (login → history → admin pages)
- Les icônes Material Icons seront conservées (indépendantes de Material UI)
- CDK Angular minimal conservé : @angular/cdk/overlay (modales) et @angular/cdk/a11y (accessibilité)
- Le datepicker sera implémenté avec Flatpickr, stylé avec Tailwind

## Out of Scope

- Dark mode (sera traité dans une feature séparée)
- Animations complexes (les transitions basiques suffisent)
- Support IE11 (déjà abandonné)
- Migration du mobile React Native (frontend Angular uniquement)
