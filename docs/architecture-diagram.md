# TruckTrack System Architecture

## Overview

TruckTrack is a GPS fleet management system built on a microservices architecture. This document describes the system components and their interactions.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Applications"]
        WEB["Angular Web App<br/>(Admin Dashboard)"]
        MOBILE["Expo Mobile App<br/>(Driver App)"]
    end

    subgraph Gateway["API Gateway Layer"]
        GATEWAY["API Gateway<br/>(Spring Cloud Gateway)<br/>:8080"]
    end

    subgraph Services["Microservices"]
        AUTH["Auth Service<br/>(Spring Boot)<br/>:8081"]
        LOCATION["Location Service<br/>(Spring Boot)<br/>:8082"]
        GPS["GPS Ingestion Service<br/>(Spring Boot)<br/>:8083"]
        NOTIF["Notification Service<br/>(Spring Boot)<br/>:8084"]
    end

    subgraph Messaging["Event Streaming"]
        KAFKA["Apache Kafka<br/>(KRaft Mode)<br/>:9092"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL + PostGIS<br/>:5432"]
        REDIS["Redis Cache<br/>:6379"]
    end

    subgraph Monitoring["Observability Stack"]
        PROM["Prometheus<br/>:9090"]
        GRAF["Grafana<br/>:3001"]
        JAEGER["Jaeger<br/>:16686"]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY

    GATEWAY --> AUTH
    GATEWAY --> LOCATION
    GATEWAY --> GPS
    GATEWAY --> NOTIF

    AUTH --> PG
    AUTH --> REDIS

    LOCATION --> PG
    LOCATION --> REDIS
    LOCATION --> KAFKA

    GPS --> KAFKA
    GPS --> PG

    NOTIF --> PG
    NOTIF --> KAFKA
    NOTIF --> REDIS

    KAFKA --> LOCATION
    KAFKA --> NOTIF

    AUTH --> PROM
    LOCATION --> PROM
    GPS --> PROM
    NOTIF --> PROM
    PROM --> GRAF

    AUTH --> JAEGER
    LOCATION --> JAEGER
    GPS --> JAEGER
    NOTIF --> JAEGER
```

## Component Details

### Client Applications

| Component | Technology | Description |
|-----------|------------|-------------|
| **Web Dashboard** | Angular 21, Material UI, NgRx | Admin interface for fleet managers and dispatchers |
| **Mobile App** | React Native (Expo) | Driver app for trip management and GPS tracking |

### API Gateway

| Component | Technology | Port | Description |
|-----------|------------|------|-------------|
| **API Gateway** | Spring Cloud Gateway | 8080 | Central entry point, routing, JWT validation, rate limiting |

### Microservices

| Service | Technology | Port | Responsibilities |
|---------|------------|------|------------------|
| **Auth Service** | Spring Boot 3.2 | 8081 | User authentication, JWT tokens, RBAC, user management |
| **Location Service** | Spring Boot 3.2 | 8082 | Truck tracking, trips, geofences, fleet analytics |
| **GPS Ingestion** | Spring Boot 3.2 | 8083 | High-throughput GPS data ingestion, validation, Kafka publishing |
| **Notification Service** | Spring Boot 3.2 | 8084 | Alert rules, notifications, WebSocket push, Expo push notifications |

### Data Layer

| Component | Technology | Port | Purpose |
|-----------|------------|------|---------|
| **PostgreSQL** | PostgreSQL 15 + PostGIS | 5432 | Primary database with geospatial extensions |
| **Redis** | Redis 7 | 6379 | Session cache, rate limiting, real-time data cache |

### Event Streaming

| Component | Technology | Port | Purpose |
|-----------|------------|------|---------|
| **Kafka** | Apache Kafka (KRaft) | 9092 | Async messaging for GPS events, notifications, inter-service communication |

### Observability

| Component | Technology | Port | Purpose |
|-----------|------------|------|---------|
| **Prometheus** | Prometheus | 9090 | Metrics collection and storage |
| **Grafana** | Grafana | 3001 | Metrics visualization and dashboards |
| **Jaeger** | Jaeger | 16686 | Distributed tracing |

## Data Flow Diagrams

### GPS Tracking Flow

```mermaid
sequenceDiagram
    participant Mobile as Mobile App
    participant Gateway as API Gateway
    participant GPS as GPS Ingestion
    participant Kafka as Kafka
    participant Location as Location Service
    participant Notif as Notification Service
    participant DB as PostgreSQL

    Mobile->>Gateway: POST /gps/positions
    Gateway->>GPS: Forward GPS data
    GPS->>GPS: Validate coordinates
    GPS->>Kafka: Publish to truck-track.gps.positions
    GPS-->>Gateway: 202 Accepted
    Gateway-->>Mobile: 202 Accepted

    Kafka->>Location: Consume GPS event
    Location->>DB: Store position history
    Location->>Location: Check geofence transitions
    Location->>Kafka: Publish geofence event (if any)

    Kafka->>Notif: Consume geofence event
    Notif->>Notif: Evaluate alert rules
    Notif->>DB: Create notification
    Notif->>Mobile: Push notification (Expo)
```

### Trip Lifecycle Flow

```mermaid
sequenceDiagram
    participant Web as Web Dashboard
    participant Gateway as API Gateway
    participant Location as Location Service
    participant Kafka as Kafka
    participant Notif as Notification Service
    participant Mobile as Mobile App
    participant DB as PostgreSQL

    Web->>Gateway: POST /admin/trips (create)
    Gateway->>Location: Create trip
    Location->>DB: Save trip (PENDING)
    Location-->>Web: Trip created

    Web->>Gateway: POST /admin/trips/{id}/assign
    Gateway->>Location: Assign trip
    Location->>DB: Update trip (ASSIGNED)
    Location->>Kafka: Publish trip.assigned event
    Kafka->>Notif: Consume event
    Notif->>Mobile: Push notification to driver

    Mobile->>Gateway: POST /trips/{id}/start
    Gateway->>Location: Start trip
    Location->>DB: Update trip (IN_PROGRESS)
    Location-->>Mobile: Trip started

    Mobile->>Gateway: POST /trips/{id}/complete
    Gateway->>Location: Complete trip
    Location->>DB: Update trip (COMPLETED)
    Location-->>Mobile: Trip completed
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Client App
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant Redis as Redis
    participant DB as PostgreSQL

    Client->>Gateway: POST /auth/login
    Gateway->>Auth: Forward credentials
    Auth->>DB: Validate user
    Auth->>Auth: Generate JWT tokens
    Auth->>Redis: Store refresh token
    Auth-->>Gateway: JWT + Refresh token
    Gateway-->>Client: Tokens

    Client->>Gateway: GET /api/resource (with JWT)
    Gateway->>Gateway: Validate JWT
    Gateway->>Auth: Forward (if valid)
    Auth-->>Gateway: Response
    Gateway-->>Client: Response

    Client->>Gateway: POST /auth/refresh
    Gateway->>Auth: Refresh request
    Auth->>Redis: Validate refresh token
    Auth->>Auth: Generate new JWT
    Auth-->>Gateway: New JWT
    Gateway-->>Client: New JWT
```

## Kafka Topics

| Topic | Producer | Consumer(s) | Description |
|-------|----------|-------------|-------------|
| `truck-track.gps.positions` | GPS Ingestion | Location Service | Real-time GPS position updates |
| `truck-track.geofence.events` | Location Service | Notification Service | Geofence entry/exit events |
| `truck-track.trips.assigned` | Location Service | Notification Service | Trip assignment notifications |
| `truck-track.trips.updated` | Location Service | Notification Service | Trip status change events |
| `truck-track.alerts` | Notification Service | - | Generated alerts for analytics |

## Security Architecture

```mermaid
flowchart LR
    subgraph External["External"]
        CLIENT["Client App"]
    end

    subgraph DMZ["DMZ"]
        GATEWAY["API Gateway<br/>JWT Validation<br/>Rate Limiting"]
    end

    subgraph Internal["Internal Network"]
        AUTH["Auth Service"]
        SERVICES["Other Services"]
        DATA["Databases"]
    end

    CLIENT -->|HTTPS| GATEWAY
    GATEWAY -->|Internal HTTP| AUTH
    GATEWAY -->|Internal HTTP| SERVICES
    AUTH -->|TCP| DATA
    SERVICES -->|TCP| DATA
```

### Security Features

- **JWT Authentication**: Stateless token-based authentication
- **Role-Based Access Control**: ADMIN, FLEET_MANAGER, DISPATCHER, DRIVER roles
- **Rate Limiting**: API Gateway level protection against abuse
- **CORS Configuration**: Strict origin validation
- **Password Hashing**: BCrypt with configurable strength
- **Refresh Token Rotation**: Secure token refresh mechanism

## Deployment

### Docker Compose (Development)

All services are containerized and can be started with:
```bash
cd infra/docker
docker-compose up -d
```

### Production Recommendations

- Kubernetes deployment with Helm charts
- Managed PostgreSQL (RDS, Cloud SQL)
- Managed Redis (ElastiCache, Memorystore)
- Managed Kafka (MSK, Confluent Cloud)
- Load balancer in front of API Gateway
- Auto-scaling for microservices
