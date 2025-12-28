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

- [ ] T001 Create notification-service directory structure per plan.md in backend/notification-service/
- [ ] T002 Create pom.xml with Spring Boot 3.2.x, Spring Kafka, SendGrid SDK, Firebase Admin SDK, Thymeleaf, Resilience4j in backend/notification-service/pom.xml
- [ ] T003 [P] Create NotificationServiceApplication.java main class in backend/notification-service/src/main/java/com/trucktrack/notification/NotificationServiceApplication.java
- [ ] T004 [P] Create application.yml with Kafka, SendGrid, Firebase, PostgreSQL config in backend/notification-service/src/main/resources/application.yml
- [ ] T005 Create database migration V1__create_notification_tables.sql from data-model.md in backend/notification-service/src/main/resources/db/migration/V1__create_notification_tables.sql
- [ ] T006 [P] Create SecurityConfig.java with JWT authentication in backend/notification-service/src/main/java/com/trucktrack/notification/config/SecurityConfig.java
- [ ] T007 Add notification-service routes to API Gateway in backend/api-gateway/src/main/resources/application.yml
- [ ] T008 Add Dockerfile for notification-service in backend/notification-service/Dockerfile

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities, enums, repositories, and services that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Enums

- [ ] T009 Create NotificationType enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/NotificationType.java
- [ ] T010 [P] Create NotificationChannel enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/NotificationChannel.java
- [ ] T011 [P] Create NotificationStatus enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/NotificationStatus.java
- [ ] T012 [P] Create DeviceType enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/DeviceType.java
- [ ] T013 [P] Create RecipientType enum in backend/notification-service/src/main/java/com/trucktrack/notification/model/enums/RecipientType.java

### Entities

- [ ] T014 Create NotificationLog entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/NotificationLog.java
- [ ] T015 [P] Create NotificationTemplate entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/NotificationTemplate.java
- [ ] T016 [P] Create UserNotificationPreference entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/UserNotificationPreference.java
- [ ] T017 [P] Create PushToken entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/PushToken.java
- [ ] T018 [P] Create EmailRecipient entity in backend/notification-service/src/main/java/com/trucktrack/notification/model/EmailRecipient.java

### Repositories

- [ ] T019 Create NotificationLogRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/NotificationLogRepository.java
- [ ] T020 [P] Create NotificationTemplateRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/NotificationTemplateRepository.java
- [ ] T021 [P] Create UserNotificationPreferenceRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/UserNotificationPreferenceRepository.java
- [ ] T022 [P] Create PushTokenRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/PushTokenRepository.java
- [ ] T023 [P] Create EmailRecipientRepository in backend/notification-service/src/main/java/com/trucktrack/notification/repository/EmailRecipientRepository.java

### DTOs

- [ ] T024 Create NotificationLogDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/NotificationLogDTO.java
- [ ] T025 [P] Create NotificationPreferenceDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/NotificationPreferenceDTO.java
- [ ] T026 [P] Create PushTokenDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/PushTokenDTO.java
- [ ] T027 [P] Create NotificationStatsDTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/NotificationStatsDTO.java
- [ ] T028 [P] Create SendNotificationRequest DTO in backend/notification-service/src/main/java/com/trucktrack/notification/dto/SendNotificationRequest.java

### Core Configurations

- [ ] T029 Create SendGridConfig with API key configuration in backend/notification-service/src/main/java/com/trucktrack/notification/config/SendGridConfig.java
- [ ] T030 [P] Create FirebaseConfig with FCM credentials in backend/notification-service/src/main/java/com/trucktrack/notification/config/FirebaseConfig.java
- [ ] T031 Create KafkaConsumerConfig for trip events in backend/notification-service/src/main/java/com/trucktrack/notification/config/KafkaConsumerConfig.java

### Core Services

- [ ] T032 Create TemplateService for Thymeleaf template rendering in backend/notification-service/src/main/java/com/trucktrack/notification/service/TemplateService.java
- [ ] T033 Create NotificationLogService for logging notifications in backend/notification-service/src/main/java/com/trucktrack/notification/service/NotificationLogService.java
- [ ] T034 Create NotificationPreferenceService for checking user preferences in backend/notification-service/src/main/java/com/trucktrack/notification/service/NotificationPreferenceService.java

### Kafka Events in location-service

- [ ] T035 Create TripCompletedEvent class in backend/location-service/src/main/java/com/trucktrack/location/event/TripCompletedEvent.java
- [ ] T036 [P] Create TripAssignedEvent class in backend/location-service/src/main/java/com/trucktrack/location/event/TripAssignedEvent.java
- [ ] T037 [P] Create EtaAlertEvent class in backend/location-service/src/main/java/com/trucktrack/location/event/EtaAlertEvent.java
- [ ] T038 Modify TripService to publish Kafka events on trip status changes in backend/location-service/src/main/java/com/trucktrack/location/service/TripService.java
- [ ] T039 Add recipient_email, recipient_name, recipient_phone columns to trips table migration in backend/location-service/src/main/resources/db/migration/V9__add_recipient_fields_to_trips.sql

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Notification de Livraison Confirmée au Client (Priority: P1)

**Goal**: Client reçoit un email avec POD (signature, photos) quand livraison terminée

**Independent Test**: Compléter un trip avec POD, vérifier que le client reçoit un email avec signature et photos.

### Backend Implementation

- [ ] T040 [US1] Create EmailService with SendGrid integration and retry logic in backend/notification-service/src/main/java/com/trucktrack/notification/service/EmailService.java
- [ ] T041 [US1] Create PushNotificationService with FCM integration in backend/notification-service/src/main/java/com/trucktrack/notification/service/PushNotificationService.java
- [ ] T042 [US1] Create delivery-confirmation.html email template (FR) in backend/notification-service/src/main/resources/templates/email/delivery-confirmation.html
- [ ] T043 [P] [US1] Create delivery-confirmation_en.html email template (EN) in backend/notification-service/src/main/resources/templates/email/delivery-confirmation_en.html
- [ ] T044 [US1] Create TripEventConsumer for truck-track.trips.completed topic in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [ ] T045 [US1] Implement handleTripCompleted method in TripEventConsumer to send delivery confirmation in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [ ] T046 [US1] Add error handling for invalid emails (log but don't block) in EmailService in backend/notification-service/src/main/java/com/trucktrack/notification/service/EmailService.java
- [ ] T047 [US1] Create WebhookController for SendGrid bounce/delivery webhooks in backend/notification-service/src/main/java/com/trucktrack/notification/controller/WebhookController.java
- [ ] T048 [US1] Implement bounce handling logic (increment bounce_count, mark invalid after 3) in WebhookController

**Checkpoint**: User Story 1 complete - client receives delivery confirmation email with POD

---

## Phase 4: User Story 2 - Notifications ETA pour le Client (Priority: P2)

**Goal**: Client reçoit push notifications à 30min et 10min avant arrivée

**Independent Test**: Simuler camion approchant, vérifier notifications 30min et 10min.

### Backend Implementation

- [ ] T049 [US2] Create EtaAlertConsumer for truck-track.trips.eta-alert topic in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/EtaAlertConsumer.java
- [ ] T050 [US2] Implement handleEtaAlert method with 30min/10min notification logic in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/EtaAlertConsumer.java
- [ ] T051 [US2] Add deduplication logic to prevent sending same alert twice in EtaAlertConsumer
- [ ] T052 [US2] Create ETA_30MIN_PUSH template in NotificationTemplate seed data
- [ ] T053 [P] [US2] Create ETA_10MIN_PUSH template in NotificationTemplate seed data

### location-service Modifications

- [ ] T054 [US2] Create EtaCalculationService to calculate ETA based on GPS positions in backend/location-service/src/main/java/com/trucktrack/location/service/EtaCalculationService.java
- [ ] T055 [US2] Modify GPS position handler to check ETA thresholds and publish EtaAlertEvent in backend/location-service/src/main/java/com/trucktrack/location/service/GpsPositionService.java

**Checkpoint**: User Story 2 complete - client receives ETA push notifications

---

## Phase 5: User Story 3 - Notification d'Assignation au Chauffeur (Priority: P2)

**Goal**: Chauffeur reçoit push notification quand trip assigné/réassigné/annulé

**Independent Test**: Assigner trip à chauffeur, vérifier push notification reçue.

### Backend Implementation

- [ ] T056 [US3] Implement handleTripAssigned method in TripEventConsumer in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [ ] T057 [US3] Implement handleTripCancelled method in TripEventConsumer in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [ ] T058 [US3] Implement handleTripReassigned method in TripEventConsumer in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [ ] T059 [US3] Create TRIP_ASSIGNED_PUSH template with destination and departure time
- [ ] T060 [P] [US3] Create TRIP_CANCELLED_PUSH template with cancellation reason
- [ ] T061 [P] [US3] Create TRIP_REASSIGNED_PUSH template

### Mobile Integration

- [ ] T062 [US3] Create pushNotification.ts service for FCM token management in mobile-expo/src/services/pushNotification.ts
- [ ] T063 [US3] Register FCM token on app startup and login in mobile-expo/src/services/pushNotification.ts
- [ ] T064 [US3] Handle notification tap to navigate to trip details in mobile-expo/src/services/pushNotification.ts

**Checkpoint**: User Story 3 complete - driver receives push notifications for trip changes

---

## Phase 6: User Story 4 - Notification Trip Assigné au Client (Priority: P3)

**Goal**: Client reçoit email quand chauffeur assigné à sa livraison

**Independent Test**: Assigner chauffeur à trip avec client, vérifier email reçu.

### Backend Implementation

- [ ] T065 [US4] Create trip-assigned-client.html email template in backend/notification-service/src/main/resources/templates/email/trip-assigned-client.html
- [ ] T066 [US4] Extend handleTripAssigned to also notify client via email in backend/notification-service/src/main/java/com/trucktrack/notification/consumer/TripEventConsumer.java
- [ ] T067 [US4] Include vehicle plate number and estimated delivery date in email template

**Checkpoint**: User Story 4 complete - client receives email when driver assigned

---

## Phase 7: User Story 5 - Rapports Quotidiens pour Fleet Manager (Priority: P3)

**Goal**: Fleet Manager reçoit email quotidien avec résumé activité flotte

**Independent Test**: Déclencher rapport quotidien, vérifier contenu email.

### Backend Implementation

- [ ] T068 [US5] Create DailyReportService for generating fleet activity summary in backend/notification-service/src/main/java/com/trucktrack/notification/service/DailyReportService.java
- [ ] T069 [US5] Create daily-report.html email template with trips completed, in progress, delayed in backend/notification-service/src/main/resources/templates/email/daily-report.html
- [ ] T070 [US5] Create ScheduledTasks class with @Scheduled(cron) for daily report at 7:00 AM in backend/notification-service/src/main/java/com/trucktrack/notification/scheduler/ScheduledTasks.java
- [ ] T071 [US5] Query trips from location-service via internal API for report data in DailyReportService
- [ ] T072 [US5] Create admin endpoint POST /admin/notifications/trigger-daily-report for testing in backend/notification-service/src/main/java/com/trucktrack/notification/controller/AdminNotificationController.java

**Checkpoint**: User Story 5 complete - fleet manager receives daily report

---

## Phase 8: User Story 6 - Préférences de Notification (Priority: P4)

**Goal**: Utilisateurs peuvent configurer leurs préférences de notification

**Independent Test**: Modifier préférences, vérifier notifications respectent paramètres.

### Backend Implementation

- [ ] T073 [US6] Create PreferenceController with GET/PUT /preferences endpoints in backend/notification-service/src/main/java/com/trucktrack/notification/controller/PreferenceController.java
- [ ] T074 [US6] Create PushTokenController with POST/GET/DELETE /push-tokens endpoints in backend/notification-service/src/main/java/com/trucktrack/notification/controller/PushTokenController.java
- [ ] T075 [US6] Update NotificationPreferenceService to filter notifications based on preferences in backend/notification-service/src/main/java/com/trucktrack/notification/service/NotificationPreferenceService.java
- [ ] T076 [US6] Create NotificationHistoryController with GET /history endpoint in backend/notification-service/src/main/java/com/trucktrack/notification/controller/NotificationHistoryController.java

### Frontend Implementation

- [ ] T077 [US6] Create notification.service.ts for API calls in frontend/src/app/core/services/notification.service.ts
- [ ] T078 [US6] Create notification-preferences.component.ts with signal inputs in frontend/src/app/features/settings/notification-preferences/notification-preferences.component.ts
- [ ] T079 [P] [US6] Create notification-preferences.component.html with toggle switches for each event type in frontend/src/app/features/settings/notification-preferences/notification-preferences.component.html
- [ ] T080 [P] [US6] Create notification-preferences.component.scss in frontend/src/app/features/settings/notification-preferences/notification-preferences.component.scss
- [ ] T081 [US6] Add route to notification preferences in settings module

### Mobile Implementation

- [ ] T082 [US6] Add notification preferences section to SettingsScreen.tsx in mobile-expo/src/screens/SettingsScreen.tsx
- [ ] T083 [US6] Create API calls for preferences in mobile API service in mobile-expo/src/services/api.ts

**Checkpoint**: User Story 6 complete - users can manage notification preferences

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Admin endpoints, monitoring, and final improvements

### Admin Endpoints

- [ ] T084 Create AdminNotificationController with GET /admin/notifications list endpoint in backend/notification-service/src/main/java/com/trucktrack/notification/controller/AdminNotificationController.java
- [ ] T085 Add GET /admin/notifications/stats endpoint for notification statistics in AdminNotificationController
- [ ] T086 Add POST /admin/notifications/{id}/resend endpoint for resending failed notifications in AdminNotificationController
- [ ] T087 Add GET /admin/templates and POST /admin/templates endpoints for template management in AdminNotificationController
- [ ] T088 Add PUT /admin/templates/{id} endpoint for updating templates in AdminNotificationController

### Resilience & Monitoring

- [ ] T089 Add @Retryable with exponential backoff to EmailService.sendEmail() method
- [ ] T090 [P] Add @Retryable with exponential backoff to PushNotificationService.sendPush() method
- [ ] T091 Add Prometheus metrics for notifications_sent_total, notification_delivery_latency in backend/notification-service/src/main/java/com/trucktrack/notification/config/MetricsConfig.java
- [ ] T092 Add health check endpoint for SendGrid and FCM connectivity

### Seed Data

- [ ] T093 Create V2__seed_notification_templates.sql with default templates in backend/notification-service/src/main/resources/db/migration/V2__seed_notification_templates.sql

### Final Validation

- [ ] T094 Run database migrations and verify tables created correctly
- [ ] T095 Validate complete flow per quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational (Phase 2) completion
- **Polish (Phase 9)**: Depends on user stories being mostly complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational - Core MVP, no dependencies on other stories
- **User Story 2 (P2)**: After Foundational - Independent, requires ETA calculation in location-service
- **User Story 3 (P2)**: After Foundational - Independent, requires mobile push token setup
- **User Story 4 (P3)**: After US1 (reuses email service) - Can start after T040 complete
- **User Story 5 (P3)**: After Foundational - Independent, scheduled task
- **User Story 6 (P4)**: After Foundational - Independent, enables preferences for all stories

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T003, T004, T006, T008 can run in parallel (different files)
```

**Phase 2 (Foundational)**:
```
T010-T013 can run in parallel (enum files)
T015-T018 can run in parallel (entity files)
T020-T023 can run in parallel (repository files)
T025-T028 can run in parallel (DTO files)
T030 can run in parallel with T029
T036, T037 can run in parallel (event files)
```

**Phase 3-8 (User Stories)**:
```
After Phase 2, stories US2, US3, US5, US6 can start in parallel:
- Developer A: US1 (Email delivery confirmation) - MVP
- Developer B: US2 (ETA push notifications)
- Developer C: US3 (Driver push notifications)
- Developer D: US5 + US6 (Daily report + Preferences)
- Developer E: US4 (Client email on assignment) - after US1
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test delivery confirmation email end-to-end
5. Deploy if ready - basic notification working

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Delivery confirmation email → **MVP Deploy**
3. User Story 2 + 3 → ETA + Driver push → Deploy
4. User Story 4 + 5 → Client assignment + Daily report → Deploy
5. User Story 6 → Preferences UI → Deploy
6. Polish → Admin endpoints, monitoring → Final Deploy

---

## Summary

| Phase | Tasks | User Story |
|-------|-------|------------|
| Phase 1: Setup | 8 | - |
| Phase 2: Foundational | 31 | - |
| Phase 3: US1 | 9 | Livraison Confirmée |
| Phase 4: US2 | 7 | ETA Notifications |
| Phase 5: US3 | 9 | Driver Notifications |
| Phase 6: US4 | 3 | Client Assignment |
| Phase 7: US5 | 5 | Daily Report |
| Phase 8: US6 | 11 | Préférences |
| Phase 9: Polish | 12 | - |
| **Total** | **95** | |

**MVP Scope**: Phases 1-3 (48 tasks) = Delivery confirmation notification

**Independent Test Criteria per Story**:
- US1: Complete trip with POD → email received with signature
- US2: Simulate truck approaching → push at 30min and 10min
- US3: Assign trip to driver → push notification received
- US4: Assign driver with client → client receives email
- US5: Trigger daily report → Fleet Manager receives summary
- US6: Update preferences → notifications respect settings
