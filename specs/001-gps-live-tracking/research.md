# Research: GPS Live Truck Tracking Technology Stack

**Date**: 2025-12-09
**Feature**: GPS Live Truck Tracking
**Branch**: 001-gps-live-tracking

## Overview

This document captures technology research, architectural decisions, and best practices for implementing the GPS live truck tracking system. All decisions align with the project constitution (v1.1.0) and support real-time GPS data streaming, microservices architecture, and strict performance requirements.

---

## 1. Backend Framework: Spring Boot 3.2+

### Decision

Use **Spring Boot 3.2+** with Java 17 as the backend framework for all microservices.

### Rationale

- **Constitution Requirement**: Java backend with Spring Boot specified in Technology Stack section
- **Microservices Support**: Spring Cloud ecosystem provides service discovery (Eureka), API gateway (Spring Cloud Gateway), distributed tracing (Sleuth/Zipkin), and configuration management
- **Kafka Integration**: Spring Kafka provides excellent abstractions for producers/consumers with automatic serialization, error handling, and backpressure support
- **WebSocket Support**: Spring WebFlux (reactive) and Spring WebSocket enable efficient real-time communication with low latency
- **Testing**: Spring Test framework with Test containers support for integration testing
- **Performance**: Spring WebFlux non-blocking I/O supports high concurrency (500+ users) with lower resource usage than traditional blocking servlets
- **Security**: Spring Security integrates JWT, OAuth2/OIDC, and RBAC out of the box

### Alternatives Considered

- **Quarkus**: Faster startup and lower memory footprint, but less mature ecosystem for WebSocket/Kafka compared to Spring Boot. Team has more Spring expertise.
- **Micronaut**: Similar benefits to Quarkus, but Spring Boot's larger community and extensive documentation reduce risk for complex real-time system.

### Best Practices

1. **Use Spring WebFlux for Location Service**: Non-blocking reactive endpoints for truck queries and WebSocket connections
2. **Use Spring MVC for other services**: Simpler blocking I/O sufficient for GPS ingestion, auth, notification services
3. **Externalize configuration**: Use Spring Cloud Config or environment variables for Kafka brokers, database URLs, Redis endpoints
4. **Health checks**: Implement Spring Actuator `/actuator/health` endpoints for Kubernetes liveness/readiness probes
5. **Metrics**: Use Micrometer to expose Prometheus metrics (request latency, Kafka lag, cache hit rates)

---

## 2. Message Queue: Apache Kafka 3.6+

### Decision

Use **Apache Kafka 3.6+** as the central message bus for GPS event streaming and inter-service communication.

### Rationale

- **Constitution Requirement**: Kafka mandated in Microservices Architecture principle
- **Throughput**: Kafka handles 10K+ messages/second with ease (supports required 10K GPS updates/second)
- **Event Sourcing**: GPS position stream is naturally an event log; Kafka provides durable, ordered, replayable events
- **Decoupling**: Services communicate asynchronously via Kafka topics, enabling independent scaling and deployment
- **Stream Processing**: Kafka Streams can compute derived streams (e.g., truck status changes, geofence breach events)
- **Durability**: Kafka's replication ensures no GPS data loss even if consumers are temporarily down

### Topic Design

- **`truck-track.gps.position`**: GPS position events from ingestion service
  - Key: `truckId` (enables partitioning by truck for parallel processing)
  - Value: `GPSPositionEvent` (JSON or Avro schema)
  - Partitions: 10 (supports scaling to 10K updates/second with 10 consumers)
  - Retention: 7 days (allows historical replay for debugging)

- **`truck-track.location.status-change`**: Derived events when truck status changes (active → idle, online → offline)
  - Key: `truckId`
  - Value: `TruckStatusEvent`
  - Partitions: 5
  - Retention: 30 days

- **`truck-track.notification.alert`**: Alert events triggered by rules (geofence breach, offline, idle)
  - Key: `alertId`
  - Value: `AlertEvent`
  - Partitions: 3
  - Retention: 90 days (matches data retention policy)

### Naming Convention

Per constitution: `truck-track.<domain>.<event>` format enforced.

### Alternatives Considered

- **RabbitMQ**: Better for complex routing, but lower throughput and lacks event sourcing/replay capabilities critical for GPS data.
- **Apache Pulsar**: Multi-tenancy and geo-replication features overkill for single-tenant fleet tracking. Kafka's maturity and ecosystem more suitable.

### Best Practices

1. **Avro schemas**: Use Confluent Schema Registry for versioned Avro schemas (better performance and schema evolution vs JSON)
2. **Exactly-once semantics**: Enable idempotent producer and transactional consumer for critical GPS data
3. **Monitor consumer lag**: Alert if lag exceeds 1000 messages (indicates backpressure or consumer failure)
4. **Partition strategy**: Partition by `truckId` ensures all events for a truck go to same consumer (maintains order)
5. **Compression**: Enable Snappy compression for GPS events (reduces network bandwidth by ~40%)

---

## 3. Database: PostgreSQL 15+ with PostGIS 3.4+

### Decision

Use **PostgreSQL 15+** with **PostGIS 3.4+** extension for primary data storage.

### Rationale

- **Constitution Requirement**: PostgreSQL with PostGIS specified in Technology Stack
- **Spatial Queries**: PostGIS provides spatial indexing (GiST/SP-GiST) for fast location-based queries:
  - Find trucks within geofence polygon: `ST_Contains(geofence.boundary, truck.location)`
  - Find nearest trucks to point: `ORDER BY ST_Distance(truck.location, point) LIMIT 10`
- **JSON Support**: PostgreSQL JSONB type efficient for storing flexible GPS metadata (altitude, accuracy, satellites)
- **Partitioning**: Time-based partitioning on GPS positions table (partition by month) improves query performance and simplifies data retention
- **ACID Transactions**: Ensures data consistency for critical operations (alert rule updates, geofence changes)
- **Performance**: Mature query planner, parallel queries, index-only scans support <200ms API response targets

### Schema Design Highlights

- **`gps_positions` table**: Partitioned by timestamp (monthly partitions), indexed on `truck_id` and geospatial column
- **`trucks` table**: Indexed on `id`, `driver_name`, `status`; includes current position (denormalized for fast reads)
- **`geofences` table**: Spatial index on `boundary` geometry column (polygon or circle)
- **Data retention**: Scheduled job drops partitions older than 90 days

### Alternatives Considered

- **MongoDB**: Document model flexible, but lacks mature spatial indexing compared to PostGIS. No strong consistency guarantees.
- **Cassandra**: Excellent write scalability, but poor fit for ad-hoc spatial queries and complex joins (truck + geofence).
- **TimescaleDB**: Considered as extension to PostgreSQL for time-series GPS data. May adopt if historical query performance insufficient.

### Best Practices

1. **Connection pooling**: Use HikariCP (default in Spring Boot) with pool size tuned for workload (start with 20 connections/service)
2. **Read replicas**: Deploy read replicas for historical queries (don't impact write throughput for live GPS data)
3. **Spatial indexes**: Create GiST index on all geometry columns: `CREATE INDEX idx_trucks_location ON trucks USING GIST (location);`
4. **Analyze queries**: Use `EXPLAIN ANALYZE` to verify spatial queries use indexes (avoid sequential scans)
5. **Vacuum**: Schedule regular VACUUM ANALYZE to maintain query performance on high-churn GPS positions table

---

## 4. Cache: Redis 7+

### Decision

Use **Redis 7+** for caching current truck positions and real-time state.

### Rationale

- **Constitution Requirement**: Redis specified for real-time truck positions and session management
- **Sub-millisecond latency**: Redis in-memory storage enables <1ms reads for current truck positions (meets <200ms API response target with margin)
- **Data Structures**: Redis hashes perfect for truck state: `HSET truck:{truckId} lat lng speed heading status lastUpdate`
- **Pub/Sub**: Redis pub/sub can push position updates to WebSocket subscribers (alternative to Kafka for low-latency fan-out)
- **TTL Support**: Automatic expiration for stale data (set TTL=5 minutes; if truck offline >5 min, Redis key expires)
- **Persistence**: Redis AOF (Append-Only File) provides durability without sacrificing performance

### Caching Strategy

- **Write-through**: GPS ingestion service writes to PostgreSQL AND updates Redis cache
- **Cache-aside for queries**: Location API reads from Redis first; on cache miss, query PostgreSQL and populate cache
- **Invalidation**: No explicit invalidation needed—TTL handles stale data, and writes update cache directly

### Data Patterns

- **Current positions**: `Hash` per truck: `truck:position:{truckId}` → `{lat, lng, speed, heading, timestamp}`
- **Truck status**: `String` per truck: `truck:status:{truckId}` → `"active"` | `"idle"` | `"offline"`
- **Active truck set**: `SortedSet` for quick listing: `trucks:active` scored by `lastUpdate` timestamp
- **Session storage**: `String` for JWT refresh tokens: `session:{userId}` → `refreshToken` (TTL=30 days)

### Alternatives Considered

- **Memcached**: Simpler than Redis, but lacks data structures (hashes, sorted sets) and persistence. Redis's pub/sub also valuable.
- **In-memory Spring Cache**: Insufficient for multi-instance deployments (each service has separate cache). Redis provides shared cache.

### Best Practices

1. **Redis cluster**: Deploy Redis cluster (3 master + 3 replica nodes) for high availability and horizontal scaling
2. **Connection pooling**: Use Lettuce (Spring Data Redis default) with connection pool to avoid connection overhead
3. **Monitor memory**: Set `maxmemory-policy = allkeys-lru` to evict least recently used keys if memory limit reached
4. **Namespace keys**: Use consistent key prefixes (`truck:`, `session:`) for easier monitoring and debugging
5. **Avoid large keys**: Keep GPS position hashes compact (<1KB); avoid storing historical data in Redis (use PostgreSQL)

---

## 5. Frontend Framework: Angular 17+

### Decision

Use **Angular 17+** with TypeScript 5.x for the frontend web application.

### Rationale

- **User Requirement**: "front Angular" explicitly requested in planning phase
- **RxJS Integration**: Angular's native RxJS support ideal for reactive streams (WebSocket GPS updates, real-time map markers)
- **TypeScript-first**: Strong typing aligns with Java backend, reduces runtime errors
- **Angular Material**: Provides comprehensive UI component library (buttons, inputs, dialogs, snackbars) meeting UX consistency principle
- **Dependency Injection**: Angular's DI system promotes testable, maintainable code (services injected into components)
- **CLI Tooling**: Angular CLI scaffolds projects, generates components/services, and optimizes production builds
- **Performance**: Angular's AOT compilation, tree-shaking, and lazy loading meet <3s page load and <100ms interaction targets

### Architecture

- **Feature modules**: Map, Search, History, Alerts as separate lazy-loaded modules (reduces initial bundle size)
- **Core module**: Singleton services (auth, WebSocket, config) loaded once
- **Shared module**: Reusable components, pipes, directives imported across features
- **State management**: RxJS BehaviorSubjects for simple state; consider NgRx if complexity grows

### Alternatives Considered

- **React**: Constitution mentions React, but user requested Angular. Angular's opinionated structure reduces decision fatigue and aligns with Java team's preference for strong typing/DI.
- **Vue.js**: Simpler learning curve, but smaller ecosystem for enterprise features (Material Design, i18n). Angular Material superior for WCAG compliance.

### Best Practices

1. **Lazy loading**: Load map module on-demand to reduce initial bundle size (<500KB JS target)
2. **Change detection**: Use `OnPush` strategy for map components to avoid unnecessary re-renders during GPS updates
3. **WebSocket service**: Centralize WebSocket connection in core service; components subscribe to RxJS observable of GPS events
4. **Error handling**: Use HttpClient interceptors to globally handle API errors and show user-friendly snackbar messages
5. **Accessibility**: Use Angular CDK A11y module for keyboard navigation, focus management, and ARIA attributes

---

## 6. Map Library: Leaflet vs Mapbox GL JS

### Decision

Use **Leaflet 1.9+** with **Leaflet.markercluster** for initial implementation; evaluate **Mapbox GL JS** if rendering performance insufficient for 1000+ trucks.

### Rationale

**Leaflet**:
- **Open-source**: No API keys or usage fees (Mapbox GL JS requires account/pricing)
- **Simplicity**: Easier learning curve, extensive plugin ecosystem (marker clustering, geofencing)
- **Browser support**: Works in all browsers per constitution (Chrome, Firefox, Safari, Edge)
- **Performance**: Handles 100 trucks smoothly with clustering; may struggle with 1000+ trucks (use Mapbox GL JS if needed)

**Mapbox GL JS** (upgrade path if needed):
- **Vector tiles**: Better performance for complex maps (1000+ trucks, detailed base layers)
- **WebGL rendering**: GPU-accelerated, smoother animations
- **Styling**: More control over map appearance (custom truck icons, dynamic coloring)
- **Cost**: Requires Mapbox account (free tier sufficient for development; production ~$5/1000 users/month)

### Feature Implementation

- **Marker clustering**: Use `Leaflet.markercluster` to group nearby trucks (>10 in view per constitution)
- **Custom markers**: Canvas or SVG truck icons color-coded by status (green=active, yellow=idle, red=offline)
- **Direction arrows**: Rotate icon based on GPS heading (CSS `transform: rotate(${heading}deg)`)
- **Geofence drawing**: Use `Leaflet.draw` plugin for user-drawn polygons and circles
- **Heatmaps (optional)**: Consider `Leaflet.heat` for visualizing truck density

### Alternatives Considered

- **Google Maps**: Excellent UX, but expensive ($7/1000 map loads) and vendor lock-in. Leaflet/Mapbox more flexible.
- **OpenLayers**: More powerful than Leaflet, but heavier bundle size and steeper learning curve. Leaflet sufficient for requirements.

### Best Practices

1. **Tile caching**: Use tile server with caching (Mapbox CDN or self-hosted tile server for OpenStreetMap)
2. **Marker recycling**: Reuse marker DOM elements when updating positions (avoid creating/destroying markers on each GPS update)
3. **Viewport culling**: Only render markers within map viewport + buffer (Leaflet.markercluster handles this automatically)
4. **Debounce updates**: Batch GPS updates every 500ms to avoid excessive map redraws (improves <100ms pan/zoom responsiveness)
5. **Responsive map**: Use CSS to ensure map resizes correctly on viewport changes (320px-2560px per constitution)

---

## 7. Testing Strategy

### Decision

Implement comprehensive multi-layer testing per Constitution Principle III (Code Quality & Testing Standards).

### Test Pyramid

**Unit Tests (70% of tests)**:
- **Backend**: JUnit 5 + Mockito for service logic, validation, Kafka producers/consumers (isolated)
- **Frontend**: Jasmine + Karma for Angular components, services, pipes
- **Coverage target**: 80% backend, 70% frontend (enforced by SonarQube gates)

**Integration Tests (20% of tests)**:
- **Backend**: Testcontainers for spinning up Kafka, PostgreSQL, Redis in Docker
  - Test GPS ingestion → Kafka → Location service → Database persistence flow
  - Test WebSocket connections end-to-end with real Kafka messages
- **Contract Tests**: Spring Cloud Contract for API contracts between services
  - Producer (e.g., Location API) defines contracts; consumer (Frontend) verifies

**End-to-End Tests (10% of tests)**:
- **Cypress**: Test critical user journeys (login → view map → search truck → view history)
- **Headless browsers**: Run in CI/CD pipeline with Dockerized browser containers
- **Test data**: Use factories to generate realistic test GPS data, trucks, geofences

**Load Tests**:
- **Gatling**: Simulate 10K GPS updates/second and 500 concurrent users
- **Scenarios**: Ramp-up from 100 to 500 users over 5 minutes, sustain for 10 minutes
- **Assertions**: P95 latency <2s for GPS updates, <200ms for API reads

### Tools & Frameworks

| Test Type | Backend | Frontend |
|-----------|---------|----------|
| Unit | JUnit 5, Mockito, Spring Test | Jasmine, Karma |
| Integration | Testcontainers, Spring Boot Test | N/A (use backend integration tests) |
| Contract | Spring Cloud Contract | Pact (if needed) |
| E2E | Cypress (shared with frontend) | Cypress |
| Load | Gatling | Lighthouse CI (performance budgets) |

### Best Practices

1. **TDD Discipline**: Write failing tests before implementation (Red-Green-Refactor cycle enforced in code reviews)
2. **Test data builders**: Use builder pattern for creating test entities (avoids brittle tests with hardcoded values)
3. **Idempotent tests**: Tests must not depend on execution order or shared state (use test database per test class)
4. **Fast feedback**: Unit tests run in <10 seconds, integration tests in <2 minutes (parallelize with Gradle/Maven parallel execution)
5. **CI/CD gates**: All tests must pass before merge; SonarQube gate blocks merge if coverage drops below 80%/70%

---

## 8. Security & Authentication

### Decision

Implement JWT-based authentication with OAuth2/OIDC integration and RBAC authorization.

### Architecture

**Auth Flow**:
1. User logs in via Auth Service (username/password or OAuth2 provider like Google, Azure AD)
2. Auth Service validates credentials, generates JWT access token (short-lived, 15 min) + refresh token (long-lived, 30 days)
3. Frontend stores tokens in `httpOnly` cookies (prevents XSS attacks) or secure localStorage
4. API Gateway validates JWT on every request using shared secret or public key (if using asymmetric RS256)
5. Services extract user ID and roles from JWT claims; enforce RBAC at service level

**Authorization**:
- **Roles**: `FLEET_MANAGER`, `DISPATCHER`, `VIEWER`
- **Truck access control**: User entity has `authorizedTruckGroups` (many-to-many relationship)
- **Endpoint authorization**: Spring Security `@PreAuthorize("hasRole('FLEET_MANAGER')")` annotations
- **Row-level security**: PostgreSQL RLS policies filter trucks based on user's authorized groups

**Encryption**:
- **In transit**: TLS 1.3 for all HTTP/WebSocket connections (NGINX/Ingress terminates TLS)
- **At rest**: PostgreSQL transparent data encryption (TDE) via pgcrypto or managed database encryption
- **Secrets**: Use Kubernetes Secrets or Vault for storing database passwords, Kafka credentials, JWT signing keys

### Best Practices

1. **Short-lived JWTs**: Access tokens expire in 15 minutes (reduces window for stolen token abuse)
2. **Refresh token rotation**: Issue new refresh token on each refresh request (prevents replay attacks)
3. **CORS**: Configure Spring Security CORS to allow only frontend origin (`https://truck-track.example.com`)
4. **Rate limiting**: API Gateway limits login attempts (10/minute per IP) to prevent brute-force attacks
5. **Audit logging**: Log all authentication events (login, logout, failed attempts) and GPS data access with user ID

---

## 9. Observability & Monitoring

### Decision

Implement comprehensive observability using Prometheus, Grafana, ELK stack, and OpenTelemetry.

### Metrics (Prometheus + Grafana)

**Application Metrics** (via Micrometer):
- **GPS ingestion rate**: GPS events/second ingested by Ingestion Service
- **Kafka consumer lag**: Messages behind latest offset (alert if lag >1000)
- **API latency**: P50, P95, P99 response times for Location API endpoints
- **WebSocket connections**: Active WebSocket sessions, connection errors
- **Cache hit rate**: Redis cache hits vs misses (target >90% for truck positions)
- **Database query time**: P95 query execution time (target <50ms for spatial queries)

**Infrastructure Metrics** (via Node Exporter, Kafka Exporter):
- **CPU/Memory**: Per-service resource utilization (trigger HPA if CPU >70%)
- **Kafka broker health**: Leader elections, under-replicated partitions
- **PostgreSQL health**: Connection pool usage, replication lag

**Dashboards**:
- **GPS Tracking Overview**: Live map of truck positions + ingestion rate + latency
- **Service Health**: Per-service CPU, memory, error rate, throughput
- **Kafka Monitor**: Topic lag, broker health, consumer group status

### Logs (ELK Stack)

**Structured Logging**:
- **Format**: JSON with correlation ID (trace ID) for request tracing across services
- **Fields**: `timestamp`, `level`, `service`, `traceId`, `userId`, `message`, `exception`
- **Retention**: 30 days in Elasticsearch

**Log Aggregation**:
- **Logstash**: Collects logs from all services (via Filebeat or direct HTTP input)
- **Elasticsearch**: Indexes logs for fast search
- **Kibana**: Visualizes logs, creates alerts for ERROR-level messages

### Distributed Tracing (OpenTelemetry + Jaeger/Zipkin)

**Trace Flow**:
- GPS device → Ingestion Service → Kafka → Location Service → PostgreSQL/Redis → Frontend
- Each service propagates `traceId` in headers/Kafka message headers
- OpenTelemetry SDK instruments HTTP, Kafka, JDBC calls automatically

**Use Cases**:
- **Latency debugging**: Identify bottlenecks in GPS update pipeline (e.g., slow PostgreSQL write)
- **Error correlation**: Trace failed requests across multiple services

### Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| High GPS ingestion lag | Kafka consumer lag >1000 messages | Scale Location Service pods |
| API latency spike | P95 response time >500ms for 5 min | Investigate database query performance |
| Service down | Prometheus `/actuator/health` check fails for 2 min | Page on-call engineer, restart pod |
| WebSocket failures | WebSocket connection error rate >5% | Check network issues, API Gateway health |
| Low cache hit rate | Redis hit rate <80% | Review cache TTL settings, check Redis memory |

### Best Practices

1. **Correlation IDs**: Generate UUID for each request; propagate in headers and Kafka messages for end-to-end tracing
2. **Log levels**: Use INFO for business events (truck went offline), DEBUG for technical details (Kafka offset committed)
3. **Metrics cardinality**: Avoid high-cardinality labels (truck IDs) in Prometheus metrics (use logs for per-truck debugging)
4. **Dashboard accessibility**: Share Grafana dashboards with non-technical stakeholders (fleet ops team monitors GPS ingestion health)
5. **Cost optimization**: Tune Elasticsearch retention and Prometheus scrape intervals to balance observability vs storage costs

---

## 10. Deployment & Infrastructure

### Decision

Deploy microservices on Kubernetes with Helm charts for templated deployment and environment management.

### Container Orchestration

**Kubernetes Features**:
- **Deployments**: Rolling updates with zero downtime (update one pod at a time)
- **Services**: ClusterIP for internal service-to-service communication, LoadBalancer for API Gateway
- **ConfigMaps/Secrets**: Store environment-specific config (Kafka brokers, database URLs, JWT keys)
- **HorizontalPodAutoscaler (HPA)**: Auto-scale pods based on CPU (>70%) or custom metrics (Kafka lag)
- **Ingress**: NGINX Ingress Controller terminates TLS, routes traffic to API Gateway and Angular frontend

**Helm Charts**:
- **Per-service charts**: Separate chart for each microservice with configurable replicas, resources, environment variables
- **Values files**: `values-dev.yaml`, `values-staging.yaml`, `values-prod.yaml` for environment-specific overrides
- **Dependencies**: Use Bitnami Helm charts for PostgreSQL, Redis, Kafka in dev/staging (use managed services in prod)

### CI/CD Pipeline

**GitHub Actions (or GitLab CI/Jenkins)**:
1. **Build**: Compile Java services (Maven/Gradle), build Angular app (ng build --prod)
2. **Test**: Run unit tests, integration tests, SonarQube analysis
3. **Containerize**: Build Docker images, push to registry (Docker Hub, ECR, GCR)
4. **Deploy**:
   - **Dev**: Auto-deploy on every commit to `main` branch
   - **Staging**: Auto-deploy on tag (e.g., `v1.0.0-rc1`)
   - **Production**: Manual approval + Helm upgrade with blue-green or canary deployment

**Infrastructure as Code**:
- **Terraform**: Provision Kubernetes cluster, managed PostgreSQL/Redis/Kafka, networking
- **Ansible (optional)**: Configure VM-based deployments if not using cloud-managed services

### Environments

| Environment | Purpose | Infrastructure |
|-------------|---------|----------------|
| **Dev** | Local development | Docker Compose (Kafka, PostgreSQL, Redis on laptop) |
| **Staging** | Pre-production testing | Kubernetes cluster, managed databases (cloud) |
| **Production** | Live traffic | Kubernetes cluster, high-availability managed services |

### Best Practices

1. **Resource limits**: Set CPU/memory requests and limits for all pods (prevents noisy neighbor issues)
2. **Readiness probes**: Configure `/actuator/health/readiness` endpoint; Kubernetes waits for pod to be ready before sending traffic
3. **Liveness probes**: Configure `/actuator/health/liveness` endpoint; Kubernetes restarts pod if unhealthy
4. **Blue-green deployment**: Deploy new version alongside old, switch traffic after validation (zero downtime)
5. **Database migrations**: Use Flyway to manage schema changes; run migrations in init container before starting app pods

---

## Summary of Key Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Backend Framework** | Spring Boot 3.2+ (Java 17) | Constitution requirement, excellent Kafka/WebSocket support, mature ecosystem |
| **Message Queue** | Apache Kafka 3.6+ | Constitution requirement, high throughput (10K updates/sec), event sourcing, durability |
| **Database** | PostgreSQL 15+ with PostGIS 3.4+ | Constitution requirement, spatial indexing for location queries, ACID transactions |
| **Cache** | Redis 7+ | Constitution requirement, sub-millisecond latency for current truck positions, pub/sub |
| **Frontend Framework** | Angular 17+ | User requirement, RxJS for reactive streams, TypeScript alignment with Java, Material Design |
| **Map Library** | Leaflet 1.9+ | Open-source, simple, marker clustering; upgrade to Mapbox GL JS if performance insufficient |
| **Testing** | JUnit 5, Testcontainers, Cypress, Gatling | Multi-layer testing (unit, integration, E2E, load) per constitution TDD requirements |
| **Security** | Spring Security, JWT, OAuth2 | JWT-based auth, RBAC, TLS 1.3, database encryption per constitution security principle |
| **Monitoring** | Prometheus, Grafana, ELK, OpenTelemetry | Metrics, logs, traces; full observability per constitution performance monitoring requirements |
| **Deployment** | Kubernetes, Helm, Docker | Container orchestration, auto-scaling, blue-green deployments, infrastructure as code |

---

## Next Steps

**Phase 1 Design Artifacts** (to be generated):
1. **data-model.md**: Detailed entity models, field types, relationships, validation rules, indexes
2. **contracts/**: OpenAPI specs for REST APIs, Avro schemas for Kafka topics
3. **quickstart.md**: Developer setup guide (Docker Compose, IDE config, running tests)
4. **Update agent context**: Add Angular, Kafka, PostGIS to AI agent's technology awareness

**Post-Planning** (Phase 2 - tasks generation):
1. Generate tasks.md via `/speckit.tasks` command
2. Break down implementation into parallelizable tasks per user story
3. Begin TDD implementation starting with User Story 1 (View Live Truck Locations on Map)
