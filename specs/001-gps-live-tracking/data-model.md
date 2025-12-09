# Data Model: GPS Live Truck Tracking

**Date**: 2025-12-09
**Feature**: GPS Live Truck Tracking
**Branch**: 001-gps-live-tracking

## Overview

This document defines the data entities, relationships, validation rules, and database schema for the GPS live truck tracking system. The data model supports real-time GPS position tracking, historical route visualization, geofencing, and alert notifications.

---

## Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│     User     │─────────│ UserTruckGroup   │─────────│  TruckGroup  │
└──────────────┘    *   *└──────────────────┘*   *    └──────────────┘
                                                               │
                                                               │ *
                                                               │
                                                        ┌──────────────┐
         ┌──────────────────────────────────────────────│    Truck     │
         │                                              └──────────────┘
         │                                                     │
         │ *                                                   │ 1
         │                                                     │
┌──────────────────┐                                   ┌──────────────┐
│   GPSPosition    │                                   │  AlertRule   │
└──────────────────┘                                   └──────────────┘
                                                              │
                                                              │ *
┌──────────────────┐                                         │
│     Geofence     │─────────────────────────────────────────┘
└──────────────────┘                    *

┌──────────────────┐
│   Notification   │────────────* ────┐
└──────────────────┘                  │
                                      │
                               ┌──────────────┐
                               │     User     │
                               └──────────────┘
```

---

## Core Entities

### 1. Truck

Represents a delivery vehicle in the fleet.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique truck identifier (generated) |
| `truck_id` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable truck ID (e.g., "TRK-001") |
| `license_plate` | VARCHAR(20) | UNIQUE, NOT NULL | Vehicle license plate number |
| `driver_name` | VARCHAR(100) | NULLABLE | Name of assigned driver |
| `driver_phone` | VARCHAR(20) | NULLABLE | Driver's contact phone number |
| `vehicle_type` | VARCHAR(50) | NOT NULL | Type of vehicle (e.g., "VAN", "TRUCK", "SEMI") |
| `status` | ENUM | NOT NULL | Current status: `ACTIVE`, `IDLE`, `OFFLINE` |
| `current_latitude` | DECIMAL(10,8) | NULLABLE | Last known latitude (denormalized for fast reads) |
| `current_longitude` | DECIMAL(11,8) | NULLABLE | Last known longitude |
| `current_speed` | DECIMAL(5,2) | NULLABLE | Last known speed in km/h |
| `current_heading` | INTEGER | NULLABLE | Last known heading in degrees (0-359) |
| `last_update` | TIMESTAMP | NULLABLE | Timestamp of last GPS update |
| `truck_group_id` | UUID | FK, NOT NULL | Reference to TruckGroup (authorization) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |

#### Indexes

```sql
CREATE INDEX idx_trucks_truck_id ON trucks(truck_id);
CREATE INDEX idx_trucks_driver_name ON trucks(driver_name);
CREATE INDEX idx_trucks_status ON trucks(status);
CREATE INDEX idx_trucks_truck_group ON trucks(truck_group_id);
CREATE INDEX idx_trucks_location ON trucks USING GIST (ST_SetSRID(ST_MakePoint(current_longitude, current_latitude), 4326));
```

#### Validation Rules

- `truck_id`: Must match pattern `^[A-Z]{3}-\d{3}$` (e.g., "TRK-001")
- `license_plate`: Must be unique per fleet, alphanumeric with hyphens allowed
- `status`: Derived from `last_update`:
  - `ACTIVE`: `last_update` within 1 minute AND `current_speed` > 5 km/h
  - `IDLE`: `last_update` within 5 minutes AND `current_speed` ≤ 5 km/h for >10 minutes
  - `OFFLINE`: `last_update` older than 5 minutes
- `current_latitude`: Range -90 to 90
- `current_longitude`: Range -180 to 180
- `current_speed`: Range 0 to 200 km/h
- `current_heading`: Range 0 to 359 degrees

---

### 2. GPSPosition

Represents a single GPS coordinate reading from a truck.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Unique position record ID |
| `truck_id` | UUID | FK, NOT NULL | Reference to Truck |
| `latitude` | DECIMAL(10,8) | NOT NULL | GPS latitude |
| `longitude` | DECIMAL(11,8) | NOT NULL | GPS longitude |
| `altitude` | DECIMAL(7,2) | NULLABLE | Altitude in meters (optional) |
| `speed` | DECIMAL(5,2) | NOT NULL | Speed in km/h |
| `heading` | INTEGER | NOT NULL | Heading in degrees (0-359) |
| `accuracy` | DECIMAL(5,2) | NULLABLE | GPS accuracy in meters (optional) |
| `satellites` | INTEGER | NULLABLE | Number of satellites (optional) |
| `timestamp` | TIMESTAMP | NOT NULL | GPS reading timestamp (from device) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record ingestion timestamp |
| `geom` | GEOMETRY(Point, 4326) | NOT NULL | PostGIS geometry point |

#### Table Partitioning

Partition by `timestamp` (monthly partitions) for efficient historical queries and data retention:

```sql
CREATE TABLE gps_positions (
  -- fields as above
) PARTITION BY RANGE (timestamp);

CREATE TABLE gps_positions_2025_01 PARTITION OF gps_positions
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
-- Create partitions for each month
```

#### Indexes

```sql
CREATE INDEX idx_gps_positions_truck_id ON gps_positions(truck_id);
CREATE INDEX idx_gps_positions_timestamp ON gps_positions(timestamp DESC);
CREATE INDEX idx_gps_positions_geom ON gps_positions USING GIST (geom);
-- Composite index for common query pattern (truck + time range)
CREATE INDEX idx_gps_positions_truck_time ON gps_positions(truck_id, timestamp DESC);
```

#### Validation Rules

- `latitude`: Range -90 to 90
- `longitude`: Range -180 to 180
- `speed`: Range 0 to 200 km/h
- `heading`: Range 0 to 359 degrees
- `accuracy`: If provided, must be > 0
- `satellites`: If provided, range 0 to 30
- `timestamp`: Must be within ±5 minutes of server time (rejects future/stale data)

#### Retention Policy

- Scheduled job (cron) drops partitions older than 90 days (per constitution data retention)
- Example: On 2025-04-01, drop partition `gps_positions_2024_12`

---

### 3. TruckGroup

Represents an authorization group for access control (e.g., "Fleet A", "Region East").

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique group identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Group name (e.g., "Fleet A") |
| `description` | TEXT | NULLABLE | Group description |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |

#### Indexes

```sql
CREATE INDEX idx_truck_groups_name ON truck_groups(name);
```

---

### 4. User

Represents a fleet manager or dispatcher using the application.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email (username) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `first_name` | VARCHAR(100) | NOT NULL | User first name |
| `last_name` | VARCHAR(100) | NOT NULL | User last name |
| `role` | ENUM | NOT NULL | Role: `FLEET_MANAGER`, `DISPATCHER`, `VIEWER` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active status |
| `last_login` | TIMESTAMP | NULLABLE | Last successful login timestamp |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |

#### Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Validation Rules

- `email`: Must be valid email format (RFC 5322)
- `password`: Min 12 characters, must include uppercase, lowercase, number, special character (enforced at application layer before hashing)
- `role`: Must be one of `FLEET_MANAGER`, `DISPATCHER`, `VIEWER`

---

### 5. UserTruckGroup (Join Table)

Many-to-many relationship between Users and TruckGroups (defines which trucks a user can view).

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `user_id` | UUID | FK, NOT NULL | Reference to User |
| `truck_group_id` | UUID | FK, NOT NULL | Reference to TruckGroup |
| `assigned_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When user was granted access |

#### Primary Key

```sql
PRIMARY KEY (user_id, truck_group_id)
```

#### Indexes

```sql
CREATE INDEX idx_user_truck_groups_user ON user_truck_groups(user_id);
CREATE INDEX idx_user_truck_groups_group ON user_truck_groups(truck_group_id);
```

---

### 6. Geofence

Represents a geographical boundary defined on the map.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique geofence identifier |
| `name` | VARCHAR(100) | NOT NULL | Geofence name (e.g., "Depot #1") |
| `description` | TEXT | NULLABLE | Geofence description |
| `zone_type` | ENUM | NOT NULL | Type: `DEPOT`, `DELIVERY_AREA`, `RESTRICTED_ZONE`, `CUSTOM` |
| `boundary` | GEOMETRY(Polygon, 4326) | NOT NULL | PostGIS polygon boundary |
| `radius_meters` | DECIMAL(10,2) | NULLABLE | Radius in meters (if circular geofence) |
| `center_latitude` | DECIMAL(10,8) | NULLABLE | Center latitude (if circular) |
| `center_longitude` | DECIMAL(11,8) | NULLABLE | Center longitude (if circular) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether geofence is currently active |
| `created_by` | UUID | FK, NOT NULL | User who created geofence |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |

#### Indexes

```sql
CREATE INDEX idx_geofences_name ON geofences(name);
CREATE INDEX idx_geofences_zone_type ON geofences(zone_type);
CREATE INDEX idx_geofences_boundary ON geofences USING GIST (boundary);
```

#### Validation Rules

- `boundary`: Must be a valid polygon (no self-intersections, at least 3 points)
- If circular geofence: `center_latitude`, `center_longitude`, and `radius_meters` must all be provided
- `radius_meters`: Range 10 to 50,000 meters (10m to 50km)

---

### 7. AlertRule

Represents a user-configured notification trigger.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique alert rule identifier |
| `name` | VARCHAR(100) | NOT NULL | Rule name (e.g., "Truck Offline Alert") |
| `description` | TEXT | NULLABLE | Rule description |
| `rule_type` | ENUM | NOT NULL | Type: `OFFLINE`, `IDLE`, `GEOFENCE_ENTER`, `GEOFENCE_EXIT`, `SPEED_LIMIT` |
| `threshold_value` | INTEGER | NULLABLE | Threshold (e.g., idle minutes, speed km/h) |
| `geofence_id` | UUID | FK, NULLABLE | Reference to Geofence (for geofence rules) |
| `truck_group_id` | UUID | FK, NULLABLE | Apply rule to specific TruckGroup (NULL = all trucks) |
| `is_enabled` | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether rule is active |
| `notification_channels` | JSON | NOT NULL | Array of channels: `["IN_APP", "EMAIL", "SMS"]` |
| `created_by` | UUID | FK, NOT NULL | User who created rule |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification timestamp |

#### Indexes

```sql
CREATE INDEX idx_alert_rules_rule_type ON alert_rules(rule_type);
CREATE INDEX idx_alert_rules_geofence ON alert_rules(geofence_id);
CREATE INDEX idx_alert_rules_truck_group ON alert_rules(truck_group_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(is_enabled);
```

#### Validation Rules

- `rule_type` = `OFFLINE`: `threshold_value` represents minutes (default 5, range 1-60)
- `rule_type` = `IDLE`: `threshold_value` represents minutes (default 30, range 5-240)
- `rule_type` = `GEOFENCE_ENTER` or `GEOFENCE_EXIT`: `geofence_id` must be NOT NULL
- `rule_type` = `SPEED_LIMIT`: `threshold_value` represents km/h (range 10-150)
- `notification_channels`: Must contain at least one channel

---

### 8. Notification

Represents an alert notification sent to a user.

#### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique notification identifier |
| `user_id` | UUID | FK, NOT NULL | Reference to User (recipient) |
| `alert_rule_id` | UUID | FK, NOT NULL | Reference to AlertRule that triggered |
| `truck_id` | UUID | FK, NOT NULL | Reference to Truck that triggered alert |
| `notification_type` | ENUM | NOT NULL | Type: `OFFLINE`, `IDLE`, `GEOFENCE_ENTER`, `GEOFENCE_EXIT`, `SPEED_LIMIT` |
| `title` | VARCHAR(255) | NOT NULL | Notification title (e.g., "Truck TRK-001 Offline") |
| `message` | TEXT | NOT NULL | Notification message body |
| `severity` | ENUM | NOT NULL | Severity: `INFO`, `WARNING`, `CRITICAL` |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether user has read notification |
| `latitude` | DECIMAL(10,8) | NULLABLE | Truck latitude when alert triggered |
| `longitude` | DECIMAL(11,8) | NULLABLE | Truck longitude when alert triggered |
| `triggered_at` | TIMESTAMP | NOT NULL | When alert condition was detected |
| `sent_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When notification was sent |
| `read_at` | TIMESTAMP | NULLABLE | When user marked as read |

#### Indexes

```sql
CREATE INDEX idx_notifications_user ON notifications(user_id, triggered_at DESC);
CREATE INDEX idx_notifications_truck ON notifications(truck_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_triggered_at ON notifications(triggered_at DESC);
```

#### Validation Rules

- `severity`: Derived from `notification_type`:
  - `OFFLINE`: `CRITICAL`
  - `IDLE`: `WARNING`
  - `GEOFENCE_ENTER`/`GEOFENCE_EXIT`: `INFO`
  - `SPEED_LIMIT`: `CRITICAL`
- `triggered_at`: Must be ≤ `sent_at` (can't send notification before event occurred)

---

## Kafka Event Schemas

### GPSPositionEvent

Published to `truck-track.gps.position` topic when GPS data ingested.

```json
{
  "eventId": "uuid",
  "truckId": "uuid",
  "truckIdReadable": "TRK-001",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "altitude": 12.5,
  "speed": 45.3,
  "heading": 270,
  "accuracy": 5.0,
  "satellites": 12,
  "timestamp": "2025-12-09T10:30:00Z",
  "ingestedAt": "2025-12-09T10:30:01Z"
}
```

**Key**: `truckId` (enables partitioning by truck for ordered processing)

---

### TruckStatusChangeEvent

Published to `truck-track.location.status-change` topic when truck status changes.

```json
{
  "eventId": "uuid",
  "truckId": "uuid",
  "truckIdReadable": "TRK-001",
  "previousStatus": "ACTIVE",
  "newStatus": "IDLE",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "timestamp": "2025-12-09T10:45:00Z"
}
```

**Key**: `truckId`

---

### AlertTriggeredEvent

Published to `truck-track.notification.alert` topic when alert rule condition met.

```json
{
  "eventId": "uuid",
  "alertRuleId": "uuid",
  "truckId": "uuid",
  "truckIdReadable": "TRK-001",
  "alertType": "OFFLINE",
  "severity": "CRITICAL",
  "message": "Truck TRK-001 has been offline for 5 minutes",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "triggeredAt": "2025-12-09T11:00:00Z",
  "affectedUserIds": ["uuid1", "uuid2"]
}
```

**Key**: `alertRuleId`

---

## Database Schema Summary

### Tables

1. `users` - User accounts
2. `truck_groups` - Authorization groups
3. `user_truck_groups` - User-to-group many-to-many
4. `trucks` - Fleet vehicles
5. `gps_positions` - GPS coordinate readings (partitioned by month)
6. `geofences` - Geographical boundaries
7. `alert_rules` - Notification trigger configurations
8. `notifications` - Alert notifications sent to users

### Foreign Key Relationships

```sql
-- Trucks
ALTER TABLE trucks ADD CONSTRAINT fk_trucks_truck_group
  FOREIGN KEY (truck_group_id) REFERENCES truck_groups(id) ON DELETE RESTRICT;

-- GPSPositions
ALTER TABLE gps_positions ADD CONSTRAINT fk_gps_positions_truck
  FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;

-- UserTruckGroups
ALTER TABLE user_truck_groups ADD CONSTRAINT fk_user_truck_groups_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_truck_groups ADD CONSTRAINT fk_user_truck_groups_group
  FOREIGN KEY (truck_group_id) REFERENCES truck_groups(id) ON DELETE CASCADE;

-- Geofences
ALTER TABLE geofences ADD CONSTRAINT fk_geofences_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- AlertRules
ALTER TABLE alert_rules ADD CONSTRAINT fk_alert_rules_geofence
  FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE;
ALTER TABLE alert_rules ADD CONSTRAINT fk_alert_rules_truck_group
  FOREIGN KEY (truck_group_id) REFERENCES truck_groups(id) ON DELETE SET NULL;
ALTER TABLE alert_rules ADD CONSTRAINT fk_alert_rules_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Notifications
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_alert_rule
  FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_truck
  FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE CASCADE;
```

---

## State Transitions

### Truck Status State Machine

```
            GPS update received
                    │
                    ▼
          ┌─────────────────┐
          │   last_update   │
          │   within 5 min? │
          └────────┬─────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
        YES                 NO
         │                   │
         ▼                   ▼
   ┌──────────┐       ┌──────────┐
   │ speed >  │       │ OFFLINE  │
   │  5 km/h? │       └──────────┘
   └─────┬────┘
         │
    ┌────┴────┐
   YES       NO
    │         │
    │    stationary
    │      >10 min?
    │         │
    │    ┌────┴────┐
    │   YES       NO
    ▼    │         │
┌────────┐  │     ┌────────┐
│ ACTIVE │◄─┘     │  IDLE  │
└────────┘        └────────┘
```

**Transition Rules**:
- `OFFLINE → ACTIVE`: GPS update received with speed >5 km/h
- `OFFLINE → IDLE`: GPS update received with speed ≤5 km/h
- `ACTIVE → IDLE`: Truck stationary (speed ≤5 km/h) for >10 minutes
- `IDLE → ACTIVE`: Truck starts moving (speed >5 km/h)
- `ACTIVE/IDLE → OFFLINE`: No GPS update for >5 minutes

---

## Data Migration (Flyway)

### Initial Schema (V1__initial_schema.sql)

```sql
-- Create ENUM types
CREATE TYPE user_role AS ENUM ('FLEET_MANAGER', 'DISPATCHER', 'VIEWER');
CREATE TYPE truck_status AS ENUM ('ACTIVE', 'IDLE', 'OFFLINE');
CREATE TYPE geofence_zone_type AS ENUM ('DEPOT', 'DELIVERY_AREA', 'RESTRICTED_ZONE', 'CUSTOM');
CREATE TYPE alert_rule_type AS ENUM ('OFFLINE', 'IDLE', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'SPEED_LIMIT');
CREATE TYPE notification_type AS ENUM ('OFFLINE', 'IDLE', 'GEOFENCE_ENTER', 'GEOFENCE_EXIT', 'SPEED_LIMIT');
CREATE TYPE notification_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create tables (see above for full DDL)
CREATE TABLE users (...);
CREATE TABLE truck_groups (...);
CREATE TABLE user_truck_groups (...);
CREATE TABLE trucks (...);
CREATE TABLE gps_positions (...) PARTITION BY RANGE (timestamp);
CREATE TABLE geofences (...);
CREATE TABLE alert_rules (...);
CREATE TABLE notifications (...);

-- Create indexes (see above)
-- Add foreign key constraints (see above)
```

### Seed Data (V2__seed_data.sql)

```sql
-- Insert default truck group
INSERT INTO truck_groups (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'All Trucks', 'Default group for all trucks');

-- Insert admin user (password: AdminPass123!)
INSERT INTO users (id, email, password_hash, first_name, last_name, role)
VALUES ('00000000-0000-0000-0000-000000000002', 'admin@trucktrack.com', '$2a$10$...', 'Admin', 'User', 'FLEET_MANAGER');

-- Grant admin access to all trucks
INSERT INTO user_truck_groups (user_id, truck_group_id)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001');
```

---

## Summary

This data model provides:
- **Comprehensive entities** for trucks, GPS positions, users, geofences, alerts
- **Spatial indexing** via PostGIS for efficient location queries
- **Partitioning** on GPS positions for scalable historical data storage
- **Authorization model** via TruckGroups and UserTruckGroups join table
- **Event schemas** for Kafka topics enabling decoupled microservices
- **State machine** for truck status transitions
- **Data retention** via partition dropping (90-day policy)

Next step: Generate API contracts (OpenAPI specs) for REST endpoints and Kafka schemas.
