# Feature Specification: Frontend Unit Tests

**Feature Branch**: `014-frontend-tests`
**Created**: 2025-12-27
**Status**: Draft
**Input**: Frontend Tests - Tests unitaires Angular pour le projet TruckTrack avec optimisation performance (éviter TestBed quand possible)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Services Testing (Priority: P1)

Le développeur veut s'assurer que les services critiques (auth, permissions, token storage) fonctionnent correctement pour garantir la sécurité et la fiabilité de l'application.

**Why this priority**: Ces services sont au coeur de l'application - authentification, gestion des permissions, stockage des tokens. Un bug ici impacte toute l'application.

**Independent Test**: Peut être testé en vérifiant que les services retournent les bonnes valeurs et gèrent correctement les états d'erreur.

**Acceptance Scenarios**:

1. **Given** un utilisateur non authentifié, **When** on vérifie l'état d'authentification, **Then** isAuthenticated retourne false
2. **Given** un token valide stocké, **When** on récupère le token, **Then** le token est retourné correctement
3. **Given** un utilisateur avec le rôle ADMIN, **When** on vérifie les permissions, **Then** l'accès admin est autorisé
4. **Given** un token expiré, **When** on vérifie la validité, **Then** le service indique que le token est invalide

---

### User Story 2 - Guards Testing (Priority: P1)

Le développeur veut valider que les guards protègent correctement les routes sensibles sans avoir besoin d'un contexte Angular complet.

**Why this priority**: Les guards sont la première ligne de défense pour protéger les routes. Tests rapides sans TestBed pour performance optimale.

**Independent Test**: Tests directs des guards en instanciation manuelle avec mocks simples.

**Acceptance Scenarios**:

1. **Given** un utilisateur non authentifié, **When** AuthGuard vérifie l'accès, **Then** l'accès est refusé et redirection vers login
2. **Given** un utilisateur sans rôle admin, **When** AdminGuard vérifie l'accès, **Then** l'accès est refusé
3. **Given** un utilisateur avec permissions page, **When** PageGuard vérifie l'accès, **Then** l'accès est autorisé

---

### User Story 3 - Interceptors Testing (Priority: P2)

Le développeur veut vérifier que l'intercepteur HTTP ajoute correctement les headers d'authentification et gère les erreurs 401.

**Why this priority**: L'intercepteur est critique pour la communication sécurisée avec le backend, mais moins visible pour l'utilisateur final.

**Independent Test**: Test de l'intercepteur avec HttpTestingController pour simuler les requêtes.

**Acceptance Scenarios**:

1. **Given** un token valide, **When** une requête HTTP est faite, **Then** le header Authorization est ajouté
2. **Given** une réponse 401, **When** l'intercepteur traite la réponse, **Then** l'utilisateur est déconnecté
3. **Given** pas de token, **When** une requête HTTP est faite, **Then** aucun header Authorization n'est ajouté

---

### User Story 4 - Feature Services Testing (Priority: P2)

Le développeur veut valider les services métier (trucks, geofences, alerts, analytics) pour s'assurer de la bonne transformation et gestion des données.

**Why this priority**: Ces services contiennent la logique métier spécifique à l'application de tracking.

**Independent Test**: Tests unitaires avec HttpClientTestingModule pour mocker les appels API.

**Acceptance Scenarios**:

1. **Given** une liste de trucks du backend, **When** le service récupère les données, **Then** les trucks sont correctement mappés
2. **Given** des coordonnées GPS, **When** on vérifie l'appartenance à une geofence, **Then** le résultat est correct
3. **Given** des données d'analytics, **When** on exporte en CSV, **Then** le fichier est correctement formaté

---

### User Story 5 - Navigation Service Testing (Priority: P3)

Le développeur veut s'assurer que le service de navigation gère correctement les menus dynamiques selon les permissions utilisateur.

**Why this priority**: Important pour l'UX mais moins critique que l'authentification.

**Independent Test**: Test du service avec mock des permissions.

**Acceptance Scenarios**:

1. **Given** un utilisateur admin, **When** on demande le menu, **Then** toutes les entrées admin sont visibles
2. **Given** un utilisateur driver, **When** on demande le menu, **Then** seules les entrées driver sont visibles

---

### Edge Cases

- Que se passe-t-il quand le localStorage est indisponible (mode privé)?
- Comment le système gère-t-il un token malformé (non-JSON)?
- Que se passe-t-il lors d'une déconnexion pendant une requête en cours?
- Comment gérer les permissions null/undefined?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Les tests des guards DOIVENT s'exécuter sans TestBed quand possible (instanciation directe)
- **FR-002**: Les tests des services simples DOIVENT utiliser l'instanciation directe avec mocks manuels
- **FR-003**: Les tests DOIVENT couvrir les cas de succès et d'erreur pour chaque service critique
- **FR-004**: Les tests d'intercepteurs DOIVENT utiliser HttpClientTestingModule (nécessite TestBed minimal)
- **FR-005**: Les tests NE DOIVENT PAS tester les comportements triviaux (getters/setters simples)
- **FR-006**: Les tests DOIVENT être organisés avec describe/it et des noms descriptifs
- **FR-007**: Chaque service avec logique métier DOIT avoir une couverture des chemins principaux

### Principes de Test

- **TP-001**: Préférer l'instanciation directe à TestBed pour les classes sans dépendances Angular complexes
- **TP-002**: Utiliser des mocks simples (objets/fonctions) plutôt que des spy complexes quand suffisant
- **TP-003**: Tester la logique métier, pas l'infrastructure Angular
- **TP-004**: Un test doit échouer pour une seule raison (Single Assertion Principle)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les tests unitaires frontend s'exécutent en moins de 30 secondes au total
- **SC-002**: 80% ou plus des services critiques (auth, permissions, guards) sont couverts
- **SC-003**: Aucun test ne nécessite TestBed sauf si absolument requis (interceptors, composants)
- **SC-004**: Les tests passent de manière fiable dans le pipeline CI sans flakiness
- **SC-005**: Le temps d'exécution par fichier de test est inférieur à 2 secondes

## Assumptions

- Les services frontend suivent les patterns Angular standards
- HttpClient est utilisé pour les appels API
- Le stockage des tokens utilise localStorage
- Les guards retournent des UrlTree ou boolean
- Jasmine/Karma est configuré pour les tests

## Out of Scope

- Tests de composants UI (templates, interactions DOM)
- Tests end-to-end (E2E)
- Tests de performance/charge
- Tests d'accessibilité
- Tests visuels (screenshot comparison)
