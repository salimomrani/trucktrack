# Quickstart: Email & Push Notifications

**Feature**: 016-email-notifications
**Date**: 2025-12-28

## Prérequis

### Services requis
- PostgreSQL (existant)
- Kafka (existant)
- Redis (existant)
- auth-service (running)
- location-service (running)

### Comptes externes
- **SendGrid**: Compte gratuit avec API Key
- **Firebase**: Projet avec Cloud Messaging activé

### Configuration environnement

```bash
# Notification Service
export SENDGRID_API_KEY=SG.xxxx
export SENDGRID_FROM_EMAIL=notifications@trucktrack.com
export FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json

# Kafka
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

---

## Scénarios de Test

### Scénario 1: Email de Confirmation de Livraison (MVP - P1)

**Objectif**: Vérifier que le client reçoit un email avec POD après livraison

**Étapes**:

1. **Créer un trip avec client**
```bash
curl -X POST http://localhost:8080/admin/trips \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Entrepôt Paris",
    "destination": "123 Rue du Client, Lyon",
    "recipientEmail": "client@example.com",
    "recipientName": "Jean Dupont"
  }'
# Note: trip_id from response
```

2. **Assigner un chauffeur**
```bash
curl -X POST http://localhost:8080/admin/trips/{trip_id}/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "xxx",
    "driverId": "yyy"
  }'
```

3. **Démarrer le trip (mobile)**
```bash
curl -X POST http://localhost:8080/location/v1/trips/{trip_id}/start \
  -H "Authorization: Bearer $DRIVER_TOKEN"
```

4. **Compléter avec POD (mobile)**
```bash
curl -X POST http://localhost:8080/location/v1/trips/{trip_id}/proof \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signatureData": "data:image/png;base64,xxx...",
    "signerName": "Jean Dupont"
  }'
```

5. **Vérification**
- [ ] Email reçu par `client@example.com`
- [ ] Sujet contient le numéro de commande
- [ ] Corps contient la signature en image
- [ ] Date/heure de livraison correcte
- [ ] Nom du signataire affiché

---

### Scénario 2: Push Notification au Chauffeur (P2)

**Objectif**: Vérifier que le chauffeur reçoit une notification push à l'assignation

**Prérequis**:
- App mobile installée sur device
- Token FCM enregistré

**Étapes**:

1. **Enregistrer le token push (mobile)**
```bash
curl -X POST http://localhost:8080/api/notifications/push-tokens \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "fcm_token_from_device",
    "deviceType": "ANDROID",
    "deviceName": "Samsung Galaxy S21"
  }'
```

2. **Assigner un trip au chauffeur**
```bash
curl -X POST http://localhost:8080/admin/trips/{trip_id}/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "xxx",
    "driverId": "{driver_user_id}"
  }'
```

3. **Vérification**
- [ ] Notification push reçue sur device
- [ ] Titre: "Nouveau trip assigné"
- [ ] Corps contient destination et heure de départ
- [ ] Tap ouvre l'app sur les détails du trip

---

### Scénario 3: Notifications ETA (P2)

**Objectif**: Vérifier les notifications ETA 30min et 10min

**Prérequis**:
- Trip en cours avec client ayant token push
- Simulation de position GPS

**Étapes**:

1. **Créer trip avec estimation 45min**
```bash
# Trip avec destination à ~45min de route
```

2. **Simuler approche du camion**
```bash
# Envoyer positions GPS simulant approche
# Position 1: ETA 35min → pas de notification
# Position 2: ETA 28min → notification 30min
# Position 3: ETA 8min → notification 10min
```

3. **Vérification**
- [ ] Notification 30min reçue une seule fois
- [ ] Notification 10min reçue une seule fois
- [ ] Pas de notification si ETA repasse au-dessus de 30min

---

### Scénario 4: Préférences de Notification (P4)

**Objectif**: Vérifier que les préférences utilisateur sont respectées

**Étapes**:

1. **Récupérer préférences actuelles**
```bash
curl http://localhost:8080/api/notifications/preferences \
  -H "Authorization: Bearer $USER_TOKEN"
```

2. **Désactiver notifications ETA par email**
```bash
curl -X PUT http://localhost:8080/api/notifications/preferences \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"eventType": "ETA_30MIN", "emailEnabled": false, "pushEnabled": true},
    {"eventType": "ETA_10MIN", "emailEnabled": false, "pushEnabled": true}
  ]'
```

3. **Déclencher notification ETA**

4. **Vérification**
- [ ] Push reçu
- [ ] Email NON reçu

---

### Scénario 5: Rapport Quotidien Fleet Manager (P3)

**Objectif**: Vérifier l'envoi du rapport quotidien

**Étapes**:

1. **Activer rapport quotidien**
```bash
curl -X PUT http://localhost:8080/api/notifications/preferences \
  -H "Authorization: Bearer $FLEET_MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"eventType": "DAILY_REPORT", "emailEnabled": true, "pushEnabled": false}
  ]'
```

2. **Déclencher manuellement (test)**
```bash
# Endpoint admin pour test
curl -X POST http://localhost:8080/admin/notifications/trigger-daily-report \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

3. **Vérification**
- [ ] Email reçu par Fleet Manager
- [ ] Contient stats trips d'hier
- [ ] Contient trips en cours aujourd'hui
- [ ] Lien vers dashboard fonctionne

---

### Scénario 6: Gestion des Bounces

**Objectif**: Vérifier que les emails invalides sont gérés correctement

**Étapes**:

1. **Créer trip avec email invalide**
```bash
curl -X POST http://localhost:8080/admin/trips \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "recipientEmail": "invalid@doesnotexist.xyz",
    ...
  }'
```

2. **Compléter le trip**

3. **Simuler webhook bounce SendGrid**
```bash
curl -X POST http://localhost:8080/api/notifications/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{
    "event": "bounce",
    "email": "invalid@doesnotexist.xyz",
    "timestamp": 1703721600,
    "reason": "550 User unknown"
  }]'
```

4. **Vérification**
- [ ] NotificationLog status = BOUNCED
- [ ] EmailRecipient.bounce_count incrémenté
- [ ] Après 3 bounces: is_valid = false
- [ ] Workflow trip non bloqué

---

## Commandes Utiles

### Vérifier les notifications envoyées
```bash
curl "http://localhost:8080/admin/notifications?from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Stats de notifications
```bash
curl "http://localhost:8080/admin/notifications/stats?from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Renvoyer une notification en échec
```bash
curl -X POST http://localhost:8080/admin/notifications/{notificationId}/resend \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Lister les templates
```bash
curl http://localhost:8080/admin/templates \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Kafka Topics à Vérifier

```bash
# Lister les messages sur le topic trips.completed
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic truck-track.trips.completed \
  --from-beginning

# Lister les messages sur le topic trips.assigned
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic truck-track.trips.assigned \
  --from-beginning
```

---

## Troubleshooting

### Email non reçu
1. Vérifier les logs notification-service
2. Vérifier SendGrid Activity Feed
3. Vérifier que l'email n'est pas en spam
4. Vérifier les préférences utilisateur

### Push non reçu
1. Vérifier que le token FCM est valide
2. Vérifier les logs Firebase Console
3. Vérifier que les notifications sont activées sur le device
4. Vérifier les préférences utilisateur

### Kafka consumer lag
```bash
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group notification-service-group \
  --describe
```
