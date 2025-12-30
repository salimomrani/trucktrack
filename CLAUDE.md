# truck_track Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-23

## Active Technologies
- Java 17 (backend), TypeScript 5.9 with Angular 21 (frontend) (006-fleet-analytics)
- PostgreSQL 15+ with PostGIS (existing), Redis 7+ (cache KPIs) (006-fleet-analytics)
- Java 17 (backend), TypeScript 5.x avec Angular 17 (frontend) + Spring Boot 3.2.1, Spring Security, Angular Material 17, NgRx (008-rbac-permissions)
- PostgreSQL 15+ (tables users, user_truck_groups existantes) (008-rbac-permissions)
- TypeScript 5.x avec React Native 0.73+ + React Native, React Navigation 6, React Native Maps, Firebase Cloud Messaging, AsyncStorage, Axios (009-driver-mobile-app)
- AsyncStorage (local), SQLite via WatermelonDB (offline sync), Backend PostgreSQL (via API) (009-driver-mobile-app)
- Java 17 (backend), TypeScript 5.x with Angular 17 (frontend), TypeScript with React Native/Expo (mobile) + Spring Boot 3.2.x, Spring Data JPA, Spring Security, Angular Material, Expo SDK (010-trip-management)
- PostgreSQL 15+ with existing schema, Redis for real-time status caching (010-trip-management)
- YAML (GitHub Actions), Java 17, Node.js 18+, Python 3.x + GitHub Actions, Maven, npm, Docker, Expo CLI (011-cicd-pipelines)
- GitHub Container Registry (ghcr.io) pour les images Docker (011-cicd-pipelines)
- Java 17 (backend), TypeScript 5.9 with Angular 21 (frontend) + Spring Boot 3.2.x, Spring Data Redis, NgRx 21.x with createSelector (012-multi-level-cache)
- Redis 7+ (cache layer), PostgreSQL 15+ (existing primary storage) (012-multi-level-cache)
- TypeScript 5.4 avec Angular 17 + Jasmine, Karma, Angular Testing Utilities (014-frontend-tests)
- N/A (tests uniquement) (014-frontend-tests)
- Java 17 (backend), TypeScript 5.x (mobile Expo, frontend Angular) (015-proof-of-delivery)
- PostgreSQL 15+ (DeliveryProof, ProofPhoto tables), Images en Base64 dans PostgreSQL (015-proof-of-delivery)
- Java 17 (Spring Boot 3.2.x) + Spring Boot Starter, Spring Kafka, SendGrid SDK, Firebase Admin SDK, Thymeleaf, Resilience4j (016-016-email-notifications)
- PostgreSQL 15+ (tables notification_logs, user_notification_preferences, push_tokens, notification_templates, email_recipients) (016-016-email-notifications)
- TypeScript 5.9 with Angular 21.0.6 + Angular Material 21.0.5, NgRx 21.x, RxJS 7.8.2, Leaflet 1.9.4, ngx-charts 23.1.0 (017-modern-ui-redesign)
- N/A (visual styling only, no data model changes) (017-modern-ui-redesign)
- TypeScript 5.9.3 with Angular 21.0.6 + Angular Material 21.0.5, NgRx 21.x, RxJS 7.8.2, SCSS (017-modern-ui-redesign)
- N/A (frontend styling only) (017-modern-ui-redesign)
- TypeScript 5.9.3 with Angular 21.0.6 + Angular 21, NgRx 21.x, RxJS 7.8.2, Angular Material 21.0.5, Leaflet 1.9.4 (019-angular-frontend-cleanup)
- N/A (frontend refactoring, backend inchangé) (019-angular-frontend-cleanup)
- TypeScript 5.9 with Angular 21.0.6 + Tailwind CSS 3.4+, @tailwindcss/forms, Flatpickr, @angular/cdk (overlay, a11y) (020-tailwind-migration)
- N/A (frontend only - no backend changes) (020-tailwind-migration)

### Backend
- Java 17 + Spring Boot 3.2.1, Spring Security, Spring Data JPA
- PostgreSQL 15+ with PostGIS, Redis 7+ (cache/sessions)
- Kafka for async messaging

### Frontend
- **Angular 21.0.6** with TypeScript 5.9.3
- Angular Material 21.0.5
- NgRx 21.x (state management)
- RxJS 7.8.2
- Leaflet 1.9.4 (maps)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

- **Backend**: Java 17 with Spring Boot conventions
- **Frontend**: TypeScript 5.9 with Angular 21 conventions (signals, block control flow)

## Recent Changes
- 020-tailwind-migration: Added TypeScript 5.9 with Angular 21.0.6 + Tailwind CSS 3.4+, @tailwindcss/forms, Flatpickr, @angular/cdk (overlay, a11y)
- 019-angular-frontend-cleanup: Added TypeScript 5.9.3 with Angular 21.0.6 + Angular 21, NgRx 21.x, RxJS 7.8.2, Angular Material 21.0.5, Leaflet 1.9.4
- 017-modern-ui-redesign: Added TypeScript 5.9.3 with Angular 21.0.6 + Angular Material 21.0.5, NgRx 21.x, RxJS 7.8.2, SCSS
  - Block control flow (`@if`/`@for`) now default
  - Signals for reactive state
  - Esbuild for faster builds
  - Build time improved by 27%


<!-- MANUAL ADDITIONS START -->

## Git Workflow (CRITIQUE - OBLIGATOIRE)

**INTERDIT**:
- Ne JAMAIS commiter directement sur `master` ou `main`
- Ne JAMAIS merger une PR soi-même (`gh pr merge` est INTERDIT)

**OBLIGATOIRE**: Toujours suivre ce workflow:
1. Créer une feature branch: `git checkout -b feature/nom-descriptif`
2. Faire les commits sur la feature branch
3. Push la branch: `git push -u origin feature/nom-descriptif`
4. Créer une Pull Request via `gh pr create`
5. **STOP** - Attendre que l'utilisateur merge la PR lui-même
6. Après merge par l'utilisateur: `git checkout master && git pull`

```bash
# ❌ INTERDIT
git commit -m "feat: something"
git push origin master
gh pr merge 123  # JAMAIS merger soi-même!

# ✅ CORRECT
git checkout -b feature/dark-mode
git add -A
git commit -m "feat: implement dark mode"
git push -u origin feature/dark-mode
gh pr create --title "feat: dark mode" --body "..."
# STOP ICI - L'utilisateur mergera la PR
```

**RAPPEL**: Cette règle s'applique à TOUTES les modifications, même les plus petites.

---

## Backend Java/Spring Conventions (OBLIGATOIRE)

### Authentification dans les Controllers

**INTERDIT**: Ne JAMAIS utiliser `@RequestHeader` pour récupérer le contexte utilisateur:
```java
// ❌ INTERDIT - Ancienne méthode
@GetMapping("/example")
public ResponseEntity<?> example(
    @RequestHeader("X-User-Id") String userId,
    @RequestHeader("X-Username") String username,
    @RequestHeader("X-User-Role") String role) { ... }
```

**OBLIGATOIRE**: Toujours utiliser `@AuthenticationPrincipal GatewayUserPrincipal`:
```java
// ✅ CORRECT - Nouvelle méthode
import com.trucktrack.common.security.GatewayUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@GetMapping("/example")
public ResponseEntity<?> example(
    @AuthenticationPrincipal GatewayUserPrincipal principal) {

    String userId = principal.userId();
    String username = principal.username();
    String role = principal.role();
    String groups = principal.groups(); // comma-separated UUIDs
    // ...
}
```

### Méthodes helper recommandées pour les controllers:
```java
private String getUserId(GatewayUserPrincipal principal) {
    return principal != null ? principal.userId() : "anonymous";
}

private String getUsername(GatewayUserPrincipal principal) {
    return principal != null ? principal.username() : "anonymous";
}

private String getUserRole(GatewayUserPrincipal principal) {
    return principal != null ? principal.role() : "GUEST";
}
```

### Communication inter-services

**INTERDIT**: Appels directs entre services (bypass du gateway)

**OBLIGATOIRE**: Passer par l'API Gateway avec `SERVICE_ACCOUNT_JWT`:
- Configurer `gateway.service-token` dans application.yml
- Utiliser WebClient avec le token Bearer
- Générer le token via `POST /admin/users/service-token`

## Angular Frontend Conventions (OBLIGATOIRE)

**IMPORTANT**: Pour tout développement frontend Angular, TOUJOURS consulter et respecter:
- `frontend/ANGULAR_CONVENTIONS.md`

### Résumé des règles clés:

1. **Signal Inputs**: Utiliser `input()` au lieu de `@Input()`
   ```typescript
   readonly items = input<Item[]>([]);
   readonly id = input.required<string>();
   ```

2. **Signal Outputs**: Utiliser `output()` au lieu de `@Output()` + EventEmitter
   ```typescript
   readonly clicked = output<void>();
   ```

3. **Modern Control Flow**: Utiliser `@if`, `@for`, `@switch` au lieu de `*ngIf`, `*ngFor`, `*ngSwitch`
   ```html
   @if (condition()) { ... }
   @for (item of items(); track item.id) { ... }
   ```

4. **Injection**: Utiliser `inject()` au lieu de constructor injection
   ```typescript
   private readonly http = inject(HttpClient);
   ```

5. **Standalone Components**: Tous les composants doivent être `standalone: true`

6. **OnPush**: Utiliser `ChangeDetectionStrategy.OnPush` avec les signals

7. **Structure des fichiers de composant - JAMAIS inline**:
   - **INTERDIT**: Mettre le template et les styles inline dans le fichier `.ts`
   - **OBLIGATOIRE**: Toujours créer des fichiers séparés pour chaque composant:
     - `component-name.component.ts` (logique)
     - `component-name.component.html` (template)
     - `component-name.component.scss` (styles)

   ```typescript
   // ❌ INTERDIT - Template/styles inline
   @Component({
     selector: 'app-example',
     template: `<div>...</div>`,
     styles: [`...`]
   })

   // ✅ CORRECT - Fichiers séparés
   @Component({
     selector: 'app-example',
     templateUrl: './example.component.html',
     styleUrls: ['./example.component.scss']
   })
   ```

8. **NgRx Store - TOUJOURS privilégier le store**:
   - **INTERDIT**: Faire des appels API pour récupérer des données déjà présentes dans le store
   - **OBLIGATOIRE**: Utiliser `StoreFacade` pour accéder aux données déjà chargées

   ```typescript
   // ❌ INTERDIT - Appel API inutile
   ngOnInit() {
     this.authService.getUserProfile().subscribe(user => ...);
   }

   // ✅ CORRECT - Données du store
   readonly user = this.facade.currentUser;
   ```

   - Les données utilisateur sont chargées après login → utiliser `facade.currentUser`
   - Les trucks sont chargés au démarrage → utiliser `facade.trucks`
   - Vérifier le store AVANT de créer un nouvel appel API

## Trip Management System (Feature 010)

### Overview
Complete trip lifecycle management for dispatchers, fleet managers, and drivers.

### Trip Status Flow
```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
           ↓              ↓
      CANCELLED ←─────────┘
```

### Backend API Endpoints (location-service)

**Admin Endpoints** (`/admin/trips`):
- `GET /admin/trips` - List trips with filters (status, driver, truck, date range)
- `GET /admin/trips/{id}` - Get trip details
- `POST /admin/trips` - Create new trip
- `PUT /admin/trips/{id}` - Update trip
- `POST /admin/trips/{id}/assign` - Assign to truck/driver
- `POST /admin/trips/{id}/reassign` - Reassign to different truck/driver
- `POST /admin/trips/{id}/cancel` - Cancel trip
- `GET /admin/trips/{id}/history` - Get status change history
- `GET /admin/trips/stats` - Get trip counts by status
- `GET /admin/trips/analytics` - Get detailed KPIs

**Driver Endpoints** (`/location/v1/trips`):
- `GET /my` - Get driver's assigned trips
- `GET /{id}` - Get trip details
- `POST /{id}/start` - Start trip (ASSIGNED → IN_PROGRESS)
- `POST /{id}/complete` - Complete trip (IN_PROGRESS → COMPLETED)

### Key Backend Files
- `TripService.java` - Core business logic
- `AdminTripController.java` - Admin REST endpoints
- `TripController.java` - Driver REST endpoints
- `Trip.java` - Entity with status transitions
- `TripAnalyticsDTO.java` - KPI calculations

### Frontend Components (Angular)
- `TripListComponent` - List with filters, date range picker, status cards
- `TripDetailComponent` - View/edit/assign/reassign/cancel
- `TripStatsComponent` - KPI dashboard widget

### Push Notifications
- Trip assignment notification to driver
- Trip cancellation notification to driver
- Trip reassignment notification (to both old and new driver)

### Mobile (React Native/Expo)
- `TripsScreen` - List of assigned trips
- `TripDetailScreen` - Start/Complete trip actions
- Push notification handling for trip updates

<!-- MANUAL ADDITIONS END -->
