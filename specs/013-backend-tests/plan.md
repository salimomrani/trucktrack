# Implementation Plan: Tests Backend

**Branch**: `013-backend-tests` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)

## Summary

Mise en place des tests unitaires et d'intégration pour les microservices backend. Focus sur les tests utiles couvrant la logique métier, pas les tests triviaux.

## Technical Context

**Language/Version**: Java 17
**Primary Dependencies**: JUnit 5, Mockito, AssertJ, TestContainers, Spring Boot Test
**Testing Framework**: JUnit 5 + Mockito
**Database Testing**: TestContainers (PostgreSQL), @DataJpaTest
**Kafka Testing**: spring-kafka-test (EmbeddedKafka)
**Target**: 80% coverage sur les classes de service

## Project Structure

```text
backend/
├── auth-service/
│   └── src/test/java/com/trucktrack/auth/
│       ├── service/
│       │   ├── AuthServiceTest.java
│       │   ├── PermissionServiceTest.java
│       │   └── LoginRateLimiterTest.java
│       └── repository/
│           └── UserRepositoryTest.java
├── location-service/
│   └── src/test/java/com/trucktrack/location/
│       ├── service/
│       │   ├── LocationServiceTest.java
│       │   ├── GeofenceServiceTest.java
│       │   ├── TripServiceTest.java
│       │   └── TruckStatusServiceTest.java
│       └── repository/
│           └── TruckRepositoryTest.java
├── gps-ingestion-service/
│   └── src/test/java/com/trucktrack/gps/
│       └── service/
│           ├── GPSValidationServiceTest.java
│           └── KafkaProducerServiceTest.java
├── notification-service/
│   └── src/test/java/com/trucktrack/notification/
│       └── service/
│           ├── AlertRuleEngineTest.java
│           ├── AlertRuleServiceTest.java
│           └── NotificationServiceTest.java
└── shared/
    └── src/test/java/com/trucktrack/common/
        └── (shared utilities tests if any)
```

## Implementation Phases

### Phase 1: Setup
- Vérifier/configurer dépendances de test dans pom.xml
- Configurer TestContainers

### Phase 2: Auth Service Tests (P1)
- AuthServiceTest
- PermissionServiceTest
- LoginRateLimiterTest
- UserRepositoryTest

### Phase 3: Location Service Tests (P1)
- LocationServiceTest
- GeofenceServiceTest
- TripServiceTest
- TruckStatusServiceTest
- TruckRepositoryTest

### Phase 4: GPS Ingestion Tests (P2)
- GPSValidationServiceTest
- KafkaProducerServiceTest

### Phase 5: Notification Service Tests (P2)
- AlertRuleEngineTest
- AlertRuleServiceTest
- NotificationServiceTest

### Phase 6: Integration Tests (P3)
- Kafka integration tests
- Cross-service flows
