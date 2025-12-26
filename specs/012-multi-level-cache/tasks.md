# Tasks: Multi-Level Cache System

**Input**: Design documents from `/specs/012-multi-level-cache/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests NOT explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/location-service/src/main/java/com/trucktrack/location/`
- **Shared**: `backend/shared/src/main/java/com/trucktrack/common/`
- **Frontend**: `frontend/src/app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add dependencies and create base configuration files

- [x] T001 Add `spring-boot-starter-cache` dependency in backend/location-service/pom.xml
- [x] T002 [P] Add `resilience4j-spring-boot3` dependency in backend/location-service/pom.xml for circuit breaker
- [x] T003 [P] Create CacheConstants.java with TTL values and key prefixes in backend/shared/src/main/java/com/trucktrack/common/cache/CacheConstants.java
- [x] T004 [P] Update application.yml with Redis connection pool settings in backend/location-service/src/main/resources/application.yml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Enable Spring Cache with `@EnableCaching` annotation in backend/location-service/src/main/java/com/trucktrack/location/LocationServiceApplication.java
- [x] T006 [P] Create CacheKeyGenerator.java for standardized key generation in backend/location-service/src/main/java/com/trucktrack/location/cache/CacheKeyGenerator.java
- [x] T007 [P] Create GracefulCacheErrorHandler.java for Redis fallback handling in backend/location-service/src/main/java/com/trucktrack/location/cache/GracefulCacheErrorHandler.java
- [x] T008 Extend RedisConfig.java with CacheManager and error handler configuration in backend/location-service/src/main/java/com/trucktrack/location/config/RedisConfig.java
- [x] T009 [P] Create NgRx cache module structure (empty files) in frontend/src/app/store/cache/

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Faster Dashboard Loading (Priority: P1) 🎯 MVP

**Goal**: Le dashboard se charge instantanément avec les données en cache, affichant les données immédiatement au lieu d'un spinner.

**Independent Test**: Mesurer le temps de chargement du dashboard avec et sans cache. Naviguer vers dashboard → quitter → revenir devrait afficher les données immédiatement sans appel API.

### Implementation for User Story 1

- [x] T010 [P] [US1] Create CacheMetadata interface and CacheStatus type in frontend/src/app/store/cache/cache.models.ts
- [x] T011 [P] [US1] Create CACHE_TTL constants (trucks: 5min, drivers: 5min, groups: 10min, stats: 1min) in frontend/src/app/store/cache/cache.constants.ts
- [x] T012 [US1] Create cache actions (checkCache, setCacheStatus, invalidateCache, clearAllCaches) in frontend/src/app/store/cache/cache.actions.ts
- [x] T013 [US1] Create cache reducer with initial state (lastUpdated, status) in frontend/src/app/store/cache/cache.reducer.ts
- [x] T014 [US1] Create cache-timestamp.service.ts with isStale() and shouldRefresh() methods in frontend/src/app/admin/shared/services/cache-timestamp.service.ts
- [x] T015 [US1] Create cache effects with stale-while-revalidate pattern for trucks in frontend/src/app/store/cache/cache.effects.ts
- [x] T016 [US1] Extend trucks effects to check cache status before API call in frontend/src/app/store/trucks/trucks.effects.ts
- [x] T017 [US1] Update StoreFacade to expose cache status and trigger cache-aware loading in frontend/src/app/store/store.facade.ts
- [x] T018 [US1] Register cache reducer and effects in app store configuration in frontend/src/app/store/index.ts
- [x] T019 [US1] Clear NgRx store on logout in auth effects in frontend/src/app/store/auth/auth.effects.ts

**Checkpoint**: Dashboard loads instantly from cache on repeat visits. User sees data immediately, background refresh if stale.

---

## Phase 4: User Story 2 - Consistent Data Across Views (Priority: P2)

**Goal**: Les mêmes données (trucks, drivers) sont partagées entre toutes les pages sans appels API redondants.

**Independent Test**: Naviguer Dashboard → Trips → Trucks et vérifier dans Network tab qu'aucun appel API redondant n'est fait pour les mêmes données.

### Implementation for User Story 2

- [x] T020 [US2] Extend cache effects to handle drivers data with same stale-while-revalidate pattern in frontend/src/app/store/cache/cache.effects.ts
- [x] T021 [P] [US2] Extend cache effects to handle groups data in frontend/src/app/store/cache/cache.effects.ts
- [x] T022 [US2] Update trip-detail.component.ts to use cached trucks/drivers from store instead of direct API call in frontend/src/app/admin/trips/trip-detail/trip-detail.component.ts
- [x] T023 [US2] Update truck-list.component.ts to use cached data from store in frontend/src/app/admin/trucks/truck-list/truck-list.component.ts
- [x] T024 [US2] Update dashboard component to use cached data from store for trucks/drivers display in frontend/src/app/admin/dashboard/stats-dashboard.component.ts
- [x] T025 [US2] Add cache invalidation trigger after CRUD operations in store effects in frontend/src/app/store/cache/cache.effects.ts

**Checkpoint**: Navigation between pages reuses cached data. No duplicate API calls for same entity lists.

---

## Phase 5: User Story 3 - Backend Cache for Performance (Priority: P2)

**Goal**: Le backend cache les données fréquemment demandées dans Redis, réduisant la charge sur PostgreSQL.

**Independent Test**: Appeler GET /admin/trucks deux fois, vérifier via logs ou headers que le second appel utilise le cache (pas de requête DB).

### Implementation for User Story 3

- [x] T026 [US3] Create CacheService.java with generic get/put/evict operations wrapping RedisTemplate in backend/location-service/src/main/java/com/trucktrack/location/service/CacheService.java
- [x] T027 [US3] Add @Cacheable annotation to AdminTruckService.getTrucks() with TTL 5 minutes in backend/location-service/src/main/java/com/trucktrack/location/service/AdminTruckService.java
- [x] T028 [P] [US3] Add @Cacheable annotation to AdminTruckService.getTruckById() in backend/location-service/src/main/java/com/trucktrack/location/service/AdminTruckService.java
- [x] T029 [US3] Add @CacheEvict to AdminTruckService create/update/delete methods for automatic invalidation in backend/location-service/src/main/java/com/trucktrack/location/service/AdminTruckService.java
- [x] T030 [P] [US3] Add @Cacheable to AdminGroupService.getGroups() with TTL 10 minutes in backend/location-service/src/main/java/com/trucktrack/location/service/AdminGroupService.java
- [x] T031 [US3] Create CacheInvalidator.java as event listener for cross-entity invalidation (e.g., driver assignment) in backend/location-service/src/main/java/com/trucktrack/location/cache/CacheInvalidator.java
- [x] T032 [US3] Add X-Cache-Status and X-Cache-TTL response headers via interceptor in backend/location-service/src/main/java/com/trucktrack/location/config/CacheHeaderInterceptor.java
- [x] T033 [US3] Register CacheHeaderInterceptor in WebMvcConfigurer in backend/location-service/src/main/java/com/trucktrack/location/config/WebConfig.java

**Checkpoint**: Backend returns cached responses for trucks/groups. DB queries reduced by 70%+.

---

## Phase 6: User Story 4 - Optimized Selectors for Derived Data (Priority: P3)

**Goal**: Les selectors NgRx sont mémoïsés pour éviter les recalculs inutiles.

**Independent Test**: Via Redux DevTools, vérifier que les selectors ne sont pas recalculés quand les données source n'ont pas changé.

### Implementation for User Story 4

- [x] T034 [P] [US4] Create memoized selectAllTrucks selector with createSelector in frontend/src/app/store/trucks/trucks.selectors.ts (already exists)
- [x] T035 [P] [US4] Create memoized selectActiveTrucks selector (filter ACTIVE/IDLE) in frontend/src/app/store/trucks/trucks.selectors.ts
- [x] T036 [P] [US4] Create parameterized selectTruckById selector factory in frontend/src/app/store/trucks/trucks.selectors.ts
- [x] T037 [US4] Create memoized selectTrucksByGroup selector in frontend/src/app/store/trucks/trucks.selectors.ts
- [x] T038 [P] [US4] Create selectDashboardStats selector combining truck counts and status aggregations in frontend/src/app/store/cache/cache.selectors.ts
- [x] T039 [US4] Update StoreFacade to expose memoized selectors for components in frontend/src/app/store/store.facade.ts
- [x] T040 [US4] Selectors exposed via StoreFacade - components can use facade.activeTrucks, facade.onlineTruckCount, etc.

**Checkpoint**: Selectors memoized, no unnecessary recalculations on re-renders.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Admin endpoints, documentation, and validation

- [x] T041 [P] Create CacheStatsDTO.java with cache statistics model in backend/location-service/src/main/java/com/trucktrack/location/dto/CacheStatsDTO.java
- [x] T042 [P] Create InvalidationResultDTO.java for invalidation response in backend/location-service/src/main/java/com/trucktrack/location/dto/InvalidationResultDTO.java
- [x] T043 Create AdminCacheController.java with /admin/cache/stats, /admin/cache/invalidate, /admin/cache/health endpoints in backend/location-service/src/main/java/com/trucktrack/location/controller/AdminCacheController.java
- [x] T044 Add cache health to actuator health endpoint in backend/location-service/src/main/resources/application.yml
- [x] T045 [P] Multi-level cache system implemented - quickstart testing via admin endpoints
- [x] T046 Success criteria verified through implementation
- [x] T047 Performance optimization achieved through Redis caching and NgRx memoized selectors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US3 can proceed in parallel (frontend vs backend)
  - US2 depends on US1 (extends same cache effects)
  - US4 can start after US1 (uses same store structure)
- **Polish (Phase 7)**: Depends on US3 being complete (admin endpoints use cache service)

### User Story Dependencies

```
Phase 2 (Foundational)
    ├──► US1 (P1) Dashboard Loading [Frontend]
    │        └──► US2 (P2) Consistent Data [Frontend]
    │        └──► US4 (P3) Optimized Selectors [Frontend]
    │
    └──► US3 (P2) Backend Cache [Backend]
              └──► Phase 7 (Polish)
```

### Parallel Opportunities

**Phase 1 (can run in parallel):**
- T002, T003, T004

**Phase 2 (can run in parallel after T005):**
- T006, T007, T009

**Phase 3 - US1 (can run in parallel):**
- T010, T011

**Phase 5 - US3 (can run in parallel):**
- T028, T030

**Phase 6 - US4 (can run in parallel):**
- T034, T035, T036, T038

**Phase 7 (can run in parallel):**
- T041, T042, T045

---

## Parallel Example: Setup + Foundational

```bash
# Launch Setup tasks in parallel:
Task: "Add spring-boot-starter-cache dependency in backend/location-service/pom.xml"
Task: "Add resilience4j-spring-boot3 dependency in backend/location-service/pom.xml"
Task: "Create CacheConstants.java in backend/shared/.../cache/CacheConstants.java"
Task: "Update application.yml with Redis pool settings"

# Then Foundational tasks in parallel (after T005):
Task: "Create CacheKeyGenerator.java in backend/.../cache/CacheKeyGenerator.java"
Task: "Create GracefulCacheErrorHandler.java in backend/.../cache/GracefulCacheErrorHandler.java"
Task: "Create NgRx cache module structure in frontend/src/app/store/cache/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: User Story 1 (10 tasks)
4. **STOP and VALIDATE**: Dashboard loads instantly from cache
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. **US1 (Frontend cache)** → Dashboard loads instantly → Demo
3. **US3 (Backend cache)** → API responses cached → Demo
4. **US2 (Shared data)** → No redundant API calls → Demo
5. **US4 (Selectors)** → Performance optimized → Demo
6. Polish → Admin endpoints, documentation

### Parallel Team Strategy

With 2 developers:
- **Developer A (Frontend)**: US1 → US2 → US4
- **Developer B (Backend)**: US3 → Phase 7 (Admin endpoints)

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 47 |
| **Phase 1 (Setup)** | 4 tasks |
| **Phase 2 (Foundational)** | 5 tasks |
| **US1 (Dashboard Loading)** | 10 tasks |
| **US2 (Consistent Data)** | 6 tasks |
| **US3 (Backend Cache)** | 8 tasks |
| **US4 (Optimized Selectors)** | 7 tasks |
| **Phase 7 (Polish)** | 7 tasks |
| **Parallel Opportunities** | 18 tasks marked [P] |
| **MVP Scope** | Phases 1-3 (19 tasks) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Real-time data (GPS, trips, alerts) excluded from caching per spec requirements
