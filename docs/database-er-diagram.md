# TruckTrack Database Entity Relationship Diagram

## Overview

This document describes the database schema for the TruckTrack fleet management system.

## ER Diagram

```mermaid
erDiagram
    %% Auth Service Entities
    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar role
        boolean is_active
        varchar expo_push_token
        timestamp created_at
        timestamp updated_at
    }

    USER_TRUCK_GROUPS {
        uuid user_id FK
        uuid truck_group_id FK
    }

    %% Location Service Entities
    TRUCKS {
        uuid id PK
        varchar truck_id UK
        varchar license_plate UK
        varchar driver_name
        uuid driver_id FK
        varchar vehicle_type
        varchar status
        double latitude
        double longitude
        double speed
        double heading
        uuid truck_group_id FK
        timestamp last_update
        timestamp created_at
    }

    TRUCK_GROUPS {
        uuid id PK
        varchar name UK
        varchar description
        timestamp created_at
        timestamp updated_at
    }

    GPS_POSITIONS {
        uuid id PK
        uuid truck_id FK
        double latitude
        double longitude
        double speed
        double heading
        double altitude
        double accuracy
        timestamp timestamp
        timestamp created_at
    }

    TRIPS {
        uuid id PK
        varchar origin
        varchar destination
        double origin_lat
        double origin_lng
        double destination_lat
        double destination_lng
        varchar status
        timestamp scheduled_at
        timestamp started_at
        timestamp completed_at
        uuid assigned_truck_id FK
        uuid assigned_driver_id FK
        varchar notes
        double distance_km
        integer duration_minutes
        timestamp created_at
        timestamp updated_at
    }

    TRIP_STATUS_HISTORY {
        uuid id PK
        uuid trip_id FK
        varchar old_status
        varchar new_status
        varchar changed_by
        varchar reason
        timestamp changed_at
    }

    GEOFENCES {
        uuid id PK
        varchar name
        varchar type
        geometry boundary
        double radius
        double center_lat
        double center_lng
        boolean is_active
        uuid truck_group_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% Notification Service Entities
    ALERT_RULES {
        uuid id PK
        varchar name
        varchar rule_type
        double threshold_value
        varchar threshold_unit
        uuid geofence_id FK
        uuid truck_group_id FK
        boolean is_active
        integer cooldown_minutes
        timestamp created_at
        timestamp updated_at
    }

    NOTIFICATIONS {
        uuid id PK
        varchar type
        varchar title
        varchar message
        varchar severity
        uuid truck_id FK
        uuid user_id FK
        uuid alert_rule_id FK
        boolean is_read
        timestamp created_at
        timestamp read_at
    }

    AUDIT_LOGS {
        uuid id PK
        varchar entity_type
        uuid entity_id
        varchar action
        varchar actor_id
        varchar actor_name
        jsonb old_value
        jsonb new_value
        timestamp created_at
    }

    SYSTEM_CONFIG {
        uuid id PK
        varchar config_key UK
        varchar config_value
        varchar description
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    USERS ||--o{ USER_TRUCK_GROUPS : "belongs to"
    TRUCK_GROUPS ||--o{ USER_TRUCK_GROUPS : "has members"
    TRUCK_GROUPS ||--o{ TRUCKS : "contains"
    TRUCK_GROUPS ||--o{ GEOFENCES : "applies to"
    TRUCK_GROUPS ||--o{ ALERT_RULES : "monitors"

    USERS ||--o{ TRUCKS : "drives"
    TRUCKS ||--o{ GPS_POSITIONS : "has history"
    TRUCKS ||--o{ TRIPS : "assigned to"
    TRUCKS ||--o{ NOTIFICATIONS : "triggers"

    USERS ||--o{ TRIPS : "assigned as driver"
    USERS ||--o{ NOTIFICATIONS : "receives"

    TRIPS ||--o{ TRIP_STATUS_HISTORY : "has history"

    GEOFENCES ||--o{ ALERT_RULES : "triggers"
    ALERT_RULES ||--o{ NOTIFICATIONS : "generates"
```

## Entity Descriptions

### Auth Service

| Entity | Description |
|--------|-------------|
| **USERS** | System users (admins, fleet managers, dispatchers, drivers) |
| **USER_TRUCK_GROUPS** | Many-to-many relationship between users and truck groups |

### Location Service

| Entity | Description |
|--------|-------------|
| **TRUCKS** | Fleet vehicles with real-time position and status |
| **TRUCK_GROUPS** | Logical grouping of trucks (by region, type, etc.) |
| **GPS_POSITIONS** | Historical GPS position data for trucks |
| **TRIPS** | Trip records with origin/destination and assignment |
| **TRIP_STATUS_HISTORY** | Audit trail of trip status changes |
| **GEOFENCES** | Geographic boundaries for monitoring |

### Notification Service

| Entity | Description |
|--------|-------------|
| **ALERT_RULES** | Configurable rules for generating alerts |
| **NOTIFICATIONS** | Alert notifications sent to users |
| **AUDIT_LOGS** | System-wide audit trail |
| **SYSTEM_CONFIG** | Application configuration settings |

## Status Enumerations

### Truck Status
- `ACTIVE` - Truck is operational and tracking
- `INACTIVE` - Truck is not in use
- `MAINTENANCE` - Truck is under maintenance
- `OFFLINE` - No GPS signal received

### Trip Status
- `PENDING` - Trip created, not assigned
- `ASSIGNED` - Trip assigned to truck/driver
- `IN_PROGRESS` - Trip started by driver
- `COMPLETED` - Trip successfully completed
- `CANCELLED` - Trip cancelled

### User Roles
- `ADMIN` - Full system access
- `FLEET_MANAGER` - Manage fleet and view analytics
- `DISPATCHER` - Manage trips and assignments
- `DRIVER` - Mobile app access, trip operations

### Alert Rule Types
- `SPEED_LIMIT` - Speed threshold exceeded
- `GEOFENCE_ENTER` - Truck entered geofence
- `GEOFENCE_EXIT` - Truck exited geofence
- `IDLE_TIME` - Truck idle too long
- `OFFLINE` - Truck lost connectivity
