# Data Model: Driver Mobile App

**Feature**: 009-driver-mobile-app
**Date**: 2025-12-24

## Local Entities (Mobile Storage)

### DriverSession

Stores the authenticated driver's session information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | UUID | Yes | Driver's unique identifier |
| email | string | Yes | Driver's email |
| firstName | string | Yes | Driver's first name |
| lastName | string | Yes | Driver's last name |
| truckId | UUID | No | Assigned truck ID |
| truckName | string | No | Assigned truck name/license |
| accessToken | string | Yes | JWT access token |
| refreshToken | string | Yes | JWT refresh token |
| expiresAt | timestamp | Yes | Token expiration time |
| createdAt | timestamp | Yes | Session creation time |

**Storage**: Keychain (iOS) / EncryptedSharedPreferences (Android)

### DriverStatus

Current status of the driver.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | enum | Yes | AVAILABLE, IN_DELIVERY, ON_BREAK, OFF_DUTY |
| updatedAt | timestamp | Yes | Last status update time |
| syncedAt | timestamp | No | Last sync with server |
| pendingSync | boolean | Yes | True if local change not synced |

**State Transitions**:
```
AVAILABLE <-> IN_DELIVERY
AVAILABLE <-> ON_BREAK
AVAILABLE <-> OFF_DUTY
IN_DELIVERY <-> ON_BREAK
IN_DELIVERY -> OFF_DUTY (requires confirmation)
ON_BREAK <-> OFF_DUTY
```

### GPSPosition

GPS position data point.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Local unique identifier |
| latitude | double | Yes | GPS latitude (-90 to 90) |
| longitude | double | Yes | GPS longitude (-180 to 180) |
| accuracy | float | Yes | Position accuracy in meters |
| speed | float | No | Speed in m/s |
| heading | float | No | Heading in degrees (0-360) |
| altitude | float | No | Altitude in meters |
| timestamp | timestamp | Yes | When position was captured |
| synced | boolean | Yes | True if sent to server |
| syncedAt | timestamp | No | When sent to server |

**Validation**:
- latitude: -90 <= value <= 90
- longitude: -180 <= value <= 180
- accuracy: value > 0
- speed: value >= 0
- heading: 0 <= value < 360

### Trip

Assigned trip/delivery for the driver.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Trip unique identifier |
| pickupAddress | string | Yes | Pickup location address |
| pickupLat | double | Yes | Pickup latitude |
| pickupLng | double | Yes | Pickup longitude |
| deliveryAddress | string | Yes | Delivery location address |
| deliveryLat | double | Yes | Delivery latitude |
| deliveryLng | double | Yes | Delivery longitude |
| clientName | string | Yes | Client/recipient name |
| clientPhone | string | No | Client phone number |
| scheduledTime | timestamp | Yes | Scheduled pickup/delivery time |
| status | enum | Yes | PENDING, IN_PROGRESS, COMPLETED, CANCELLED |
| notes | string | No | Additional notes |
| createdAt | timestamp | Yes | When trip was created |
| updatedAt | timestamp | Yes | Last update time |
| cachedAt | timestamp | Yes | When cached locally |

**Trip Status Transitions**:
```
PENDING -> IN_PROGRESS (driver starts)
IN_PROGRESS -> COMPLETED (driver finishes)
PENDING -> CANCELLED (dispatch cancels)
IN_PROGRESS -> CANCELLED (dispatch cancels)
```

### Message

Chat message between driver and dispatch.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Message unique identifier |
| senderId | UUID | Yes | Sender user ID |
| senderType | enum | Yes | DRIVER, DISPATCH |
| content | string | Yes | Message text content |
| timestamp | timestamp | Yes | When message was sent |
| isRead | boolean | Yes | Read by recipient |
| synced | boolean | Yes | True if sent to server |
| syncedAt | timestamp | No | When synced |

### PushNotification

Received push notification.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Notification unique identifier |
| type | enum | Yes | ALERT, GEOFENCE, MESSAGE, SYSTEM |
| title | string | Yes | Notification title |
| body | string | Yes | Notification body text |
| data | json | No | Additional payload data |
| receivedAt | timestamp | Yes | When received |
| isRead | boolean | Yes | Read by driver |
| actionUrl | string | No | Deep link to open |

**Notification Types**:
- `ALERT`: Speed, geofence, maintenance alerts
- `GEOFENCE`: Zone entry/exit notifications
- `MESSAGE`: New message from dispatch
- `SYSTEM`: App updates, account changes

### AppSettings

User preferences and settings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| notificationsEnabled | boolean | Yes | Push notifications on/off |
| soundEnabled | boolean | Yes | Notification sounds |
| vibrationEnabled | boolean | Yes | Vibration on notification |
| language | string | Yes | App language (fr, en) |
| theme | enum | Yes | LIGHT, DARK, SYSTEM |
| mapType | enum | Yes | STANDARD, SATELLITE, HYBRID |
| lastSyncAt | timestamp | No | Last full data sync |

## Entity Relationships

```
DriverSession (1) -------- (1) DriverStatus
      |
      |--- (1) -------- (*) GPSPosition
      |
      |--- (1) -------- (*) Trip
      |
      |--- (1) -------- (*) Message
      |
      |--- (1) -------- (*) PushNotification
      |
      |--- (1) -------- (1) AppSettings
```

## Sync Strategy

### GPS Positions
- **Offline**: Store locally with `synced=false`
- **Online**: Batch send every 30 seconds or when 3+ positions queued
- **Conflict**: Server always wins (positions are immutable)

### Driver Status
- **Offline**: Store locally with `pendingSync=true`
- **Online**: Send immediately on change
- **Conflict**: Latest timestamp wins

### Trips
- **Direction**: Server -> Mobile only (read-only)
- **Sync**: Pull on app open, background refresh every 5 minutes
- **Conflict**: Server always wins

### Messages
- **Offline**: Queue outgoing with `synced=false`
- **Online**: Send immediately, receive via WebSocket
- **Conflict**: Append-only, no conflicts

## Database Schema (WatermelonDB)

```javascript
// schema.js
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'gps_positions',
      columns: [
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'accuracy', type: 'number' },
        { name: 'speed', type: 'number', isOptional: true },
        { name: 'heading', type: 'number', isOptional: true },
        { name: 'altitude', type: 'number', isOptional: true },
        { name: 'timestamp', type: 'number' },
        { name: 'synced', type: 'boolean' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'trips',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'pickup_address', type: 'string' },
        { name: 'pickup_lat', type: 'number' },
        { name: 'pickup_lng', type: 'number' },
        { name: 'delivery_address', type: 'string' },
        { name: 'delivery_lat', type: 'number' },
        { name: 'delivery_lng', type: 'number' },
        { name: 'client_name', type: 'string' },
        { name: 'client_phone', type: 'string', isOptional: true },
        { name: 'scheduled_time', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'cached_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'sender_id', type: 'string' },
        { name: 'sender_type', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'timestamp', type: 'number' },
        { name: 'is_read', type: 'boolean' },
        { name: 'synced', type: 'boolean' },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'data', type: 'string', isOptional: true },
        { name: 'received_at', type: 'number' },
        { name: 'is_read', type: 'boolean' },
        { name: 'action_url', type: 'string', isOptional: true },
      ],
    }),
  ],
});
```
