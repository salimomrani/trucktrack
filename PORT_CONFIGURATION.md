# Truck Track - Port Configuration

This document lists all ports used by the Truck Track system services.

## Backend Services (Spring Boot)

| Service | Port | Health Check URL | Configuration File |
|---------|------|------------------|-------------------|
| **GPS Ingestion Service** | `8080` | `http://localhost:8080/actuator/health` | `backend/gps-ingestion-service/src/main/resources/application.yml` |
| **Location Service** | `8081` | `http://localhost:8081/actuator/health` | `backend/location-service/src/main/resources/application.yml` |
| **Notification Service** | `8082` | `http://localhost:8082/actuator/health` | `backend/notification-service/src/main/resources/application.yml` |
| **Auth Service** | `8083` | `http://localhost:8083/actuator/health` | `backend/auth-service/src/main/resources/application.yml` |
| **API Gateway** | `8000` | `http://localhost:8000/actuator/health` | `backend/api-gateway/src/main/resources/application.yml` |

## Docker Infrastructure

| Service | External Port | Internal Port | Admin UI | Configuration File |
|---------|--------------|---------------|----------|-------------------|
| **Kafka Broker** | `9092` | `29092` | - | `infra/docker/docker-compose.yml` |
| **Kafka UI** | `8088` | `8080` | `http://localhost:8088` | `infra/docker/docker-compose.yml` |
| **PostgreSQL (PostGIS)** | `5432` | `5432` | - | `infra/docker/docker-compose.yml` |
| **Redis** | `6379` | `6379` | - | `infra/docker/docker-compose.yml` |

## API Gateway Routes

The API Gateway (port 8000) routes requests to backend services:

| Route Pattern | Target Service | Target Port | Authentication Required |
|--------------|----------------|-------------|------------------------|
| `/auth/**` | Auth Service | `8083` | No (login endpoint) |
| `/gps/**` | GPS Ingestion Service | `8080` | Yes (JWT) |
| `/location/**` | Location Service | `8081` | Yes (JWT) |
| `/public/location/**` | Location Service | `8081` | No (public endpoint) |
| `/notifications/**` | Notification Service | `8082` | Yes (JWT) |

## Frontend & Mobile

| Application | Port | URL | Start Command |
|-------------|------|-----|---------------|
| **Angular Frontend** | `4200` | `http://localhost:4200` | `cd frontend && npm start` |
| **Expo Mobile (Metro)** | `8081` | `exp://192.168.x.x:8081` | `cd mobile-expo && npx expo start` |

> **Note**: Expo Metro bundler uses port 8081 by default, which conflicts with Location Service. Use `npx expo start --port 19000` to avoid conflict, or stop Location Service when developing mobile.

## Quick Access URLs

### Backend Services
- API Gateway: `http://localhost:8000`
- GPS Ingestion: `http://localhost:8080`
- Location Service: `http://localhost:8081`
- Notification Service: `http://localhost:8082`
- Auth Service: `http://localhost:8083`

### Frontend
- Angular Web App: `http://localhost:4200`

### Infrastructure
- Kafka UI: `http://localhost:8088`
- PostgreSQL: `localhost:5432` (database: `trucktrack`)
- Redis: `localhost:6379`

## Testing Endpoints

### Health Checks
```bash
# Check all services health
curl http://localhost:8000/actuator/health  # API Gateway
curl http://localhost:8080/actuator/health  # GPS Ingestion
curl http://localhost:8081/actuator/health  # Location Service
curl http://localhost:8082/actuator/health  # Notification Service
curl http://localhost:8083/actuator/health  # Auth Service
```

### GPS Position Submission
```bash
# Direct to GPS Ingestion Service
curl -X POST http://localhost:8080/gps/v1/positions \
  -H "Content-Type: application/json" \
  -d '{...}'

# Via API Gateway (requires JWT token)
curl -X POST http://localhost:8000/gps/v1/positions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{...}'
```

## Port Conflicts

If you encounter "Address already in use" errors, check for conflicts:

```bash
# Check if a port is in use
lsof -i :8080    # GPS Ingestion Service
lsof -i :8081    # Location Service
lsof -i :8082    # Notification Service
lsof -i :8083    # Auth Service
lsof -i :8000    # API Gateway
lsof -i :9092    # Kafka
lsof -i :5432    # PostgreSQL
lsof -i :6379    # Redis
lsof -i :8088    # Kafka UI
```

## Kafka Topics

The following Kafka topics are created automatically:

| Topic | Partitions | Retention | Compression | Purpose |
|-------|-----------|-----------|-------------|---------|
| `truck-track.gps.position` | 10 | 7 days | snappy | GPS position events |
| `truck-track.location.status-change` | 5 | 30 days | none | Truck status changes |
| `truck-track.notification.alert` | 3 | 90 days | none | Notification alerts |

## Database Configuration

**PostgreSQL Connection:**
- Host: `localhost`
- Port: `5432`
- Database: `trucktrack`
- Username: `trucktrack`
- Password: `changeme`
- Extensions: PostGIS (for geospatial queries)

**Redis Connection:**
- Host: `localhost`
- Port: `6379`
- Max Memory: `256mb`
- Policy: `allkeys-lru`
- Persistence: AOF enabled

## Notes

1. All backend services expose Prometheus metrics at `/actuator/prometheus`
2. The API Gateway uses JWT authentication (secret configured in application.yml)
3. Kafka uses KRaft mode (no Zookeeper required)
4. Docker services are connected via `truck-track-network` bridge network
5. All services use JSON logging format for production
