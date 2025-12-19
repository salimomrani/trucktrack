# Truck Track - GPS Fleet Tracking System

Real-time GPS tracking for fleet management with live maps, historical routes, and alerts.

## Quick Start

```bash
# 1. Start Docker
open -a Docker  # macOS

# 2. Start backend services
./start-all.sh

# 3. Start frontend (separate terminal)
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
