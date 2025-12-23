# Notification Service

Moteur d'alertes et système de notifications.

Évalue les règles d'alerte sur chaque position GPS reçue : dépassement de vitesse, entrée/sortie de geofence, camion offline ou idle. Les alertes déclenchées sont persistées et diffusées en temps réel via WebSocket. Un système de cooldown évite le spam de notifications.

**Port:** 8082

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notification/v1/notifications | List notifications |
| GET | /notification/v1/alert-rules | List rules |
| POST | /notification/v1/alert-rules | Create rule |
| PUT | /notification/v1/alert-rules/{id} | Update rule |
| DELETE | /notification/v1/alert-rules/{id} | Delete rule |
| WS | /ws/notifications | Real-time alerts |

## Quick Start

```bash
cd backend/notification-service
mvn spring-boot:run
```

## Alert Types

| Type | Trigger |
|------|---------|
| SPEED_LIMIT | Speed exceeds threshold |
| GEOFENCE_ENTER | Truck enters geofence |
| GEOFENCE_EXIT | Truck exits geofence |
| OFFLINE | No GPS data for X minutes |
| IDLE | Speed = 0 for X minutes |

## Kafka

- **Consumes:** `truck-track.gps.position`, `truck-track.location.status-change`
- **Produces:** `truck-track.notification.alert`

## Configuration

```yaml
alert:
  offline-threshold-minutes: 5
  default-speed-limit: 120
  cooldown-minutes: 5  # Prevents alert spam

# Inter-service communication via API Gateway
gateway:
  url: ${GATEWAY_URL:http://localhost:8000}
  service-token: ${SERVICE_ACCOUNT_JWT:}  # Required for geofence checks
  timeout: 5000
```

## Communication Inter-Services

Ce service appelle le **location-service** via l'API Gateway pour vérifier les geofences:

```
notification-service → API Gateway → location-service
                         ↑
                    JWT Service Account
```

**Configuration requise:**
```bash
# Generate service token (une seule fois, via admin)
curl -X POST "http://localhost:8000/admin/users/service-token?serviceName=notification-service" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Set in environment
export SERVICE_ACCOUNT_JWT=<token>
```

## WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8082/ws/notifications');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```
