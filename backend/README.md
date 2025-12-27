# TruckTrack Backend

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=salimomrani_trucktrack&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=salimomrani_trucktrack)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=salimomrani_trucktrack&metric=coverage)](https://sonarcloud.io/summary/new_code?id=salimomrani_trucktrack)

Backend microservices en Java 17 / Spring Boot 3.2 pour le système de suivi GPS.

## Architecture

```
                    ┌─────────────────┐              ┌─────────────────┐
                    │   Frontend      │              │  Mobile App     │
                    │   Angular       │              │  React Native   │
                    └────────┬────────┘              └────────┬────────┘
                             │ HTTP                           │ REST/GPS
                             └───────────────┬────────────────┘
                                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway :8000                                 │
│                    (JWT validation, routing, CORS)                         │
└───────┬───────────────────┬───────────────────┬───────────────────┬───────┘
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │ GPS Ingestion │   │   Location    │   │ Notification  │
│    :8083      │   │    :8080      │   │   Service     │   │   Service     │
│               │   │               │   │    :8081      │   │    :8082      │
│ - Login       │   │ - Validation  │   │ - CRUD trucks │   │ - Alert rules │
│ - JWT tokens  │   │ - Publish GPS │   │ - History     │   │ - Evaluation  │
│ - Users CRUD  │   │               │   │ - Geofences   │   │ - WebSocket   │
└───────────────┘   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
                            │                   │                   │
                            │ produce           │ consume           │ consume
                            ▼                   ▼                   ▼
                    ┌─────────────────────────────────────────────────────┐
                    │                    KAFKA :9092                       │
                    │                                                      │
                    │  truck-track.gps.position      (GPS events)         │
                    │  truck-track.location.status   (Status changes)     │
                    │  truck-track.notification.alert (Alerts)            │
                    └─────────────────────────────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
            ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
            │  PostgreSQL   │        │     Redis     │        │    Jaeger     │
            │    :5432      │        │    :6379      │        │   :16686      │
            │               │        │               │        │               │
            │ + PostGIS     │        │ Cache positions│       │ Tracing       │
            │ Spatial queries│       │ TTL 5min      │        │               │
            └───────────────┘        └───────────────┘        └───────────────┘
```

## Flux de données

### 1. Ingestion GPS
```
Truck Device → GPS Ingestion → Kafka → Location Service → PostgreSQL
                    │                        │
                    │                        └→ Redis (cache)
                    │                        └→ WebSocket (frontend)
                    │
                    └────────────→ Kafka → Notification Service → Alertes
```

### 2. Pourquoi Kafka ?

| Problème | Solution Kafka |
|----------|----------------|
| Pics de trafic GPS | Buffer les messages, consommation à son rythme |
| Couplage fort entre services | Découplage total via topics |
| Perte de données si service down | Persistence des messages, replay possible |
| Scaling | Partitionnement par truckId, consumers parallèles |

### 3. Partitionnement Kafka

Les messages GPS sont partitionnés par `truckId` :
- Garantit l'ordre des positions pour un même camion
- Permet de scaler les consumers horizontalement
- Un camion = toujours la même partition

## Services

| Service | Port | Rôle | Dépendances |
|---------|------|------|-------------|
| **api-gateway** | 8000 | Point d'entrée, JWT validation, routing | auth-service |
| **auth-service** | 8083 | Authentification, gestion users | PostgreSQL |
| **gps-ingestion-service** | 8080 | Réception GPS, validation, publish Kafka | Kafka |
| **location-service** | 8081 | Stockage positions, history, geofences, WebSocket | Kafka, PostgreSQL, Redis |
| **notification-service** | 8082 | Règles d'alerte, notifications temps réel | Kafka, PostgreSQL |
| **shared** | - | DTOs, events, exceptions partagés | - |

## Quick Start

```bash
# 1. Infrastructure (Kafka, PostgreSQL, Redis)
cd infra/docker && docker-compose up -d

# 2. Build tous les services
cd backend && mvn clean install -DskipTests

# 3. Migrations base de données
mvn flyway:migrate -P local

# 4. Lancer un service
cd backend/location-service && mvn spring-boot:run

# Ou tout lancer d'un coup (depuis la racine)
./start-all.sh
```

## Kafka Topics

| Topic | Producteur | Consommateurs | Partitions |
|-------|------------|---------------|------------|
| `truck-track.gps.position` | gps-ingestion | location, notification | 10 |
| `truck-track.location.status-change` | location | notification | 5 |
| `truck-track.notification.alert` | notification | - | 3 |

**Format des messages :**

```json
// truck-track.gps.position
{
  "truckId": "uuid",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "speed": 65.5,
  "heading": 180,
  "timestamp": "2025-12-19T10:30:00Z"
}
```

## Base de données

PostgreSQL avec extension **PostGIS** pour les requêtes spatiales.

**Tables principales :**
- `trucks` - Informations camions
- `gps_positions` - Historique positions (partitionné par mois)
- `geofences` - Zones géographiques (polygones)
- `users` - Utilisateurs et rôles
- `alert_rules` - Règles d'alertes configurées
- `notifications` - Historique des alertes

**Requêtes spatiales utilisées :**
```sql
-- Camions dans un geofence
SELECT * FROM trucks WHERE ST_Contains(geofence.zone, truck.position);

-- Camions dans un rayon de 5km
SELECT * FROM trucks WHERE ST_DWithin(position, point, 5000);
```

## API Endpoints

### Auth Service (:8083)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/v1/login` | Login, retourne JWT |
| POST | `/auth/v1/refresh` | Refresh token |
| POST | `/auth/v1/register` | Inscription |
| GET | `/auth/v1/me` | User courant |

### Location Service (:8081)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/location/v1/trucks` | Liste des camions |
| GET | `/location/v1/trucks/{id}` | Détail camion |
| GET | `/location/v1/trucks/{id}/history` | Historique positions |
| GET | `/location/v1/geofences` | Liste geofences |
| POST | `/location/v1/geofences` | Créer geofence |
| WS | `/ws/locations` | WebSocket positions live |

### Notification Service (:8082)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notification/v1/notifications` | Liste notifications |
| GET | `/notification/v1/alert-rules` | Liste règles |
| POST | `/notification/v1/alert-rules` | Créer règle |
| WS | `/ws/notifications` | WebSocket alertes live |

### Mobile Driver API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drivers/me` | Profil chauffeur connecté |
| GET | `/drivers/me/status` | Statut actuel (AVAILABLE, IN_DELIVERY, etc.) |
| PUT | `/drivers/me/status` | Mettre à jour le statut |
| GET | `/drivers/me/trips` | Trajets assignés au chauffeur |
| PUT | `/trips/{id}/status` | Mettre à jour statut d'un trajet |
| GET | `/drivers/me/messages` | Messages du chauffeur |
| POST | `/drivers/me/messages` | Envoyer message au dispatch |
| POST | `/locations` | Envoyer position GPS (background) |
| POST | `/devices/register` | Enregistrer device FCM token |

## Monitoring

| Outil | URL | Usage |
|-------|-----|-------|
| Prometheus | http://localhost:9090 | Métriques |
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |
| Jaeger | http://localhost:16686 | Distributed tracing |
| Kafka UI | http://localhost:8088 | Topics, messages, consumers |

**Health check :**
```bash
curl http://localhost:8081/actuator/health
```

## Sécurité

### Authentification Controllers

Tous les controllers utilisent `@AuthenticationPrincipal GatewayUserPrincipal` pour récupérer le contexte utilisateur:

```java
@GetMapping("/example")
public ResponseEntity<?> example(
    @AuthenticationPrincipal GatewayUserPrincipal principal) {

    String userId = principal.userId();
    String username = principal.username();
    String role = principal.role();
    String groups = principal.groups();
}
```

### Communication Inter-Services

Les services communiquent entre eux **exclusivement via l'API Gateway**:

```
notification-service → API Gateway (JWT) → location-service
```

**Configuration:**
```yaml
gateway:
  url: ${GATEWAY_URL:http://localhost:8000}
  service-token: ${SERVICE_ACCOUNT_JWT:}
```

**Générer un token service:**
```bash
curl -X POST "http://localhost:8000/admin/users/service-token?serviceName=my-service" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Rate Limiting

L'endpoint `/auth/v1/login` est protégé contre les attaques brute-force:
- 5 tentatives max par 15 minutes (par IP)
- Lockout de 15 minutes après dépassement

## Tests

```bash
mvn test           # Tests unitaires
mvn verify         # Tests d'intégration
```

## Development Credentials

Test user accounts are documented in `DEVELOPMENT.md` (git-ignored for security).

| Role | Email | Description |
|------|-------|-------------|
| ADMIN | sysadmin@trucktrack.com | Full system access |
| FLEET_MANAGER | fleetmanager@trucktrack.com | Fleet management access |
| DISPATCHER | dispatcher@trucktrack.com | Dispatch operations |
| DRIVER | driver@trucktrack.com | Driver mobile app |
| VIEWER | viewer@trucktrack.com | Read-only access |
