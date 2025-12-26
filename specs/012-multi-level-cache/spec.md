# Feature Specification: Multi-Level Cache System

**Feature Branch**: `012-multi-level-cache`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "Système de cache multi-niveaux pour optimiser les performances en cachant les données qui changent peu fréquemment. Backend Redis + Frontend NgRx Store avec selectors mémoïsés."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Faster Dashboard Loading (Priority: P1)

En tant qu'administrateur de flotte, je veux que le tableau de bord se charge instantanément avec les données en cache, afin de pouvoir consulter rapidement l'état de ma flotte sans attendre les appels API.

**Why this priority**: L'expérience utilisateur du dashboard est critique car c'est la page la plus consultée. Un chargement rapide améliore significativement la satisfaction utilisateur et la productivité.

**Independent Test**: Peut être testé en mesurant le temps de chargement du dashboard avec et sans cache. L'utilisateur voit les données immédiatement au lieu d'un spinner.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est connecté et a déjà visité le dashboard, **When** il retourne sur le dashboard, **Then** les données (trucks, drivers, groupes) s'affichent immédiatement depuis le cache
2. **Given** l'utilisateur consulte le dashboard, **When** les données sont en cache depuis moins de 5 minutes, **Then** aucun appel API n'est effectué pour les listes statiques
3. **Given** l'utilisateur consulte le dashboard, **When** les données en cache ont expiré, **Then** le système rafraîchit automatiquement en arrière-plan sans bloquer l'affichage

---

### User Story 2 - Consistent Data Across Views (Priority: P2)

En tant qu'utilisateur, je veux que les mêmes données (trucks, drivers) soient partagées entre toutes les pages de l'application, afin d'éviter les incohérences et les appels API redondants.

**Why this priority**: Éviter les appels API redondants améliore les performances et réduit la charge serveur. La cohérence des données améliore l'expérience utilisateur.

**Independent Test**: Navigation entre plusieurs pages (Dashboard → Trips → Trucks) et vérification qu'aucun appel API redondant n'est effectué pour les mêmes données.

**Acceptance Scenarios**:

1. **Given** l'utilisateur a chargé la liste des trucks sur le dashboard, **When** il navigue vers la page d'assignation de trip, **Then** la même liste de trucks est disponible sans nouvel appel API
2. **Given** un driver est modifié sur une page, **When** l'utilisateur navigue vers une autre page affichant ce driver, **Then** les modifications sont reflétées immédiatement

---

### User Story 3 - Backend Cache for Performance (Priority: P2)

En tant que système, je veux cacher les données fréquemment demandées côté serveur, afin de réduire la charge sur la base de données et améliorer les temps de réponse API.

**Why this priority**: Réduit la charge sur PostgreSQL et améliore les temps de réponse pour tous les utilisateurs simultanément.

**Independent Test**: Mesurer les temps de réponse API et le nombre de requêtes DB avec et sans cache Redis.

**Acceptance Scenarios**:

1. **Given** la liste des trucks est demandée, **When** elle est déjà en cache Redis, **Then** la réponse est retournée sans requête à la base de données
2. **Given** un truck est modifié (CRUD), **When** la modification est sauvegardée, **Then** le cache correspondant est automatiquement invalidé
3. **Given** le cache est vide ou expiré, **When** une requête arrive, **Then** la donnée est récupérée de la DB et mise en cache

---

### User Story 4 - Optimized Selectors for Derived Data (Priority: P3)

En tant que développeur frontend, je veux utiliser des selectors mémoïsés NgRx pour calculer les données dérivées, afin d'éviter les recalculs inutiles et améliorer les performances de rendu.

**Why this priority**: Optimisation fine qui améliore les performances de rendu, particulièrement pour les listes filtrées et les calculs de statistiques.

**Independent Test**: Vérifier via les DevTools Redux que les selectors ne sont pas recalculés inutilement lors des re-renders.

**Acceptance Scenarios**:

1. **Given** une liste de trucks est affichée avec filtres, **When** le filtre ne change pas, **Then** le selector retourne la même référence mémoire (mémoïsation)
2. **Given** les statistiques du dashboard sont calculées, **When** les données source n'ont pas changé, **Then** les statistiques ne sont pas recalculées

---

### Edge Cases

- Que se passe-t-il si Redis est indisponible ? Le système doit fallback sur la base de données sans erreur utilisateur
- Que se passe-t-il si le cache contient des données obsolètes après une modification directe en DB ? TTL gère l'expiration
- Comment gérer les données en cache lors de la déconnexion/reconnexion de l'utilisateur ? Clear du store NgRx au logout
- Que se passe-t-il si deux utilisateurs modifient la même entité simultanément ? L'invalidation du cache backend assure la cohérence

## Requirements *(mandatory)*

### Functional Requirements

**Backend (Redis Cache)**

- **FR-001**: Le système DOIT cacher les listes de trucks avec un TTL de 5 minutes
- **FR-002**: Le système DOIT cacher les listes de drivers avec un TTL de 5 minutes
- **FR-003**: Le système DOIT cacher les groupes/flottes avec un TTL de 10 minutes
- **FR-004**: Le système DOIT cacher les statistiques/KPIs avec un TTL de 1 minute
- **FR-005**: Le système DOIT invalider automatiquement le cache lors des opérations CRUD sur les entités cachées
- **FR-006**: Le système DOIT utiliser un pattern cache-aside (read-through) pour le chargement du cache
- **FR-007**: Le système DOIT fonctionner normalement si Redis est indisponible (fallback DB)

**Frontend (NgRx Store + Selectors)**

- **FR-008**: Le store NgRx DOIT centraliser toutes les données de référence (trucks, drivers, groupes)
- **FR-009**: Les selectors DOIVENT être mémoïsés avec createSelector pour éviter les recalculs
- **FR-010**: Le système DOIT implémenter un pattern "stale-while-revalidate" : afficher les données en cache immédiatement puis rafraîchir en arrière-plan si nécessaire
- **FR-011**: Le système DOIT stocker un timestamp de dernière mise à jour pour chaque type de donnée
- **FR-012**: Le système NE DOIT PAS effectuer d'appel API si les données sont en cache et non expirées
- **FR-013**: Le système DOIT clear le store NgRx lors du logout utilisateur

**Données NON cachées (temps réel)**

- **FR-014**: Les positions GPS DOIVENT rester en temps réel via WebSocket (pas de cache)
- **FR-015**: Les statuts des trips en cours DOIVENT être récupérés en temps réel
- **FR-016**: Les alertes DOIVENT être affichées en temps réel sans cache

### Key Entities

- **CacheableEntity**: Représente une entité pouvant être mise en cache (trucks, drivers, groups) avec son TTL et timestamp de dernière mise à jour
- **CacheState**: État du cache frontend contenant les données, le timestamp de chargement, et le statut (loading, loaded, stale)
- **CacheConfig**: Configuration des TTL et stratégies de cache par type d'entité

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le temps de chargement du dashboard passe de >2 secondes à <500ms pour les visites répétées
- **SC-002**: Le nombre d'appels API pour les données de référence est réduit de 70% lors de la navigation entre pages
- **SC-003**: Le temps de réponse moyen des endpoints cachés (trucks, drivers, groups) est <50ms quand les données sont en cache
- **SC-004**: Le système supporte 100 utilisateurs simultanés sans dégradation de performance grâce au cache backend
- **SC-005**: Aucune erreur visible pour l'utilisateur si Redis est temporairement indisponible
- **SC-006**: Les données modifiées sont visibles par tous les utilisateurs dans un délai maximum égal au TTL configuré

## Assumptions

- Redis est déjà configuré et accessible par les services backend (connexion existante)
- NgRx est déjà en place dans le frontend avec un store basique
- Les données de référence (trucks, drivers, groupes) changent rarement (quelques fois par jour max)
- Le TTL est un compromis acceptable entre fraîcheur des données et performance

## Out of Scope

- Cache distribué multi-région
- Cache de niveau CDN pour les assets statiques
- Persistance du cache frontend entre sessions (localStorage)
- Cache des résultats de recherche/filtrage complexe
- Synchronisation temps réel du cache entre onglets du navigateur
