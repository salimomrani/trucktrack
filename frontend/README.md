# TruckTrack Frontend

Angular 17 application for GPS fleet tracking.

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

- Angular 17
- Angular Material
- Leaflet (maps)
- RxJS
- NgRx (state management)
