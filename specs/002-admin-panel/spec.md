# Feature Specification: Admin Panel

**Feature Branch**: `002-admin-panel`
**Created**: 2025-12-19
**Status**: MVP Complete
**Completed**: 2025-12-22
**Input**: User description: "Admin Panel - Interface d'administration pour gérer les utilisateurs, les camions, les configurations système et visualiser les statistiques globales de la flotte"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestion des utilisateurs (Priority: P1)

En tant qu'administrateur, je veux pouvoir créer, modifier, désactiver et supprimer des comptes utilisateurs afin de contrôler l'accès au système.

**Why this priority**: La gestion des utilisateurs est fondamentale pour la sécurité et le contrôle d'accès. Sans cette fonctionnalité, impossible de gérer qui peut accéder au système.

**Independent Test**: Peut être testé en créant un utilisateur, modifiant ses informations, changeant son rôle, puis le désactivant. L'utilisateur désactivé ne doit plus pouvoir se connecter.

**Acceptance Scenarios**:

1. **Given** je suis connecté en tant qu'admin, **When** je crée un nouvel utilisateur avec email/mot de passe/rôle, **Then** l'utilisateur reçoit un email d'activation et peut se connecter après activation
2. **Given** un utilisateur existe, **When** je modifie son rôle de VIEWER à FLEET_MANAGER, **Then** ses permissions sont mises à jour immédiatement
3. **Given** un utilisateur est actif, **When** je le désactive, **Then** il est déconnecté de toutes ses sessions et ne peut plus se connecter
4. **Given** un utilisateur est désactivé, **When** je le réactive, **Then** il peut à nouveau se connecter avec ses credentials existants

---

### User Story 2 - Gestion des camions (Priority: P1)

En tant qu'administrateur, je veux pouvoir ajouter, modifier et retirer des camions de la flotte afin de maintenir l'inventaire à jour.

**Why this priority**: Les camions sont l'entité centrale du système. La capacité de gérer la flotte est essentielle pour le fonctionnement opérationnel.

**Independent Test**: Peut être testé en ajoutant un nouveau camion, vérifiant qu'il apparaît sur la carte, modifiant ses informations, puis le retirant de la flotte active.

**Acceptance Scenarios**:

1. **Given** je suis admin, **When** j'ajoute un camion avec immatriculation/nom/conducteur assigné, **Then** le camion apparaît dans la liste et peut recevoir des positions GPS
2. **Given** un camion existe, **When** je modifie son conducteur assigné, **Then** l'historique est conservé et le nouveau conducteur est affiché
3. **Given** un camion est actif, **When** je le marque comme "hors service", **Then** il n'apparaît plus sur la carte live mais son historique reste accessible
4. **Given** je veux assigner un camion à un groupe, **When** je sélectionne le groupe, **Then** le camion est visible pour tous les utilisateurs ayant accès à ce groupe

---

### User Story 3 - Dashboard statistiques (Priority: P2)

En tant qu'administrateur, je veux visualiser des statistiques globales de la flotte pour avoir une vue d'ensemble de l'activité et identifier les tendances.

**Why this priority**: Les statistiques fournissent une valeur ajoutée pour la prise de décision mais ne sont pas bloquantes pour l'utilisation quotidienne du système.

**Independent Test**: Peut être testé en accédant au dashboard et vérifiant que les métriques s'affichent correctement et correspondent aux données réelles.

**Acceptance Scenarios**:

1. **Given** je suis admin sur le dashboard, **When** je consulte les statistiques, **Then** je vois le nombre total de camions actifs/inactifs/hors service
2. **Given** des positions GPS ont été enregistrées, **When** je consulte les statistiques journalières, **Then** je vois le kilométrage total parcouru par la flotte
3. **Given** des alertes ont été déclenchées, **When** je consulte le tableau de bord, **Then** je vois un résumé des alertes par type (vitesse, geofence, offline)
4. **Given** je sélectionne une période (jour/semaine/mois), **When** les statistiques se rechargent, **Then** les données correspondent à la période sélectionnée

---

### User Story 4 - Configuration système (Priority: P2)

En tant qu'administrateur, je veux pouvoir configurer les paramètres globaux du système pour adapter le comportement aux besoins de l'entreprise.

**Why this priority**: La configuration permet d'adapter le système mais des valeurs par défaut raisonnables permettent de fonctionner sans configuration initiale.

**Independent Test**: Peut être testé en modifiant un paramètre (ex: seuil de vitesse par défaut) et vérifiant que le nouveau comportement est appliqué.

**Acceptance Scenarios**:

1. **Given** je suis admin dans les paramètres, **When** je modifie le seuil de vitesse par défaut, **Then** les nouvelles alertes utilisent ce seuil
2. **Given** je configure le délai "offline", **When** un camion ne transmet plus depuis ce délai, **Then** il est automatiquement marqué offline
3. **Given** je modifie les paramètres d'alerte, **When** je sauvegarde, **Then** un historique des modifications est conservé avec l'auteur et la date

---

### User Story 5 - Gestion des groupes de camions (Priority: P3)

En tant qu'administrateur, je veux pouvoir créer des groupes de camions et y assigner des utilisateurs pour segmenter l'accès à la flotte.

**Why this priority**: Les groupes permettent une gestion fine des accès mais une flotte peut fonctionner sans segmentation au début.

**Independent Test**: Peut être testé en créant un groupe, y ajoutant des camions, assignant un utilisateur FLEET_MANAGER au groupe, et vérifiant qu'il ne voit que ces camions.

**Acceptance Scenarios**:

1. **Given** je suis admin, **When** je crée un groupe "Région Nord", **Then** le groupe apparaît dans la liste et je peux y ajouter des camions
2. **Given** un groupe existe avec des camions, **When** j'assigne un utilisateur au groupe, **Then** cet utilisateur ne voit que les camions de ses groupes assignés
3. **Given** un camion est dans plusieurs groupes, **When** je le retire d'un groupe, **Then** il reste visible pour les utilisateurs des autres groupes

---

### Edge Cases

- Que se passe-t-il si un admin tente de se désactiver lui-même ? → Action bloquée avec message d'erreur
- Que se passe-t-il si le dernier admin est supprimé ? → Action bloquée, au moins un admin doit exister
- Que se passe-t-il si un camion avec historique est supprimé ? → Le camion est archivé, pas supprimé physiquement, historique conservé
- Que se passe-t-il si un utilisateur assigné à un groupe est supprimé ? → Les assignations sont supprimées automatiquement
- Que se passe-t-il si les statistiques sont demandées sur une période sans données ? → Affichage de valeurs à zéro avec message informatif
- Que se passe-t-il si le mot de passe ne respecte pas la politique ? → Formulaire invalide avec message explicite des critères manquants
- Que se passe-t-il si l'email d'activation n'est jamais reçu ? → L'admin peut renvoyer l'email manuellement depuis la fiche utilisateur
- Que se passe-t-il si une immatriculation existe déjà ? → Création refusée avec message indiquant le doublon

## Requirements *(mandatory)*

### Functional Requirements

**Gestion des utilisateurs**
- **FR-001**: Le système DOIT permettre la création d'utilisateurs avec email, mot de passe et rôle (ADMIN, FLEET_MANAGER, DRIVER, VIEWER)
- **FR-001a**: Le mot de passe DOIT respecter: minimum 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre
- **FR-002**: Le système DOIT permettre la modification des informations utilisateur (nom, email, rôle)
- **FR-003**: Le système DOIT permettre la désactivation/réactivation d'un compte sans suppression des données
- **FR-004**: Le système DOIT empêcher la suppression/désactivation du dernier administrateur
- **FR-005**: Le système DOIT journaliser toutes les actions administratives (qui, quoi, quand)
- **FR-005a**: Les logs d'audit DOIVENT être conservés minimum 90 jours avec possibilité d'archivage

**Gestion des camions**
- **FR-006**: Le système DOIT permettre l'ajout de camions avec immatriculation, identifiant lisible, et conducteur assigné
- **FR-007**: Le système DOIT permettre la modification des informations d'un camion
- **FR-008**: Le système DOIT permettre de marquer un camion comme "hors service" sans supprimer son historique
- **FR-009**: Le système DOIT permettre l'assignation d'un camion à un ou plusieurs groupes

**Dashboard statistiques**
- **FR-010**: Le système DOIT afficher le nombre de camions par statut (actif, idle, offline, hors service)
- **FR-011**: Le système DOIT calculer et afficher le kilométrage total de la flotte par période
- **FR-012**: Le système DOIT afficher un résumé des alertes déclenchées par type et par période
- **FR-013**: Le système DOIT permettre le filtrage des statistiques par période (jour, semaine, mois, personnalisé)

**Configuration système**
- **FR-014**: Le système DOIT permettre la configuration du seuil de vitesse par défaut pour les alertes
- **FR-015**: Le système DOIT permettre la configuration du délai avant marquage "offline"
- **FR-016**: Le système DOIT conserver un historique des modifications de configuration

**Gestion des groupes**
- **FR-017**: Le système DOIT permettre la création de groupes avec nom et description
- **FR-018**: Le système DOIT permettre l'assignation de camions à des groupes (structure plate, un camion peut appartenir à plusieurs groupes)
- **FR-019**: Le système DOIT permettre l'assignation d'utilisateurs à des groupes
- **FR-020**: Le système DOIT filtrer automatiquement la visibilité des camions selon les groupes de l'utilisateur

**Interface & Navigation**
- **FR-021**: Les listes (utilisateurs, camions, groupes) DOIVENT être paginées (25 éléments par défaut, configurable: 10, 25, 50, 100)
- **FR-022**: Les listes DOIVENT permettre la recherche par texte (nom, email, immatriculation)
- **FR-023**: Les listes DOIVENT permettre le tri par colonnes (nom, date création, statut)

**Notifications & Emails**
- **FR-024**: Le système DOIT envoyer un email d'activation lors de la création d'un utilisateur
- **FR-025**: En cas d'échec d'envoi d'email, le système DOIT réessayer 3 fois puis notifier l'admin

### Key Entities

- **User**: Représente un utilisateur du système avec ses informations d'identification, son rôle, son statut (actif/inactif), et ses groupes assignés. L'email est unique dans le système.
- **Truck**: Représente un camion de la flotte avec son immatriculation (unique), identifiant lisible, conducteur assigné, statut opérationnel, et groupes d'appartenance
- **TruckGroup**: Représente un regroupement logique de camions (structure plate). Un camion peut appartenir à plusieurs groupes, un utilisateur peut être assigné à plusieurs groupes.
- **SystemConfig**: Représente les paramètres globaux du système avec versioning pour l'historique des modifications
- **AuditLog**: Représente l'historique des actions administratives (création, modification, suppression). Rétention: 90 jours minimum.
- **FleetStatistics**: Représente les métriques agrégées de la flotte (calculées à la demande, non pré-stockées)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrateur peut créer un nouvel utilisateur en moins de 2 minutes
- **SC-002**: Un administrateur peut ajouter un nouveau camion à la flotte en moins de 1 minute
- **SC-003**: Le dashboard statistiques charge et affiche les données en moins de 3 secondes
- **SC-004**: 100% des actions administratives sont journalisées et consultables
- **SC-005**: Les modifications de configuration sont appliquées en moins de 30 secondes sur l'ensemble du système
- **SC-006**: Un utilisateur FLEET_MANAGER ne peut voir que les camions de ses groupes assignés (isolation complète)
- **SC-007**: L'interface admin est accessible uniquement aux utilisateurs avec rôle ADMIN

## Clarifications

### Session 2025-12-19

- Q: Quelle politique de mot de passe appliquer ? → A: Minimum 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre
- Q: Combien de temps conserver les logs d'audit ? → A: 90 jours minimum, archivage possible au-delà
- Q: Comment gérer les listes longues (pagination) ? → A: 25 éléments par page par défaut, configurable (10, 25, 50, 100)
- Q: Structure des groupes (hiérarchique ou plate) ? → A: Structure plate pour V1 (un camion peut appartenir à plusieurs groupes indépendants)
- Q: Que faire si l'envoi d'email échoue ? → A: File d'attente avec 3 tentatives, notification admin si échec persistant

## Assumptions

- Le système d'authentification JWT existant sera réutilisé pour l'authentification admin
- Les rôles utilisateur (ADMIN, FLEET_MANAGER, DRIVER, VIEWER) sont déjà définis dans le système
- L'envoi d'emails pour l'activation des comptes utilisera un service SMTP standard
- Les statistiques seront calculées à la demande (pas de pré-calcul pour la V1)
- L'interface admin sera intégrée au frontend Angular existant
