# Feature Specification: Tests Backend

**Feature Branch**: `013-backend-tests`
**Created**: 2025-12-27
**Status**: Draft
**Input**: Tests unitaires et d'intégration pour les microservices backend. Focus sur les tests utiles, pas les tests triviaux.

## Principes de Test

**Ce qu'on teste :**
- Logique métier complexe (calculs, validations, règles)
- Intégrations critiques (repositories, Kafka, cache)
- Cas limites et gestion d'erreurs
- Sécurité (authentification, autorisations)

**Ce qu'on NE teste PAS :**
- Getters/setters simples
- Constructeurs triviaux
- Code généré (Lombok, MapStruct)
- Configurations Spring Boot par défaut

## User Scenarios & Testing

### User Story 1 - Tests Auth Service (Priority: P1)

Tester la logique d'authentification et de gestion des utilisateurs car c'est critique pour la sécurité.

**Why this priority**: L'authentification est le point d'entrée de l'application. Un bug ici = faille de sécurité.

**Independent Test**: Lancer `mvn test -pl auth-service` et vérifier 80%+ couverture sur AuthService, PermissionService.

**Acceptance Scenarios**:

1. **Given** un utilisateur avec email/password valides, **When** login, **Then** retourne JWT valide
2. **Given** un utilisateur avec mauvais password, **When** login, **Then** retourne 401 et incrémente rate limit
3. **Given** un utilisateur bloqué par rate limit, **When** login, **Then** retourne 429
4. **Given** un token JWT expiré, **When** appel API, **Then** retourne 401
5. **Given** un admin, **When** crée un utilisateur, **Then** utilisateur créé avec rôle correct

---

### User Story 2 - Tests Location Service (Priority: P1)

Tester la logique de tracking GPS, geofences et gestion des camions.

**Why this priority**: C'est le cœur métier de l'application.

**Independent Test**: Lancer `mvn test -pl location-service` et vérifier 80%+ couverture sur services critiques.

**Acceptance Scenarios**:

1. **Given** une position GPS valide, **When** LocationService reçoit, **Then** met à jour position camion
2. **Given** un camion entre dans une geofence, **When** position traitée, **Then** event ENTER publié
3. **Given** un camion sort d'une geofence, **When** position traitée, **Then** event EXIT publié
4. **Given** un trajet assigné, **When** TripService.startTrip(), **Then** statut passe à IN_PROGRESS
5. **Given** un trajet terminé, **When** TripService.completeTrip(), **Then** calcul distance/durée correct

---

### User Story 3 - Tests GPS Ingestion Service (Priority: P2)

Tester la validation et l'ingestion des données GPS.

**Why this priority**: Point d'entrée des données - doit valider correctement.

**Independent Test**: Lancer `mvn test -pl gps-ingestion-service`.

**Acceptance Scenarios**:

1. **Given** position GPS avec coordonnées valides, **When** validation, **Then** acceptée
2. **Given** position GPS hors limites (-91 latitude), **When** validation, **Then** rejetée
3. **Given** position GPS avec timestamp futur, **When** validation, **Then** rejetée
4. **Given** position valide, **When** ingestion, **Then** publiée sur Kafka

---

### User Story 4 - Tests Notification Service (Priority: P2)

Tester le moteur de règles d'alertes.

**Why this priority**: Les alertes sont critiques pour le monitoring de flotte.

**Independent Test**: Lancer `mvn test -pl notification-service`.

**Acceptance Scenarios**:

1. **Given** règle vitesse > 90km/h, **When** camion à 100km/h, **Then** alerte générée
2. **Given** règle idle > 30min, **When** camion immobile 45min, **Then** alerte générée
3. **Given** alerte récente (cooldown), **When** même condition, **Then** pas de nouvelle alerte
4. **Given** camion entre geofence interdite, **When** règle active, **Then** alerte générée

---

### User Story 5 - Tests d'Intégration (Priority: P3)

Tester les flux end-to-end entre services.

**Why this priority**: Valide que les services communiquent correctement.

**Independent Test**: Lancer tests d'intégration avec TestContainers.

**Acceptance Scenarios**:

1. **Given** GPS Ingestion reçoit position, **When** Kafka consommé par Location Service, **Then** position stockée en DB
2. **Given** camion entre geofence, **When** flux complet, **Then** notification envoyée
3. **Given** utilisateur créé, **When** login, **Then** peut accéder aux endpoints protégés

---

### Edge Cases

- Que se passe-t-il si Kafka est indisponible ?
- Comment gérer les positions GPS dupliquées ?
- Que faire si Redis cache est down ?
- Comment gérer les timeouts de base de données ?

## Requirements

### Functional Requirements

- **FR-001**: Chaque service DOIT avoir des tests unitaires pour ses services métier
- **FR-002**: Les tests DOIVENT utiliser des mocks pour les dépendances externes
- **FR-003**: Les tests d'intégration DOIVENT utiliser TestContainers
- **FR-004**: Le code coverage DOIT être >= 80% sur les classes de service
- **FR-005**: Les tests DOIVENT couvrir les cas d'erreur, pas seulement le happy path
- **FR-006**: Les tests DOIVENT être rapides (<10 sec pour les unitaires)

### Exclusions Explicites

- **EX-001**: Pas de tests pour les DTOs simples (validation via annotations)
- **EX-002**: Pas de tests pour les entités JPA (getters/setters Lombok)
- **EX-003**: Pas de tests pour les configurations Spring (@Configuration)
- **EX-004**: Pas de tests pour les controllers simples (délégation pure)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Coverage >= 80% sur les packages `service/` de chaque microservice
- **SC-002**: Tous les tests passent en CI (GitHub Actions)
- **SC-003**: Tests unitaires exécutés en < 2 minutes par service
- **SC-004**: Tests d'intégration exécutés en < 5 minutes
- **SC-005**: Zéro test flaky (même résultat à chaque exécution)

## Scope & Boundaries

### In Scope

- Tests unitaires des services (AuthService, LocationService, TripService, etc.)
- Tests des repositories avec @DataJpaTest
- Tests des règles d'alertes (AlertRuleEngine)
- Tests de validation GPS
- Tests d'intégration Kafka avec EmbeddedKafka
- Mocks pour Redis, external APIs

### Out of Scope

- Tests E2E (Selenium, Cypress) - feature séparée
- Tests de performance/charge - feature séparée
- Tests du frontend - feature séparée
- Tests manuels

## Assumptions

- JUnit 5 + Mockito sont déjà configurés
- TestContainers disponible pour PostgreSQL
- EmbeddedKafka pour tests Kafka
- H2 ou TestContainers pour tests repository

## Dependencies

- JUnit 5
- Mockito
- TestContainers
- Spring Boot Test
- AssertJ (assertions fluides)
