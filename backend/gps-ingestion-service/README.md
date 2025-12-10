# GPS Ingestion Service

Microservice responsible for ingesting GPS position data from truck devices and publishing events to Kafka.

## Overview

The GPS Ingestion Service is the entry point for all GPS position data in the TruckTrack system. It receives GPS coordinates from truck tracking devices via REST API or WebSocket, validates the data, and publishes position events to Kafka for downstream processing.

## Technology Stack

- **Framework**: Spring Boot 3.2.x
- **Language**: Java 17
- **Message Broker**: Apache Kafka
- **API**: REST (Spring Web) + WebSocket (SockJS/STOMP)
- **Validation**: Jakarta Bean Validation
- **Build Tool**: Maven

## Architecture

```
Truck Devices → GPS Ingestion Service → Kafka (truck-track.gps.position) → Location Service
                                                                           → Notification Service
```

## Port

- Default Port: `8080`

## Dependencies

- Kafka Broker (localhost:29092)
- Shared Library (common DTOs and events)

## Getting Started

### Prerequisites

```bash
# Ensure Kafka is running
cd infra/docker
docker-compose up -d kafka

# Build shared library first
cd backend
mvn clean install -pl shared -am
```

### Build

```bash
cd backend/gps-ingestion-service
mvn clean install
```

### Run

```bash
mvn spring-boot:run

# Or with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Run with Docker

```bash
docker build -t truck-track-gps-ingestion:latest .
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:29092 \
  truck-track-gps-ingestion:latest
```

## Configuration

### Application Properties

Key configuration in `application.yml`:

```yaml
server:
  port: 8080

spring:
  kafka:
    bootstrap-servers: localhost:29092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      properties:
        spring.json.type.mapping: gpsPosition:com.trucktrack.common.event.GPSPositionEvent

  application:
    name: gps-ingestion-service

kafka:
  topics:
    gps-position: truck-track.gps.position
```

### Environment Variables

- `SPRING_PROFILES_ACTIVE` - Active Spring profile (dev, staging, prod)
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka broker addresses
- `SERVER_PORT` - HTTP server port (default: 8080)

## API Endpoints

### REST API

#### Ingest GPS Position

```http
POST /gps/ingest
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "altitude": 10.5,
  "speed": 55.0,
  "heading": 180,
  "timestamp": "2025-12-09T10:30:00Z"
}
```

**Response**: `202 Accepted`

```json
{
  "status": "accepted",
  "eventId": "evt_123456789",
  "timestamp": "2025-12-09T10:30:00.123Z"
}
```

#### Bulk Ingest GPS Positions

```http
POST /gps/ingest/bulk
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "positions": [
    {
      "truckId": "550e8400-e29b-41d4-a716-446655440000",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2025-12-09T10:30:00Z"
    },
    {
      "truckId": "550e8400-e29b-41d4-a716-446655440001",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "timestamp": "2025-12-09T10:30:01Z"
    }
  ]
}
```

**Response**: `202 Accepted`

```json
{
  "accepted": 2,
  "rejected": 0
}
```

#### Health Check

```http
GET /actuator/health
```

**Response**: `200 OK`

```json
{
  "status": "UP",
  "components": {
    "kafka": {
      "status": "UP"
    }
  }
}
```

### WebSocket API (To Be Implemented)

Connect to WebSocket for real-time GPS streaming:

```javascript
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
  stompClient.send("/app/gps/stream", {}, JSON.stringify({
    truckId: "truck-123",
    latitude: 40.7128,
    longitude: -74.0060,
    timestamp: new Date().toISOString()
  }));
});
```

## Kafka Events

### Published Events

#### GPSPositionEvent

**Topic**: `truck-track.gps.position`

**Schema**:
```json
{
  "eventId": "evt_123456789",
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "truckIdReadable": "TRUCK-001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "altitude": 10.5,
  "speed": 55.0,
  "heading": 180,
  "timestamp": "2025-12-09T10:30:00Z"
}
```

**Partitioning**: Keyed by `truckId` to ensure ordered processing per truck

## Validation Rules

GPS position data is validated before publishing to Kafka:

- `truckId`: Required, must be valid UUID
- `latitude`: Required, must be between -90 and 90
- `longitude`: Required, must be between -180 and 180
- `altitude`: Optional, if provided must be >= 0
- `speed`: Optional, if provided must be >= 0
- `heading`: Optional, if provided must be between 0 and 359
- `timestamp`: Required, must not be in the future

## Error Handling

### Error Response Format

```json
{
  "timestamp": "2025-12-09T10:30:00.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/gps/ingest",
  "errors": {
    "latitude": "must be between -90 and 90",
    "truckId": "must be a valid UUID"
  }
}
```

### HTTP Status Codes

- `202 Accepted` - GPS data accepted and queued for processing
- `400 Bad Request` - Invalid GPS data (validation errors)
- `401 Unauthorized` - Missing or invalid JWT token
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Kafka unavailable

## Performance Considerations

### Rate Limiting

- Default: 1000 requests per minute per truck
- Configurable via `application.yml`

### Batch Processing

- Bulk ingestion endpoint processes up to 1000 positions per request
- Positions are published to Kafka in batches for efficiency

### Kafka Producer Configuration

```yaml
spring:
  kafka:
    producer:
      batch-size: 16384
      linger-ms: 10
      buffer-memory: 33554432
      compression-type: snappy
      acks: 1  # Balance between performance and durability
```

## Monitoring

### Metrics

Available at `/actuator/metrics`:

- `gps.ingestion.received` - Total GPS positions received
- `gps.ingestion.published` - Total events published to Kafka
- `gps.ingestion.failed` - Total failed ingestions
- `gps.ingestion.latency` - Processing latency histogram

### Logging

Structured JSON logging configured via Logback:

```json
{
  "timestamp": "2025-12-09T10:30:00.123Z",
  "level": "INFO",
  "logger": "com.trucktrack.gps.service.GPSIngestionService",
  "message": "GPS position ingested",
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "eventId": "evt_123456789"
}
```

## Testing

### Unit Tests

```bash
mvn test
```

### Integration Tests

```bash
# Start Kafka first
cd infra/docker
docker-compose up -d kafka

# Run integration tests
cd backend/gps-ingestion-service
mvn verify
```

### Manual Testing with curl

```bash
# Get JWT token first
TOKEN=$(curl -X POST http://localhost:8083/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Ingest GPS position
curl -X POST http://localhost:8080/gps/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "truckId": "550e8400-e29b-41d4-a716-446655440000",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "speed": 55.0,
    "heading": 180,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

## Security

### Authentication

- All endpoints except `/actuator/health` require JWT authentication
- JWT token validated by API Gateway
- User context propagated via `X-User-Id` header

### Data Privacy

- GPS positions contain sensitive location data
- Consider encryption at rest and in transit for production
- Implement data retention policies

## Deployment

### Docker Build

```bash
mvn clean package
docker build -t truck-track-gps-ingestion:1.0.0 .
```

### Environment-Specific Configuration

Create `application-{profile}.yml` for each environment:

- `application-dev.yml` - Development (local Kafka)
- `application-staging.yml` - Staging environment
- `application-prod.yml` - Production environment

## Troubleshooting

### Kafka Connection Issues

**Problem**: Cannot connect to Kafka broker

**Solution**:
```bash
# Check Kafka is running
docker ps | grep kafka

# Check Kafka logs
docker logs kafka

# Test Kafka connectivity
docker exec -it kafka kafka-broker-api-versions --bootstrap-server localhost:29092
```

### Events Not Published

**Problem**: GPS data accepted but not appearing in Kafka

**Solution**:
- Check application logs for producer errors
- Verify topic exists: `docker exec -it kafka kafka-topics --bootstrap-server localhost:29092 --list`
- Check Kafka UI at http://localhost:8081

### High Latency

**Problem**: Slow GPS ingestion processing

**Solution**:
- Increase Kafka producer batch size
- Enable compression (snappy or lz4)
- Reduce producer `linger.ms` for lower latency
- Scale horizontally with multiple service instances

## Related Services

- **Location Service** - Consumes GPS events and stores positions
- **Notification Service** - Consumes GPS events for alert processing
- **API Gateway** - Routes requests and handles JWT authentication
- **Auth Service** - Issues JWT tokens

## License

Proprietary - TruckTrack System
