# TruckTrack Backend

Backend microservices en Java 17 / Spring Boot 3.2 pour le système de suivi GPS.

Architecture event-driven avec Kafka pour la communication asynchrone entre services. Les positions GPS sont ingérées, stockées dans PostgreSQL avec PostGIS pour les requêtes spatiales, et diffusées en temps réel via WebSocket.

## Services

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 8000 | Routing, JWT validation, CORS |
| auth-service | 8083 | Login, JWT generation |
| gps-ingestion-service | 8080 | GPS position intake → Kafka |
| location-service | 8081 | Positions, history, geofences |
| notification-service | 8082 | Alerts, notifications |
| shared | - | Common DTOs, events, exceptions |

## Quick Start

```bash
# Prerequisites: Docker running
cd infra/docker && docker-compose up -d

# Build
cd backend && mvn clean install -DskipTests

# Run migrations
mvn flyway:migrate -P local

# Start a service
cd backend/location-service && mvn spring-boot:run
```

## Kafka Topics

| Topic | Description |
|-------|-------------|
| truck-track.gps.position | GPS position events |
| truck-track.location.status-change | Truck status changes |
| truck-track.notification.alert | Alert notifications |

## API Endpoints

### Auth Service (:8083)
- `POST /auth/v1/login` - Login
- `POST /auth/v1/refresh` - Refresh token
- `POST /auth/v1/logout` - Logout

### Location Service (:8081)
- `GET /location/v1/trucks` - List trucks
- `GET /location/v1/trucks/{id}/history` - Position history
- `WS /ws/locations` - Live position updates

### Notification Service (:8082)
- `GET /notification/v1/notifications` - List notifications
- `POST /notification/v1/alert-rules` - Create alert rule

## Monitoring

```bash
# Health
curl http://localhost:8081/actuator/health

# Metrics
curl http://localhost:8081/actuator/prometheus
```

| Tool | URL |
|------|-----|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |
| Jaeger | http://localhost:16686 |

## Testing

```bash
mvn test           # Unit tests
mvn verify         # Integration tests
```
