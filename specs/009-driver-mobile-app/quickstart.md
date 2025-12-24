# Quickstart: Driver Mobile App

**Feature**: 009-driver-mobile-app
**Date**: 2025-12-24

## Prerequisites

- Node.js 18+ and npm/yarn
- React Native CLI (`npm install -g react-native-cli`)
- Xcode 15+ (for iOS development)
- Android Studio with SDK 29+ (for Android development)
- Backend services running (Auth, GPS Ingestion, Location)

## Project Setup

```bash
# Create React Native project
npx react-native init TruckTrackDriver --template react-native-template-typescript

# Navigate to project
cd TruckTrackDriver

# Install core dependencies
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-maps
npm install @react-native-async-storage/async-storage
npm install axios @tanstack/react-query
npm install zustand
npm install @nozbe/watermelondb
npm install react-native-background-geolocation
npm install @react-native-firebase/app @react-native-firebase/messaging
npm install react-native-keychain
npm install date-fns

# Install dev dependencies
npm install -D @types/react @types/react-native
npm install -D jest @testing-library/react-native
npm install -D detox

# iOS setup
cd ios && pod install && cd ..
```

## Integration Scenarios

### Scenario 1: Driver Login Flow

```typescript
// Test: Driver can login with valid credentials
// Expected: Receives JWT tokens, navigates to home screen

import { authService } from './services/auth';

async function testLoginFlow() {
  // Given a driver with valid credentials
  const credentials = {
    email: 'driver@trucktrack.com',
    password: 'DriverPass123!'
  };

  // When the driver logs in
  const response = await authService.login(credentials);

  // Then tokens are received and stored
  expect(response.accessToken).toBeDefined();
  expect(response.refreshToken).toBeDefined();
  expect(response.user.role).toBe('DRIVER');

  // And tokens are securely stored
  const storedToken = await authService.getAccessToken();
  expect(storedToken).toBe(response.accessToken);
}
```

### Scenario 2: GPS Tracking Background

```typescript
// Test: GPS positions are tracked and sent while app is backgrounded
// Expected: Positions queued locally, batch sent every 30s

import { gpsService } from './services/gps';

async function testBackgroundGpsTracking() {
  // Given a logged-in driver with AVAILABLE status
  await authService.login({ email: 'driver@test.com', password: 'Test123!' });
  await statusService.updateStatus('AVAILABLE');

  // When GPS tracking is started
  await gpsService.startTracking();

  // Then positions are captured every 10 seconds
  await wait(15000); // Wait 15 seconds
  const positions = await gpsService.getQueuedPositions();
  expect(positions.length).toBeGreaterThanOrEqual(1);

  // And positions are batched and sent
  await gpsService.syncPositions();
  const remaining = await gpsService.getQueuedPositions();
  expect(remaining.length).toBe(0);
}
```

### Scenario 3: Status Change

```typescript
// Test: Driver can change status and it syncs to server
// Expected: Status updates locally and on server

import { statusService } from './services/status';

async function testStatusChange() {
  // Given a driver with AVAILABLE status
  const initialStatus = await statusService.getStatus();
  expect(initialStatus.status).toBe('AVAILABLE');

  // When the driver changes to ON_BREAK
  const newStatus = await statusService.updateStatus('ON_BREAK');

  // Then status is updated locally
  expect(newStatus.status).toBe('ON_BREAK');

  // And GPS tracking is paused (battery saving)
  const trackingActive = await gpsService.isTracking();
  expect(trackingActive).toBe(false);
}
```

### Scenario 4: Offline Trip Viewing

```typescript
// Test: Driver can view trips when offline
// Expected: Cached trips are displayed

import { tripService } from './services/trips';
import { offlineService } from './services/offline';

async function testOfflineTripViewing() {
  // Given trips are cached while online
  await tripService.syncTrips();
  const onlineTrips = await tripService.getTrips();
  expect(onlineTrips.length).toBeGreaterThan(0);

  // When network is lost
  await offlineService.simulateOffline();

  // Then cached trips are still available
  const offlineTrips = await tripService.getTrips();
  expect(offlineTrips).toEqual(onlineTrips);

  // And offline indicator is shown
  const isOffline = await offlineService.isOffline();
  expect(isOffline).toBe(true);
}
```

### Scenario 5: Push Notification Handling

```typescript
// Test: Driver receives and can act on push notifications
// Expected: Notification displayed, tap navigates to relevant screen

import { notificationService } from './services/notifications';

async function testPushNotificationHandling() {
  // Given FCM token is registered
  await notificationService.registerToken();

  // When a MESSAGE notification is received
  const notification = {
    type: 'MESSAGE',
    title: 'New message from Dispatch',
    body: 'Please confirm delivery ETA',
    data: { messageId: 'msg-123' }
  };
  await notificationService.handleNotification(notification);

  // Then notification is stored locally
  const notifications = await notificationService.getNotifications();
  expect(notifications[0].title).toBe('New message from Dispatch');

  // And tapping navigates to messages screen
  const route = notificationService.getNavigationRoute(notification);
  expect(route).toBe('/messages');
}
```

### Scenario 6: Message Sync

```typescript
// Test: Messages sync bidirectionally
// Expected: Sent messages queued offline, received messages displayed

import { messageService } from './services/messages';

async function testMessageSync() {
  // Given driver is online
  const messages = await messageService.getMessages();
  const initialCount = messages.length;

  // When driver sends a message offline
  await offlineService.simulateOffline();
  await messageService.sendMessage('Stuck in traffic, 20min delay');

  // Then message is queued
  const pending = await messageService.getPendingMessages();
  expect(pending.length).toBe(1);

  // When connection is restored
  await offlineService.restoreConnection();
  await messageService.syncMessages();

  // Then message is sent and queue is empty
  const stillPending = await messageService.getPendingMessages();
  expect(stillPending.length).toBe(0);
}
```

## Environment Configuration

```typescript
// src/constants/config.ts
export const Config = {
  API_BASE_URL: __DEV__
    ? 'http://localhost:8000'
    : 'https://api.trucktrack.com',

  GPS_INTERVAL_ACTIVE: 10000,    // 10 seconds
  GPS_INTERVAL_LOW_BATTERY: 30000, // 30 seconds
  GPS_BATCH_SIZE: 3,
  GPS_SYNC_INTERVAL: 30000,     // 30 seconds

  SESSION_TIMEOUT_DAYS: 7,

  TRIP_CACHE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours

  LOW_BATTERY_THRESHOLD: 15,    // 15%
};
```

## Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Run E2E tests (Detox)
detox test --configuration ios.sim.debug
```

## Backend Integration Checklist

- [ ] Auth Service: `/auth/login`, `/auth/refresh` endpoints ready
- [ ] Auth Service: Add `/drivers/me/fcm-token` endpoint
- [ ] Location Service: Add `/drivers/me/status` endpoints
- [ ] Location Service: Add `/drivers/me/trips` endpoint
- [ ] GPS Ingestion: Verify `/gps/positions` accepts batch format
- [ ] Notification Service: Configure FCM integration
- [ ] New: Add messaging endpoints or integrate with existing service

## Testing Credentials

| Role | Email | Password |
|------|-------|----------|
| Driver | driver@trucktrack.com | DriverPass123! |
| Driver 2 | driver2@trucktrack.com | DriverPass123! |

## Common Issues

### iOS Location Permissions
Add to `Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>TruckTrack needs your location to track deliveries</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>TruckTrack needs background location for delivery tracking</string>
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

### Android Background Location
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```
