# Location Service

Service central de gestion des positions, trajets et données géographiques.

Consomme les événements GPS depuis Kafka, stocke les positions dans PostgreSQL/PostGIS, maintient un cache Redis pour les positions courantes, et diffuse les mises à jour en temps réel via WebSocket. Gère également les geofences avec des requêtes spatiales (ST_Contains, ST_Distance) et le système de gestion des trajets.

**Port:** 8081

## API - Trucks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /location/v1/trucks | List all trucks |
| GET | /location/v1/trucks/{id} | Truck details |
| GET | /location/v1/trucks/{id}/current | Current position |
| GET | /location/v1/trucks/{id}/history | Position history |
| GET | /location/v1/trucks/history/paged | Paginated history (infinite scroll) |
| GET | /location/v1/trucks/my-truck | Get driver's assigned truck |
| PATCH | /location/v1/trucks/{id}/status | Update truck status |

## API - Trips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /location/v1/trips | List all trips (admin) |
| GET | /location/v1/trips/{id} | Trip details |
| POST | /location/v1/trips | Create new trip |
| PUT | /location/v1/trips/{id} | Update trip |
| DELETE | /location/v1/trips/{id} | Delete trip |
| POST | /location/v1/trips/{id}/assign | Assign truck & driver |
| POST | /location/v1/trips/{id}/start | Start trip (driver) |
| POST | /location/v1/trips/{id}/complete | Complete trip (driver) |
| GET | /location/v1/trips/my | Driver's trips |
| GET | /location/v1/trips/my/active | Driver's active trips |
| GET | /location/v1/trips/{id}/history | Trip status history |
| GET | /location/v1/trips/analytics | Trip statistics |

## API - Geofences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /location/v1/geofences | List geofences |
| POST | /location/v1/geofences | Create geofence |

## WebSocket

| Endpoint | Description |
|----------|-------------|
| WS /ws/locations | Live position updates |

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

**Tables:** `trucks`, `gps_positions`, `geofences`, `users`, `trips`, `trip_status_history`

### Trip Entity
- **Coordinates**: origin_lat/lng, destination_lat/lng (BigDecimal for precision)
- **Status**: PENDING → ASSIGNED → IN_PROGRESS → COMPLETED/CANCELLED
- **Relations**: assigned_truck_id, assigned_driver_id, created_by

## Cache

Redis for current positions (5min TTL).

**Key pattern:** `truck:position:{truckId}`

## WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8081/ws/locations');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```
