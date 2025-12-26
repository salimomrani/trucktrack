# Data Model: Trip Management System

**Date**: 2025-12-26
**Feature**: 010-trip-management

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRIP MANAGEMENT                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │    Trip      │       │    Truck     │
│  (auth-svc)  │       │ (loc-svc)    │       │  (loc-svc)   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ driverId(FK) │       │ id (PK)      │
│ email        │       │ truckId (FK) │──────►│ truckId      │
│ firstName    │       │ origin       │       │ driverName   │
│ lastName     │       │ destination  │       │ status       │
│ role         │       │ status       │       │ ...          │
│ expoPushToken│       │ scheduledAt  │       └──────────────┘
└──────────────┘       │ notes        │
                       │ createdBy(FK)│
                       │ ...          │
                       └──────┬───────┘
                              │
                              │ 1:N
                              ▼
                       ┌──────────────────┐
                       │ TripStatusHistory│
                       ├──────────────────┤
                       │ id (PK)          │
                       │ tripId (FK)      │
                       │ previousStatus   │
                       │ newStatus        │
                       │ changedBy (FK)   │
                       │ changedAt        │
                       │ notes            │
                       └──────────────────┘
```

---

## Entities

### Trip (NEW)

Primary entity representing a delivery assignment.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| origin | VARCHAR(500) | NOT NULL | Starting address/location |
| destination | VARCHAR(500) | NOT NULL | Delivery address/location |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | Current trip status |
| scheduledAt | TIMESTAMP | NULL | Planned departure time |
| startedAt | TIMESTAMP | NULL | When driver started trip |
| completedAt | TIMESTAMP | NULL | When driver completed trip |
| notes | TEXT | NULL | Instructions from dispatcher |
| assignedTruckId | UUID | FK → trucks.id, NULL | Assigned truck |
| assignedDriverId | UUID | NULL | References User.id in auth-service |
| createdBy | UUID | NOT NULL | Dispatcher/Admin who created trip |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | NOT NULL | Last modification |

**Indexes**:
- `idx_trips_status` on (status)
- `idx_trips_driver` on (assignedDriverId)
- `idx_trips_truck` on (assignedTruckId)
- `idx_trips_scheduled` on (scheduledAt)
- `idx_trips_created` on (createdAt DESC)

**Business Rules**:
- `assignedTruckId` and `assignedDriverId` MUST both be set when status = ASSIGNED
- `startedAt` MUST be set when status = IN_PROGRESS
- `completedAt` MUST be set when status = COMPLETED
- Only PENDING trips can be deleted (soft-delete via CANCELLED status)

---

### TripStatus (NEW - Enum)

Enumeration of valid trip states.

| Value | Description | Next Valid States |
|-------|-------------|-------------------|
| PENDING | Created but not yet assigned | ASSIGNED, CANCELLED |
| ASSIGNED | Assigned to truck and driver | IN_PROGRESS, CANCELLED |
| IN_PROGRESS | Driver has started the trip | COMPLETED, CANCELLED |
| COMPLETED | Trip successfully completed | (terminal) |
| CANCELLED | Trip was cancelled | (terminal) |

**State Transition Diagram**:
```
     ┌─────────────────────────────────────────────────────┐
     │                     CANCELLED                        │
     └─────────────────────────────────────────────────────┘
              ▲              ▲              ▲
              │              │              │
     ┌────────┴───┐   ┌──────┴─────┐   ┌────┴────────┐
     │   PENDING  │──►│  ASSIGNED  │──►│ IN_PROGRESS │──►┌──────────┐
     └────────────┘   └────────────┘   └─────────────┘   │COMPLETED │
                                                         └──────────┘
```

---

### TripStatusHistory (NEW)

Audit trail for all status changes.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| tripId | UUID | FK → trips.id, NOT NULL | Reference to trip |
| previousStatus | ENUM | NULL | Status before change (NULL for creation) |
| newStatus | ENUM | NOT NULL | Status after change |
| changedBy | UUID | NOT NULL | User who made the change |
| changedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | When change occurred |
| notes | VARCHAR(500) | NULL | Optional note (e.g., cancellation reason) |

**Indexes**:
- `idx_trip_history_trip` on (tripId, changedAt DESC)

---

## Existing Entity Modifications

### User (auth-service)

Add field for push notification support.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| expoPushToken | VARCHAR(100) | NULL | Expo push notification token |

**Migration**: `V11__add_expo_push_token.sql`

---

## Database Migration Scripts

### V11__create_trips_table.sql (location-service)

```sql
-- Trip status enum
CREATE TYPE trip_status AS ENUM (
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

-- Trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin VARCHAR(500) NOT NULL,
    destination VARCHAR(500) NOT NULL,
    status trip_status NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    assigned_truck_id UUID REFERENCES trucks(id),
    assigned_driver_id UUID,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_driver ON trips(assigned_driver_id);
CREATE INDEX idx_trips_truck ON trips(assigned_truck_id);
CREATE INDEX idx_trips_scheduled ON trips(scheduled_at);
CREATE INDEX idx_trips_created ON trips(created_at DESC);

-- Trip status history table
CREATE TABLE trip_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    previous_status trip_status,
    new_status trip_status NOT NULL,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes VARCHAR(500)
);

CREATE INDEX idx_trip_history_trip ON trip_status_history(trip_id, changed_at DESC);
```

### V12__add_expo_push_token.sql (auth-service)

```sql
ALTER TABLE users ADD COLUMN expo_push_token VARCHAR(100);
```

---

## Validation Rules

### Trip Creation
- `origin` and `destination` are required, max 500 characters
- `scheduledAt` must be in the future if provided
- `createdBy` must be a valid user with DISPATCHER or ADMIN role

### Trip Assignment
- `assignedTruckId` must reference an existing truck with status NOT IN (MAINTENANCE, OUT_OF_SERVICE)
- `assignedDriverId` must be a valid user with DRIVER role
- Both `assignedTruckId` and `assignedDriverId` must be provided together

### Status Transitions
- PENDING → ASSIGNED: Requires truck and driver assignment
- ASSIGNED → IN_PROGRESS: Only the assigned driver can perform
- IN_PROGRESS → COMPLETED: Only the assigned driver can perform
- Any → CANCELLED: Only DISPATCHER or ADMIN can cancel

---

## Sample Data

```sql
-- Sample trip
INSERT INTO trips (origin, destination, status, scheduled_at, assigned_truck_id, assigned_driver_id, created_by) VALUES
('Entrepôt Paris Nord', 'Centre Distribution Lyon', 'ASSIGNED', '2025-12-27 08:00:00+01',
 'existing-truck-uuid', 'driver-user-uuid', 'dispatcher-user-uuid');

-- Sample history entry
INSERT INTO trip_status_history (trip_id, previous_status, new_status, changed_by) VALUES
('trip-uuid', 'PENDING', 'ASSIGNED', 'dispatcher-user-uuid');
```
