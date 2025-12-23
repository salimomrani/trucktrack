# Data Model: Gestion des Droits et Permissions (RBAC)

**Feature**: 008-rbac-permissions | **Date**: 2025-12-23

## Entity Overview

```
┌──────────────┐     ┌───────────────────────┐     ┌─────────────┐
│    User      │─────│  UserGroupAssignment  │─────│ TruckGroup  │
│  (existing)  │ 1:N │      (existing)       │ N:1 │  (existing) │
└──────────────┘     └───────────────────────┘     └─────────────┘
       │
       │ has
       ▼
┌──────────────┐
│   UserRole   │
│  (existing)  │
│    enum      │
└──────────────┘
       │
       │ defines
       ▼
┌────────────────────┐
│  RolePermissions   │
│      (NEW)         │
│   static class     │
└────────────────────┘
       │
       │ grants access to
       ▼
┌──────────────┐
│    Page      │
│  (concept)   │
└──────────────┘
```

## Existing Entities (No Modification)

### User

**Location**: `backend/auth-service/src/main/java/com/trucktrack/auth/model/User.java`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| username | String | Email address |
| password | String | BCrypt hash |
| role | UserRole | Single role enum |
| active | Boolean | Account status |
| createdAt | Instant | Creation timestamp |
| updatedAt | Instant | Last update |

### UserRole (Enum)

**Location**: `backend/auth-service/src/main/java/com/trucktrack/auth/model/UserRole.java`

| Value | Description |
|-------|-------------|
| ADMIN | Full system access |
| FLEET_MANAGER | Manage assigned groups |
| DISPATCHER | View/manage trucks in assigned groups |
| DRIVER | Mobile app, own truck only |
| VIEWER | Read-only access |

### UserGroupAssignment

**Location**: `backend/auth-service/src/main/java/com/trucktrack/auth/model/UserGroupAssignment.java`

| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | FK to User |
| truckGroupId | UUID | FK to TruckGroup (cross-service) |
| assignedAt | Instant | Assignment timestamp |

**Composite PK**: (userId, truckGroupId)

### TruckGroup

**Location**: `backend/location-service/src/main/java/com/trucktrack/location/model/TruckGroup.java`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Group name |
| description | String | Optional description |
| createdAt | Instant | Creation timestamp |
| updatedAt | Instant | Last update |

## New Entities/Structures

### RolePermissions (Static Class)

**Location**: `backend/shared/src/main/java/com/trucktrack/common/security/RolePermissions.java`

**Purpose**: Define which roles can access which pages/resources.

```java
public final class RolePermissions {

    public enum Page {
        DASHBOARD,
        MAP,
        ANALYTICS,
        ADMIN,
        ALERTS,
        PROFILE
    }

    private static final Map<UserRole, Set<Page>> PERMISSIONS = Map.of(
        UserRole.ADMIN, Set.of(Page.values()),
        UserRole.FLEET_MANAGER, Set.of(DASHBOARD, MAP, ANALYTICS, ALERTS, PROFILE),
        UserRole.DISPATCHER, Set.of(DASHBOARD, MAP, ALERTS, PROFILE),
        UserRole.DRIVER, Set.of(DASHBOARD, ALERTS, PROFILE),
        UserRole.VIEWER, Set.of(DASHBOARD, MAP, ALERTS, PROFILE)
    );

    public static boolean canAccess(UserRole role, Page page) { ... }
    public static Set<Page> getAccessiblePages(UserRole role) { ... }
}
```

### UserPermissions (DTO)

**Location**: `backend/shared/src/main/java/com/trucktrack/common/dto/UserPermissions.java`

**Purpose**: Transfer permission data to frontend.

| Field | Type | Description |
|-------|------|-------------|
| userId | UUID | User identifier |
| role | String | Role name |
| accessiblePages | List<String> | Pages user can access |
| groupIds | List<UUID> | Groups assigned to user |

## Permission Matrix

| Page | ADMIN | FLEET_MANAGER | DISPATCHER | DRIVER | VIEWER |
|------|-------|---------------|------------|--------|--------|
| Dashboard | ✓ (all) | ✓ (groups) | ✓ (groups) | ✓ (own truck) | ✓ (read) |
| Map | ✓ | ✓ | ✓ | ✗ | ✓ |
| Analytics | ✓ | ✓ | ✗ | ✗ | ✗ |
| Admin | ✓ | ✗ | ✗ | ✗ | ✗ |
| Alerts | ✓ | ✓ | ✓ | ✓ (own) | ✓ (read) |
| Profile | ✓ | ✓ | ✓ | ✓ | ✓ |

## Data Filtering Rules

### By Role

| Role | Sees Data For |
|------|---------------|
| ADMIN | All trucks, all groups, all users |
| FLEET_MANAGER | Trucks in assigned groups only |
| DISPATCHER | Trucks in assigned groups only |
| DRIVER | Own assigned truck only |
| VIEWER | Trucks in assigned groups only (read-only) |

### Query Pattern

```java
// For roles with group filtering
@Query("SELECT t FROM Truck t WHERE t.group.id IN :groupIds")
List<Truck> findByGroupIds(@Param("groupIds") Set<UUID> groupIds);

// For DRIVER (by assigned truck)
@Query("SELECT t FROM Truck t WHERE t.assignedDriverId = :userId")
Optional<Truck> findByAssignedDriverId(@Param("userId") UUID userId);

// For ADMIN (no filter)
List<Truck> findAll();
```

## JWT Token Structure

```json
{
  "sub": "user@trucktrack.com",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "FLEET_MANAGER",
  "groupIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "iat": 1703318400,
  "exp": 1703404800
}
```

**Constraints**:
- Maximum 50 groupIds in token
- If user has >50 groups, query DB at runtime

## Database Schema (Existing)

```sql
-- Already exists in auth-service
CREATE TABLE user_truck_groups (
    user_id UUID NOT NULL REFERENCES users(id),
    truck_group_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, truck_group_id)
);

CREATE INDEX idx_user_truck_groups_user ON user_truck_groups(user_id);
CREATE INDEX idx_user_truck_groups_group ON user_truck_groups(truck_group_id);
```

No new tables required for V1.

## State Transitions

### Permission Update Flow

```
User permissions changed (by Admin)
          │
          ▼
┌─────────────────────┐
│ Update user_truck_  │
│ groups table        │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ User logs out       │
│ (or token expires)  │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ User logs in        │
│ New JWT generated   │
│ with updated groups │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ New permissions     │
│ active              │
└─────────────────────┘
```

**Note**: Permissions take effect on next login, not in real-time during active session (per spec assumptions).

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| UserGroupAssignment | userId | Must exist in users table |
| UserGroupAssignment | truckGroupId | Should exist in truck_groups (cross-service) |
| User | role | Must be valid UserRole enum value |
| JWT | groupIds | Maximum 50 entries |
