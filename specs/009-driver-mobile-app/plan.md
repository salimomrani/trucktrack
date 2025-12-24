# Implementation Plan: Driver Mobile App

**Branch**: `009-driver-mobile-app` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-driver-mobile-app/spec.md`

## Summary

Application mobile cross-platform pour les chauffeurs permettant l'authentification, le tracking GPS en temps réel, la gestion de statut, la visualisation des trajets, la messagerie avec le dispatch, et les notifications push. L'application s'intègre avec l'infrastructure backend existante via JWT et envoie les positions GPS au GPS Ingestion Service existant.

## Technical Context

**Language/Version**: TypeScript 5.x avec React Native 0.73+
**Primary Dependencies**: React Native, React Navigation 6, React Native Maps, Firebase Cloud Messaging, AsyncStorage, Axios
**Storage**: AsyncStorage (local), SQLite via WatermelonDB (offline sync), Backend PostgreSQL (via API)
**Testing**: Jest, React Native Testing Library, Detox (E2E)
**Target Platform**: iOS 14+, Android 10+ (API 29+)
**Project Type**: mobile
**Performance Goals**:
- GPS tracking <5% batterie/heure
- App launch <2 secondes
- Position updates every 10 seconds
- Background GPS tracking stable 8h+
**Constraints**:
- Offline-capable (cache trips, queue GPS/messages)
- Background location permissions required
- Push notifications required
- JWT authentication with existing Auth Service
**Scale/Scope**:
- ~500 drivers concurrent
- 6 main screens (Login, Home/Status, Map, Trips, Messages, Settings)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Real-Time Data First | PASS | GPS tracking every 10s, offline buffering, auto-reconnection |
| II. Microservices Architecture | PASS | Integrates with existing GPS Ingestion, Auth, Location services |
| III. Code Quality & Testing | PASS | TDD with Jest, E2E with Detox, 80% coverage target |
| IV. Performance Requirements | PASS | <2s app launch, <5% battery/hour, handles offline gracefully |
| V. Security & Privacy | PASS | JWT auth, TLS 1.3, encrypted local storage |
| VI. User Experience Consistency | PASS | Material Design (Android), HIG (iOS), shared design tokens |

**Gate Status**: PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/009-driver-mobile-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
mobile/
├── src/
│   ├── components/           # Shared UI components
│   │   ├── common/           # Buttons, inputs, cards
│   │   ├── map/              # Map-related components
│   │   └── navigation/       # Tab bar, headers
│   ├── screens/              # Screen components
│   │   ├── auth/             # Login, splash
│   │   ├── home/             # Status management
│   │   ├── map/              # Live map view
│   │   ├── trips/            # Trip list and details
│   │   ├── messages/         # Chat with dispatch
│   │   └── settings/         # App settings
│   ├── services/             # Business logic
│   │   ├── api/              # API client, interceptors
│   │   ├── auth/             # Authentication logic
│   │   ├── gps/              # GPS tracking, background service
│   │   ├── notifications/    # Push notification handling
│   │   ├── offline/          # Offline sync manager
│   │   └── storage/          # Local persistence
│   ├── hooks/                # Custom React hooks
│   ├── store/                # State management (Zustand)
│   ├── navigation/           # React Navigation config
│   ├── types/                # TypeScript interfaces
│   ├── utils/                # Helper functions
│   └── constants/            # App constants, config
├── android/                  # Android native code
├── ios/                      # iOS native code
├── __tests__/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # Detox E2E tests
├── App.tsx                   # Entry point
├── package.json
├── tsconfig.json
├── metro.config.js
├── babel.config.js
└── jest.config.js
```

**Structure Decision**: React Native monolithic app with feature-based folder structure. Native code in ios/ and android/ directories for platform-specific implementations (background GPS, push notifications).

## Complexity Tracking

> No constitutional violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
