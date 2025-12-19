# TruckTrack Frontend

Angular 17+ frontend application for the GPS Live Truck Tracking system.

## Overview

The frontend provides a real-time web interface for monitoring truck locations, viewing historical routes, managing geofences, and configuring alerts.

## Technology Stack

- **Framework**: Angular 17+ (generated with Angular CLI 17.3.17)
- **UI Library**: Angular Material 17.3.0 ✅ INSTALLED
- **Maps**: Leaflet.js with OpenStreetMap (to be installed)
- **State Management**: RxJS
- **Build Tool**: Angular CLI
- **Language**: TypeScript 5.x

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Angular CLI 17.x

```bash
npm install -g @angular/cli@17
```

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

```bash
npm start
# or
ng serve
```

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

```bash
# Development build
npm run build

# Production build
ng build --configuration production
```

### Running Tests

```bash
# Unit tests via Karma
ng test

# End-to-end tests (requires e2e package)
ng e2e

# Test coverage
ng test --code-coverage
```

### Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Project Structure

```
src/
├── app/
│   ├── core/                     # Singleton services, guards, interceptors ✅
│   │   ├── guards/              # ✅ Auth guard implemented
│   │   ├── interceptors/        # ✅ JWT interceptor implemented
│   │   ├── models/              # ✅ Auth models defined
│   │   └── services/            # ✅ AuthService implemented
│   ├── shared/                  # Shared modules, components, pipes
│   │   ├── components/          # Reusable components
│   │   ├── models/              # TypeScript interfaces and types
│   │   └── pipes/               # Custom pipes
│   ├── features/                # Feature modules
│   │   ├── auth/                # ✅ Login component implemented
│   │   │   ├── login/          # ✅ Email/password login form
│   │   │   └── unauthorized/   # ✅ Unauthorized page
│   │   ├── map/                 # 🔄 Placeholder (Phase 3)
│   │   ├── history/             # 🔄 Placeholder (Phase 5)
│   │   ├── alerts/              # 🔄 Placeholder (Phase 6)
│   │   └── not-found/           # ✅ 404 page
│   ├── app.component.ts         # Root component
│   ├── app.routes.ts            # ✅ Routing configured
│   └── app.config.ts            # ✅ App configuration with providers
├── assets/                      # Static assets (images, icons)
├── environments/                # ✅ Environment configs (dev, staging, prod)
└── styles.scss                  # ✅ Global styles with Material theme
```

## Environment Configuration

The application uses environment files for configuration:

- `environment.ts` - Development environment (local backend)
- `environment.staging.ts` - Staging environment
- `environment.prod.ts` - Production environment

### Environment Variables

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',       // API Gateway URL
  wsUrl: 'ws://localhost:8081/ws',       // WebSocket URL for real-time updates
  map: {
    defaultCenter: { lat: 37.7749, lng: -122.4194 },
    defaultZoom: 12,
    clusterThreshold: 10,
    updateInterval: 2000
  },
  logging: {
    enableConsoleLogging: true,
    logLevel: 'debug'
  }
};
```

**Note:** Token storage keys are hardcoded in `TokenStorageService`. Token expiry is managed by the backend via JWT claims.

## Implementation Status

### Phase 2: Foundational ✅ COMPLETE

#### 1. Authentication ✅ COMPLETE
- ✅ JWT-based authentication service
- ✅ Login/logout functionality
- ✅ Route guards for protected pages (authGuard, roleGuard)
- ✅ HTTP interceptor for adding JWT to requests
- ✅ Token refresh logic with 401 handling
- ✅ Login component with Material Design form
- ✅ Unauthorized and 404 pages
- ✅ Angular routing with lazy loading

#### 2. Infrastructure ✅ COMPLETE
- ✅ Angular Material 17 integration
- ✅ Environment configurations (dev, staging, prod)
- ✅ Global Material theme
- ✅ Core services architecture
- ✅ HTTP client with interceptors
- ✅ Reactive forms setup

### Phase 3-6: User Stories ✅ COMPLETE

#### 1. Live Truck Dashboard ✅ COMPLETE
- ✅ Real-time truck location display on Leaflet map
- ✅ Truck status indicators (ACTIVE, IDLE, OFFLINE)
- ✅ Search and filter trucks by status/name
- ✅ Truck details panel with live updates
- ✅ WebSocket integration for real-time position updates
- ✅ Truck clustering for performance

#### 2. Historical Routes ✅ COMPLETE
- ✅ Date range selector with Angular Material
- ✅ Route playback with timeline controls
- ✅ Speed and location details display
- ✅ Animated route visualization

#### 3. Geofence Management ✅ COMPLETE
- ✅ Draw geofences on map (polygon, circle)
- ✅ CRUD operations for geofences
- ✅ Zone type configuration (entry/exit alerts)
- ✅ Geofence list with edit/delete

#### 4. Alert Management ✅ COMPLETE
- ✅ Configure alert rules (speed, geofence, offline)
- ✅ View alert history with filtering
- ✅ Real-time alert notifications via WebSocket
- ✅ Alert severity indicators

## API Integration

The frontend communicates with the backend through the API Gateway at `http://localhost:8084`.

### Authentication Endpoints

```typescript
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /auth/me
```

### GPS Endpoints

```typescript
POST /gps/ingest           # Ingest GPS position
GET  /gps/stream           # SSE stream for real-time updates
```

### Location Endpoints

```typescript
GET  /location/trucks                    # Get all trucks
GET  /location/trucks/{id}               # Get truck details
GET  /location/trucks/{id}/current       # Get current position
GET  /location/trucks/{id}/history       # Get position history
POST /location/geofences                 # Create geofence
GET  /location/geofences                 # List geofences
```

### Notification Endpoints

```typescript
GET  /notification/alerts                # Get alert history
POST /notification/alert-rules           # Create alert rule
GET  /notification/alert-rules           # List alert rules
```

## Development Guidelines

### Code Style

- Follow Angular style guide: https://angular.io/guide/styleguide
- Use TypeScript strict mode
- Prefer reactive patterns with RxJS
- Use OnPush change detection where possible

### Component Structure

```typescript
@Component({
  selector: 'app-truck-list',
  templateUrl: './truck-list.component.html',
  styleUrls: ['./truck-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TruckListComponent implements OnInit, OnDestroy {
  // Public properties for template
  trucks$ = this.truckService.getTrucks();

  // Private properties
  private destroy$ = new Subject<void>();

  constructor(private truckService: TruckService) {}

  ngOnInit(): void {
    // Initialization logic
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: Cannot connect to backend
- **Solution**: Ensure API Gateway is running on `http://localhost:8084`
- Check CORS configuration in backend

**Issue**: JWT token expired
- **Solution**: Implement token refresh logic in AuthService

**Issue**: Map tiles not loading
- **Solution**: Check internet connection and OpenStreetMap tile server status

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular CLI Overview and Command Reference](https://angular.io/cli)
- [Angular Material](https://material.angular.io/)
- [Leaflet.js Documentation](https://leafletjs.com/)
- [RxJS Documentation](https://rxjs.dev/)

## License

Proprietary - TruckTrack System
