# Feature Specification: Email & Push Notifications

**Feature Branch**: `016-email-notifications`
**Created**: 2025-12-28
**Status**: Draft
**Input**: Notifications multi-canal (Email + Push) pour tous les utilisateurs du système

## Vue d'ensemble

Système de notifications complet permettant d'informer les utilisateurs (Fleet Managers, Drivers, Clients finaux) des événements importants via Email et Push mobile. Le système doit être événementiel, basé sur Kafka, et supporter les préférences utilisateur.

## User Scenarios & Testing

### User Story 1 - Notification de Livraison Confirmée au Client (Priority: P1)

Le client final reçoit un email et/ou une notification push lorsque sa livraison est terminée, incluant la preuve de livraison (signature, photos).

**Why this priority**: C'est la fonctionnalité avec le plus de valeur métier - confirmer au client que sa marchandise a été livrée avec preuve à l'appui. Améliore la satisfaction client et réduit les appels au support.

**Independent Test**: Compléter un trip avec POD, vérifier que le client reçoit un email avec la signature et les photos attachées.

**Acceptance Scenarios**:

1. **Given** un trip en cours avec un client associé, **When** le chauffeur complète la livraison avec signature, **Then** le client reçoit un email avec:
   - Objet: "Votre livraison a été effectuée - [Numéro de commande]"
   - Corps: Date/heure de livraison, nom du signataire, signature en image
   - Pièces jointes: Photos de la livraison (si présentes)

2. **Given** un client avec notifications push activées, **When** la livraison est terminée, **Then** il reçoit une notification push avec message de confirmation et lien vers les détails.

3. **Given** un client sans email valide, **When** la livraison est terminée, **Then** le système log l'erreur mais ne bloque pas le workflow de livraison.

---

### User Story 2 - Notifications ETA pour le Client (Priority: P2)

Le client reçoit des notifications lorsque le camion approche de sa destination (30 min, 10 min avant arrivée estimée).

**Why this priority**: Permet au client de se préparer à recevoir la livraison, réduisant les échecs de livraison et améliorant l'expérience.

**Independent Test**: Simuler un camion approchant d'une destination, vérifier les notifications à 30min et 10min.

**Acceptance Scenarios**:

1. **Given** un trip en cours vers un client, **When** l'ETA passe sous 30 minutes, **Then** le client reçoit une notification push "Votre livraison arrive dans environ 30 minutes".

2. **Given** un trip en cours vers un client ayant reçu la notification 30min, **When** l'ETA passe sous 10 minutes, **Then** le client reçoit une notification push "Votre livreur arrive dans quelques minutes".

3. **Given** un trip où l'ETA fluctue (trafic), **When** l'ETA repasse au-dessus de 30min après avoir été en dessous, **Then** le système ne renvoie PAS la notification 30min (éviter le spam).

---

### User Story 3 - Notification d'Assignation au Chauffeur (Priority: P2)

Le chauffeur reçoit une notification push lorsqu'un nouveau trip lui est assigné, avec les détails de la mission.

**Why this priority**: Le chauffeur doit être informé rapidement pour organiser sa journée. Essentiel pour les opérations quotidiennes.

**Independent Test**: Assigner un trip à un chauffeur, vérifier qu'il reçoit la notification push sur son mobile.

**Acceptance Scenarios**:

1. **Given** un chauffeur avec l'app mobile installée et connectée, **When** un dispatcher lui assigne un nouveau trip, **Then** il reçoit une notification push avec:
   - Titre: "Nouveau trip assigné"
   - Corps: Adresse de départ, destination, heure de départ prévue
   - Action: Tap ouvre l'app sur les détails du trip

2. **Given** un chauffeur avec l'app en arrière-plan, **When** son trip est réassigné à un autre chauffeur, **Then** il reçoit une notification "Trip annulé - [Destination] a été réassigné".

3. **Given** un chauffeur dont le trip est annulé, **When** le dispatcher annule le trip, **Then** il reçoit une notification avec la raison de l'annulation.

---

### User Story 4 - Notification Trip Assigné au Client (Priority: P3)

Le client reçoit une notification lorsqu'un chauffeur est assigné à sa livraison, avec les informations du véhicule.

**Why this priority**: Transparence pour le client qui sait que sa livraison est en cours de préparation.

**Independent Test**: Assigner un trip à un chauffeur avec un client associé, vérifier que le client reçoit l'email.

**Acceptance Scenarios**:

1. **Given** un trip avec client associé, **When** un chauffeur et un camion sont assignés, **Then** le client reçoit un email:
   - Objet: "Un chauffeur a été assigné à votre livraison"
   - Corps: Nom du chauffeur (optionnel), immatriculation du véhicule, date prévue de livraison

---

### User Story 5 - Rapports Quotidiens pour Fleet Manager (Priority: P3)

Le Fleet Manager reçoit un email quotidien résumant l'activité de la flotte: trips complétés, en cours, en retard.

**Why this priority**: Vision globale de l'activité sans avoir à se connecter au dashboard.

**Independent Test**: Déclencher l'envoi du rapport quotidien, vérifier le contenu de l'email.

**Acceptance Scenarios**:

1. **Given** un Fleet Manager avec les notifications quotidiennes activées, **When** il est 7h00 du matin (configurable), **Then** il reçoit un email avec:
   - Trips complétés hier
   - Trips en cours aujourd'hui
   - Trips en retard (alertes)
   - Lien vers le dashboard pour plus de détails

2. **Given** un Fleet Manager, **When** il désactive les rapports quotidiens dans ses préférences, **Then** il ne reçoit plus les emails de rapport.

---

### User Story 6 - Préférences de Notification (Priority: P4)

Chaque utilisateur peut configurer ses préférences de notification (canaux, types d'événements, fréquence).

**Why this priority**: Personnalisation importante mais non bloquante pour le MVP.

**Independent Test**: Modifier les préférences d'un utilisateur, vérifier que les notifications respectent les nouveaux paramètres.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté au dashboard, **When** il accède à "Paramètres > Notifications", **Then** il voit une liste des types de notifications avec toggle Email/Push pour chacun.

2. **Given** un utilisateur qui désactive les notifications ETA, **When** un camion approche, **Then** il ne reçoit PAS de notification push ETA.

3. **Given** un client sans compte utilisateur, **When** une livraison lui est destinée, **Then** il reçoit les notifications par défaut (email de livraison uniquement).

---

### Edge Cases

- **Bounce email**: Que faire si l'email du client bounce? Log l'erreur, marquer l'email comme invalide après 3 bounces.
- **Push token expiré**: Gérer le cas où le token Firebase/APNs est invalide. Supprimer le token et ne pas bloquer.
- **Haute charge**: Gestion des pics (ex: 1000 livraisons terminées en même temps). Queue Kafka pour étaler la charge.
- **Client sans email ni push**: Logger mais ne pas bloquer le workflow opérationnel.
- **Timezone**: Respecter la timezone du destinataire pour les heures dans les emails.
- **Langue**: Supporter FR/EN selon la préférence utilisateur (i18n).

## Requirements

### Functional Requirements

- **FR-001**: System MUST send email notifications via SMTP/API (SendGrid, AWS SES, ou SMTP standard)
- **FR-002**: System MUST send push notifications via Firebase Cloud Messaging (FCM) pour Android et APNs pour iOS
- **FR-003**: System MUST consume events from Kafka topics (`truck-track.trips.completed`, `truck-track.trips.assigned`, etc.)
- **FR-004**: System MUST persist notification history (sent, delivered, failed, read)
- **FR-005**: System MUST support user notification preferences (channels, event types)
- **FR-006**: System MUST handle email bounces and invalid push tokens gracefully
- **FR-007**: System MUST support email templates with variables (nom, date, signature image, etc.)
- **FR-008**: System MUST retry failed notifications (3 retries avec exponential backoff)
- **FR-009**: System MUST respect rate limits des providers (SendGrid: 100/sec, FCM: 500/sec)
- **FR-010**: System MUST support scheduling for daily digest emails

### Non-Functional Requirements

- **NFR-001**: Notification delivery latency < 30 seconds for push, < 2 minutes for email
- **NFR-002**: System MUST handle 10,000 notifications/hour without degradation
- **NFR-003**: 99.9% uptime for notification service (async, non-blocking)
- **NFR-004**: All notification content MUST be encrypted in transit (TLS)

### Key Entities

- **NotificationTemplate**: Modèle d'email/push avec variables et i18n
- **NotificationEvent**: Événement déclencheur (type, payload, timestamp)
- **NotificationLog**: Historique des notifications envoyées (status, delivery info)
- **UserNotificationPreference**: Préférences par utilisateur et type d'événement
- **PushToken**: Tokens FCM/APNs par device utilisateur
- **EmailRecipient**: Email du client final (peut ne pas avoir de compte utilisateur)

## Success Criteria

### Measurable Outcomes

- **SC-001**: 95% des notifications push livrées en moins de 30 secondes
- **SC-002**: 99% des emails envoyés avec succès (hors bounces)
- **SC-003**: Réduction de 30% des appels support "ma livraison est-elle arrivée?"
- **SC-004**: 80% des clients ouvrent l'email de confirmation de livraison
- **SC-005**: Fleet Managers consultent le dashboard 20% moins souvent (informés par email)

## Out of Scope

- SMS notifications (phase future - coût élevé)
- WhatsApp Business API (complexité d'intégration)
- Notifications temps réel in-app (WebSocket) - utiliser push à la place
- Personnalisation avancée des templates par le client (admin uniquement)
