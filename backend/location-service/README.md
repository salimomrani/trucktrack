# Location Service

Core microservice for managing truck locations, geofences, and providing location-based queries with PostGIS.

## Overview

The Location Service is the central data store and query engine for all location-related functionality. It consumes GPS position events from Kafka, stores them in a PostgreSQL database with PostGIS extensions, maintains current truck positions in Redis cache, and provides REST APIs for querying locations, managing geofences, and retrieving historical routes.

## Technology Stack

- **Framework**: Spring Boot 3.2.x
- **Language**: Java 17
- **Database**: PostgreSQL 15 with PostGIS 3.4
- **Cache**: Redis 7
- **Message Broker**: Apache Kafka
- **ORM**: Spring Data JPA / Hibernate
- **Migration**: Flyway
- **Build Tool**: Maven

## Architecture

```
Kafka (gps.position) → Location Service → PostgreSQL + PostGIS
                                       ↓
                                    Redis Cache
                                       ↓
                               REST API Consumers
```

## Port

- Default Port: `8081`

## Dependencies

- PostgreSQL with PostGIS (localhost:5432)
- Redis (localhost:6379)
- Kafka Broker (localhost:29092)
- Shared Library (common DTOs and events)

## Getting Started

### Prerequisites

```bash
# Ensure infrastructure is running
cd infra/docker
docker-compose up -d postgres redis kafka

# Build shared library first
cd backend
mvn clean install -pl shared -am
```

### Database Setup

Database schema is automatically created and migrated using Flyway on application startup.

**Manual migration** (if needed):
```bash
cd backend/location-service
mvn flyway:migrate
```

### Build

```bash
cd backend/location-service
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
docker build -t truck-track-location:latest .
docker run -p 8081:8081 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/trucktrack \
  -e SPRING_DATA_REDIS_HOST=redis \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:29092 \
  truck-track-location:latest
```

## Configuration

### Application Properties

Key configuration in `application.yml`:

```yaml
server:
  port: 8081

spring:
  application:
    name: location-service

  datasource:
    url: jdbc:postgresql://localhost:5432/trucktrack
    username: trucktrack_user
    password: trucktrack_pass
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema
    properties:
      hibernate:
        dialect: org.hibernate.spatial.dialect.postgis.PostgisPG95Dialect

  data:
    redis:
      host: localhost
      port: 6379

  kafka:
    bootstrap-servers: localhost:29092
    consumer:
      group-id: location-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: com.trucktrack.common.event

kafka:
  topics:
    gps-position: truck-track.gps.position
    status-change: truck-track.location.status-change
```

### Environment Variables

- `SPRING_PROFILES_ACTIVE` - Active Spring profile (dev, staging, prod)
- `SPRING_DATASOURCE_URL` - PostgreSQL connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `SPRING_DATA_REDIS_HOST` - Redis host
- `SPRING_DATA_REDIS_PORT` - Redis port
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka broker addresses

## Database Schema

### Tables

#### trucks
- `truck_id` (UUID, PK) - Unique truck identifier
- `truck_id_readable` (VARCHAR) - Human-readable ID (e.g., TRUCK-001)
- `license_plate` (VARCHAR) - Truck license plate
- `driver_name` (VARCHAR) - Current driver name
- `status` (ENUM) - Current status (ACTIVE, IDLE, OFFLINE)
- `last_seen` (TIMESTAMP) - Last GPS position timestamp

#### gps_positions (Partitioned by timestamp)
- `position_id` (UUID, PK) - Unique position identifier
- `truck_id` (UUID, FK) - Reference to trucks table
- `location` (GEOMETRY(Point, 4326)) - PostGIS point (lat, lng)
- `altitude` (DOUBLE) - Altitude in meters
- `speed` (DOUBLE) - Speed in km/h
- `heading` (INTEGER) - Direction in degrees (0-359)
- `timestamp` (TIMESTAMP) - GPS timestamp
- `created_at` (TIMESTAMP) - Record creation time

**Partitioning Strategy**: Monthly partitions for efficient historical queries

#### geofences
- `geofence_id` (UUID, PK) - Unique geofence identifier
- `name` (VARCHAR) - Geofence name
- `zone` (GEOMETRY) - PostGIS polygon or circle
- `zone_type` (ENUM) - ENTRY_ALERT, EXIT_ALERT, ENTRY_EXIT_ALERT
- `created_at` (TIMESTAMP) - Creation timestamp

#### truck_groups
- `group_id` (UUID, PK) - Unique group identifier
- `name` (VARCHAR) - Group name
- `description` (TEXT) - Group description

#### user_truck_groups
- Junction table for user-group-truck relationships
- Manages which users can see which trucks

### Indexes

```sql
-- Spatial index on gps_positions
CREATE INDEX idx_gps_positions_location ON gps_positions USING GIST (location);

-- Time-based queries
CREATE INDEX idx_gps_positions_timestamp ON gps_positions (timestamp DESC);
CREATE INDEX idx_gps_positions_truck_timestamp ON gps_positions (truck_id, timestamp DESC);

-- Geofence spatial index
CREATE INDEX idx_geofences_zone ON geofences USING GIST (zone);
```

## API Endpoints

### Truck Management

#### Get All Trucks

```http
GET /location/trucks
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `status` - Filter by status (ACTIVE, IDLE, OFFLINE)
- `groupId` - Filter by truck group

**Response**: `200 OK`

```json
{
  "trucks": [
    {
      "truckId": "550e8400-e29b-41d4-a716-446655440000",
      "truckIdReadable": "TRUCK-001",
      "licensePlate": "ABC-123",
      "driverName": "John Doe",
      "status": "ACTIVE",
      "lastSeen": "2025-12-09T10:30:00Z",
      "currentPosition": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "speed": 55.0,
        "heading": 180
      }
    }
  ]
}
```

#### Get Truck Details

```http
GET /location/trucks/{truckId}
Authorization: Bearer {jwt_token}
```

**Response**: `200 OK`

```json
{
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "truckIdReadable": "TRUCK-001",
  "licensePlate": "ABC-123",
  "driverName": "John Doe",
  "status": "ACTIVE",
  "lastSeen": "2025-12-09T10:30:00Z",
  "currentPosition": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "altitude": 10.5,
    "speed": 55.0,
    "heading": 180
  }
}
```

### Position Queries

#### Get Current Position

```http
GET /location/trucks/{truckId}/current
Authorization: Bearer {jwt_token}
```

Retrieves current position from Redis cache (falls back to database).

**Response**: `200 OK`

```json
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

#### Get Position History

```http
GET /location/trucks/{truckId}/history
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `startTime` (required) - ISO 8601 timestamp
- `endTime` (required) - ISO 8601 timestamp
- `limit` (optional) - Max records to return (default: 1000)

**Response**: `200 OK`

```json
{
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "positions": [
    {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "altitude": 10.5,
      "speed": 55.0,
      "heading": 180,
      "timestamp": "2025-12-09T10:30:00Z"
    }
  ],
  "count": 1,
  "hasMore": false
}
```

#### Get Trucks Within Bounds

```http
GET /location/trucks/within-bounds
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `minLat` - Minimum latitude
- `maxLat` - Maximum latitude
- `minLng` - Minimum longitude
- `maxLng` - Maximum longitude

Returns all trucks currently within the specified bounding box.

### Geofence Management

#### Create Geofence

```http
POST /location/geofences
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Warehouse District",
  "zoneType": "ENTRY_EXIT_ALERT",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-74.0060, 40.7128],
        [-74.0050, 40.7128],
        [-74.0050, 40.7138],
        [-74.0060, 40.7138],
        [-74.0060, 40.7128]
      ]
    ]
  }
}
```

**Response**: `201 Created`

```json
{
  "geofenceId": "650e8400-e29b-41d4-a716-446655440000",
  "name": "Warehouse District",
  "zoneType": "ENTRY_EXIT_ALERT",
  "createdAt": "2025-12-09T10:30:00Z"
}
```

#### List Geofences

```http
GET /location/geofences
Authorization: Bearer {jwt_token}
```

#### Delete Geofence

```http
DELETE /location/geofences/{geofenceId}
Authorization: Bearer {jwt_token}
```

#### Check Truck in Geofence

```http
GET /location/geofences/{geofenceId}/trucks
Authorization: Bearer {jwt_token}
```

Returns all trucks currently inside the specified geofence using PostGIS `ST_Contains`.

## Kafka Integration

### Consumed Events

#### GPSPositionEvent

**Topic**: `truck-track.gps.position`

**Handler**: `GPSPositionConsumer.java`

**Processing**:
1. Deserialize GPS position event
2. Update truck's last_seen and status
3. Insert position into gps_positions table
4. Update current position in Redis with 5-minute TTL
5. Check geofence boundaries (PostGIS spatial query)
6. Publish TruckStatusChangeEvent if status changed

### Published Events

#### TruckStatusChangeEvent

**Topic**: `truck-track.location.status-change`

**Published when**: Truck status changes (e.g., ACTIVE → IDLE)

**Schema**:
```json
{
  "eventId": "evt_status_123",
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "previousStatus": "ACTIVE",
  "newStatus": "IDLE",
  "timestamp": "2025-12-09T10:30:00Z"
}
```

## Redis Caching

### Current Positions Cache

- **Key Pattern**: `truck:position:{truckId}`
- **TTL**: 5 minutes
- **Value**: JSON serialized GPSPositionEvent

### Cache Strategy

- **Write-Through**: Update cache on every GPS position event
- **Read-Through**: If cache miss, query database and populate cache
- **Eviction**: Automatic TTL-based eviction for offline trucks

## PostGIS Spatial Queries

### Examples

#### Find Trucks Within Geofence

```sql
SELECT t.truck_id, t.truck_id_readable
FROM trucks t
JOIN gps_positions gp ON gp.truck_id = t.truck_id
JOIN geofences g ON ST_Contains(g.zone, gp.location)
WHERE g.geofence_id = ?
  AND gp.timestamp = (
    SELECT MAX(timestamp)
    FROM gps_positions
    WHERE truck_id = t.truck_id
  );
```

#### Find Trucks Near Location

```sql
SELECT t.truck_id, t.truck_id_readable,
       ST_Distance(gp.location::geography, ST_MakePoint(?, ?)::geography) as distance_meters
FROM trucks t
JOIN gps_positions gp ON gp.truck_id = t.truck_id
WHERE ST_DWithin(gp.location::geography, ST_MakePoint(?, ?)::geography, 5000)
  AND gp.timestamp = (
    SELECT MAX(timestamp)
    FROM gps_positions
    WHERE truck_id = t.truck_id
  )
ORDER BY distance_meters;
```

## Performance Optimization

### Database Partitioning

The `gps_positions` table is partitioned monthly:

```sql
-- Partition for December 2025
CREATE TABLE gps_positions_2025_12 PARTITION OF gps_positions
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

**Benefits**:
- Faster queries on recent data
- Easier archival of old data
- Improved maintenance operations

### Caching Strategy

- Current positions cached in Redis for sub-millisecond reads
- Truck lists cached with 1-minute TTL
- Geofence data cached (infrequently changed)

### Query Optimization

- Spatial indexes on all geometry columns
- Composite indexes on (truck_id, timestamp)
- Materialized views for dashboard queries (to be implemented)

## Monitoring & Observability

### Metrics

Available at `/actuator/metrics` and `/actuator/prometheus`:

- `location.positions.stored` - Total positions stored
- `location.cache.hits` - Redis cache hit rate
- `location.cache.misses` - Redis cache miss rate
- `location.geofence.checks` - Geofence boundary checks performed
- `location.query.latency` - Database query latency
- `http_server_requests_seconds` - HTTP request metrics
- `kafka_consumer_*` - Kafka consumer metrics

### Distributed Tracing

OpenTelemetry tracing is enabled via Micrometer Tracing Bridge:
- HTTP requests traced automatically
- Kafka consumer messages include trace context
- Database queries traced
- Redis operations traced
- Traces exported to Jaeger at http://localhost:16686

### Monitoring Stack

| Tool | URL | Description |
|------|-----|-------------|
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |
| Jaeger | http://localhost:16686 | Distributed tracing |

### Logging

Structured logging with trace correlation (traceId, spanId):
- GPS position processing
- Status changes
- Geofence entry/exit events
- Cache operations

Log format: `[timestamp] [thread] [traceId,spanId] LEVEL logger - message`

## Testing

### Unit Tests

```bash
mvn test
```

### Integration Tests

```bash
# Start infrastructure
cd infra/docker
docker-compose up -d postgres redis kafka

# Run integration tests
cd backend/location-service
mvn verify
```

### Manual Testing

```bash
# Get JWT token
TOKEN=$(curl -X POST http://localhost:8083/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Get all trucks
curl http://localhost:8081/location/trucks \
  -H "Authorization: Bearer $TOKEN" | jq

# Get truck history
curl "http://localhost:8081/location/trucks/550e8400-e29b-41d4-a716-446655440000/history?startTime=2025-12-01T00:00:00Z&endTime=2025-12-09T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check PostGIS extension
docker exec -it postgres psql -U trucktrack_user -d trucktrack -c "SELECT PostGIS_Version();"
```

### Flyway Migration Failures

```bash
# Check migration history
docker exec -it postgres psql -U trucktrack_user -d trucktrack -c "SELECT * FROM flyway_schema_history;"

# Repair failed migration
mvn flyway:repair
```

### Redis Connection Issues

```bash
# Check Redis is running
docker exec -it redis redis-cli ping

# Inspect cached keys
docker exec -it redis redis-cli keys "truck:position:*"
```

### Kafka Consumer Lag

```bash
# Check consumer group lag
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:29092 \
  --group location-service \
  --describe
```

## Data Retention

### Position Data

Recommended retention policy:
- **Hot data** (last 7 days): Keep in main partition with Redis cache
- **Warm data** (7-90 days): Keep in monthly partitions
- **Cold data** (90+ days): Archive to object storage, drop partitions

### Implementation

```sql
-- Archive and drop old partition
INSERT INTO archive.gps_positions_2024_01
SELECT * FROM gps_positions_2024_01;

DROP TABLE gps_positions_2024_01;
```

## Related Services

- **GPS Ingestion Service** - Publishes GPS events consumed by this service
- **Notification Service** - Consumes status change events for alert processing
- **API Gateway** - Routes location API requests
- **Auth Service** - Provides user authentication

## License

Proprietary - TruckTrack System
