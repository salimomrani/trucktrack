# truck_track Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-09

## Active Technologies
- Java 17 (backend), TypeScript 5.4 with Angular 17 (frontend) + Spring Boot 3.2.1, Spring Security, Spring Data JPA, Angular Material (002-admin-panel)
- PostgreSQL 15+ with PostGIS, Redis 7+ (cache sessions) (002-admin-panel)
- TypeScript 5.x with Angular 17 (frontend only) + Angular Material 17, RxJS, NgRx (already in use) (003-nav-optimization)
- N/A (frontend state only, consumes existing APIs) (003-nav-optimization)
- TypeScript 5.4 with Angular 17 + Angular Material 17.3.10, RxJS, NgRx (store/signals) (003-nav-optimization)
- TypeScript 5.4.2 with Angular 17.3.0 + Angular Material 17.3.10, NgRx 17.2.0, RxJS 7.8.0, Leaflet 1.9.4 (004-angular-signals-migration)
- TypeScript 5.4.2 → 5.6+ (upgraded with Angular 21) (005-angular-21-migration)
- N/A (frontend only, no storage changes) (005-angular-21-migration)

- Java 17 (backend), TypeScript 5.x with Angular 17+ (frontend) (001-gps-live-tracking)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

Java 17 (backend), TypeScript 5.x with Angular 17+ (frontend): Follow standard conventions

## Recent Changes
- 005-angular-21-migration: Added TypeScript 5.4.2 → 5.6+ (upgraded with Angular 21)
- 004-angular-signals-migration: Added TypeScript 5.4.2 with Angular 17.3.0 + Angular Material 17.3.10, NgRx 17.2.0, RxJS 7.8.0, Leaflet 1.9.4
- 003-nav-optimization: Added TypeScript 5.4 with Angular 17 + Angular Material 17.3.10, RxJS, NgRx (store/signals)


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

<!-- MANUAL ADDITIONS END -->
