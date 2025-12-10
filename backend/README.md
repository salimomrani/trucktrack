# Truck Track Backend Services

This directory contains all backend microservices for the GPS Live Truck Tracking application.

## Architecture Overview

The backend follows a microservices architecture pattern with event-driven communication via Apache Kafka.

```
┌─────────────────┐
│   API Gateway   │ :8000 (Entry Point)
└────────┬────────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
┌───▼────────┐          ┌──────────▼──┐
│ GPS        │          │  Location   │
│ Ingestion  │          │  Service    │
│ Service    │          │             │
└────────────┘          └─────────────┘
    │                         │
    │    ┌──────────┐        │
    └────►  Kafka   ◄────────┘
         │ Broker   │
         └────┬─────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────────┐   ┌───────▼─────┐
│ Notification│   │    Auth     │
│  Service    │   │   Service   │
└─────────────┘   └─────────────┘
```

## Services

### 1. GPS Ingestion Service (Port: 8080)
**Purpose**: Receives GPS coordinates from delivery trucks and publishes to Kafka

**Endpoints**:
- `POST /gps/v1/positions` - Ingest GPS position

**Technologies**:
- Spring Boot 3.2
- Spring Kafka (Producer)
- Validation

### 2. Location Service (Port: 8081)
**Purpose**: Consumes GPS events, manages truck positions, serves location queries, provides WebSocket live updates

**Endpoints**:
- `GET /location/v1/trucks` - List all trucks
- `GET /location/v1/trucks/{id}` - Get truck details
- `GET /location/v1/trucks/{id}/current-position` - Get current position
- `GET /location/v1/trucks/{id}/history` - Get historical route
- `WebSocket /ws/locations` - Live position updates

**Technologies**:
- Spring Boot 3.2
- Spring WebFlux (WebSocket)
- Spring Kafka (Consumer)
- Spring Data JPA
- PostgreSQL + PostGIS
- Redis

### 3. Notification Service (Port: 8082)
**Purpose**: Processes alert rules and sends notifications

**Endpoints**:
- `POST /notification/v1/alert-rules` - Create alert rule
- `GET /notification/v1/alert-rules` - List alert rules
- `GET /notification/v1/notifications` - List notifications

**Technologies**:
- Spring Boot 3.2
- Spring Kafka (Consumer)
- Spring Data JPA
- PostgreSQL

### 4. Auth Service (Port: 8083)
**Purpose**: Handles authentication and JWT token generation

**Endpoints**:
- `POST /auth/v1/login` - User login
- `POST /auth/v1/refresh` - Refresh access token
- `POST /auth/v1/logout` - User logout

**Technologies**:
- Spring Boot 3.2
- Spring Security
- JWT (jjwt library)
- BCrypt password hashing

### 5. API Gateway (Port: 8000)
**Purpose**: Single entry point for all client requests, handles routing, authentication, rate limiting

**Technologies**:
- Spring Cloud Gateway
- JWT validation
- CORS configuration

### 6. Shared Common Library
**Purpose**: Shared DTOs, exceptions, utilities used across all services

**Contains**:
- Common DTOs (GPSCoordinate, TruckStatus)
- Event POJOs (GPSPositionEvent, TruckStatusChangeEvent, AlertTriggeredEvent)
- Common exceptions (ResourceNotFoundException, ValidationException, UnauthorizedException)

## Current Implementation Status

### Phase 1: Setup ✅ COMPLETE
- [X] Maven multi-module project structure
- [X] All 5 microservices initialized
- [X] Shared common library
- [X] Checkstyle configuration
- [X] Docker Compose setup
- [X] SonarQube configuration
- [X] CI/CD pipeline

### Phase 2: Foundational Infrastructure ✅ COMPLETE
- [X] PostgreSQL database connection
- [X] Flyway migrations (V1: schema, V2: seed data)
- [X] Database tables with PostGIS spatial indexes
- [X] Kafka connection configuration
- [X] Kafka topics creation
- [X] Redis connection configuration
- [X] JWT token generation and validation
- [X] API Gateway routes
- [X] Prometheus metrics
- [X] Structured JSON logging
- [X] Common DTOs, events, exceptions

### Phase 3: User Story 1 (Next Phase)
Coming next: GPS ingestion, location tracking, live map visualization

## Development

### Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- PostgreSQL 15+ with PostGIS
- Kafka 3.6+
- Redis 7+

### Build All Services
```bash
cd backend
mvn clean install
```

### Run Single Service
```bash
cd backend/location-service
mvn spring-boot:run
```

### Run Tests
```bash
mvn test                    # Unit tests
mvn verify                  # Integration tests
```

### Code Quality
```bash
mvn checkstyle:check        # Check style
mvn sonar:sonar             # SonarQube analysis
```

## Configuration

Each service uses Spring Boot externalized configuration:
- `application.yml` - Default configuration
- `application-dev.yml` - Development overrides
- `application-staging.yml` - Staging overrides
- `application-prod.yml` - Production overrides

Environment variables can override any property:
```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/trucktrack
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export SPRING_DATA_REDIS_HOST=localhost
```

## Database Migrations

Flyway migrations are in `location-service/src/main/resources/db/migration/`

Run migrations:
```bash
mvn flyway:migrate -P local
```

## Kafka Topics

- `truck-track.gps.position` - GPS position events (10 partitions)
- `truck-track.location.status-change` - Truck status changes (5 partitions)
- `truck-track.notification.alert` - Alert notifications (3 partitions)

## Monitoring

- **Health checks**: `http://localhost:{port}/actuator/health`
- **Metrics**: `http://localhost:{port}/actuator/metrics`
- **Prometheus**: `http://localhost:{port}/actuator/prometheus`

## Next Steps

1. Start Docker infrastructure: `cd infra/docker && docker-compose up -d`
2. Run Flyway migrations: `mvn flyway:migrate -P local`
3. Start all services
4. Implement User Story 1 (GPS ingestion + live map)

See `/specs/001-gps-live-tracking/tasks.md` for detailed task breakdown.
