# Truck Track - GPS Fleet Tracking System

Système de suivi GPS en temps réel pour la gestion de flottes de camions.

**Fonctionnalités principales :**
- Carte temps réel avec positions GPS live (WebSocket)
- Historique des trajets avec playback
- Geofences (zones géographiques) avec alertes entrée/sortie
- Alertes configurables (vitesse, offline, idle)
- Dashboard de monitoring (Prometheus/Grafana)

## Prérequis

| Outil | Version | Installation |
|-------|---------|--------------|
| Docker Desktop | 4.x+ | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| Java JDK | 17+ | `brew install openjdk@17` (macOS) |
| Maven | 3.9+ | `brew install maven` (macOS) |
| Node.js | 18+ | `brew install node` (macOS) |

**Vérifier l'installation :**
```bash
docker --version    # Docker version 24.x+
java -version       # openjdk 17.x+
mvn -version        # Apache Maven 3.9+
node --version      # v18.x+
```

## Quick Start

```bash
# 1. Start Docker
open -a Docker  # macOS (attendre que Docker soit prêt)

# 2. Start backend (infrastructure + services)
./start-all.sh

# 3. Start frontend (nouveau terminal)
cd frontend && npm install && npm start
```

**Access:**
- Frontend: http://localhost:4200
- API Gateway: http://localhost:8000
- Login: `admin@trucktrack.com` / `AdminPass123!`

**Management:**
```bash
./stop-all.sh   # Stop backend
./status.sh     # Check status
```

## Architecture

```
Frontend :4200 → API Gateway :8000 → Microservices
                                    ├── Auth :8083
                                    ├── GPS Ingestion :8080 → Kafka :9092
                                    ├── Location :8081 → PostgreSQL :5432
                                    └── Notification :8082    Redis :6379
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 4200 | Angular 17 UI |
| API Gateway | 8000 | Routing, auth |
| Auth | 8083 | JWT authentication |
| GPS Ingestion | 8080 | GPS data intake |
| Location | 8081 | Positions, WebSocket |
| Notification | 8082 | Alerts |

## Monitoring

| Tool | URL | Credentials |
|------|-----|-------------|
| Grafana | http://localhost:3000 | admin / admin |
| Prometheus | http://localhost:9090 | - |
| Jaeger | http://localhost:16686 | - |

## Development

```bash
# Manual start
cd infra/docker && docker-compose up -d
cd backend && mvn flyway:migrate -P local
cd backend/<service> && mvn spring-boot:run
cd frontend && npm install && npm start

# Tests
cd backend && mvn test
cd frontend && npm test
```

## Logs

```bash
tail -f logs/*.log              # All services
tail -f logs/location.log       # Specific service
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Docker not running | `open -a Docker` |
| Port in use | `lsof -i :8080` then `kill -9 <PID>` |
| Services won't start | `./stop-all.sh && ./start-all.sh --build` |

## Documentation

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [Architecture](docs/ARCHITECTURE.md)
