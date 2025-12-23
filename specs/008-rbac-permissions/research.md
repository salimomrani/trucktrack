# Research: Gestion des Droits et Permissions (RBAC)

**Feature**: 008-rbac-permissions | **Date**: 2025-12-23

## Executive Summary

L'analyse du codebase révèle qu'une base RBAC existe déjà. Cette feature vise à étendre le système existant pour un contrôle d'accès complet avec filtrage des données par groupe.

## Existing Infrastructure Analysis

### 1. Roles (Already Implemented)

**File**: `backend/auth-service/src/main/java/com/trucktrack/auth/model/UserRole.java`

```java
public enum UserRole {
    ADMIN,
    FLEET_MANAGER,
    DISPATCHER,
    DRIVER,
    VIEWER;  // Note: VIEWER exists but not in spec
}
```

**Decision**: Conserver les 5 rôles existants. Le spec mentionne 4 rôles (sans VIEWER), mais VIEWER est utilisé - le garder pour rétrocompatibilité.

**Rationale**: Le code existant utilise déjà ces rôles avec des méthodes helper (`isAdmin()`, `canManageTrucks()`, etc.)

### 2. Frontend Guards (Partially Implemented)

**Files**: `frontend/src/app/core/guards/`
- `auth.guard.ts` - Authentication guard (complet)
- `admin.guard.ts` - Admin-only guard (complet)

**Existing Capabilities**:
- `authGuard` - Vérifie l'authentification
- `guestOnlyGuard` - Pour page login
- `roleGuard(allowedRoles: string[])` - Factory function pour guards par rôle
- `adminGuard` - Specific pour admin

**Decision**: Réutiliser `roleGuard()` existant, créer un `permissionGuard` pour les pages spécifiques.

**Rationale**: Le pattern factory `roleGuard(['ROLE1', 'ROLE2'])` est déjà implémenté et fonctionne avec NgRx store.

### 3. User-Group Assignment (Already Implemented)

**File**: `backend/auth-service/src/main/java/com/trucktrack/auth/model/UserGroupAssignment.java`

Table `user_truck_groups` avec:
- `user_id` (UUID)
- `truck_group_id` (UUID)
- `assigned_at` (Instant)

**Decision**: Utiliser cette table existante pour le filtrage des données.

**Rationale**: La structure est en place, il suffit d'ajouter les requêtes de filtrage dans les repositories.

### 4. TruckGroup Entity (Already Implemented)

**File**: `backend/location-service/src/main/java/com/trucktrack/location/model/TruckGroup.java`

**Decision**: Aucune modification nécessaire.

## Technical Decisions

### D1: Permission Matrix Storage

**Decision**: Hardcode les permissions dans une classe Java statique `RolePermissions.java`

**Rationale**:
- La matrice est simple (4 rôles × 6 pages)
- Pas besoin de flexibilité dynamique en V1
- Performance optimale (pas de requête DB)
- Plus facile à tester

**Alternatives Rejected**:
- Base de données: Complexité inutile pour V1, pas de besoin de modification runtime
- Configuration file: Moins type-safe, risque d'erreurs

### D2: Backend Authorization Method

**Decision**: Utiliser Spring Security `@PreAuthorize` avec expressions SpEL

**Rationale**:
- Standard Spring Security
- Déclaratif et lisible
- Intégré avec le contexte de sécurité
- Tests faciles avec `@WithMockUser`

**Example**:
```java
@PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
public List<Truck> getTrucks() { ... }
```

### D3: Data Filtering Approach

**Decision**: Filtrage au niveau Repository avec méthodes spécifiques

**Rationale**:
- Séparation claire des responsabilités
- Performance (filtrage SQL)
- Réutilisable dans plusieurs services

**Implementation**:
```java
// TruckRepository
@Query("SELECT t FROM Truck t JOIN t.group g WHERE g.id IN :groupIds")
List<Truck> findByGroupIds(@Param("groupIds") Set<UUID> groupIds);
```

### D4: JWT Claims for Permissions

**Decision**: Inclure `role` et `groupIds` dans le JWT token

**Rationale**:
- Évite les requêtes DB pour chaque vérification
- Le token est déjà validé par le gateway
- Les groupIds peuvent être limités à 50 pour éviter les tokens trop gros

**Structure JWT**:
```json
{
  "sub": "user@example.com",
  "role": "FLEET_MANAGER",
  "groupIds": ["uuid1", "uuid2"],
  "userId": "uuid"
}
```

### D5: Frontend Navigation Update

**Decision**: Créer un `NavigationService` qui filtre les items selon le rôle

**Rationale**:
- Centralise la logique de navigation
- Utilise le store NgRx existant
- Navigation déclarative dans les routes

**Alternative Rejected**:
- Directive ngIf dans chaque menu item: Duplication, difficile à maintenir

### D6: Access Denied Page

**Decision**: Créer un composant `AccessDeniedComponent` avec message et lien retour

**Rationale**:
- UX claire
- Point unique de redirection pour tous les refus

## Security Considerations

### Server-Side Validation (Critical)

Le contrôle côté serveur est **obligatoire**. Les guards Angular sont pour l'UX, pas la sécurité.

**Checklist**:
- [ ] Chaque endpoint a `@PreAuthorize`
- [ ] Le filtrage des données est dans le Repository (pas le contrôleur)
- [ ] Les IDs dans les URLs sont validés contre les permissions de l'utilisateur

### Audit Logging

**Decision**: Logger les accès refusés avec détails

**Format**: `WARN - Access denied: user={}, role={}, resource={}, action={}`

## Dependencies Between Components

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
├─────────────────────────────────────────────────────┤
│  NavigationService ──► roleGuard ──► Routes         │
│         │                  │                         │
│         ▼                  ▼                         │
│   Header/Sidenav    AccessDeniedComponent           │
└─────────────────────────────────────────────────────┘
                        │
                        ▼ JWT Token (role, groupIds)
┌─────────────────────────────────────────────────────┐
│                   API Gateway                        │
├─────────────────────────────────────────────────────┤
│  JwtAuthenticationFilter (extract role, groupIds)   │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                Backend Services                      │
├─────────────────────────────────────────────────────┤
│  @PreAuthorize ──► RolePermissions (static)         │
│         │                                            │
│         ▼                                            │
│  Repository.findByGroupIds(groupIds)                │
└─────────────────────────────────────────────────────┘
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT token trop gros (nombreux groupIds) | Performance | Limiter à 50 groupIds, utiliser requête DB si plus |
| Cache périmé après changement de permissions | Sécurité | Invalidation à la reconnexion, TTL court sur cache |
| Oubli de @PreAuthorize sur endpoint | Sécurité | Code review checklist, tests d'intégration |

## Conclusion

L'infrastructure existante couvre ~40% des besoins. Les ajouts principaux sont:
1. Matrice de permissions (`RolePermissions.java`)
2. Filtrage par groupe dans les repositories
3. Navigation dynamique côté frontend
4. Annotations `@PreAuthorize` sur tous les endpoints
5. Composant Access Denied

Aucun NEEDS CLARIFICATION - toutes les décisions techniques sont documentées ci-dessus.
