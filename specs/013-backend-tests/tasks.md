# Tasks: Tests Backend

**Input**: Design documents from `/specs/013-backend-tests/`
**Prerequisites**: plan.md ✓, spec.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, etc.)

---

## Phase 1: Setup

**Purpose**: Configurer les dépendances et l'infrastructure de test

- [x] T001 Vérifier dépendances test dans backend/pom.xml (JUnit5, Mockito, AssertJ, TestContainers)
- [x] T002 [P] Ajouter TestContainers PostgreSQL si manquant dans backend/pom.xml
- [x] T003 [P] Créer classe de base TestContainersConfig dans backend/shared/src/test/java/

---

## Phase 2: User Story 1 - Auth Service Tests (Priority: P1)

**Goal**: Tester authentification, JWT, rate limiting, permissions

**Independent Test**: `mvn test -pl auth-service` → 80%+ coverage sur services

### Implementation

- [x] T004 [P] [US1] Créer AuthServiceTest dans backend/auth-service/src/test/java/com/trucktrack/auth/service/AuthServiceTest.java
  - Test login avec credentials valides → JWT retourné
  - Test login avec mauvais password → 401
  - Test login avec user inexistant → 401
  - Test refresh token valide → nouveau JWT
  - Test refresh token expiré → 401

- [x] T005 [P] [US1] Créer PermissionServiceTest dans backend/auth-service/src/test/java/com/trucktrack/auth/service/PermissionServiceTest.java
  - Test hasPermission avec rôle admin → true pour toutes permissions
  - Test hasPermission avec rôle driver → true seulement pour permissions driver
  - Test hasPermission avec permission inexistante → false

- [x] T006 [P] [US1] Créer LoginRateLimiterTest dans backend/auth-service/src/test/java/com/trucktrack/auth/service/LoginRateLimiterTest.java
  - Test 5 tentatives OK → pas de blocage
  - Test 6ème tentative → blocage 15 min
  - Test après délai → déblocage

- [x] T007 [P] [US1] Créer AdminUserServiceTest dans backend/auth-service/src/test/java/com/trucktrack/auth/service/AdminUserServiceTest.java
  - Test création utilisateur → user créé avec rôle
  - Test création avec email existant → exception
  - Test update utilisateur → données mises à jour
  - Test suppression utilisateur → user désactivé

- [x] T008 [US1] Créer UserRepositoryTest dans backend/auth-service/src/test/java/com/trucktrack/auth/repository/UserRepositoryTest.java
  - Test findByEmail existant → user trouvé
  - Test findByEmail inexistant → Optional.empty
  - Test save user → persisté en DB

**Checkpoint**: Auth service tests complets, coverage >= 80%

---

## Phase 3: User Story 2 - Location Service Tests (Priority: P1)

**Goal**: Tester tracking GPS, geofences, trips, statut camions

**Independent Test**: `mvn test -pl location-service` → 80%+ coverage sur services

### Implementation

- [x] T009 [P] [US2] Créer LocationServiceTest dans backend/location-service/src/test/java/com/trucktrack/location/service/LocationServiceTest.java
  - Test updatePosition → position mise à jour
  - Test updatePosition → publie event Kafka
  - Test getLastPosition → retourne dernière position
  - Test getPositionHistory → retourne historique

- [x] T010 [P] [US2] Créer GeofenceServiceTest dans backend/location-service/src/test/java/com/trucktrack/location/service/GeofenceServiceTest.java
  - Test isInsideGeofence point dedans → true
  - Test isInsideGeofence point dehors → false
  - Test checkGeofenceTransition ENTER → event publié
  - Test checkGeofenceTransition EXIT → event publié
  - Test checkGeofenceTransition pas de changement → pas d'event

- [x] T011 [P] [US2] Créer TripServiceTest dans backend/location-service/src/test/java/com/trucktrack/location/service/TripServiceTest.java
  - Test createTrip → trip créé avec statut PENDING
  - Test assignTrip → truck et driver assignés
  - Test startTrip → statut IN_PROGRESS, startTime set
  - Test completeTrip → statut COMPLETED, distance/durée calculées
  - Test cancelTrip → statut CANCELLED

- [x] T012 [P] [US2] Créer TruckStatusServiceTest dans backend/location-service/src/test/java/com/trucktrack/location/service/TruckStatusServiceTest.java
  - Test updateStatus → statut mis à jour
  - Test calculateIdleTime → durée correcte
  - Test detectOffline → marqué offline après timeout

- [x] T013 [P] [US2] Créer FleetStatisticsServiceTest dans backend/location-service/src/test/java/com/trucktrack/location/service/FleetStatisticsServiceTest.java
  - Test getActiveCount → nombre correct
  - Test getAverageSpeed → moyenne calculée
  - Test getTotalDistance → somme correcte

- [x] T014 [US2] Créer TruckRepositoryTest dans backend/location-service/src/test/java/com/trucktrack/location/repository/TruckRepositoryTest.java
  - Test findByStatus → liste filtrée
  - Test findTrucksInBoundingBox → trucks dans rayon

**Checkpoint**: Location service tests complets, coverage >= 80%

---

## Phase 4: User Story 3 - GPS Ingestion Tests (Priority: P2)

**Goal**: Tester validation et ingestion des données GPS

**Independent Test**: `mvn test -pl gps-ingestion-service`

### Implementation

- [x] T015 [P] [US3] Créer GPSValidationServiceTest dans backend/gps-ingestion-service/src/test/java/com/trucktrack/gps/service/GPSValidationServiceTest.java
  - Test coordonnées valides → accepté
  - Test latitude > 90 → rejeté
  - Test latitude < -90 → rejeté
  - Test longitude > 180 → rejeté
  - Test longitude < -180 → rejeté
  - Test timestamp futur → rejeté
  - Test timestamp trop ancien → rejeté
  - Test speed négative → rejeté

- [x] T016 [P] [US3] Créer KafkaProducerServiceTest dans backend/gps-ingestion-service/src/test/java/com/trucktrack/gps/service/KafkaProducerServiceTest.java
  - Test publish position → message envoyé sur topic
  - Test publish avec Kafka down → exception gérée

**Checkpoint**: GPS Ingestion tests complets

---

## Phase 5: User Story 4 - Notification Service Tests (Priority: P2)

**Goal**: Tester moteur de règles d'alertes

**Independent Test**: `mvn test -pl notification-service`

### Implementation

- [x] T017 [P] [US4] Créer AlertRuleEngineTest dans backend/notification-service/src/test/java/com/trucktrack/notification/service/AlertRuleEngineTest.java
  - Test règle SPEED_LIMIT dépassée → alerte
  - Test règle SPEED_LIMIT respectée → pas d'alerte
  - Test règle IDLE_TIME dépassée → alerte
  - Test règle GEOFENCE_ENTER → alerte
  - Test règle GEOFENCE_EXIT → alerte
  - Test règle désactivée → pas d'alerte
  - Test multiple règles → toutes évaluées

- [x] T018 [P] [US4] Créer AlertCooldownCacheTest dans backend/notification-service/src/test/java/com/trucktrack/notification/service/AlertCooldownCacheTest.java
  - Test première alerte → autorisée
  - Test alerte pendant cooldown → bloquée
  - Test alerte après cooldown → autorisée

- [x] T019 [P] [US4] Créer AlertRuleServiceTest dans backend/notification-service/src/test/java/com/trucktrack/notification/service/AlertRuleServiceTest.java
  - Test createRule → règle créée
  - Test updateRule → règle mise à jour
  - Test deleteRule → règle supprimée
  - Test getActiveRules → liste filtrée

- [x] T020 [P] [US4] Créer NotificationServiceTest dans backend/notification-service/src/test/java/com/trucktrack/notification/service/NotificationServiceTest.java
  - Test sendNotification → notification persistée
  - Test sendNotification → WebSocket envoyé
  - Test markAsRead → notification marquée lue

**Checkpoint**: Notification service tests complets

---

## Phase 6: User Story 5 - Integration Tests (Priority: P3)

**Goal**: Tester flux end-to-end entre services

**Independent Test**: `mvn test -P integration-tests`

### Implementation

- [x] T021 [US5] Créer KafkaIntegrationTest dans backend/location-service/src/test/java/com/trucktrack/location/integration/KafkaIntegrationTest.java
  - Test GPS position publiée → consommée et stockée
  - Test geofence event → notification générée

- [x] T022 [US5] Créer AuthFlowIntegrationTest dans backend/auth-service/src/test/java/com/trucktrack/auth/integration/AuthFlowIntegrationTest.java
  - Test login → JWT → accès API protégée

**Checkpoint**: Integration tests complets

---

## Phase 7: Polish & Validation

**Purpose**: Validation finale et documentation

- [x] T023 Exécuter tous les tests et vérifier coverage
- [x] T024 [P] Corriger les tests qui échouent
- [x] T025 [P] Ajouter @DisplayName pour lisibilité
- [x] T026 Vérifier que CI passe avec tous les tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Pas de dépendances
- **Phase 2-5 (User Stories)**: Dépendent de Phase 1, peuvent être parallélisées entre elles
- **Phase 6 (Integration)**: Dépend de Phase 2-5
- **Phase 7 (Polish)**: Dépend de tout

### Parallel Opportunities

**Services indépendants (peuvent être faits en parallèle) :**
- Auth Service (T004-T008) || Location Service (T009-T014) || GPS Ingestion (T015-T016) || Notification (T017-T020)

**Tests dans un même service (parallélisables) :**
- Tous les tests marqués [P] dans un même service

---

## Implementation Strategy

### MVP First

1. Phase 1: Setup
2. Phase 2: Auth Service Tests (sécurité critique)
3. Phase 3: Location Service Tests (cœur métier)
4. **STOP et VALIDER**: Coverage >= 80% sur P1

### Incremental

1. Setup → Auth Tests → Location Tests → MVP
2. Ajouter GPS Ingestion Tests
3. Ajouter Notification Tests
4. Ajouter Integration Tests
5. Polish

---

## Notes

- Utiliser `@MockBean` pour mocker les dépendances externes
- Utiliser `@DataJpaTest` pour tests repository (H2 ou TestContainers)
- Utiliser `@EmbeddedKafka` pour tests Kafka
- Nommer les tests clairement: `should_returnJwt_when_validCredentials()`
- Utiliser AssertJ pour assertions fluides
- Ne PAS tester les getters/setters Lombok
