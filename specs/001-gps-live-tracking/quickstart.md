# Quickstart Guide: GPS Live Truck Tracking

**Feature**: GPS Live Truck Tracking
**Branch**: 001-gps-live-tracking
**Last Updated**: 2025-12-09

## Overview

This guide helps developers set up a local development environment for the GPS live truck tracking application. You'll have a fully functional system with all microservices, Kafka, PostgreSQL (with PostGIS), Redis, and the Angular frontend running locally via Docker Compose.

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker** | 20.10+ | Container runtime |
| **Docker Compose** | 2.0+ | Multi-container orchestration |
| **Java JDK** | 17+ | Backend development |
| **Node.js** | 18+ | Frontend development |
| **Maven** | 3.8+ | Java build tool |
| **Angular CLI** | 17+ | Frontend scaffolding |
| **Git** | 2.30+ | Version control |

### Optional Tools

- **IntelliJ IDEA** or **VS Code** (recommended IDEs)
- **Postman** or **Insomnia** (API testing)
- **pgAdmin** or **DBeaver** (database GUI)
- **Kafka UI** (Kafka topic visualization)

---

## Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/truck-track.git
cd truck-track
git checkout 001-gps-live-tracking
```

### 2. Start Infrastructure Services

Start Kafka, PostgreSQL, and Redis via Docker Compose:

```bash
cd infra/docker
docker-compose up -d
```

**What this starts**:
- Kafka broker (port 9092) + ZooKeeper (port 2181)
- PostgreSQL 15 with PostGIS (port 5432)
- Redis 7 (port 6379)
- Kafka UI (port 8080) - view topics and messages

**Verify services are running**:

```bash
docker-compose ps
# All services should show "Up"
```

### 3. Initialize Database

Run Flyway migrations to create schema:

```bash
cd ../../backend
mvn flyway:migrate -P local
```

**Verify**:

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U trucktrack -d trucktrack

# Check tables
\dt

# Should see: users, trucks, gps_positions, geofences, alert_rules, etc.
\q
```

### 4. Start Backend Services

Open 5 terminal windows and start each microservice:

```bash
# Terminal 1: GPS Ingestion Service
cd backend/gps-ingestion-service
mvn spring-boot:run

# Terminal 2: Location Service
cd backend/location-service
mvn spring-boot:run

# Terminal 3: Notification Service
cd backend/notification-service
mvn spring-boot:run

# Terminal 4: Auth Service
cd backend/auth-service
mvn spring-boot:run

# Terminal 5: API Gateway
cd backend/api-gateway
mvn spring-boot:run
```

**Ports**:
- GPS Ingestion: 8080
- Location Service: 8081
- Notification Service: 8082
- Auth Service: 8083
- API Gateway: 8000 (entry point for all APIs)

**Health check**:

```bash
curl http://localhost:8000/actuator/health
# Should return: {"status":"UP"}
```

### 5. Start Frontend

```bash
cd frontend
npm install
npm start
```

**Access application**: http://localhost:4200

**Default login**:
- Email: `admin@trucktrack.com`
- Password: `AdminPass123!`

---

## Architecture Overview

```
┌─────────────┐
│   Angular   │ :4200
│  Frontend   │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────┐
│ API Gateway │ :8000
└──────┬──────┘
       │
    ┌──┴──────────────────────────┐
    │                             │
    ▼                             ▼
┌─────────────┐          ┌─────────────┐
│   Location  │ :8081    │    Auth     │ :8083
│   Service   │◄─────────┤   Service   │
└──────┬──────┘          └─────────────┘
       │
       │ Kafka
       ▼
┌─────────────┐
│     GPS     │ :8080
│  Ingestion  │
└──────┬──────┘
       │
       ▼
┌─────────────┐          ┌─────────────┐
│    Kafka    │ :9092    │  PostgreSQL │ :5432
│   Broker    │          │  + PostGIS  │
└─────────────┘          └─────────────┘
       │
       ▼
┌─────────────┐
│ Notification│ :8082
│   Service   │
└─────────────┘
```

---

## Development Workflow

### Running Tests

**Backend (Java)**:

```bash
# Unit tests
cd backend/location-service
mvn test

# Integration tests (uses Testcontainers)
mvn verify -P integration-tests

# All tests
mvn clean verify
```

**Frontend (Angular)**:

```bash
cd frontend

# Unit tests
npm test

# E2E tests (requires backend running)
npm run e2e
```

### Code Quality Checks

**Java (SonarQube)**:

```bash
# Start SonarQube (if not already running)
docker run -d -p 9000:9000 sonarqube:latest

# Run analysis
cd backend
mvn clean verify sonar:sonar
```

**Angular (ESLint)**:

```bash
cd frontend
npm run lint
```

### Simulating GPS Data

Use the provided test script to send mock GPS positions:

```bash
cd backend/gps-ingestion-service
./scripts/simulate-gps-data.sh

# Sends GPS positions for 10 trucks moving around San Francisco
# Updates every 2 seconds
```

**Watch Kafka topic**:

```bash
# View GPS events in Kafka UI: http://localhost:8080
# Or use kafka-console-consumer:
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic truck-track.gps.position \
  --from-beginning
```

### Debugging

**Backend (IntelliJ IDEA)**:
1. Open `backend` folder as project
2. Run → Edit Configurations → Add → Spring Boot
3. Main class: `com.trucktrack.location.LocationServiceApplication`
4. Set breakpoints and run in Debug mode

**Frontend (VS Code)**:
1. Install "Debugger for Chrome" extension
2. Run frontend: `npm start`
3. F5 to launch debugger
4. Set breakpoints in TypeScript files

---

## Common Tasks

### Add a New Truck

```bash
curl -X POST http://localhost:8000/admin/v1/trucks \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "TRK-999",
    "licensePlate": "XYZ-5678",
    "driverName": "Jane Smith",
    "vehicleType": "VAN",
    "truckGroupId": "00000000-0000-0000-0000-000000000001"
  }'
```

### Send GPS Position (Manual)

```bash
curl -X POST http://localhost:8000/gps/v1/positions \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "00000000-0000-0000-0000-000000000003",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "speed": 45.3,
    "heading": 270,
    "timestamp": "2025-12-09T10:30:00Z"
  }'
```

### Query Truck Positions

```bash
# Get all trucks
curl http://localhost:8000/location/v1/trucks \
  -H "Authorization: Bearer <JWT_TOKEN>"

# Get truck history (last 24 hours)
curl "http://localhost:8000/location/v1/trucks/{truckId}/history?startTime=2025-12-08T00:00:00Z&endTime=2025-12-09T00:00:00Z" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### View Real-Time Updates (WebSocket)

```javascript
// In browser console at http://localhost:4200
const ws = new WebSocket('ws://localhost:8081/ws/locations');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

---

## Database Management

### Connect to PostgreSQL

```bash
docker exec -it postgres psql -U trucktrack -d trucktrack
```

**Useful queries**:

```sql
-- View all trucks
SELECT truck_id, driver_name, status, last_update FROM trucks;

-- View recent GPS positions
SELECT truck_id, latitude, longitude, speed, timestamp
FROM gps_positions
ORDER BY timestamp DESC
LIMIT 10;

-- Trucks within 10km of point (using PostGIS)
SELECT truck_id, driver_name,
  ST_Distance(
    ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
  ) / 1000 AS distance_km
FROM trucks
WHERE ST_DWithin(
  ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326)::geography,
  ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
  10000
)
ORDER BY distance_km;
```

### Reset Database

```bash
# Stop all services
docker-compose down -v

# Restart (this recreates database)
docker-compose up -d

# Re-run migrations
cd backend
mvn flyway:migrate -P local
```

---

## Troubleshooting

### Kafka connection refused

**Symptom**: `Connection to node -1 (localhost/127.0.0.1:9092) could not be established`

**Fix**:
```bash
# Check Kafka is running
docker ps | grep kafka

# If not running, restart
docker-compose up -d kafka

# Wait 30 seconds for Kafka to be ready
```

### PostgreSQL connection failed

**Symptom**: `PSQLException: Connection refused`

**Fix**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check port 5432 is not already in use
lsof -i :5432

# If another PostgreSQL instance is running, stop it or change port in docker-compose.yml
```

### Frontend build errors

**Symptom**: `Module not found` or `Cannot find module`

**Fix**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Tests fail with "Testcontainers timeout"

**Symptom**: Integration tests hang or timeout starting containers

**Fix**:
```bash
# Ensure Docker daemon is running
docker info

# Increase Docker memory allocation (Docker Desktop → Preferences → Resources → Memory → 4GB+)

# Pull required images manually
docker pull postgres:15
docker pull redis:7
docker pull confluentinc/cp-kafka:7.5.0
```

---

## Environment Variables

### Backend Services

All services use Spring Boot externalized configuration. Override via environment variables:

```bash
# Example: Change PostgreSQL connection
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/trucktrack
export SPRING_DATASOURCE_USERNAME=trucktrack
export SPRING_DATASOURCE_PASSWORD=changeme

# Example: Change Kafka broker
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Example: Change Redis host
export SPRING_DATA_REDIS_HOST=localhost
export SPRING_DATA_REDIS_PORT=6379
```

### Frontend

Edit `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8081/ws',
  mapboxAccessToken: 'YOUR_MAPBOX_TOKEN' // Optional: for Mapbox GL JS
};
```

---

## Next Steps

1. **Read the spec**: [spec.md](./spec.md) for feature requirements
2. **Review data model**: [data-model.md](./data-model.md) for entity relationships
3. **Check API contracts**: [contracts/](./contracts/) for OpenAPI specs
4. **Start implementing**: Use `/speckit.tasks` to generate task breakdown

---

## Useful Links

- **Kafka UI**: http://localhost:8080 (view topics, messages)
- **SonarQube**: http://localhost:9000 (code quality)
- **API Gateway**: http://localhost:8000/swagger-ui.html (API docs)
- **Angular Dev Server**: http://localhost:4200
- **PostgreSQL**: `localhost:5432` (user: `trucktrack`, db: `trucktrack`)
- **Redis**: `localhost:6379`

---

## Getting Help

- **Constitution**: See `.specify/memory/constitution.md` for project principles
- **Research**: See `research.md` for technology decisions and best practices
- **Issues**: File bugs/questions on GitHub Issues
- **Slack**: `#truck-track-dev` channel (if available)

Happy coding! 🚚📍
