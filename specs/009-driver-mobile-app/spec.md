# Feature Specification: Driver Mobile App

**Feature Branch**: `009-driver-mobile-app`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "Driver Mobile App - Application mobile pour les chauffeurs permettant de voir leur position en temps réel, mettre à jour leur statut (disponible, en livraison, en pause), recevoir des notifications push pour les alertes, voir leurs trajets assignés, et communiquer avec le dispatch."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Driver Authentication & Status Management (Priority: P1)

En tant que chauffeur, je veux pouvoir me connecter à l'application mobile et gérer mon statut de disponibilité afin que le dispatch sache si je suis disponible pour des missions.

**Why this priority**: C'est la fonctionnalité de base qui permet l'identification du chauffeur et la gestion de sa disponibilité. Sans authentification et gestion de statut, aucune autre fonctionnalité n'est utilisable.

**Independent Test**: Un chauffeur peut se connecter avec ses identifiants existants (email/mot de passe), voir son profil, et changer son statut entre "Disponible", "En livraison", "En pause", et "Hors service".

**Acceptance Scenarios**:

1. **Given** un chauffeur avec un compte actif, **When** il entre ses identifiants corrects, **Then** il accède à l'écran principal de l'application
2. **Given** un chauffeur connecté avec le statut "Disponible", **When** il sélectionne "En pause", **Then** son statut est mis à jour immédiatement et visible par le dispatch
3. **Given** un chauffeur connecté, **When** il ferme l'application sans se déconnecter, **Then** sa session reste active pendant 7 jours
4. **Given** un chauffeur avec des identifiants incorrects, **When** il tente de se connecter, **Then** un message d'erreur clair s'affiche

---

### User Story 2 - GPS Position & Real-time Tracking (Priority: P1)

En tant que chauffeur, je veux que ma position GPS soit transmise automatiquement au système afin que le dispatch puisse suivre ma localisation en temps réel.

**Why this priority**: Le tracking GPS est la fonctionnalité coeur du système TruckTrack. Elle doit fonctionner en arrière-plan de manière fiable.

**Independent Test**: L'application transmet la position GPS toutes les 10 secondes lorsque le chauffeur est en service, même quand l'application est en arrière-plan.

**Acceptance Scenarios**:

1. **Given** un chauffeur connecté avec le statut "Disponible" ou "En livraison", **When** l'application est ouverte ou en arrière-plan, **Then** la position GPS est envoyée au serveur toutes les 10 secondes
2. **Given** un chauffeur avec le statut "En pause" ou "Hors service", **When** l'application fonctionne, **Then** la position GPS n'est pas transmise (économie de batterie)
3. **Given** un chauffeur en zone sans réseau, **When** le réseau revient, **Then** les positions en attente sont envoyées au serveur
4. **Given** un chauffeur connecté, **When** il regarde la carte, **Then** sa position actuelle est affichée avec un marqueur distinctif

---

### User Story 3 - Push Notifications for Alerts (Priority: P2)

En tant que chauffeur, je veux recevoir des notifications push pour les alertes importantes afin de réagir rapidement aux événements.

**Why this priority**: Les notifications permettent au chauffeur de rester informé sans avoir l'application ouverte en permanence.

**Independent Test**: Le chauffeur reçoit une notification push lorsqu'une alerte de geofence ou un nouveau message du dispatch arrive.

**Acceptance Scenarios**:

1. **Given** un chauffeur connecté avec notifications activées, **When** une alerte de vitesse excessive est générée, **Then** il reçoit une notification push avec le détail
2. **Given** un chauffeur qui entre dans une zone de geofence, **When** l'entrée est détectée, **Then** il reçoit une notification indiquant le nom de la zone
3. **Given** un chauffeur avec l'application fermée, **When** un nouveau message du dispatch arrive, **Then** il reçoit une notification push
4. **Given** un chauffeur, **When** il désactive les notifications dans les paramètres, **Then** il ne reçoit plus de notifications push

---

### User Story 4 - View Assigned Trips (Priority: P2)

En tant que chauffeur, je veux voir la liste de mes trajets assignés afin de planifier mes livraisons.

**Why this priority**: La visualisation des trajets permet au chauffeur de connaître son planning et d'optimiser ses déplacements.

**Independent Test**: Le chauffeur peut voir ses trajets du jour avec les adresses de départ et d'arrivée, et naviguer vers chaque destination.

**Acceptance Scenarios**:

1. **Given** un chauffeur connecté avec des trajets assignés, **When** il ouvre l'écran des trajets, **Then** il voit la liste de ses trajets du jour triés par heure
2. **Given** un trajet dans la liste, **When** le chauffeur le sélectionne, **Then** il voit les détails (adresse départ, arrivée, client, notes)
3. **Given** un trajet sélectionné, **When** le chauffeur appuie sur "Naviguer", **Then** l'application de navigation par défaut s'ouvre avec l'itinéraire
4. **Given** un chauffeur sans trajets assignés, **When** il ouvre l'écran des trajets, **Then** un message "Aucun trajet prévu" s'affiche

---

### User Story 5 - Messaging with Dispatch (Priority: P3)

En tant que chauffeur, je veux pouvoir envoyer et recevoir des messages avec le dispatch afin de communiquer sur les problèmes ou mises à jour.

**Why this priority**: La messagerie améliore la coordination mais n'est pas critique pour le fonctionnement de base.

**Independent Test**: Le chauffeur peut envoyer un message texte au dispatch et voir les réponses dans une conversation.

**Acceptance Scenarios**:

1. **Given** un chauffeur connecté, **When** il ouvre l'écran de messagerie, **Then** il voit l'historique des conversations avec le dispatch
2. **Given** un chauffeur dans l'écran de messagerie, **When** il tape et envoie un message, **Then** le message apparaît dans la conversation et est reçu par le dispatch
3. **Given** un nouveau message du dispatch, **When** le chauffeur ouvre l'application, **Then** le message est affiché avec un indicateur "non lu"
4. **Given** une perte de connexion, **When** le chauffeur envoie un message, **Then** le message est mis en file d'attente et envoyé quand la connexion revient

---

### User Story 6 - Offline Mode (Priority: P3)

En tant que chauffeur, je veux pouvoir utiliser les fonctions essentielles de l'application même sans connexion internet afin de continuer à travailler dans les zones sans réseau.

**Why this priority**: Le mode offline est un confort supplémentaire mais les chauffeurs ont généralement une connexion mobile.

**Independent Test**: Le chauffeur peut voir ses trajets et sa dernière position connue même sans connexion internet.

**Acceptance Scenarios**:

1. **Given** un chauffeur sans connexion internet, **When** il ouvre l'application, **Then** il voit ses trajets en cache et sa dernière position connue
2. **Given** un chauffeur qui perd la connexion, **When** il change son statut, **Then** le changement est stocké localement et synchronisé au retour de la connexion
3. **Given** un chauffeur offline depuis plus de 24h, **When** il ouvre les trajets, **Then** un avertissement indique que les données peuvent être obsolètes

---

### Edge Cases

- Que se passe-t-il si le GPS est désactivé sur le téléphone ? L'application affiche une alerte demandant d'activer le GPS avec un bouton d'accès rapide aux paramètres
- Que se passe-t-il si les permissions de localisation sont refusées ? L'application affiche un écran explicatif et un bouton vers les paramètres système
- Que se passe-t-il si la batterie est faible (< 15%) ? La fréquence de tracking GPS est réduite à 30 secondes pour économiser la batterie
- Que se passe-t-il si le token JWT expire ? Le token est rafraîchi automatiquement ; si échec, redirection vers l'écran de login
- Que se passe-t-il si un chauffeur a été désactivé côté admin ? Déconnexion automatique avec message explicatif "Votre compte a été désactivé"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L'application DOIT permettre aux chauffeurs de se connecter avec leur email et mot de passe existants
- **FR-002**: L'application DOIT afficher le profil du chauffeur (nom, email, camion assigné)
- **FR-003**: L'application DOIT permettre au chauffeur de changer son statut parmi : Disponible, En livraison, En pause, Hors service
- **FR-004**: L'application DOIT transmettre la position GPS au serveur toutes les 10 secondes quand le chauffeur est en service
- **FR-005**: L'application DOIT fonctionner en arrière-plan pour le tracking GPS (iOS et Android)
- **FR-006**: L'application DOIT afficher la carte avec la position actuelle du chauffeur
- **FR-007**: L'application DOIT recevoir et afficher les notifications push pour les alertes
- **FR-008**: L'application DOIT afficher la liste des trajets assignés au chauffeur
- **FR-009**: L'application DOIT permettre de lancer la navigation vers une destination via l'app native
- **FR-010**: L'application DOIT permettre d'envoyer et recevoir des messages avec le dispatch
- **FR-011**: L'application DOIT stocker les données essentielles localement pour le mode offline
- **FR-012**: L'application DOIT synchroniser les données locales quand la connexion revient
- **FR-013**: L'application DOIT être disponible sur iOS (14+) et Android (10+)
- **FR-014**: L'application DOIT respecter les permissions RBAC existantes (rôle DRIVER uniquement)

### Key Entities

- **DriverSession**: Représente la session active du chauffeur (userId, token, refreshToken, expiresAt)
- **DriverStatus**: Statut actuel du chauffeur (AVAILABLE, IN_DELIVERY, ON_BREAK, OFF_DUTY)
- **GPSPosition**: Position GPS avec timestamp (latitude, longitude, speed, heading, accuracy, timestamp)
- **Trip**: Trajet assigné au chauffeur (id, pickupAddress, deliveryAddress, client, scheduledTime, status, notes)
- **Message**: Message échangé avec le dispatch (id, senderId, receiverId, content, timestamp, isRead)
- **PushNotification**: Notification reçue (id, type, title, body, data, receivedAt, isRead)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les chauffeurs peuvent se connecter et changer leur statut en moins de 30 secondes
- **SC-002**: La position GPS est transmise avec une précision de moins de 10 mètres
- **SC-003**: 95% des positions GPS sont transmises dans les 15 secondes suivant leur capture
- **SC-004**: Les notifications push sont reçues dans les 5 secondes suivant leur émission
- **SC-005**: L'application consomme moins de 5% de batterie par heure en mode tracking actif
- **SC-006**: Le temps de chargement initial de l'application est inférieur à 3 secondes
- **SC-007**: L'application fonctionne sans crash pendant 8 heures d'utilisation continue
- **SC-008**: 90% des chauffeurs peuvent accomplir leurs tâches quotidiennes sans formation

## Assumptions

- Les chauffeurs ont des smartphones relativement récents (iOS 14+ ou Android 10+)
- Les chauffeurs ont un forfait data mobile actif
- L'infrastructure backend existante (API Gateway, Auth Service) reste inchangée
- Le système d'alertes existant peut envoyer des notifications push via un service tiers
- Les trajets sont créés et assignés via le panneau d'administration web existant

## Out of Scope

- Création ou modification des trajets par le chauffeur (uniquement consultation)
- Signature électronique de livraison
- Scan de codes-barres ou QR codes
- Paiement ou facturation
- Appels téléphoniques intégrés (le chauffeur utilise l'app téléphone native)
- Édition du profil chauffeur (géré via admin panel web)
- Support tablette (optimisé pour smartphone uniquement)
