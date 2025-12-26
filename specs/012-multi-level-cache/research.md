# Research: Multi-Level Cache System

**Feature**: 012-multi-level-cache | **Date**: 2025-12-26

## Research Tasks

### 1. Redis Caching with Spring Boot

**Decision**: Use Spring Data Redis with `@Cacheable` annotations and programmatic cache management via `RedisTemplate`.

**Rationale**:
- Spring Cache abstraction provides declarative caching with minimal code changes
- `@Cacheable`, `@CachePut`, `@CacheEvict` annotations align with existing service methods
- `RedisTemplate` offers fine-grained control for complex invalidation scenarios
- Spring Boot auto-configuration simplifies Redis connection management

**Alternatives considered**:
- Caffeine (in-memory only) - Rejected: No shared cache across service instances
- Hazelcast - Rejected: More complex setup, overkill for current scale
- Spring Cache with Redis (chosen) - Best balance of simplicity and functionality

**Implementation approach**:
```java
@Cacheable(value = "trucks", key = "#groupId", unless = "#result == null")
public List<TruckResponse> getTrucksByGroup(UUID groupId) { ... }

@CacheEvict(value = "trucks", allEntries = true)
public void updateTruck(UUID truckId, UpdateTruckRequest request) { ... }
```

### 2. Cache-Aside Pattern (Read-Through)

**Decision**: Implement cache-aside pattern where application code checks cache first, then DB on miss.

**Rationale**:
- Explicit control over what gets cached and when
- Graceful degradation: if Redis unavailable, queries fall through to DB
- Matches Spring's `@Cacheable` behavior by default

**Pattern flow**:
```
Request → Check Cache → [HIT] → Return cached data
                      → [MISS] → Query DB → Store in cache → Return data
```

**Fallback behavior** (Redis unavailable):
- Log warning, proceed to DB query
- Do NOT throw exception to user
- Use Spring's `CacheErrorHandler` for graceful degradation

### 3. NgRx Memoized Selectors

**Decision**: Use NgRx `createSelector` with `createFeatureSelector` for all derived data.

**Rationale**:
- Built-in memoization prevents recalculation on unchanged state
- Composable selectors enable complex derived data without performance penalty
- DevTools integration shows selector execution for debugging

**Implementation approach**:
```typescript
// Feature selector
export const selectTrucksState = createFeatureSelector<TrucksState>('trucks');

// Memoized selectors
export const selectAllTrucks = createSelector(
  selectTrucksState,
  (state) => state.trucks
);

export const selectActiveTrucks = createSelector(
  selectAllTrucks,
  (trucks) => trucks.filter(t => t.status === 'ACTIVE' || t.status === 'IDLE')
);

// Parameterized selector with props
export const selectTruckById = (truckId: string) => createSelector(
  selectAllTrucks,
  (trucks) => trucks.find(t => t.id === truckId)
);
```

### 4. Stale-While-Revalidate Pattern

**Decision**: Display cached data immediately, refresh in background if stale.

**Rationale**:
- Instant perceived performance for users
- Data freshness maintained without blocking UI
- Standard pattern used by service workers and CDNs

**Implementation approach**:
```typescript
// State includes timestamp
interface CacheState {
  lastUpdated: number; // Unix timestamp
  status: 'fresh' | 'stale' | 'loading';
}

// Effect checks staleness and triggers background refresh
loadTrucks$ = createEffect(() => this.actions$.pipe(
  ofType(loadTrucks),
  withLatestFrom(this.store.select(selectTrucksCacheState)),
  filter(([_, cache]) => this.isStale(cache, TRUCKS_TTL)),
  switchMap(() => this.truckService.getTrucks().pipe(
    map(trucks => loadTrucksSuccess({ trucks })),
    catchError(error => of(loadTrucksFailure({ error })))
  ))
));
```

### 5. Cache Invalidation Strategy

**Decision**: Event-driven invalidation on CRUD operations + TTL expiration.

**Rationale**:
- CRUD operations immediately invalidate relevant cache entries
- TTL ensures eventual consistency even if invalidation event missed
- Simple key structure enables targeted invalidation

**Cache key structure**:
```
trucks:list:{groupId}          # List of trucks for a group
trucks:detail:{truckId}        # Single truck details
drivers:list:{groupId}         # List of drivers for a group
groups:list:{userId}           # User's accessible groups
stats:dashboard:{userId}       # Dashboard KPIs
```

**Invalidation triggers**:
| Operation | Invalidates |
|-----------|-------------|
| Create truck | `trucks:list:*` |
| Update truck | `trucks:list:*`, `trucks:detail:{id}` |
| Delete truck | `trucks:list:*`, `trucks:detail:{id}` |
| Assign driver | `trucks:*`, `drivers:*` |

### 6. TTL Configuration

**Decision**: Use differentiated TTLs based on data change frequency.

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Trucks list | 5 min | Updated few times per day |
| Drivers list | 5 min | Updated few times per day |
| Groups/Fleets | 10 min | Very rarely updated |
| Dashboard KPIs | 1 min | Aggregated metrics, acceptable staleness |
| User profile | Session | Changes on login/logout only |

**NOT cached** (real-time requirements):
- GPS positions (WebSocket stream)
- Trip status (active updates)
- Alerts (immediate visibility required)

### 7. Redis Connection Resilience

**Decision**: Configure Redis with connection pooling and circuit breaker.

**Rationale**:
- Connection pool prevents exhaustion under load
- Circuit breaker prevents cascading failures if Redis down

**Configuration**:
```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
          min-idle: 2
          max-wait: 1000ms
```

**Circuit breaker** (using Resilience4j):
- Open after 5 consecutive failures
- Half-open after 30 seconds
- Success threshold: 3 calls

## Resolved Clarifications

All technical context items have been resolved through research. No blockers remain.

## Dependencies

### Backend
- `spring-boot-starter-data-redis` (existing in project)
- `spring-boot-starter-cache` (add)
- `resilience4j-spring-boot3` (add for circuit breaker)

### Frontend
- `@ngrx/store` (existing)
- `@ngrx/effects` (existing)
- No new dependencies required

## Next Steps

1. Proceed to Phase 1: Data Model & Contracts
2. Define cache state interfaces
3. Create API contract for cache management endpoints (if needed)
