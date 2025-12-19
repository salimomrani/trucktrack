# Location Service

Service central de gestion des positions et données géographiques.

Consomme les événements GPS depuis Kafka, stocke les positions dans PostgreSQL/PostGIS, maintient un cache Redis pour les positions courantes, et diffuse les mises à jour en temps réel via WebSocket. Gère également les geofences avec des requêtes spatiales (ST_Contains, ST_Distance).

**Port:** 8081

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /location/v1/trucks | List all trucks |
| GET | /location/v1/trucks/{id} | Truck details |
| GET | /location/v1/trucks/{id}/current | Current position |
| GET | /location/v1/trucks/{id}/history | Position history |
| GET | /location/v1/geofences | List geofences |
| POST | /location/v1/geofences | Create geofence |
| WS | /ws/locations | Live position updates |

## Quick Start

```bash
cd backend/location-service
mvn spring-boot:run
```

## Kafka

- **Consumes:** `truck-track.gps.position`
- **Produces:** `truck-track.location.status-change`

## Database

PostgreSQL + PostGIS for spatial queries.

**Tables:** `trucks`, `gps_positions`, `geofences`, `users`

## Cache

Redis for current positions (5min TTL).

**Key pattern:** `truck:position:{truckId}`

## WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8081/ws/locations');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```
