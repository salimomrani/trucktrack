# Implementation Plan: GPS Live Truck Tracking

**Branch**: `001-gps-live-tracking` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-gps-live-tracking/spec.md`

## Summary

Build a real-time GPS truck tracking application with live map visualization. The system ingests GPS coordinates from delivery trucks, displays them on an interactive map with sub-2-second latency, and supports search/filter, historical route visualization, and alert notifications. Architecture uses Java Spring Boot microservices for backend, Angular for frontend, Kafka for GPS event streaming, and PostgreSQL with PostGIS for spatial data storage.

**Technical Approach**: Event-driven microservices architecture with Kafka as the central nervous system. GPS devices push coordinates to an ingestion service that publishes to Kafka topics. Location service consumes events, updates Redis cache for real-time positions, and persists to PostgreSQL. Angular frontend connects via WebSocket to receive live updates and displays trucks on Leaflet/Mapbox map. Search/filter and historical queries hit REST APIs backed by PostGIS spatial indexes.

## Technical Context

**Language/Version**: Java 17 (backend), TypeScript 5.x with Angular 17+ (frontend)
**Primary Dependencies**:
- **Backend**: Spring Boot 3.2+, Spring Kafka, Spring Data JPA, Spring WebFlux (WebSocket), Spring Security
- **Frontend**: Angular 17+, RxJS 7+, Leaflet/Mapbox GL JS (map rendering), Angular Material (UI components)
- **Message Queue**: Apache Kafka 3.6+ with Kafka Streams for stream processing
- **Testing**: JUnit 5 + Mockito (Java), Jasmine + Karma (Angular unit), Cypress (E2E), Testcontainers (integration), Gatling (load testing)

**Storage**:
- **Primary Database**: PostgreSQL 15+ with PostGIS 3.4+ extension (GPS positions, trucks, geofences, alert rules)
- **Cache**: Redis 7+ (current truck positions, session management, real-time state)
- **Time-Series (Optional)**: Consider TimescaleDB extension for PostgreSQL to optimize historical GPS data queries

**Target Platform**:
- **Backend**: Linux servers (Docker containers on Kubernetes or cloud-managed container services)
- **Frontend**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions per constitution)
- **Development**: Multi-platform (macOS, Linux, Windows with WSL2)

**Project Type**: Web application (separate backend and frontend)

**Performance Goals**:
- GPS Update Latency: <2 seconds (95th percentile) from device to map display
- API Response Time: <200ms (95th percentile) for read operations, <500ms for writes
- Throughput: GPS ingestion service handles 10,000 position updates/second
- Concurrent Users: 500 users viewing live maps without degradation
- Map Rendering: <3 seconds initial load with 100 trucks, <100ms for pan/zoom operations

**Constraints**:
- Real-time WebSocket connections for live map updates (avoid polling)
- Spatial queries optimized with PostGIS indexes (nearest truck, trucks in geofence)
- Horizontal scalability for all microservices
- WCAG 2.1 Level AA accessibility compliance
- 90-day GPS data retention with configurable policies
- TLS 1.3 encryption in transit, database encryption at rest

**Scale/Scope**:
- Initial Target: 10-500 trucks per fleet
- Concurrent Users: 500 users
- GPS Data Volume: 10K updates/second (500 trucks * 20 updates/second)
- Historical Data: 90 days retention (~400M records per 500-truck fleet)
- API Load: ~50K requests/minute during peak usage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Real-Time Data First

**Compliance**: PASS

- Event-driven architecture with Kafka ensures sub-second GPS coordinate propagation
- WebSocket connections eliminate polling, enabling live map updates <2 seconds
- Redis cache stores current positions for instant read access
- Offline buffering handled by GPS devices; backend processes batches on reconnect

**Evidence**: Architecture design prioritizes Kafka event streaming and WebSocket push notifications.

---

### ✅ Principle II: Microservices Architecture

**Compliance**: PASS

- **GPS Ingestion Service**: REST/MQTT endpoint for GPS device data, publishes to Kafka
- **Location Service**: Consumes Kafka events, manages Redis cache and PostgreSQL persistence
- **Notification Service**: Processes alert rules, sends in-app notifications
- **API Gateway**: Spring Cloud Gateway or NGINX as single entry point
- **Auth Service**: JWT-based authentication, OAuth2 integration
- Each service independently deployable with Docker images

**Evidence**: Clear service boundaries align with constitution requirements.

---

### ✅ Principle III: Code Quality & Testing Standards (NON-NEGOTIABLE)

**Compliance**: PASS

**Testing**:
- TDD enforced: Tests written before implementation per Red-Green-Refactor cycle
- JUnit 5 (backend unit tests), Jasmine/Karma (Angular unit tests)
- Spring Cloud Contract for API contract tests
- Testcontainers for integration tests (Kafka, PostgreSQL, Redis)
- Cypress for E2E tests covering critical user journeys
- Gatling for load tests validating 10K updates/second throughput
- Target: 80% backend coverage, 70% frontend coverage

**Code Quality**:
- SonarQube integrated in CI/CD pipeline (zero critical/blocker issues gate)
- Checkstyle (Java - Google Java Style Guide), ESLint + Prettier (Angular/TypeScript)
- Pre-commit hooks enforce formatting
- OpenAPI/Swagger documentation for all REST APIs
- README per microservice with setup, architecture overview
- ER diagrams for database schemas

**Evidence**: Comprehensive testing strategy and quality gates defined.

---

### ✅ Principle IV: Performance Requirements

**Compliance**: PASS

**Scalability**:
- Kubernetes HorizontalPodAutoscaler for all services
- Kafka partitioning by truck ID for parallel GPS ingestion
- PostgreSQL read replicas for historical query load distribution
- Redis cluster for high-availability caching

**Performance Benchmarks**:
- GPS Update Latency: Kafka + WebSocket architecture targets <2s
- API Response: Spring WebFlux non-blocking I/O for <200ms reads
- Map Rendering: Angular lazy loading, Leaflet clustering for 100+ trucks
- Throughput: Kafka consumers scaled to handle 10K updates/second

**Performance Monitoring**:
- Micrometer (Spring Boot) exposes Prometheus metrics
- Angular performance monitoring via Core Web Vitals tracking
- Grafana dashboards for latency, throughput, error rates
- Performance regression tests in CI/CD fail build if >10% degradation

**Evidence**: Architecture and tooling support all performance targets.

---

### ✅ Principle V: Security & Privacy

**Compliance**: PASS

- **Authentication**: Spring Security with JWT tokens, OAuth2/OIDC integration
- **Authorization**: Role-based access control (RBAC) - users see only authorized trucks
- **Encryption**: TLS 1.3 for all HTTP/WebSocket connections, PostgreSQL database encryption
- **Data Retention**: Configurable policies (default 90 days), automated cleanup job
- **Audit Logging**: Spring Boot Actuator logs all GPS data access with user ID, timestamp
- **Security Scanning**: OWASP Dependency-Check, Snyk in CI/CD pipeline
- **Penetration Testing**: Annual third-party audits planned

**Evidence**: Comprehensive security measures address all constitution requirements.

---

### ✅ Principle VI: User Experience Consistency

**Compliance**: PASS

**Design System**:
- Angular Material component library for consistent UI components
- Design tokens for colors, typography, spacing (CSS custom properties)
- WCAG 2.1 Level AA: ARIA labels, keyboard navigation, 4.5:1 contrast ratios
- Angular i18n for internationalization
- CSS media queries + Angular flex layout for responsive 320px-2560px

**Interaction Patterns**:
- Loading spinners (<200ms), Angular HttpClient interceptors for error handling
- Material Design progress indicators, snackbars for feedback
- Angular Router for navigation, breadcrumbs for deep hierarchies

**Map Interface Standards**:
- Leaflet/Mapbox GL JS with custom markers (color-coded status, direction arrows)
- Marker clustering (Leaflet.markercluster) for >10 trucks in view
- WebSocket reconnection with exponential backoff, connection status indicator
- Controls positioned per constitution (zoom: bottom-right, search: top-left, filters: left sidebar)

**Cross-Platform**: Responsive web app supporting desktop and tablet browsers per constitution.

**Evidence**: Angular + Material Design + Leaflet/Mapbox provides all UX consistency requirements.

---

### 🔶 Architecture Decision: Technology Stack

**Decision**: Use Angular instead of React (constitution mentions React)

**Justification**: User explicitly requested "front Angular" in planning phase input. Angular provides:
- Built-in dependency injection, RxJS for reactive streams (ideal for real-time GPS updates)
- TypeScript-first framework aligning with Java backend type safety
- Angular Material for design system consistency
- Opinionated structure reducing decision fatigue

**Constitution Alignment**: Constitution lists "Frontend: React" as example but states "or similar modern framework". Angular satisfies all UX consistency, performance, and code quality principles.

**Approval**: Documented here per constitution requirement for justified deviations.

---

### ✅ Summary: Constitution Compliance

**Status**: ALL PRINCIPLES SATISFIED ✅

**Minor Deviation**: Angular instead of React (justified above)
**Gates**: PASS - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/001-gps-live-tracking/
├── plan.md              # This file
├── research.md          # Phase 0: Technology research and decisions
├── data-model.md        # Phase 1: Entity models, relationships, validation rules
├── quickstart.md        # Phase 1: Developer onboarding, local setup
└── contracts/           # Phase 1: API specifications
    ├── gps-ingestion-api.yaml      # OpenAPI spec for GPS Ingestion Service
    ├── location-api.yaml           # OpenAPI spec for Location Service
    ├── notification-api.yaml       # OpenAPI spec for Notification Service
    ├── auth-api.yaml               # OpenAPI spec for Auth Service
    └── kafka-schemas.json          # Avro/JSON schemas for Kafka topics
```

### Source Code (repository root)

```text
backend/
├── gps-ingestion-service/
│   ├── src/main/java/com/trucktrack/gps/
│   │   ├── controller/          # REST controllers for GPS data ingestion
│   │   ├── service/             # Business logic, Kafka producer
│   │   ├── model/               # GPS position DTOs, validation
│   │   └── config/              # Kafka, security, monitoring config
│   └── src/test/java/           # Unit, integration, contract tests
│
├── location-service/
│   ├── src/main/java/com/trucktrack/location/
│   │   ├── consumer/            # Kafka consumer for GPS events
│   │   ├── repository/          # Spring Data JPA (PostgreSQL), Redis repos
│   │   ├── service/             # Location updates, queries, caching
│   │   ├── controller/          # REST API for truck queries, WebSocket for live updates
│   │   └── model/               # Truck, GPSPosition, Route entities
│   └── src/test/java/
│
├── notification-service/
│   ├── src/main/java/com/trucktrack/notification/
│   │   ├── consumer/            # Kafka consumer for location events
│   │   ├── service/             # Alert rule engine, notification delivery
│   │   ├── controller/          # REST API for alert configuration
│   │   └── model/               # AlertRule, Geofence, Notification entities
│   └── src/test/java/
│
├── auth-service/
│   ├── src/main/java/com/trucktrack/auth/
│   │   ├── controller/          # Login, token refresh endpoints
│   │   ├── service/             # JWT generation, OAuth2 integration
│   │   ├── model/               # User, Role entities
│   │   └── config/              # Spring Security configuration
│   └── src/test/java/
│
├── api-gateway/
│   ├── src/main/java/com/trucktrack/gateway/
│   │   ├── filter/              # Authentication, rate limiting filters
│   │   ├── config/              # Route configuration
│   │   └── controller/          # Health check, status endpoints
│   └── src/test/java/
│
└── shared/
    └── src/main/java/com/trucktrack/common/
        ├── dto/                  # Shared DTOs (GPSCoordinate, TruckStatus)
        ├── event/                # Kafka event POJOs
        ├── exception/            # Common exception classes
        └── util/                 # Validation, date/time utilities

frontend/
├── src/
│   ├── app/
│   │   ├── core/                # Singleton services (auth, WebSocket, config)
│   │   ├── shared/              # Shared modules (Material, pipes, directives)
│   │   ├── features/
│   │   │   ├── map/             # Live map component, truck markers, clustering
│   │   │   ├── search/          # Truck search, filter components
│   │   │   ├── history/         # Historical route visualization
│   │   │   ├── alerts/          # Alert configuration, notification list
│   │   │   └── auth/            # Login, logout components
│   │   ├── models/              # TypeScript interfaces (Truck, GPSPosition, etc.)
│   │   └── services/            # HTTP clients, WebSocket service, state management
│   ├── assets/                  # Map icons, images
│   ├── styles/                  # Global styles, design tokens, theme
│   └── environments/            # Environment configs (dev, staging, prod)
│
└── cypress/
    ├── e2e/                     # E2E tests for user stories
    └── support/                 # Test utilities, commands

infra/
├── docker/                      # Dockerfiles for each service
├── kubernetes/                  # K8s manifests (deployments, services, ingress)
├── helm/                        # Helm charts for deployment
└── monitoring/
    ├── prometheus/              # Prometheus config, alert rules
    └── grafana/                 # Dashboard definitions

tests/
├── integration/                 # Cross-service integration tests (Testcontainers)
├── load/                        # Gatling load test scenarios
└── e2e/                         # Additional E2E tests (shared with frontend/cypress)
```

**Structure Decision**: Web application structure (Option 2) selected due to separate Java backend and Angular frontend. Microservices grouped under `backend/` with shared common library. Frontend is standalone Angular app. Infrastructure and cross-cutting tests at repository root for holistic view.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations identified. All constitutional principles satisfied.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

**Note**: Angular instead of React is documented in Constitution Check section as a minor, justified technology choice based on user requirements.
