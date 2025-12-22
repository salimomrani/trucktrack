# Feature Specification: Optimisation du Menu de Navigation

**Feature Branch**: `003-nav-optimization`
**Created**: 2025-12-21
**Status**: Draft
**Input**: User description: "Optimisation du menu de navigation - Améliorer l'ergonomie et la structure du menu de navigation pour une meilleure expérience utilisateur"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigation principale optimisée (Priority: P1)

En tant qu'utilisateur, je veux un menu de navigation clair et bien organisé afin de trouver rapidement les fonctionnalités dont j'ai besoin.

**Why this priority**: La navigation est le point d'entrée vers toutes les fonctionnalités. Une navigation confuse ou désorganisée impacte directement la productivité.

**Independent Test**: Peut être testé en demandant à un nouvel utilisateur de trouver chaque section en moins de 5 secondes sans aide.

**Acceptance Scenarios**:

1. **Given** je suis connecté, **When** je regarde le menu, **Then** je vois clairement les sections principales regroupées logiquement
2. **Given** je suis sur une page, **When** je regarde le menu, **Then** l'élément correspondant est visuellement mis en évidence
3. **Given** je navigue entre les pages, **When** je clique sur un lien, **Then** la transition est fluide et le nouvel état du menu est immédiat
4. **Given** je suis un nouvel utilisateur, **When** j'arrive sur l'application, **Then** je comprends intuitivement la structure des sections

---

### User Story 2 - Menu adapté au rôle utilisateur (Priority: P1)

En tant qu'utilisateur, je veux voir uniquement les éléments de menu auxquels j'ai accès afin de ne pas être distrait par des fonctionnalités inutilisables.

**Why this priority**: Afficher des options inaccessibles crée de la confusion et des erreurs. Le menu doit refléter les permissions réelles.

**Independent Test**: Peut être testé en se connectant avec différents rôles (ADMIN, FLEET_MANAGER, DRIVER, VIEWER) et vérifiant que chaque rôle voit exactement les options autorisées.

**Acceptance Scenarios**:

1. **Given** je suis ADMIN, **When** je regarde le menu, **Then** je vois toutes les sections incluant l'administration
2. **Given** je suis FLEET_MANAGER, **When** je regarde le menu, **Then** je vois les sections opérationnelles mais pas l'administration
3. **Given** je suis DRIVER, **When** je regarde le menu, **Then** je vois uniquement les sections pertinentes pour mon rôle
4. **Given** je suis VIEWER, **When** je regarde le menu, **Then** je vois uniquement les sections en lecture seule

---

### User Story 3 - Navigation responsive (Priority: P2)

En tant qu'utilisateur mobile, je veux une navigation adaptée aux petits écrans afin d'utiliser l'application confortablement sur mon téléphone.

**Why this priority**: Les conducteurs et gestionnaires de flotte utilisent souvent des appareils mobiles sur le terrain.

**Independent Test**: Peut être testé en redimensionnant le navigateur et vérifiant que le menu reste utilisable à toutes les tailles.

**Acceptance Scenarios**:

1. **Given** je suis sur mobile (< 768px), **When** je regarde l'écran, **Then** le menu est remplacé par un bouton hamburger
2. **Given** je suis sur mobile, **When** je clique sur le bouton hamburger, **Then** un menu latéral s'ouvre avec toutes les options
3. **Given** le menu mobile est ouvert, **When** je clique sur une option, **Then** le menu se ferme automatiquement
4. **Given** le menu mobile est ouvert, **When** je clique en dehors, **Then** le menu se ferme

---

### User Story 4 - Raccourcis et accès rapides (Priority: P2)

En tant qu'utilisateur fréquent, je veux des raccourcis vers les actions courantes afin de gagner du temps dans mes tâches quotidiennes.

**Why this priority**: Les utilisateurs réguliers bénéficient de moyens rapides d'accéder aux fonctions fréquemment utilisées.

**Independent Test**: Peut être testé en mesurant le nombre de clics pour atteindre les actions courantes avant/après optimisation.

**Acceptance Scenarios**:

1. **Given** je suis sur n'importe quelle page, **When** je regarde le menu, **Then** je vois un indicateur du nombre d'alertes non lues
2. **Given** des camions sont offline, **When** je regarde le menu, **Then** je vois un indicateur visuel d'attention
3. **Given** je veux accéder à mon profil, **When** je clique sur mon avatar, **Then** j'accède directement aux options utilisateur

---

### User Story 5 - Geofences dans la navigation (Priority: P3)

En tant qu'utilisateur, je veux accéder aux geofences depuis le menu afin de gérer les zones géographiques facilement.

**Why this priority**: Les geofences sont une fonctionnalité existante mais pas accessible depuis le menu principal.

**Independent Test**: Peut être testé en vérifiant que le lien geofences apparaît et mène à la page correspondante.

**Acceptance Scenarios**:

1. **Given** je suis ADMIN ou FLEET_MANAGER, **When** je regarde le menu, **Then** je vois une option pour les geofences
2. **Given** je clique sur geofences, **When** la page charge, **Then** je vois la liste des zones configurées

---

### Edge Cases

- Que se passe-t-il si l'utilisateur n'a aucun rôle défini ? → Afficher uniquement le profil et le logout
- Que se passe-t-il si le menu contient trop d'éléments pour l'écran ? → Scroll dans le menu mobile, ou regroupement en sous-menus
- Que se passe-t-il si la connexion est perdue pendant la navigation ? → Afficher un indicateur de connexion dans le menu
- Que se passe-t-il si le badge d'alertes dépasse 99 ? → Afficher "99+"
- Que se passe-t-il si l'écran est très large (> 1920px) ? → Le menu reste centré avec une largeur maximale
- Que se passe-t-il si tous les camions sont online ? → L'indicateur offline n'est pas affiché (aucun badge)
- Que se passe-t-il si l'utilisateur redimensionne la fenêtre ? → Le menu s'adapte instantanément au nouveau breakpoint

## Requirements *(mandatory)*

### Functional Requirements

**Structure du menu**
- **FR-001**: Le menu DOIT afficher les sections principales : Carte, Historique, Alertes, Geofences
- **FR-002**: Le menu DOIT regrouper les éléments en catégories logiques (Opérations, Administration)
- **FR-003**: L'élément de menu actif DOIT être visuellement distinct (couleur, indicateur)
- **FR-004**: Le menu DOIT inclure le logo et le nom de l'application

**Adaptation au rôle**
- **FR-005**: Le menu DOIT masquer les options inaccessibles selon le rôle de l'utilisateur
- **FR-006**: Les éléments d'administration DOIVENT être visibles uniquement pour les ADMIN
- **FR-007**: Les DRIVER DOIVENT voir uniquement Carte et leur profil
- **FR-008**: Les VIEWER DOIVENT voir toutes les sections en lecture seule

**Responsive**
- **FR-009**: Sur mobile (< 768px), le menu DOIT être remplacé par un menu hamburger
- **FR-010**: Le menu mobile DOIT s'ouvrir en overlay latéral (sidebar)
- **FR-011**: Le menu mobile DOIT se fermer au clic sur une option ou en dehors
- **FR-012**: La transition d'ouverture/fermeture DOIT être animée (< 300ms)

**Indicateurs et badges**
- **FR-013**: Le menu DOIT afficher le nombre d'alertes non lues sur l'icône Alertes
- **FR-014**: Le badge DOIT afficher "99+" si le nombre dépasse 99
- **FR-015**: Le menu DOIT afficher un indicateur si des camions sont offline

**Menu utilisateur**
- **FR-016**: Le menu utilisateur DOIT afficher le nom/email et le rôle
- **FR-017**: Le menu utilisateur DOIT inclure un lien vers le profil/paramètres
- **FR-018**: Le menu utilisateur DOIT inclure l'option de déconnexion

**Accessibilité**
- **FR-019**: Le menu DOIT être navigable au clavier (Tab, Enter, Escape)
- **FR-020**: Le menu DOIT avoir des attributs ARIA appropriés pour les lecteurs d'écran
- **FR-021**: Les icônes DOIVENT avoir des labels textuels visibles ou en aria-label

**Layout et structure**
- **FR-022**: Le menu DOIT être une barre horizontale (top navbar) sur desktop (>= 768px)
- **FR-023**: Le menu mobile DOIT s'ouvrir en glissant depuis la gauche
- **FR-024**: Sur tablette (768-1024px), le menu DOIT afficher la version desktop complète

**Éléments de menu par rôle**
- **FR-025**: ADMIN voit : Carte, Historique, Alertes, Geofences, Administration (Users, Trucks, Config), Profil
- **FR-026**: FLEET_MANAGER voit : Carte, Historique, Alertes, Geofences, Profil
- **FR-027**: DRIVER voit : Carte, Profil
- **FR-028**: VIEWER voit : Carte, Historique, Alertes, Geofences (lecture seule), Profil

**Indicateur offline**
- **FR-029**: Un camion est considéré offline après 5 minutes sans signal GPS
- **FR-030**: L'indicateur offline DOIT afficher le nombre de camions offline si > 0
- **FR-031**: L'indicateur offline DOIT être cliquable et mener à une vue filtrée

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un nouvel utilisateur trouve n'importe quelle section en moins de 5 secondes
- **SC-002**: Le menu se charge et s'affiche en moins de 100ms après l'authentification
- **SC-003**: 100% des utilisateurs voient uniquement les options correspondant à leur rôle
- **SC-004**: Le menu mobile s'ouvre/ferme en moins de 300ms
- **SC-005**: Le menu est utilisable sur tous les appareils de 320px à 2560px de largeur
- **SC-006**: Le taux de clics erronés (sur options inaccessibles) est de 0%
- **SC-007**: Le score d'accessibilité Lighthouse est supérieur à 90 pour la navigation

## Clarifications

### Session 2025-12-21

- Q: Quel type de layout pour le menu (top navbar vs sidebar) ? → A: Top navbar horizontal sur desktop, sidebar coulissante sur mobile
- Q: Quels éléments de menu spécifiques pour chaque rôle ? → A: Voir FR-022 ci-dessous
- Q: Comportement sur tablette (768-1024px) ? → A: Affichage desktop complet (pas de hamburger)
- Q: Seuil pour considérer un camion offline ? → A: 5 minutes sans signal GPS
- Q: Direction de l'animation du menu mobile ? → A: Slide depuis la gauche (pattern standard)

## Assumptions

- Le système de rôles (ADMIN, FLEET_MANAGER, DRIVER, VIEWER) est déjà implémenté
- Le compteur d'alertes non lues existe déjà dans le système
- La page Geofences existe mais n'est pas encore liée au menu
- Les utilisateurs ont accès à des appareils avec des tailles d'écran variées
- L'application utilise déjà Angular Material pour les composants UI
