# Research: Email & Push Notifications

**Feature**: 016-email-notifications
**Date**: 2025-12-28

## 1. Email Provider

### Decision: SendGrid

### Rationale
- **API simple**: SDK Java officiel, intégration Spring Boot triviale
- **Webhooks**: Suivi delivery/bounce/open intégré
- **Templates dynamiques**: Variables et conditionnels dans les templates
- **Free tier généreux**: 100 emails/jour gratuits (suffisant pour dev/test)
- **RGPD compliant**: Serveurs EU disponibles

### Alternatives Considered

| Provider | Avantages | Inconvénients | Verdict |
|----------|-----------|---------------|---------|
| **SendGrid** | SDK Java, webhooks, templates | Coût à l'échelle | **Choisi** |
| **AWS SES** | Moins cher à grande échelle | Plus complexe à configurer, pas de templates | Trop complexe pour MVP |
| **SMTP Standard** | Simple, no vendor lock-in | Pas de tracking, pas de templates | Insuffisant |
| **Mailgun** | Bonne API | Moins populaire, moins de docs | Non retenu |

### Implementation Notes
```yaml
# application.yml
sendgrid:
  api-key: ${SENDGRID_API_KEY}
  from-email: notifications@trucktrack.com
  from-name: TruckTrack
```

---

## 2. Push Notifications

### Decision: Firebase Cloud Messaging (FCM) uniquement

### Rationale
- **Cross-platform**: Android ET iOS via une seule API
- **Expo compatible**: expo-notifications utilise FCM en backend
- **Gratuit**: Pas de limite de volume
- **Fiable**: Infrastructure Google, 99.9% uptime
- **SDK Java**: firebase-admin SDK officiel

### Alternatives Considered

| Solution | Avantages | Inconvénients | Verdict |
|----------|-----------|---------------|---------|
| **FCM seul** | Simple, gratuit, cross-platform | Dépendance Google | **Choisi** |
| **FCM + APNs direct** | Contrôle total iOS | Double implémentation | Over-engineering |
| **OneSignal** | Dashboard, analytics | Coût, vendor lock-in | Non nécessaire |
| **Pusher** | WebSocket aussi | Payant, complexe | Non retenu |

### Implementation Notes
```java
// FirebaseMessaging.getInstance().send(message)
// Token stocké côté mobile via expo-notifications
```

---

## 3. Template Engine

### Decision: Thymeleaf

### Rationale
- **Spring Boot natif**: Auto-configuration, pas de dépendance supplémentaire
- **HTML naturel**: Templates lisibles sans tooling
- **i18n intégré**: Messages bundles pour FR/EN
- **Variables sécurisées**: Échappement automatique

### Alternatives Considered

| Engine | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| **Thymeleaf** | Spring natif, i18n | Syntaxe verbeuse | **Choisi** |
| **Freemarker** | Puissant, flexible | Config additionnelle | Non nécessaire |
| **SendGrid Templates** | Éditeur WYSIWYG | Vendor lock-in, moins flexible | Backup option |

### Template Structure
```
resources/
  templates/
    email/
      delivery-confirmation.html
      delivery-confirmation_fr.html
      trip-assigned.html
      daily-report.html
```

---

## 4. Architecture Kafka

### Decision: Dedicated Notification Service (nouveau microservice)

### Rationale
- **Constitution**: "Notification Service" explicitement mentionné dans l'architecture
- **Séparation des responsabilités**: Ne pas surcharger location-service
- **Scalabilité indépendante**: Peut scaler selon le volume de notifications
- **Resilience**: Si le service tombe, les messages restent dans Kafka

### Kafka Topics

| Topic | Producer | Description |
|-------|----------|-------------|
| `truck-track.trips.completed` | location-service | Trip terminé avec POD |
| `truck-track.trips.assigned` | location-service | Trip assigné à un chauffeur |
| `truck-track.trips.cancelled` | location-service | Trip annulé |
| `truck-track.trips.eta-alert` | location-service | ETA passe sous seuil |

### Consumer Pattern
- **Consumer Group**: `notification-service-group`
- **Concurrency**: 3 partitions, 3 consumers
- **Error handling**: Dead Letter Queue pour messages en échec

---

## 5. Stockage des Préférences

### Decision: Table dans PostgreSQL (auth-service)

### Rationale
- **Cohérence**: Les préférences sont liées à l'utilisateur (auth-service)
- **Simple**: Pas besoin d'un nouveau service
- **Transactionnel**: Mise à jour atomique avec le profil utilisateur

### Alternative: Redis
- Avantage: Lecture ultra-rapide
- Inconvénient: Complexité, risque de désynchronisation
- Verdict: PostgreSQL suffisant, Redis si besoin de performance

---

## 6. Gestion des Clients Finaux (sans compte)

### Decision: Table EmailRecipient dans notification-service

### Rationale
- **Clients sans compte**: Un client peut recevoir des notifications sans créer de compte
- **Données minimales**: email, nom, préférences par défaut
- **Lié au Trip**: Chaque trip peut avoir un `recipient_email` et `recipient_name`

### Data Flow
```
Trip créé → recipient_email stocké → notification-service lookup → email envoyé
```

---

## 7. Rate Limiting & Retry

### Decision: Spring Retry + Resilience4j

### Rationale
- **Exponential backoff**: 1s, 2s, 4s entre retries
- **Circuit breaker**: Éviter de surcharger SendGrid/FCM si down
- **Rate limiter**: Respecter limites providers (100/sec SendGrid)

### Configuration
```java
@Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000, multiplier = 2))
public void sendEmail(EmailNotification notification) { ... }
```

---

## 8. Monitoring & Observability

### Decision: Prometheus + Grafana (existant)

### Metrics à tracker
- `notifications_sent_total{channel=email|push, status=success|failed}`
- `notification_delivery_latency_seconds`
- `email_bounce_rate`
- `push_token_invalid_count`

### Alerts
- Bounce rate > 5% → Alerte
- Delivery latency > 60s → Alerte
- FCM errors spike → Alerte

---

## 9. Structure du Nouveau Service

### Decision: Nouveau microservice `notification-service`

```
backend/
  notification-service/
    src/main/java/com/trucktrack/notification/
      config/
        KafkaConsumerConfig.java
        SendGridConfig.java
        FirebaseConfig.java
      consumer/
        TripEventConsumer.java
        EtaAlertConsumer.java
      service/
        EmailService.java
        PushNotificationService.java
        NotificationPreferenceService.java
        TemplateService.java
      model/
        NotificationLog.java
        NotificationTemplate.java
        PushToken.java
      repository/
        NotificationLogRepository.java
        PushTokenRepository.java
      dto/
        EmailNotificationDTO.java
        PushNotificationDTO.java
```

---

## 10. Sécurité

### Considérations
- **API Keys**: SendGrid/FCM keys en variables d'environnement, pas en code
- **PII**: Emails clients = données personnelles → chiffrement au repos
- **Unsubscribe**: Lien de désinscription obligatoire dans chaque email (RGPD)
- **Audit**: Logger qui a reçu quoi et quand

---

## Summary

| Aspect | Décision | Justification |
|--------|----------|---------------|
| Email Provider | SendGrid | SDK Java, webhooks, templates |
| Push Provider | FCM | Cross-platform, gratuit, Expo compatible |
| Templates | Thymeleaf | Spring natif, i18n |
| Architecture | Nouveau microservice | Constitution, scalabilité |
| Stockage préférences | PostgreSQL (auth-service) | Cohérence utilisateur |
| Retry/Rate limit | Spring Retry + Resilience4j | Robustesse |
| Monitoring | Prometheus + Grafana | Existant |
