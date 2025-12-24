# TruckTrack Driver - Mobile App

Application mobile React Native pour les chauffeurs de la flotte TruckTrack.

## Fonctionnalités

- **Authentification** - Login sécurisé avec JWT (stockage Keychain)
- **GPS Tracking** - Suivi en arrière-plan avec optimisation batterie
- **Statut Chauffeur** - Available, In Delivery, On Break, Off Duty
- **Trajets** - Visualisation et gestion des livraisons assignées
- **Messagerie** - Communication bidirectionnelle avec le dispatch
- **Notifications Push** - Alertes en temps réel (Firebase)
- **Mode Offline** - Fonctionne sans connexion, sync automatique

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                     React Native 0.73                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Screens   │  │   Store     │  │  Services   │              │
│  │             │  │  (Zustand)  │  │             │              │
│  │  • Login    │  │             │  │  • API      │              │
│  │  • Home     │  │  • Auth     │  │  • GPS      │              │
│  │  • Map      │  │  • Status   │  │  • Push     │              │
│  │  • Trips    │  │  • Trips    │  │  • Offline  │              │
│  │  • Messages │  │  • Messages │  │             │              │
│  │  • Profile  │  │  • Settings │  │             │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
├──────────────────────────┼───────────────────────────────────────┤
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Native Modules                        │    │
│  │                                                          │    │
│  │  • Background Geolocation (GPS tracking)                │    │
│  │  • Firebase Messaging (Push notifications)               │    │
│  │  • Keychain (Secure token storage)                      │    │
│  │  • NetInfo (Network monitoring)                          │    │
│  │  • AsyncStorage (Local persistence)                      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ REST API / WebSocket
                               ▼
                    ┌─────────────────────┐
                    │    API Gateway      │
                    │      :8000          │
                    └─────────────────────┘
```

## Quick Start

### Prérequis

```bash
# Node.js 18+
node --version

# Pour Android
# - Android Studio avec SDK 34
# - Java 17

# Pour iOS (macOS uniquement)
# - Xcode 15+
# - CocoaPods
```

### Installation

```bash
cd mobile
npm install

# iOS uniquement
cd ios && pod install && cd ..
```

### Configuration Firebase

1. Créer un projet Firebase Console
2. Ajouter une application Android (`com.trucktrackdriver`)
3. Télécharger `google-services.json` → `android/app/`
4. Pour iOS: télécharger `GoogleService-Info.plist` → `ios/`

### Configuration Google Maps

1. Activer Maps SDK dans Google Cloud Console
2. Créer une clé API
3. Ajouter dans `android/app/src/main/res/values/strings.xml`:
```xml
<string name="google_maps_api_key">YOUR_API_KEY</string>
```

### Lancer l'application

```bash
# Metro bundler
npm start

# Android
npm run android
# ou
cd android && ./gradlew assembleDebug

# iOS
npm run ios
# ou
cd ios && xcodebuild -workspace TruckTrackDriver.xcworkspace -scheme TruckTrackDriver
```

## Structure du projet

```
mobile/
├── android/                    # Configuration Android native
│   ├── app/
│   │   ├── build.gradle       # Dependencies, SDK versions
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/.../MainActivity.kt
│   │   │   └── res/           # Resources, icons, styles
│   │   └── google-services.json  # Firebase config
│   └── build.gradle           # Root gradle config
│
├── ios/                        # Configuration iOS native
│   ├── TruckTrackDriver/
│   │   └── Info.plist
│   ├── Podfile
│   └── GoogleService-Info.plist  # Firebase config
│
├── src/
│   ├── components/            # UI Components
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── TextInput.tsx
│   │       ├── Card.tsx
│   │       ├── StatusBadge.tsx
│   │       └── LoadingOverlay.tsx
│   │
│   ├── screens/               # App Screens
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── main/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── MapScreen.tsx
│   │   │   ├── TripsScreen.tsx
│   │   │   ├── MessagesScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   ├── trips/
│   │   │   └── TripDetailScreen.tsx
│   │   ├── messages/
│   │   │   └── MessageDetailScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   │
│   ├── navigation/            # React Navigation
│   │   ├── AppNavigator.tsx   # Root navigator
│   │   ├── AuthNavigator.tsx  # Login flow
│   │   ├── MainNavigator.tsx  # Bottom tabs
│   │   └── types.ts           # Navigation types
│   │
│   ├── store/                 # Zustand State Management
│   │   ├── authStore.ts       # Auth state
│   │   ├── statusStore.ts     # Driver status
│   │   ├── tripsStore.ts      # Trips data
│   │   ├── messagesStore.ts   # Messages
│   │   └── settingsStore.ts   # App settings
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts      # Axios instance
│   │   │   └── interceptors.ts # JWT refresh
│   │   ├── auth/
│   │   │   ├── authService.ts # Login/logout
│   │   │   ├── tokenStorage.ts # Keychain
│   │   │   └── statusService.ts # Status API
│   │   ├── location/
│   │   │   └── gpsService.ts  # Background GPS
│   │   ├── notifications/
│   │   │   └── pushService.ts # FCM
│   │   └── offline/
│   │       └── syncService.ts # Offline queue
│   │
│   ├── hooks/
│   │   └── useGPSTracking.ts  # GPS hook
│   │
│   ├── types/
│   │   ├── entities.ts        # Domain models
│   │   └── api.ts             # API types
│   │
│   ├── constants/
│   │   ├── config.ts          # App config
│   │   └── theme.ts           # Colors, spacing
│   │
│   └── App.tsx                # Entry point
│
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

## API Endpoints utilisés

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login chauffeur |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh token |
| GET | `/drivers/me` | Profil chauffeur |
| GET | `/drivers/me/status` | Statut actuel |
| PUT | `/drivers/me/status` | Mettre à jour statut |
| GET | `/drivers/me/trips` | Trajets assignés |
| PUT | `/trips/{id}/status` | Update trip status |
| GET | `/drivers/me/messages` | Messages |
| POST | `/drivers/me/messages` | Envoyer message |
| POST | `/locations` | Envoyer position GPS |

## GPS Tracking

Le tracking GPS fonctionne en arrière-plan avec `react-native-background-geolocation`:

```typescript
// Configuration par défaut
{
  desiredAccuracy: HIGH,       // Précision maximale
  distanceFilter: 10,          // Mise à jour tous les 10m
  stopOnTerminate: false,      // Continue après fermeture app
  startOnBoot: true,           // Démarre au boot
  batchSync: true,             // Envoie par lots
  autoSync: true,              // Sync automatique
}
```

**Optimisation batterie:**
- Mode haute précision quand batterie > 15%
- Mode économie quand batterie < 15% (interval 30s au lieu de 10s)
- Arrêt automatique en statut OFF_DUTY

## Offline Mode

L'application fonctionne sans connexion:

1. **Positions GPS** - Stockées localement, envoyées quand online
2. **Changements de statut** - Mis en queue, sync automatique
3. **Messages** - Envoyés dès que connexion disponible
4. **Trajets** - Cache local, refresh au retour online

## Build Production

### Android

```bash
# Générer keystore (une fois)
keytool -genkeypair -v -storetype PKCS12 -keystore trucktrack-upload.keystore \
  -alias trucktrack-key -keyalg RSA -keysize 2048 -validity 10000

# Configurer gradle.properties
TRUCKTRACK_UPLOAD_STORE_FILE=trucktrack-upload.keystore
TRUCKTRACK_UPLOAD_KEY_ALIAS=trucktrack-key
TRUCKTRACK_UPLOAD_STORE_PASSWORD=***
TRUCKTRACK_UPLOAD_KEY_PASSWORD=***

# Build release APK
cd android && ./gradlew assembleRelease

# Build AAB (Play Store)
cd android && ./gradlew bundleRelease
```

### iOS

```bash
# Build via Xcode
# 1. Open TruckTrackDriver.xcworkspace
# 2. Select "Any iOS Device"
# 3. Product → Archive
# 4. Distribute App
```

## Tests

```bash
npm test              # Unit tests
npm run test:watch    # Watch mode
npm run lint          # ESLint
npm run typecheck     # TypeScript
```

## Tech Stack

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| Framework | React Native | 0.73 |
| Language | TypeScript | 5.x |
| Navigation | React Navigation | 6.x |
| State | Zustand | 4.x |
| HTTP | Axios | 1.x |
| Maps | react-native-maps | 1.x |
| GPS | react-native-background-geolocation | 4.x |
| Push | @react-native-firebase/messaging | 18.x |
| Storage | react-native-keychain | 8.x |
| Network | @react-native-community/netinfo | 11.x |

## Troubleshooting

| Problème | Solution |
|----------|----------|
| Build Android échoue | `cd android && ./gradlew clean` |
| Pods outdated | `cd ios && pod install --repo-update` |
| Metro cache | `npm start -- --reset-cache` |
| GPS ne démarre pas | Vérifier permissions dans Settings |
| Push non reçues | Vérifier google-services.json |
