# TruckTrack Frontend

Interface utilisateur Angular 21 pour le suivi GPS de flottes de camions en temps réel.

L'application permet aux gestionnaires de flotte de :
- Visualiser tous les camions sur une carte interactive (Leaflet)
- Suivre les positions en temps réel via WebSocket
- Consulter l'historique des trajets avec playback
- Gérer les geofences (zones géographiques)
- Configurer et recevoir des alertes (vitesse, geofence, offline)

## Quick Start

```bash
cd frontend
npm install
npm start
```

**Access:** http://localhost:4200

## Features

- **Live Map** - Real-time truck positions with Leaflet
- **Search/Filter** - Find trucks by status, name
- **History** - Route playback with timeline
- **Geofences** - Draw and manage zones
- **Alerts** - Configure rules, view notifications

## Project Structure

```
src/app/
├── core/           # Services, guards, interceptors
├── features/
│   ├── auth/       # Login
│   ├── map/        # Live tracking
│   ├── history/    # Route history
│   ├── geofences/  # Geofence management
│   └── alerts/     # Notifications
└── shared/         # Components, pipes
```

## Environment

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8081/ws'
};
```

## Commands

```bash
npm start           # Dev server
npm run build       # Production build
npm test            # Unit tests
npm run lint        # Lint check
```

## Tech Stack

- Angular 21.0.6
- Angular Material 21.0.5
- TypeScript 5.9.3
- Leaflet 1.9.4 (maps)
- RxJS 7.8.2
- NgRx 21.x (state management)

### Angular 21 Features

- **Block Control Flow** - Modern `@if`/`@for` syntax
- **Signals** - Reactive state management
- **Esbuild** - Fast production builds
- **Zoneless Ready** - Can enable zoneless change detection
