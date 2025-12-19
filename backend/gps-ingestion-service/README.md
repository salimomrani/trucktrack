# GPS Ingestion Service

Ingests GPS positions from trucks and publishes to Kafka.

**Port:** 8080

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /gps/v1/position | Ingest single position |
| POST | /gps/v1/positions | Bulk ingest |

## Quick Start

```bash
cd backend/gps-ingestion-service
mvn spring-boot:run
```

## Kafka

**Produces to:** `truck-track.gps.position`

```json
{
  "truckId": "uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "speed": 55.0,
  "heading": 180,
  "timestamp": "2025-12-19T10:30:00Z"
}
```

## Validation

- `latitude`: -90 to 90
- `longitude`: -180 to 180
- `speed`: >= 0
- `heading`: 0 to 359
- `timestamp`: not in future

## Testing

```bash
curl -X POST http://localhost:8080/gps/v1/position \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"truckId":"uuid","latitude":40.7128,"longitude":-74.006,"timestamp":"2025-12-19T10:30:00Z"}'
```
