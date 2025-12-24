# Research: Driver Mobile App

**Feature**: 009-driver-mobile-app
**Date**: 2025-12-24

## Technology Decisions

### 1. Mobile Framework

**Decision**: React Native 0.73+

**Rationale**:
- Cross-platform (iOS + Android) from single codebase
- Team already familiar with React/TypeScript (frontend web uses Angular, but React Native is more mature for mobile)
- Large ecosystem with community support
- Good performance for GPS and map-heavy applications
- Easier integration with existing REST APIs

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Flutter | Less mature ecosystem for background location, team would need to learn Dart |
| Native (Swift/Kotlin) | 2x development cost, requires separate codebases |
| Expo | Limited native module access for background GPS |

### 2. Background GPS Tracking

**Decision**: react-native-background-geolocation (Transistor Software)

**Rationale**:
- Industry-leading solution for background location tracking
- Handles iOS/Android differences automatically
- Built-in battery optimization
- Supports geofencing, motion detection
- Excellent documentation
- Used by major fleet management apps

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| expo-location | Limited background capabilities |
| react-native-geolocation-service | Foreground only, no background support |
| Custom native modules | High development/maintenance cost |

### 3. Map Library

**Decision**: react-native-maps with Google Maps (Android) / Apple Maps (iOS)

**Rationale**:
- Native map rendering (best performance)
- Platform-native look and feel
- Free tier sufficient for driver app (no heavy user count)
- Supports markers, polylines, clustering
- Integrates well with navigation intent launchers

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Mapbox | Additional licensing cost, overkill for simple driver map |
| Leaflet (WebView) | Poor performance, not native feel |

### 4. Push Notifications

**Decision**: Firebase Cloud Messaging (FCM) + Apple Push Notification Service (APNs)

**Rationale**:
- FCM works for both platforms (routes to APNs for iOS)
- Free unlimited notifications
- Backend already uses notification-service that can integrate with FCM
- Good delivery reliability
- Supports data-only messages for silent updates

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| OneSignal | Additional vendor dependency |
| Custom solution | High complexity, lower reliability |
| AWS SNS | More complex setup for mobile |

### 5. Offline Storage & Sync

**Decision**: WatermelonDB (SQLite-based) + AsyncStorage

**Rationale**:
- WatermelonDB: High-performance local database with sync capabilities
- Handles large datasets (trips, messages history)
- Lazy loading for better memory usage
- AsyncStorage: Simple key-value for settings, tokens
- Both work offline seamlessly

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Realm | Sync features require paid Realm Cloud |
| SQLite raw | Low-level, more boilerplate code |
| Redux Persist | Not suitable for large datasets |

### 6. State Management

**Decision**: Zustand

**Rationale**:
- Lightweight, minimal boilerplate
- TypeScript-first design
- No providers/context wrapping needed
- Easy to persist with AsyncStorage
- Simpler than Redux for this scope

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Redux Toolkit | Overkill for 6 screens, more boilerplate |
| MobX | Less familiar to team |
| Context API | Performance issues with frequent updates (GPS) |

### 7. Navigation

**Decision**: React Navigation 6

**Rationale**:
- De facto standard for React Native
- Native stack navigation (best performance)
- Deep linking support for push notifications
- TypeScript support
- Active maintenance

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| expo-router | Requires Expo managed workflow |
| React Native Navigation (Wix) | More complex setup |

### 8. API Communication

**Decision**: Axios + React Query

**Rationale**:
- Axios: Familiar, interceptors for JWT refresh
- React Query: Caching, background refresh, offline support
- Automatic retry on network errors
- Optimistic updates for better UX

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| fetch API | No interceptors, more boilerplate |
| Apollo Client | Not using GraphQL |
| SWR | Less features than React Query for offline |

## Integration Points

### Existing Backend Services

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Auth Service | POST /auth/login | Driver authentication |
| Auth Service | POST /auth/refresh | Token refresh |
| Auth Service | GET /auth/me | Get driver profile |
| GPS Ingestion | POST /gps/positions | Send GPS positions (batch) |
| Location Service | GET /trucks/{id}/status | Get/update driver status |
| Location Service | PUT /trucks/{id}/status | Update driver status |
| Location Service | GET /trips/driver/{id} | Get assigned trips |
| Notification Service | WebSocket /ws/notifications | Real-time notifications |

### New Backend Endpoints Required

| Endpoint | Purpose | Service |
|----------|---------|---------|
| POST /drivers/{id}/fcm-token | Register FCM token | Auth Service |
| DELETE /drivers/{id}/fcm-token | Unregister FCM token | Auth Service |
| GET /messages/driver/{id} | Get messages for driver | New: Messaging (or Location Service) |
| POST /messages | Send message to dispatch | New: Messaging (or Location Service) |
| PUT /messages/{id}/read | Mark message as read | New: Messaging (or Location Service) |

## Performance Considerations

### Battery Optimization

- GPS updates every 10 seconds when AVAILABLE or IN_DELIVERY
- GPS paused when ON_BREAK or OFF_DUTY
- Reduce to 30 seconds when battery < 15%
- Use significant location changes when app backgrounded long time
- Batch GPS uploads (every 30 seconds or 3 positions)

### Network Optimization

- Compress GPS data (msgpack or protobuf optional future)
- Queue requests when offline
- Exponential backoff for retries
- Background sync when connection restored

### Memory Management

- Lazy load trip details
- Pagination for message history
- Clear old cached data (>7 days)
- Use FlatList with virtualization

## Security Considerations

- JWT tokens stored in Keychain (iOS) / EncryptedSharedPreferences (Android)
- Certificate pinning for API calls
- Biometric authentication option (future)
- Session timeout after 7 days inactivity
- Automatic logout on account deactivation

## Testing Strategy

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit | Jest | 80% |
| Component | React Native Testing Library | Key components |
| Integration | Jest + MSW | API integrations |
| E2E | Detox | Critical flows (login, status change, GPS) |

## Open Questions Resolved

1. **Q**: React Native ou Flutter?
   **A**: React Native - meilleure intégration background GPS, équipe TypeScript

2. **Q**: Comment gérer le GPS en arrière-plan sur iOS?
   **A**: react-native-background-geolocation avec mode "always" location permission

3. **Q**: Comment synchroniser les données offline?
   **A**: WatermelonDB pour la persistance, queue custom pour GPS/messages

4. **Q**: Firebase ou autre pour les push notifications?
   **A**: Firebase Cloud Messaging - gratuit, fiable, cross-platform
