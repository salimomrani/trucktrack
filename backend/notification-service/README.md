# Notification Service

Microservice responsible for alert detection, notification delivery, and alert rule management.

## Overview

The Notification Service monitors truck activity by consuming GPS position and status change events from Kafka. It evaluates alert rules (geofence violations, speed limits, offline trucks, idle detection), triggers notifications, and provides APIs for managing alert rules and viewing alert history.

## Technology Stack

- **Framework**: Spring Boot 3.2.x
- **Language**: Java 17
- **Database**: PostgreSQL 15 (shared with Location Service)
- **Message Broker**: Apache Kafka
- **Notification Channels**: Email, SMS, WebSocket, Push Notifications
- **Build Tool**: Maven

## Architecture

```
Kafka Events → Notification Service → Alert Rule Engine
    ↓                                        ↓
GPS Position                          Notification Delivery
Status Change                         (Email, SMS, WebSocket)
    ↓                                        ↓
Alert History (PostgreSQL)            User Interface
```

## Port

- Default Port: `8082`

## Dependencies

- PostgreSQL (localhost:5432)
- Kafka Broker (localhost:29092)
- Shared Library (common DTOs and events)
- Email Server (SMTP) - for email notifications
- SMS Provider (Twilio, etc.) - for SMS notifications

## Getting Started

### Prerequisites

```bash
# Ensure infrastructure is running
cd infra/docker
docker-compose up -d postgres kafka

# Build shared library first
cd backend
mvn clean install -pl shared -am
```

### Build

```bash
cd backend/notification-service
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
docker build -t truck-track-notification:latest .
docker run -p 8082:8082 \
  -e SPRING_PROFILES_ACTIVE=dev \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/trucktrack \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:29092 \
  truck-track-notification:latest
```

## Configuration

### Application Properties

Key configuration in `application.yml`:

```yaml
server:
  port: 8082

spring:
  application:
    name: notification-service

  datasource:
    url: jdbc:postgresql://localhost:5432/trucktrack
    username: trucktrack_user
    password: trucktrack_pass

  kafka:
    bootstrap-servers: localhost:29092
    consumer:
      group-id: notification-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: com.trucktrack.common.event

  mail:
    host: smtp.gmail.com
    port: 587
    username: ${SMTP_USERNAME}
    password: ${SMTP_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true

kafka:
  topics:
    gps-position: truck-track.gps.position
    status-change: truck-track.location.status-change
    alert-triggered: truck-track.notification.alert

notification:
  sms:
    provider: twilio
    account-sid: ${TWILIO_ACCOUNT_SID}
    auth-token: ${TWILIO_AUTH_TOKEN}
    from-number: ${TWILIO_FROM_NUMBER}
```

### Environment Variables

- `SPRING_PROFILES_ACTIVE` - Active Spring profile
- `SPRING_DATASOURCE_URL` - PostgreSQL connection URL
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka broker addresses
- `SMTP_USERNAME` - Email server username
- `SMTP_PASSWORD` - Email server password
- `TWILIO_ACCOUNT_SID` - Twilio account SID (for SMS)
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_FROM_NUMBER` - Twilio phone number

## Database Schema

### Tables

#### alert_rules
- `rule_id` (UUID, PK) - Unique rule identifier
- `name` (VARCHAR) - Rule name
- `rule_type` (ENUM) - Alert type (OFFLINE, IDLE, GEOFENCE_ENTER, GEOFENCE_EXIT, SPEED_LIMIT)
- `truck_id` (UUID, FK) - Specific truck (null for all trucks)
- `geofence_id` (UUID, FK) - Related geofence (for geofence alerts)
- `threshold_value` (DOUBLE) - Threshold value (e.g., speed limit, idle minutes)
- `enabled` (BOOLEAN) - Rule active status
- `created_by` (UUID, FK) - User who created the rule
- `created_at` (TIMESTAMP) - Creation timestamp

#### notifications
- `notification_id` (UUID, PK) - Unique notification identifier
- `rule_id` (UUID, FK) - Related alert rule
- `truck_id` (UUID, FK) - Related truck
- `notification_type` (ENUM) - Type (GEOFENCE_VIOLATION, SPEED_LIMIT, OFFLINE, IDLE)
- `severity` (ENUM) - Severity level (INFO, WARNING, CRITICAL)
- `message` (TEXT) - Notification message
- `delivered` (BOOLEAN) - Delivery status
- `delivered_at` (TIMESTAMP) - Delivery timestamp
- `created_at` (TIMESTAMP) - Creation timestamp

## API Endpoints

### Alert Rules

#### Create Alert Rule

```http
POST /notification/alert-rules
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Downtown Speed Limit",
  "ruleType": "SPEED_LIMIT",
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "thresholdValue": 80.0,
  "enabled": true
}
```

**Response**: `201 Created`

```json
{
  "ruleId": "750e8400-e29b-41d4-a716-446655440000",
  "name": "Downtown Speed Limit",
  "ruleType": "SPEED_LIMIT",
  "thresholdValue": 80.0,
  "enabled": true,
  "createdAt": "2025-12-09T10:30:00Z"
}
```

#### List Alert Rules

```http
GET /notification/alert-rules
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `truckId` - Filter by truck
- `ruleType` - Filter by alert type
- `enabled` - Filter by enabled status

**Response**: `200 OK`

```json
{
  "rules": [
    {
      "ruleId": "750e8400-e29b-41d4-a716-446655440000",
      "name": "Downtown Speed Limit",
      "ruleType": "SPEED_LIMIT",
      "truckId": "550e8400-e29b-41d4-a716-446655440000",
      "thresholdValue": 80.0,
      "enabled": true,
      "createdBy": "user-123",
      "createdAt": "2025-12-09T10:30:00Z"
    }
  ]
}
```

#### Update Alert Rule

```http
PUT /notification/alert-rules/{ruleId}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "enabled": false,
  "thresholdValue": 90.0
}
```

#### Delete Alert Rule

```http
DELETE /notification/alert-rules/{ruleId}
Authorization: Bearer {jwt_token}
```

### Notifications

#### Get Alert History

```http
GET /notification/alerts
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
- `truckId` - Filter by truck
- `notificationType` - Filter by notification type
- `severity` - Filter by severity
- `startTime` - Start of time range (ISO 8601)
- `endTime` - End of time range (ISO 8601)
- `limit` - Max results (default: 100)
- `offset` - Pagination offset

**Response**: `200 OK`

```json
{
  "alerts": [
    {
      "notificationId": "850e8400-e29b-41d4-a716-446655440000",
      "truckId": "550e8400-e29b-41d4-a716-446655440000",
      "truckIdReadable": "TRUCK-001",
      "notificationType": "SPEED_LIMIT",
      "severity": "WARNING",
      "message": "Truck TRUCK-001 exceeded speed limit: 95 km/h (limit: 80 km/h)",
      "delivered": true,
      "deliveredAt": "2025-12-09T10:30:05Z",
      "createdAt": "2025-12-09T10:30:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

#### Get Alert Details

```http
GET /notification/alerts/{notificationId}
Authorization: Bearer {jwt_token}
```

#### Mark Alert as Read

```http
POST /notification/alerts/{notificationId}/read
Authorization: Bearer {jwt_token}
```

## Alert Types and Rules

### 1. OFFLINE Alert

**Trigger**: Truck hasn't sent GPS data for X minutes

**Configuration**:
```json
{
  "ruleType": "OFFLINE",
  "thresholdValue": 15.0  // Minutes without GPS data
}
```

**Detection**: Periodic job checks `last_seen` timestamp in trucks table

### 2. IDLE Alert

**Trigger**: Truck speed is 0 for X minutes while status is ACTIVE

**Configuration**:
```json
{
  "ruleType": "IDLE",
  "thresholdValue": 30.0  // Minutes with speed = 0
}
```

**Detection**: Tracks consecutive GPS positions with speed = 0

### 3. SPEED_LIMIT Alert

**Trigger**: Truck speed exceeds configured limit

**Configuration**:
```json
{
  "ruleType": "SPEED_LIMIT",
  "thresholdValue": 80.0  // Speed in km/h
}
```

**Detection**: Evaluated on each GPS position event

### 4. GEOFENCE_ENTER Alert

**Trigger**: Truck enters specified geofence

**Configuration**:
```json
{
  "ruleType": "GEOFENCE_ENTER",
  "geofenceId": "650e8400-e29b-41d4-a716-446655440000"
}
```

**Detection**: Location Service publishes geofence events

### 5. GEOFENCE_EXIT Alert

**Trigger**: Truck exits specified geofence

**Configuration**:
```json
{
  "ruleType": "GEOFENCE_EXIT",
  "geofenceId": "650e8400-e29b-41d4-a716-446655440000"
}
```

## Kafka Integration

### Consumed Events

#### GPSPositionEvent

**Topic**: `truck-track.gps.position`

**Handler**: `GPSPositionConsumer.java`

**Processing**:
1. Evaluate all enabled alert rules for the truck
2. Check speed limit violations
3. Check idle status (consecutive positions with speed = 0)
4. Trigger alerts if conditions met
5. Publish AlertTriggeredEvent

#### TruckStatusChangeEvent

**Topic**: `truck-track.location.status-change`

**Handler**: `StatusChangeConsumer.java`

**Processing**:
1. Detect OFFLINE status transitions
2. Trigger OFFLINE alerts
3. Reset idle detection state

### Published Events

#### AlertTriggeredEvent

**Topic**: `truck-track.notification.alert`

**Published when**: Alert rule condition is met

**Schema**:
```json
{
  "eventId": "evt_alert_123",
  "ruleId": "750e8400-e29b-41d4-a716-446655440000",
  "truckId": "550e8400-e29b-41d4-a716-446655440000",
  "alertType": "SPEED_LIMIT",
  "severity": "WARNING",
  "message": "Truck TRUCK-001 exceeded speed limit: 95 km/h (limit: 80 km/h)",
  "metadata": {
    "currentSpeed": 95.0,
    "speedLimit": 80.0,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "timestamp": "2025-12-09T10:30:00Z"
}
```

## Notification Delivery

### Channels

#### 1. Email Notifications

```java
@Service
public class EmailNotificationService {
    public void sendEmail(String to, String subject, String body) {
        // SMTP-based email delivery
    }
}
```

**Configuration**: SMTP server details in application.yml

#### 2. SMS Notifications

```java
@Service
public class SmsNotificationService {
    public void sendSms(String toNumber, String message) {
        // Twilio or other SMS provider integration
    }
}
```

**Configuration**: SMS provider credentials in application.yml

#### 3. WebSocket Push

```java
@Service
public class WebSocketNotificationService {
    public void pushToUser(String userId, AlertTriggeredEvent alert) {
        // Push notification to connected WebSocket clients
    }
}
```

**Endpoint**: `ws://localhost:8082/notifications`

#### 4. In-App Notifications

Stored in `notifications` table, retrieved via REST API

### Delivery Rules

- **CRITICAL** severity: Email + SMS + WebSocket
- **WARNING** severity: Email + WebSocket
- **INFO** severity: WebSocket only

### Throttling

Prevent notification spam with configurable throttling:

```yaml
notification:
  throttling:
    enabled: true
    same-rule-cooldown: 300  # Seconds between same rule triggers
    max-per-truck-per-hour: 10
```

## Alert Rule Engine

### Rule Evaluation Flow

```
1. Event received (GPS Position or Status Change)
   ↓
2. Load all enabled rules for truck
   ↓
3. For each rule:
   - Check rule type
   - Evaluate condition (speed, geofence, time, etc.)
   - Check throttling
   ↓
4. If condition met:
   - Create notification record
   - Publish AlertTriggeredEvent
   - Deliver via configured channels
   ↓
5. Log alert history
```

### Performance Optimization

- **Rule Caching**: Cache enabled rules in memory, refresh every 5 minutes
- **Batch Processing**: Process multiple GPS events in batches
- **Async Delivery**: Notification delivery runs asynchronously

## Monitoring & Observability

### Metrics

Available at `/actuator/metrics` and `/actuator/prometheus`:

- `notification.alerts.triggered` - Total alerts triggered
- `notification.alerts.delivered` - Total notifications delivered
- `notification.email.sent` - Email notifications sent
- `notification.sms.sent` - SMS notifications sent
- `notification.rule.evaluations` - Total rule evaluations
- `notification.rule.evaluation.latency` - Rule evaluation latency
- `http_server_requests_seconds` - HTTP request metrics
- `kafka_consumer_*` - Kafka consumer metrics

### Distributed Tracing

OpenTelemetry tracing is enabled via Micrometer Tracing Bridge:
- HTTP requests traced automatically
- Kafka consumer messages include trace context
- Alert rule evaluation traced
- Notification delivery traced
- Traces exported to Jaeger at http://localhost:16686

### Monitoring Stack

| Tool | URL | Description |
|------|-----|-------------|
| Prometheus | http://localhost:9090 | Metrics collection |
| Grafana | http://localhost:3000 | Dashboards (admin/admin) |
| Jaeger | http://localhost:16686 | Distributed tracing |

### Logging

Structured logging with trace correlation (traceId, spanId):
- Alert triggers
- Notification delivery status
- Rule evaluation results
- Delivery failures

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
docker-compose up -d postgres kafka

# Run integration tests
cd backend/notification-service
mvn verify
```

### Manual Testing

```bash
# Get JWT token
TOKEN=$(curl -X POST http://localhost:8083/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Create speed limit alert rule
curl -X POST http://localhost:8082/notification/alert-rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Speed Limit Test",
    "ruleType": "SPEED_LIMIT",
    "thresholdValue": 80.0,
    "enabled": true
  }' | jq

# Get alert history
curl http://localhost:8082/notification/alerts \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Troubleshooting

### Alerts Not Triggering

**Problem**: Alert rules configured but no notifications generated

**Solution**:
- Check rule is enabled: `GET /notification/alert-rules`
- Verify Kafka consumer is running: Check application logs
- Check rule evaluation logic: Enable DEBUG logging

### Email Delivery Failures

**Problem**: Emails not being delivered

**Solution**:
```bash
# Test SMTP connection
curl -v telnet://smtp.gmail.com:587

# Check application logs for email errors
docker logs notification-service | grep -i email
```

### SMS Delivery Failures

**Problem**: SMS notifications not sent

**Solution**:
- Verify Twilio credentials are correct
- Check Twilio account balance
- Review Twilio logs in dashboard

### Notification Delays

**Problem**: Notifications delivered with significant delay

**Solution**:
- Check Kafka consumer lag: `kafka-consumer-groups --describe`
- Increase consumer threads in configuration
- Enable async notification delivery

## Scheduled Jobs

### Offline Detection Job

Runs every 5 minutes to detect offline trucks:

```java
@Scheduled(cron = "0 */5 * * * *")
public void detectOfflineTrucks() {
    // Find trucks with last_seen > threshold
    // Trigger OFFLINE alerts
}
```

### Notification Cleanup Job

Runs daily to archive old notifications:

```java
@Scheduled(cron = "0 0 2 * * *")  // 2 AM daily
public void cleanupOldNotifications() {
    // Archive notifications older than 90 days
}
```

## Related Services

- **Location Service** - Provides geofence events and status changes
- **GPS Ingestion Service** - Publishes GPS position events
- **API Gateway** - Routes notification API requests
- **Auth Service** - Provides user authentication

## Future Enhancements

- Push notifications for mobile apps (FCM, APNS)
- Webhook notifications for third-party integrations
- Advanced rule expressions (e.g., "speed > 80 for 5 consecutive minutes")
- Machine learning for anomaly detection
- Notification templates with customization

## License

Proprietary - TruckTrack System
