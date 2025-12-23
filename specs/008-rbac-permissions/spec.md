# Feature Specification: Gestion des Droits et Permissions (RBAC)

**Feature Branch**: `008-rbac-permissions`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Gestion des droits et permissions - Contrôle d'accès basé sur les rôles (RBAC) pour déterminer qui peut voir quelles pages et données. Définir les permissions par rôle (ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER). Restreindre l'accès aux pages admin, analytics, gestion des camions selon le rôle. Filtrer les données visibles (camions, groupes) selon les groupes assignés à l'utilisateur. Guards Angular pour protéger les routes frontend. V1 focus sur le contrôle d'accès aux pages et filtrage des données par groupe."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contrôle d'accès aux pages selon le rôle (Priority: P1)

En tant qu'utilisateur connecté, je veux que l'application affiche uniquement les pages auxquelles j'ai accès selon mon rôle, afin de ne pas être confronté à des erreurs d'autorisation et d'avoir une navigation adaptée à mes responsabilités.

**Why this priority**: C'est la base du système de permissions - sans contrôle d'accès aux pages, les utilisateurs peuvent accéder à des fonctionnalités non autorisées, créant des risques de sécurité et une mauvaise expérience utilisateur.

**Independent Test**: Peut être testé en se connectant avec différents rôles et en vérifiant que seules les pages autorisées sont accessibles et visibles dans la navigation.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté avec le rôle ADMIN, **When** il accède à l'application, **Then** il voit toutes les pages dans la navigation (Dashboard, Carte, Analytics, Admin, Alertes, Profil)
2. **Given** un utilisateur connecté avec le rôle FLEET_MANAGER, **When** il accède à l'application, **Then** il voit les pages Dashboard, Carte, Analytics, Alertes, Profil (pas Admin)
3. **Given** un utilisateur connecté avec le rôle DISPATCHER, **When** il accède à l'application, **Then** il voit les pages Dashboard, Carte, Alertes, Profil (pas Admin ni Analytics)
4. **Given** un utilisateur connecté avec le rôle DRIVER, **When** il accède à l'application, **Then** il voit uniquement les pages Dashboard (son camion), Alertes (ses alertes), Profil
5. **Given** un utilisateur non autorisé qui tente d'accéder à une page protégée via URL directe, **When** il entre l'URL manuellement, **Then** il est redirigé vers une page d'accès refusé ou le dashboard

---

### User Story 2 - Filtrage des données par groupe assigné (Priority: P2)

En tant qu'utilisateur, je veux voir uniquement les camions et données des groupes qui me sont assignés, afin de me concentrer sur les véhicules dont je suis responsable et ne pas avoir accès aux données d'autres équipes.

**Why this priority**: Essentiel pour la séparation des données dans une flotte multi-équipes. Sans ce filtrage, tous les utilisateurs voient toutes les données, ce qui pose des problèmes de confidentialité et de surcharge d'information.

**Independent Test**: Peut être testé en créant des utilisateurs assignés à différents groupes et en vérifiant que chacun ne voit que les camions de ses groupes.

**Acceptance Scenarios**:

1. **Given** un FLEET_MANAGER assigné au groupe "Équipe Nord", **When** il consulte la liste des camions, **Then** il voit uniquement les camions du groupe "Équipe Nord"
2. **Given** un DISPATCHER assigné aux groupes "Équipe Nord" et "Équipe Sud", **When** il consulte la carte, **Then** il voit les camions des deux groupes
3. **Given** un ADMIN (sans restriction de groupe), **When** il consulte n'importe quelle page, **Then** il voit tous les camions de toute la flotte
4. **Given** un DRIVER assigné à un camion spécifique, **When** il consulte le dashboard, **Then** il voit uniquement les informations de son propre camion
5. **Given** un utilisateur qui tente d'accéder aux détails d'un camion hors de ses groupes, **When** il essaie via l'API ou URL, **Then** le système refuse l'accès avec un message approprié

---

### User Story 3 - Navigation dynamique selon les permissions (Priority: P3)

En tant qu'utilisateur, je veux que le menu de navigation s'adapte automatiquement à mes permissions, afin de ne voir que les options pertinentes pour mon rôle sans éléments désactivés ou cachés de manière confuse.

**Why this priority**: Améliore l'expérience utilisateur en évitant la frustration de voir des options inaccessibles. Dépend de P1 (contrôle d'accès) pour fonctionner correctement.

**Independent Test**: Peut être testé en vérifiant visuellement le menu de navigation pour chaque rôle.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté, **When** l'application charge, **Then** le menu affiche uniquement les liens vers les pages autorisées pour son rôle
2. **Given** un changement de rôle d'un utilisateur (par un admin), **When** l'utilisateur se reconnecte, **Then** sa navigation reflète ses nouvelles permissions
3. **Given** un utilisateur avec le rôle DRIVER, **When** il voit le menu, **Then** il ne voit pas les options Admin, Analytics, ou gestion de flotte

---

### User Story 4 - Feedback clair sur les accès refusés (Priority: P4)

En tant qu'utilisateur, je veux recevoir un message clair lorsque j'essaie d'accéder à une ressource non autorisée, afin de comprendre pourquoi l'accès est refusé et qui contacter si nécessaire.

**Why this priority**: Améliore l'expérience utilisateur et réduit les tickets support. Moins critique que les fonctionnalités de base de contrôle d'accès.

**Independent Test**: Peut être testé en tentant d'accéder à des ressources non autorisées et en vérifiant les messages affichés.

**Acceptance Scenarios**:

1. **Given** un utilisateur qui accède à une page non autorisée, **When** la page se charge, **Then** il voit un message "Accès non autorisé" avec une explication et un lien vers le dashboard
2. **Given** un utilisateur qui tente une action non autorisée via l'interface, **When** l'action échoue, **Then** il voit un message d'erreur explicatif (ex: "Vous n'avez pas les droits pour modifier ce camion")

---

### Edge Cases

- Que se passe-t-il si un utilisateur n'est assigné à aucun groupe ? → L'utilisateur ne voit aucune donnée (sauf ADMIN qui voit tout)
- Que se passe-t-il si un groupe est supprimé alors que des utilisateurs y sont assignés ? → Les utilisateurs perdent l'accès aux données de ce groupe
- Que se passe-t-il si un utilisateur a un rôle mais aucune assignation de groupe ? → Il peut accéder aux pages de son rôle mais ne voit aucune donnée de camion
- Comment gérer les sessions actives lors d'un changement de permissions ? → Les nouvelles permissions s'appliquent à la prochaine connexion
- Que se passe-t-il si un DRIVER n'est plus assigné à un camion ? → Il voit un dashboard vide avec un message explicatif

## Requirements *(mandatory)*

### Functional Requirements

#### Contrôle d'accès par rôle

- **FR-001**: Le système DOIT supporter 4 rôles : ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER
- **FR-002**: Le système DOIT définir les permissions de page par rôle selon la matrice suivante :

| Page       | ADMIN | FLEET_MANAGER | DISPATCHER | DRIVER         |
|------------|-------|---------------|------------|----------------|
| Dashboard  | Oui   | Oui           | Oui        | Oui (limité)   |
| Carte      | Oui   | Oui           | Oui        | Non            |
| Analytics  | Oui   | Oui           | Non        | Non            |
| Admin      | Oui   | Non           | Non        | Non            |
| Alertes    | Oui   | Oui           | Oui        | Oui (ses alertes) |
| Profil     | Oui   | Oui           | Oui        | Oui            |

- **FR-003**: Le système DOIT bloquer l'accès aux pages non autorisées même via URL directe
- **FR-004**: Le système DOIT rediriger les utilisateurs non autorisés vers une page appropriée

#### Filtrage des données par groupe

- **FR-005**: Le système DOIT filtrer les camions visibles selon les groupes assignés à l'utilisateur
- **FR-006**: Le système DOIT permettre d'assigner un utilisateur à un ou plusieurs groupes
- **FR-007**: Les ADMIN DOIVENT voir toutes les données sans restriction de groupe
- **FR-008**: Les DRIVER DOIVENT voir uniquement les données de leur camion assigné
- **FR-009**: Le système DOIT appliquer le filtrage sur toutes les vues : liste, carte, analytics, alertes

#### Navigation et interface

- **FR-010**: La navigation DOIT afficher uniquement les liens vers les pages autorisées
- **FR-011**: Le système DOIT afficher un message clair lors d'un accès refusé
- **FR-012**: Le système DOIT inclure le rôle de l'utilisateur dans le menu profil ou header

#### Sécurité

- **FR-013**: Le contrôle d'accès DOIT être vérifié côté serveur (pas uniquement côté client)
- **FR-014**: Les endpoints DOIVENT rejeter les requêtes non autorisées avec un code d'erreur approprié
- **FR-015**: Le système DOIT journaliser les tentatives d'accès non autorisées

### Key Entities

- **Role**: Définit un ensemble de permissions (ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER). Chaque utilisateur a exactement un rôle.
- **Permission**: Représente le droit d'accéder à une page ou fonctionnalité spécifique. Les permissions sont liées aux rôles.
- **UserGroupAssignment**: Association entre un utilisateur et un ou plusieurs groupes de camions. Détermine quelles données l'utilisateur peut voir.
- **TruckGroup**: Groupe logique de camions (déjà existant). Utilisé pour le filtrage des données.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des tentatives d'accès non autorisées aux pages sont bloquées (vérifiable par tests de sécurité)
- **SC-002**: Les utilisateurs voient uniquement les données de leurs groupes assignés dans 100% des cas
- **SC-003**: La navigation s'adapte au rôle en moins de 1 seconde après connexion
- **SC-004**: Le temps de chargement des pages n'augmente pas de plus de 10% avec les vérifications de permissions
- **SC-005**: Les messages d'accès refusé sont compréhensibles (validé par test utilisateur - 90% comprennent pourquoi l'accès est refusé)
- **SC-006**: Zéro donnée visible hors des groupes assignés (vérifiable par audit de sécurité)

## Assumptions

- Les rôles existants (ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER) sont suffisants pour V1 - pas besoin de rôles personnalisables
- Un utilisateur ne peut avoir qu'un seul rôle à la fois
- Les groupes de camions (TruckGroup) existent déjà dans le système
- L'assignation utilisateur-groupe est gérée par les administrateurs via le panel admin existant
- Les permissions s'appliquent à la prochaine connexion, pas en temps réel pendant une session active
- Le DRIVER est toujours assigné à un camion spécifique, pas à un groupe

## Out of Scope (V1)

- Permissions personnalisables par utilisateur (au-delà du rôle)
- Rôles personnalisés / création de nouveaux rôles
- Permissions granulaires par action (lecture/écriture/suppression)
- Héritage de permissions entre rôles
- Audit trail détaillé des changements de permissions
- Notifications lors de changements de permissions
