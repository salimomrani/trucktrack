# Tasks: Email & Push Notifications

**Input**: Design documents from `/specs/016-email-notifications/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/notification-api.yaml

**Tests**: Not explicitly requested - focusing on implementation tasks.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create notification-service microservice skeleton and add dependencies

- [x] T001 Create notification-service directory structure per plan.md in backend/notification-service/
- [x] T002 Create pom.xml with Spring Boot 3.2.x, Spring Kafka, SendGrid SDK, Firebase Admin SDK, Thymeleaf, Resilience4j in backend/notification-service/pom.xml
- [x] T003 [P] Create NotificationServiceApplication.java main class in backend/notification-service/src/main/java/com/trucktrack/notification/NotificationServiceApplication.java
- [x] T004 [P] Create application.yml with Kafka, SendGrid, Firebase, PostgreSQL config in backend/notification-service/src/main/resources/application.yml
- [x] T005 Create database migration V1__create_notification_tables.sql from data-model.md in backend/notification-service/src/main/resources/db/migration/V1__create_notification_tables.sql
- [x] T006 [P] Create SecurityConfig.java with JWT authentication in backend/notification-service/src/main/java/com/trucktrack/notification/config/SecurityConfig.java
- [x] T007 Add notification-service routes to API Gateway in backend/api-gateway/src/main/resources/application.yml
- [x] T008 Add Dockerfile for notification-service in backend/notification-service/Dockerfile

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities, enums, repositories, and services that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Enums

- [x] T009 Create NotificationType enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/NotificationType.java
- [x] T010 [P] Create NotificationChannel enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/NotificationChannel.java
- [x] T011 [P] Create NotificationStatus enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/NotificationStatus.java
- [x] T012 [P] Create DeviceType enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/DeviceType.java
- [x] T013 [P] Create RecipientType enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/RecipientType.java

### Entities

- [x] T014 Create NotificationLog entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/NotificationLog.java
- [x] T015 [P] Create NotificationTemplate entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/NotificationTemplate.java
- [x] T016 [P] Create UserNotificationPreference entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/UserNotificationPreference.java
- [x] T017 [P] Create PushToken entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/PushToken.java
- [x] T018 [P] Create EmailRecipient entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/EmailRecipient.java

### Repositories

- [x] T019 Create NotificationLogRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/NotificationLogRepository.java
- [x] T020 [P] Create NotificationTemplateRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/NotificationTemplateRepository.java
- [x] T021 [P] Create UserNotificationPreferenceRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/UserNotificationPreferenceRepository.java
- [x] T022 [P] Create PushTokenRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/PushTokenRepository.java
- [x] T023 [P] Create EmailRecipientRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/EmailRecipientRepository.java

### DTOs

- [x] T024 Create NotificationLogDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/NotificationLogDTO.java
- [x] T025 [P] Create NotificationPreferenceDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/NotificationPreferenceDTO.java
- [x] T026 [P] Create PushTokenDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/PushTokenDTO.java
- [x] T027 [P] Create NotificationStatsDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/NotificationStatsDTO.java
- [x] T028 [P] Create SendNotificationRequest DTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/SendNotificationRequest.java

### Core Configurations

- [x] T029 Create SendGridConfig with API key configuration in backend/notification-service/src/main/java/com/trucktrack/notification/config/SendGridConfig.java
- [x] T030 [P] Create FirebaseConfig with FCM credentials in backend/notification-service/src/main/java/com/trucktrack/notification/config/FirebaseConfig.java
- [x] T031 Create KafkaConsumerConfig for trip events in backend/notification-service/src/main/java/com/trucktrack/notification/config/KafkaConsumerConfig.java

### Core Services

- [x] T032 Create TemplateService for Thymeleaf template rendering in backend/notification-service/src/main/java/com/trucktrack/notification/service/TemplateService.java
- [x] T033 Create NotificationLogService for logging notifications in backend/notification-service/src/main/java/com/trucktrack/notification/service/NotificationLogService.java
- [x] T034 Create NotificationPreferenceService for checking user preferences in backend/notification-service/src/main/java/com/trucktrack/notification/service/NotificationPreferenceService.java

### Kafka Events in location-service

- [x] T035 Create TripCompletedEvent class in backend/location-service/src/main/java/com/trucktrack/location/event/TripCompletedEvent.java
- [x] T036 [P] Create TripAssignedEvent class in backend/location-service/src/main/java/com/trucktrack/location/event/TripAssignedEvent.java
- [x] T037 [P] Create EtaAlertEvent class in backend/location-service/src/main/java/com/trucktrack/location/event/EtaAlertEvent.java
- [x] T038 Modify TripService to publish Kafka events on trip status changes in backend/location-service/src/main/java/com/trucktrack/location/service/TripService.java
- [x] T039 Add recipient_email, recipient_name, recipient_phone columns to trips table migration in backend/location-service/src/main/resources/db/migration/V9__add_recipient_fields_to_trips.sql

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Notification de Livraison Confirmée au Client (Priority: P1)

**Goal**: Client reçoit un email avec POD (signature, photos) quand livraison terminée

**Independent Test**: Compléter un trip avec POD, vérifier que le client reçoit un email avec signature et photos.

### Backend Implementation

- [x] T040 [US1] Create EmailService with SendGrid integration and retry logic in backend/notification-service/src/main/java/com/trucktrack/notification/service/EmailService.java
- [x] T041 [US1] Create PushNotificationService with FCM integration in backend/notification-service/src/main/java/com/trucktrack/notification/service/PushNotificationService.java
- [x] T042 [US1] Create delivery-confirmation.html email template (FR) in backend/notification-service/src/main/resources/templates/email/delivery-confirmation.html
- [x] T043 [P] [US1] Create delivery-confirmation_en.html email template (EN) in backend/notification-service/src/main/resources/templates/email/delivery-confirmation_en.html
- [x] T044 [US1] Create TripEventConsumer for truck-track.trips.completed topic in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [x] T045 [US1] Implement handleTripCompleted method in TripEventConsumer to send delivery confirmation in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [x] T046 [US1] Add error handling for invalid emails (log but don't block) in EmailService in backend/notification-service/src/main/java/com/trucktrack/notification/service/EmailService.java
- [x] T047 [US1] Create WebhookController for SendGrid bounce/delivery webhooks in backend/notification-service/src/main/java/com/trucktrack/notification/controller/WebhookController.java
- [x] T048 [US1] Implement bounce handling logic (increment bounce_count, mark invalid after 3) in WebhookController

**Checkpoint**: User Story 1 complete - client receives delivery confirmation email with POD

---

## Phase 4: User Story 2 - Notifications ETA pour le Client (Priority: P2)

**Goal**: Client reçoit push notifications à 30min et 10min avant arrivée

**Independent Test**: Simuler camion approchant, vérifier notifications 30min et 10min.

### Backend Implementation

- [x] T049 [US2] Create EtaAlertConsumer for truck-track.trips.eta-alert topic in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/EtaAlertConsumer.java
- [x] T050 [US2] Implement handleEtaAlert method with 30min/10min notification logic in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/EtaAlertConsumer.java
- [x] T051 [US2] Add deduplication logic to prevent sending same alert twice in EtaAlertConsumer
- [x] T052 [US2] Create ETA_30MIN_PUSH template in NotificationTemplate seed data
- [x] T053 [P] [US2] Create ETA_10MIN_PUSH template in NotificationTemplate seed data

### location-service Modifications

- [x] T054 [US2] Create EtaCalculationService to calculate ETA based on GPS positions in backend/location-service/src/main/java/com/trucktrack/location/service/EtaCalculationService.java
- [x] T055 [US2] Modify GPS position handler to check ETA thresholds and publish EtaAlertEvent in backend/location-service/src/main/java/com/trucktrack/location/service/GpsPositionService.java

**Checkpoint**: User Story 2 complete - client receives ETA push notifications

---

## Phase 5: User Story 3 - Notification d'Assignation au Chauffeur (Priority: P2)

**Goal**: Chauffeur reçoit push notification quand trip assigné/réassigné/annulé

**Independent Test**: Assigner trip à chauffeur, vérifier push notification reçue.

### Backend Implementation

- [x] T056 [US3] Implement handleTripAssigned method in TripEventConsumer in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [x] T057 [US3] Implement handleTripCancelled method in TripEventConsumer in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [x] T058 [US3] Implement handleTripReassigned method in TripEventConsumer in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [x] T059 [US3] Create TRIP_ASSIGNED_PUSH template with destination and departure time
- [x] T060 [P] [US3] Create TRIP_CANCELLED_PUSH template with cancellation reason
- [x] T061 [P] [US3] Create TRIP_REASSIGNED_PUSH template

### Mobile Integration

- [x] T062 [US3] Create pushNotification.ts service for FCM token management in mobile-expo/src/services/pushNotification.ts
- [x] T063 [US3] Register FCM token on app startup and login in mobile-expo/src/services/pushNotification.ts
- [x] T064 [US3] Handle notification tap to navigate to trip details in mobile-expo/src/services/pushNotification.ts

**Checkpoint**: User Story 3 complete - driver receives push notifications for trip changes

---

## Phase 6: User Story 4 - Notification Trip Assigné au Client (Priority: P3)

**Goal**: Client reçoit email quand chauffeur assigné à sa livraison

**Independent Test**: Assigner chauffeur à trip avec client, vérifier email reçu.

### Backend Implementation

- [x] T065 [US4] Create trip-assigned-client.html email template in backend/notification-service/src/main/resources/templates/email/trip-assigned-client.html
- [x] T066 [US4] Extend handleTripAssigned to also notify client via email in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [x] T067 [US4] Include vehicle plate number and estimated delivery date in email template

**Checkpoint**: User Story 4 complete - client receives email when driver assigned

---

## Phase 7: User Story 5 - Rapports Quotidiens pour Fleet Manager (Priority: P3)

**Goal**: Fleet Manager reçoit email quotidien avec résumé activité flotte

**Independent Test**: Déclencher rapport quotidien, vérifier contenu email.

### Backend Implementation

- [x] T068 [US5] Create DailyReportService for generating fleet activity summary in backend/notification-service/src/main/java/com/trucktrack/notification/service/DailyReportService.java
- [x] T069 [US5] Create daily-report.html email template with trips completed, in progress, delayed in backend/notification-service/src/main/resources/templates/email/daily-report.html
- [x] T070 [US5] Create ScheduledTasks class with @Scheduled(cron) for daily report at 7:00 AM in backend/notification-service/src/main/java/com/trucktrack/notification/scheduler/ScheduledTasks.java
- [x] T071 [US5] Query trips from location-service via internal API for report data in DailyReportService
- [x] T072 [US5] Create admin endpoint POST /admin/notifications/trigger-daily-report for testing in backend/notification-service/src/main/java/com/trucktrack/notification/controller/AdminNotificationController.java

**Checkpoint**: User Story 5 complete - fleet manager receives daily report

---

## Phase 8: User Story 6 - Préférences de Notification (Priority: P4)

**Goal**: Utilisateurs peuvent configurer leurs préférences de notification

**Independent Test**: Modifier préférences, vérifier notifications respectent paramètres.

### Backend Implementation

- [x] T073 [US6] Create PreferenceController with GET/PUT /preferences endpoints in backend/notification-service/src/main/java/com/trucktrack/notification/controller/PreferenceController.java
- [x] T074 [US6] Create PushTokenController with POST/GET/DELETE /push-tokens endpoints in backend/notification-service/src/main/java/com/trucktrack/notification/controller/PushTokenController.java
- [x] T075 [US6] Update NotificationPreferenceService to filter notifications based on preferences in backend/notification-service/src/main/java/com/trucktrack/notification/service/NotificationPreferenceService.java
- [x] T076 [US6] Create NotificationHistoryController with GET /history endpoint in backend/notification-service/src/main/java/com/trucktrack/notification/controller/NotificationHistoryController.java

### Frontend Implementation

- [x] T077 [US6] Create notification.service.ts for API calls in frontend/src/app/core/services/notification.service.ts
- [x] T078 [US6] Create notification-preferences.component.ts with signal inputs in frontend/src/app/features/settings/notification-preferences/notification-preferences.component.ts
- [x] T079 [P] [US6] Create notification-preferences.component.html with toggle switches for each event type in frontend/src/app/features/settings/notification-preferences/notification-preferences.component.html
- [x] T080 [P] [US6] Create notification-preferences.component.scss in frontend/src/app/features/settings/notification-preferences/notification-preferences.component.scss
- [x] T081 [US6] Add route to notification preferences in settings module

### Mobile Implementation

- [x] T082 [US6] Add notification preferences section to SettingsScreen.tsx in mobile-expo/src/screens/SettingsScreen.tsx
- [x] T083 [US6] Create API calls for preferences in mobile API service in mobile-expo/src/services/api.ts

**Checkpoint**: User Story 6 complete - users can manage notification preferences

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Admin endpoints, monitoring, and final improvements

### Admin Endpoints

- [x] T084 Create AdminNotificationController with GET /admin/notifications list endpoint in backend/notification-service/src/main/java/com/trucktrack/notification/controller/AdminNotificationController.java
- [x] T085 Add GET /admin/notifications/stats endpoint for notification statistics in AdminNotificationController
- [x] T086 Add POST /admin/notifications/{id}/resend endpoint for resending failed notifications in AdminNotificationController
- [x] T087 Add GET /admin/templates and POST /admin/templates endpoints for template management in AdminNotificationController
- [x] T088 Add PUT /admin/templates/{id} endpoint for updating templates in AdminNotificationController

### Resilience & Monitoring

- [x] T089 Add @Retryable with exponential backoff to EmailService.sendEmail() method
- [x] T090 [P] Add @Retryable with exponential backoff to PushNotificationService.sendPush() method
- [x] T091 Add Prometheus metrics for notifications_sent_total, notification_delivery_latency in backend/notification-service/src/main/java/com/trucktrack/notification/config/MetricsConfig.java
- [ ] T092 Add health check endpoint for SendGrid and FCM connectivity

### Seed Data

- [ ] T093 Create V2__seed_notification_templates.sql with default templates in backend/notification-service/src/main/resources/db/migration/V2__seed_notification_templates.sql

### Final Validation

- [ ] T094 Run database migrations and verify tables created correctly
- [ ] T095 Validate complete flow per quickstart.md scenarios

---

## Summary

| Phase | Tasks | Completed | User Story |
|-------|-------|-----------|------------|
| Phase 1: Setup | 8 | 8 | - |
| Phase 2: Foundational | 31 | 31 | - |
| Phase 3: US1 | 9 | 9 | Livraison Confirmée |
| Phase 4: US2 | 7 | 7 | ETA Notifications |
| Phase 5: US3 | 9 | 9 | Driver Notifications |
| Phase 6: US4 | 3 | 3 | Client Assignment |
| Phase 7: US5 | 5 | 5 | Daily Report |
| Phase 8: US6 | 11 | 11 | Préférences |
| Phase 9: Polish | 12 | 8 | - |
| **Total** | **95** | **91** | |

**Progress: 91/95 tasks completed (96%)**
