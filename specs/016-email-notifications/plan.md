# Implementation Plan: Email & Push Notifications

**Branch**: `016-email-notifications` | **Date**: 2025-12-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-email-notifications/spec.md`

## Summary

Système de notifications multi-canal (Email + Push) pour informer tous les utilisateurs (Fleet Managers, Drivers, Clients finaux) des événements clés: livraisons terminées avec POD, assignations de trips, alertes ETA, et rapports quotidiens.

**Approche technique**: Nouveau microservice `notification-service` consommant les événements Kafka, utilisant SendGrid pour les emails et Firebase Cloud Messaging pour les notifications push. Templates Thymeleaf avec support i18n (FR/EN).

## Technical Context

**Language/Version**: Java 17 (Spring Boot 3.2.x)
**Primary Dependencies**: Spring Boot Starter, Spring Kafka, SendGrid SDK, Firebase Admin SDK, Thymeleaf, Resilience4j
**Storage**: PostgreSQL 15+ (tables notification_logs, user_notification_preferences, push_tokens, notification_templates, email_recipients)
**Testing**: JUnit 5, Mockito, Testcontainers (Kafka, PostgreSQL)
**Target Platform**: Linux containers (Docker/Kubernetes)
**Project Type**: Microservice (nouveau service dans le backend)
**Performance Goals**: 10,000 notifications/heure, latence push < 30s, latence email < 2min
**Constraints**: Rate limits SendGrid (100/sec), FCM (500/sec), retry avec exponential backoff
**Scale/Scope**: Support 500 utilisateurs concurrents, 3 types de destinataires, 7 types d'événements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | PASS | Notifications push < 30s, event-driven via Kafka |
| II. Microservices Architecture | PASS | Nouveau microservice indépendant, communique via Kafka |
| III. Code Quality & Testing Standards | PASS | Tests unitaires, intégration, contract tests prévus |
| IV. Performance Requirements | PASS | Targets définis: 10k notif/h, latences spécifiées |
| V. Security & Privacy | PASS | JWT auth, TLS, audit logging, RGPD (unsubscribe) |
| VI. User Experience Consistency | PASS | Templates i18n, préférences utilisateur |

**Gate Result**: PASS - Aucune violation constitutionnelle

## Project Structure

### Documentation (this feature)

```text
specs/016-email-notifications/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical research and decisions
├── data-model.md        # Database schema and entities
├── quickstart.md        # Test scenarios and commands
├── contracts/
│   └── notification-api.yaml  # OpenAPI specification
└── tasks.md             # Implementation tasks (to be generated)
```

### Source Code (repository root)

```text
backend/
├── notification-service/           # NEW microservice
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/trucktrack/notification/
│       │   │   ├── NotificationServiceApplication.java
│       │   │   ├── config/
│       │   │   │   ├── KafkaConsumerConfig.java
│       │   │   │   ├── SendGridConfig.java
│       │   │   │   ├── FirebaseConfig.java
│       │   │   │   └── SecurityConfig.java
│       │   │   ├── consumer/
│       │   │   │   ├── TripEventConsumer.java
│       │   │   │   └── EtaAlertConsumer.java
│       │   │   ├── service/
│       │   │   │   ├── EmailService.java
│       │   │   │   ├── PushNotificationService.java
│       │   │   │   ├── NotificationPreferenceService.java
│       │   │   │   ├── TemplateService.java
│       │   │   │   └── NotificationLogService.java
│       │   │   ├── controller/
│       │   │   │   ├── PreferenceController.java
│       │   │   │   ├── PushTokenController.java
│       │   │   │   ├── NotificationHistoryController.java
│       │   │   │   ├── AdminNotificationController.java
│       │   │   │   └── WebhookController.java
│       │   │   ├── model/
│       │   │   │   ├── NotificationLog.java
│       │   │   │   ├── NotificationTemplate.java
│       │   │   │   ├── UserNotificationPreference.java
│       │   │   │   ├── PushToken.java
│       │   │   │   ├── EmailRecipient.java
│       │   │   │   └── enums/
│       │   │   │       ├── NotificationType.java
│       │   │   │       ├── NotificationChannel.java
│       │   │   │       ├── NotificationStatus.java
│       │   │   │       ├── DeviceType.java
│       │   │   │       └── RecipientType.java
│       │   │   ├── repository/
│       │   │   │   ├── NotificationLogRepository.java
│       │   │   │   ├── NotificationTemplateRepository.java
│       │   │   │   ├── UserNotificationPreferenceRepository.java
│       │   │   │   ├── PushTokenRepository.java
│       │   │   │   └── EmailRecipientRepository.java
│       │   │   └── dto/
│       │   │       ├── NotificationPreferenceDTO.java
│       │   │       ├── PushTokenDTO.java
│       │   │       ├── NotificationLogDTO.java
│       │   │       ├── NotificationStatsDTO.java
│       │   │       └── SendNotificationRequest.java
│       │   └── resources/
│       │       ├── application.yml
│       │       ├── db/migration/
│       │       │   └── V1__create_notification_tables.sql
│       │       └── templates/
│       │           └── email/
│       │               ├── delivery-confirmation.html
│       │               ├── delivery-confirmation_en.html
│       │               ├── trip-assigned.html
│       │               └── daily-report.html
│       └── test/
│           └── java/com/trucktrack/notification/
│               ├── consumer/
│               ├── service/
│               └── controller/

├── location-service/
│   └── src/main/java/com/trucktrack/location/
│       ├── service/
│       │   └── TripService.java           # MODIFY: Publish Kafka events
│       └── event/
│           ├── TripCompletedEvent.java    # NEW
│           ├── TripAssignedEvent.java     # NEW
│           └── EtaAlertEvent.java         # NEW

├── api-gateway/
│   └── src/main/resources/
│       └── application.yml                # MODIFY: Add notification-service routes

frontend/
└── src/app/
    ├── features/
    │   └── settings/
    │       └── notification-preferences/  # NEW
    │           ├── notification-preferences.component.ts
    │           ├── notification-preferences.component.html
    │           └── notification-preferences.component.scss
    └── core/services/
        └── notification.service.ts        # NEW

mobile-expo/
└── src/
    ├── services/
    │   └── pushNotification.ts            # NEW: FCM token management
    └── screens/
        └── SettingsScreen.tsx             # MODIFY: Add notification preferences
```

**Structure Decision**: Nouveau microservice `notification-service` suivant l'architecture existante. Modifications mineures dans location-service (publish events), api-gateway (routes), frontend (préférences), et mobile (push tokens).

## Complexity Tracking

> Aucune violation constitutionnelle à justifier.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Dependencies

### External Services
- **SendGrid**: Email delivery API (free tier: 100/day)
- **Firebase Cloud Messaging**: Push notifications (free)

### Internal Dependencies
- **auth-service**: User authentication, user_notification_preferences table
- **location-service**: Trip events producer (Kafka)
- **api-gateway**: Routing to notification-service

### Kafka Topics (to create)
- `truck-track.trips.completed`
- `truck-track.trips.assigned`
- `truck-track.trips.cancelled`
- `truck-track.trips.eta-alert`

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SendGrid rate limit | Medium | Medium | Queue + rate limiter Resilience4j |
| FCM token invalidation | Low | Low | Graceful handling, remove invalid tokens |
| Email bounce spam | Medium | High | Bounce tracking, 3-strike disable |
| Kafka consumer lag | Low | Medium | Multiple partitions, monitoring alerts |

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Create feature branch `016-email-notifications`
3. Start with Phase 1: Setup (new microservice skeleton)
4. MVP: User Story 1 (Delivery confirmation email)
