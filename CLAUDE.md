# truck_track Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-23

## Active Technologies
- Java 17 (backend), TypeScript 5.9 with Angular 21 (frontend) (006-fleet-analytics)
- PostgreSQL 15+ with PostGIS (existing), Redis 7+ (cache KPIs) (006-fleet-analytics)
- Java 17 (backend), TypeScript 5.x avec Angular 17 (frontend) + Spring Boot 3.2.1, Spring Security, Angular Material 17, NgRx (008-rbac-permissions)
- PostgreSQL 15+ (tables users, user_truck_groups existantes) (008-rbac-permissions)
- TypeScript 5.x avec React Native 0.73+ + React Native, React Navigation 6, React Native Maps, Firebase Cloud Messaging, AsyncStorage, Axios (009-driver-mobile-app)
- AsyncStorage (local), SQLite via WatermelonDB (offline sync), Backend PostgreSQL (via API) (009-driver-mobile-app)

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
- 009-driver-mobile-app: Added TypeScript 5.x avec React Native 0.73+ + React Native, React Navigation 6, React Native Maps, Firebase Cloud Messaging, AsyncStorage, Axios
- 008-rbac-permissions: Added Java 17 (backend), TypeScript 5.x avec Angular 17 (frontend) + Spring Boot 3.2.1, Spring Security, Angular Material 17, NgRx
- 006-fleet-analytics: Added Java 17 (backend), TypeScript 5.9 with Angular 21 (frontend)
  - Block control flow (`@if`/`@for`) now default
  - Signals for reactive state
  - Esbuild for faster builds
  - Build time improved by 27%


<!-- MANUAL ADDITIONS START -->

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

<!-- MANUAL ADDITIONS END -->
