# Data Model: Admin Panel

**Feature**: 002-admin-panel
**Date**: 2025-12-19

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTH-SERVICE DATABASE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐         ┌─────────────────────────┐                       │
│  │      users       │         │  user_group_assignments │                       │
│  ├──────────────────┤         ├─────────────────────────┤                       │
│  │ id: UUID (PK)    │◄────────│ user_id: UUID (PK,FK)   │                       │
│  │ email: VARCHAR   │         │ truck_group_id: UUID(PK)│───────┐               │
│  │ password_hash    │         │ assigned_at: TIMESTAMP  │       │               │
│  │ first_name       │         └─────────────────────────┘       │               │
│  │ last_name        │                                           │               │
│  │ role: ENUM       │         ┌─────────────────────────┐       │               │
│  │ is_active: BOOL  │         │      audit_logs         │       │               │
│  │ last_login       │         ├─────────────────────────┤       │               │
│  │ created_at       │◄────────│ user_id: UUID (FK)      │       │               │
│  │ updated_at       │         │ id: UUID (PK)           │       │               │
│  └──────────────────┘         │ action: ENUM            │       │               │
│                               │ entity_type: VARCHAR    │       │               │
│                               │ entity_id: UUID         │       │               │
│                               │ changes: JSONB          │       │               │
│                               │ timestamp: TIMESTAMP    │       │               │
│                               └─────────────────────────┘       │               │
└─────────────────────────────────────────────────────────────────│───────────────┘
                                                                  │
                    ┌─────────────────────────────────────────────┘
                    │ (cross-service reference, no FK)
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            LOCATION-SERVICE DATABASE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────┐         ┌──────────────────────────┐                      │
│  │   truck_groups   │         │ truck_group_assignments  │                      │
│  ├──────────────────┤         ├──────────────────────────┤                      │
│  │ id: UUID (PK)    │◄────────│ truck_group_id: UUID(FK) │                      │
│  │ name: VARCHAR    │         │ truck_id: UUID (PK,FK)   │                      │
│  │ description      │         │ assigned_at: TIMESTAMP   │                      │
│  │ created_at       │         └──────────────────────────┘                      │
│  │ updated_at       │                    │                                      │
│  └──────────────────┘                    │                                      │
│                                          ▼                                      │
│  ┌──────────────────┐         ┌──────────────────────────┐                      │
│  │     trucks       │◄────────│ (many-to-many)           │                      │
│  ├──────────────────┤         └──────────────────────────┘                      │
│  │ id: UUID (PK)    │                                                           │
│  │ truck_id: VARCHAR│         ┌──────────────────────────┐                      │
│  │ license_plate    │         │     system_config        │                      │
│  │ driver_name      │         ├──────────────────────────┤                      │
│  │ driver_phone     │         │ id: UUID (PK)            │                      │
│  │ vehicle_type     │         │ config_key: VARCHAR (UK) │                      │
│  │ status: ENUM     │         │ config_value: VARCHAR    │                      │
│  │ current_latitude │         │ description: VARCHAR     │                      │
│  │ current_longitude│         │ version: INT             │                      │
│  │ current_speed    │         │ updated_by: UUID         │                      │
│  │ current_heading  │         │ updated_at: TIMESTAMP    │                      │
│  │ last_update      │         └──────────────────────────┘                      │
│  │ created_at       │                                                           │
│  │ updated_at       │         ┌──────────────────────────┐                      │
│  └──────────────────┘         │   config_history         │                      │
│                               ├──────────────────────────┤                      │
│                               │ id: UUID (PK)            │                      │
│                               │ config_key: VARCHAR      │                      │
│                               │ old_value: VARCHAR       │                      │
│                               │ new_value: VARCHAR       │                      │
│                               │ changed_by: UUID         │                      │
│                               │ changed_at: TIMESTAMP    │                      │
│                               └──────────────────────────┘                      │
│                                                                                  │
│  ┌──────────────────────────┐                                                   │
│  │      audit_logs          │                                                   │
│  ├──────────────────────────┤                                                   │
│  │ id: UUID (PK)            │                                                   │
│  │ action: ENUM             │                                                   │
│  │ entity_type: VARCHAR     │                                                   │
│  │ entity_id: UUID          │                                                   │
│  │ user_id: UUID            │                                                   │
│  │ changes: JSONB           │                                                   │
│  │ timestamp: TIMESTAMP     │                                                   │
│  └──────────────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Entities

### 1. User (MODIFIED)

**Location**: `auth-service`
**Table**: `users`
**Changes**: Add relationship to groups via join table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | User first name |
| last_name | VARCHAR(100) | NOT NULL | User last name |
| role | ENUM | NOT NULL | ADMIN, FLEET_MANAGER, DRIVER, VIEWER |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| last_login | TIMESTAMP | NULL | Last successful login |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last modification |

**Indexes**:
- `idx_user_email` (email) UNIQUE
- `idx_user_role` (role)
- `idx_user_active` (is_active)

**State Transitions**:
```
                  ┌─────────────┐
    create()      │   CREATED   │
   ──────────────►│ is_active=F │
                  └──────┬──────┘
                         │ activate()
                         ▼
                  ┌─────────────┐
                  │   ACTIVE    │◄──────┐
                  │ is_active=T │       │ reactivate()
                  └──────┬──────┘       │
                         │ deactivate() │
                         ▼              │
                  ┌─────────────┐       │
                  │  INACTIVE   │───────┘
                  │ is_active=F │
                  └─────────────┘
```

---

### 2. UserGroupAssignment (NEW)

**Location**: `auth-service`
**Table**: `user_group_assignments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| user_id | UUID | PK, FK(users.id) | User reference |
| truck_group_id | UUID | PK | Group ID (cross-service) |
| assigned_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Assignment timestamp |

**Note**: `truck_group_id` has no FK constraint (different database).

---

### 3. Truck (MODIFIED)

**Location**: `location-service`
**Table**: `trucks`
**Changes**: Remove `truck_group_id`, use join table instead

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| truck_id | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable ID |
| license_plate | VARCHAR(100) | UNIQUE | Immatriculation |
| driver_name | VARCHAR(100) | NULL | Current driver |
| driver_phone | VARCHAR(50) | NULL | Driver contact |
| vehicle_type | VARCHAR(50) | NOT NULL | Truck type |
| status | ENUM | NOT NULL, DEFAULT OFFLINE | Current status |
| current_latitude | DECIMAL(10,8) | NULL | Last known lat |
| current_longitude | DECIMAL(11,8) | NULL | Last known lng |
| current_speed | DECIMAL(5,2) | NULL | km/h |
| current_heading | INT | NULL | Degrees 0-359 |
| last_update | TIMESTAMP | NULL | Last GPS update |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last modification |

**Status Enum**:
- `ACTIVE` - Moving, speed > 0
- `IDLE` - Stopped, speed = 0
- `OFFLINE` - No GPS signal
- `OUT_OF_SERVICE` - Admin marked inactive

---

### 4. TruckGroupAssignment (NEW)

**Location**: `location-service`
**Table**: `truck_group_assignments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| truck_id | UUID | PK, FK(trucks.id) ON DELETE CASCADE | Truck reference |
| truck_group_id | UUID | PK, FK(truck_groups.id) ON DELETE CASCADE | Group reference |
| assigned_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Assignment timestamp |

---

### 5. TruckGroup (EXISTING)

**Location**: `location-service`
**Table**: `truck_groups`
**Changes**: None

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Group name |
| description | VARCHAR(500) | NULL | Group description |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last modification |

---

### 6. SystemConfig (NEW)

**Location**: `location-service`
**Table**: `system_config`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| config_key | VARCHAR(100) | UNIQUE, NOT NULL | Configuration key |
| config_value | VARCHAR(500) | NOT NULL | Configuration value |
| description | VARCHAR(500) | NULL | Human-readable description |
| version | INT | NOT NULL, DEFAULT 1 | Optimistic locking |
| updated_by | UUID | NOT NULL | Admin who last modified |
| updated_at | TIMESTAMP | NOT NULL | Last modification |

**Predefined Keys**:
| Key | Default | Description |
|-----|---------|-------------|
| `alert.speed_limit_default` | `120` | Default speed limit (km/h) |
| `alert.offline_threshold_minutes` | `5` | Minutes before offline status |
| `alert.idle_threshold_minutes` | `10` | Minutes before idle alert |

---

### 7. ConfigHistory (NEW)

**Location**: `location-service`
**Table**: `config_history`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| config_key | VARCHAR(100) | NOT NULL | Configuration key |
| old_value | VARCHAR(500) | NULL | Previous value |
| new_value | VARCHAR(500) | NOT NULL | New value |
| changed_by | UUID | NOT NULL | Admin who changed |
| changed_at | TIMESTAMP | NOT NULL | Change timestamp |

---

### 8. AuditLog (NEW)

**Location**: Both `auth-service` and `location-service`
**Table**: `audit_logs`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| action | ENUM | NOT NULL | CREATE, UPDATE, DELETE, DEACTIVATE, REACTIVATE |
| entity_type | VARCHAR(50) | NOT NULL | USER, TRUCK, GROUP, CONFIG |
| entity_id | UUID | NOT NULL | ID of affected entity |
| user_id | UUID | NOT NULL | Admin who performed action |
| changes | JSONB | NULL | JSON diff of changes |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() | Action timestamp |

**Indexes**:
- `idx_audit_entity` (entity_type, entity_id)
- `idx_audit_user` (user_id)
- `idx_audit_timestamp` (timestamp)

**Retention**: 90 days minimum (FR-005a)

---

## Validation Rules

### User
| Field | Rule | Error Message |
|-------|------|---------------|
| email | Valid email format | "Email must be valid" |
| email | Unique | "Email already exists" |
| password | Min 8 chars, 1 upper, 1 lower, 1 digit | "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit" |
| first_name | Not blank, max 100 | "First name is required" |
| last_name | Not blank, max 100 | "Last name is required" |
| role | Valid enum value | "Invalid role" |

### Truck
| Field | Rule | Error Message |
|-------|------|---------------|
| truck_id | Not blank, unique | "Truck ID is required and must be unique" |
| license_plate | Unique if provided | "License plate already exists" |
| vehicle_type | Not blank | "Vehicle type is required" |

### TruckGroup
| Field | Rule | Error Message |
|-------|------|---------------|
| name | Not blank, max 100 | "Group name is required" |

### SystemConfig
| Field | Rule | Error Message |
|-------|------|---------------|
| config_value | Numeric for thresholds | "Value must be a valid number" |
| config_value | Positive for thresholds | "Value must be positive" |

---

## Migration Scripts

### V20__add_user_group_assignments.sql (auth-service)
```sql
CREATE TABLE user_group_assignments (
    user_id UUID NOT NULL,
    truck_group_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, truck_group_id),
    CONSTRAINT fk_user_group_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_groups_user ON user_group_assignments(user_id);
CREATE INDEX idx_user_groups_group ON user_group_assignments(truck_group_id);
```

### V21__add_audit_logs.sql (auth-service)
```sql
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'REACTIVATE');

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL,
    changes JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

### V22__migrate_truck_groups.sql (location-service)
```sql
-- Create new join table
CREATE TABLE truck_group_assignments (
    truck_id UUID NOT NULL,
    truck_group_id UUID NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (truck_id, truck_group_id),
    CONSTRAINT fk_truck_assign_truck FOREIGN KEY (truck_id)
        REFERENCES trucks(id) ON DELETE CASCADE,
    CONSTRAINT fk_truck_assign_group FOREIGN KEY (truck_group_id)
        REFERENCES truck_groups(id) ON DELETE CASCADE
);

-- Migrate existing assignments
INSERT INTO truck_group_assignments (truck_id, truck_group_id, assigned_at)
SELECT id, truck_group_id, created_at
FROM trucks
WHERE truck_group_id IS NOT NULL;

-- Make truck_group_id nullable first (for rollback safety)
ALTER TABLE trucks ALTER COLUMN truck_group_id DROP NOT NULL;

CREATE INDEX idx_truck_groups_truck ON truck_group_assignments(truck_id);
CREATE INDEX idx_truck_groups_group ON truck_group_assignments(truck_group_id);
```

### V23__add_system_config.sql (location-service)
```sql
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(500) NOT NULL,
    description VARCHAR(500),
    version INT NOT NULL DEFAULT 1,
    updated_by UUID NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE config_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL,
    old_value VARCHAR(500),
    new_value VARCHAR(500) NOT NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default values
INSERT INTO system_config (config_key, config_value, description, updated_by)
VALUES
    ('alert.speed_limit_default', '120', 'Default speed limit in km/h', '00000000-0000-0000-0000-000000000000'),
    ('alert.offline_threshold_minutes', '5', 'Minutes before truck marked offline', '00000000-0000-0000-0000-000000000000'),
    ('alert.idle_threshold_minutes', '10', 'Minutes before idle alert triggered', '00000000-0000-0000-0000-000000000000');

CREATE INDEX idx_config_history_key ON config_history(config_key);
CREATE INDEX idx_config_history_time ON config_history(changed_at);
```

### V24__add_location_audit_logs.sql (location-service)
```sql
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'REACTIVATE');

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL,
    changes JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

### V25__drop_truck_group_id.sql (location-service)
```sql
-- Run AFTER verifying migration success
ALTER TABLE trucks DROP COLUMN truck_group_id;
DROP INDEX IF EXISTS idx_trucks_truck_group;
```
