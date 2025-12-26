# Data Model: Multi-Level Cache System

**Feature**: 012-multi-level-cache | **Date**: 2025-12-26

## Overview

This feature introduces cache-related data structures for both backend (Redis) and frontend (NgRx Store). No new database entities are required - caching operates on existing Truck, Driver, and Group entities.

## Backend Data Structures

### CacheEntry (Redis Structure)

```java
/**
 * Generic wrapper for cached data with metadata.
 * Stored as JSON in Redis.
 */
public record CacheEntry<T>(
    T data,
    Instant cachedAt,
    String cacheKey,
    Duration ttl
) {
    public boolean isExpired() {
        return Instant.now().isAfter(cachedAt.plus(ttl));
    }
}
```

### CacheConfig (Configuration)

```java
/**
 * Cache configuration per entity type.
 */
public enum CacheConfig {
    TRUCKS("trucks", Duration.ofMinutes(5)),
    DRIVERS("drivers", Duration.ofMinutes(5)),
    GROUPS("groups", Duration.ofMinutes(10)),
    STATS("stats", Duration.ofMinutes(1));

    private final String prefix;
    private final Duration ttl;

    // Constructor and getters...
}
```

### Redis Key Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| `trucks:list:{groupId}` | `trucks:list:550e8400-e29b-41d4-a716-446655440000` | Cached truck list for a group |
| `trucks:detail:{truckId}` | `trucks:detail:TRK-001` | Single truck details |
| `drivers:list:{groupId}` | `drivers:list:550e8400-e29b-41d4-a716-446655440000` | Cached driver list for a group |
| `groups:list:{userId}` | `groups:list:user-123` | Groups accessible by user |
| `stats:dashboard:{groupId}` | `stats:dashboard:550e8400-e29b-41d4-a716-446655440000` | Dashboard KPIs |

## Frontend Data Structures (NgRx)

### CacheState Interface

```typescript
/**
 * Cache metadata for a data collection.
 */
export interface CacheMetadata {
  lastUpdated: number;      // Unix timestamp (ms)
  status: CacheStatus;
  error?: string;
}

export type CacheStatus = 'idle' | 'loading' | 'fresh' | 'stale' | 'error';

/**
 * TTL configuration in milliseconds.
 */
export const CACHE_TTL = {
  TRUCKS: 5 * 60 * 1000,      // 5 minutes
  DRIVERS: 5 * 60 * 1000,     // 5 minutes
  GROUPS: 10 * 60 * 1000,     // 10 minutes
  STATS: 1 * 60 * 1000,       // 1 minute
} as const;
```

### Enhanced Entity State

```typescript
/**
 * Trucks state with cache metadata.
 */
export interface TrucksState {
  trucks: Truck[];
  selectedTruckId: string | null;
  cache: CacheMetadata;
}

/**
 * Initial state with cache initialized.
 */
export const initialTrucksState: TrucksState = {
  trucks: [],
  selectedTruckId: null,
  cache: {
    lastUpdated: 0,
    status: 'idle'
  }
};
```

### Cache Actions

```typescript
/**
 * Actions for cache management.
 */
export const CacheActions = {
  // Trigger refresh check
  checkTrucksCache: createAction('[Cache] Check Trucks Cache'),

  // Set cache status
  setTrucksCacheStatus: createAction(
    '[Cache] Set Trucks Cache Status',
    props<{ status: CacheStatus }>()
  ),

  // Mark cache as invalidated (force refresh on next access)
  invalidateTrucksCache: createAction('[Cache] Invalidate Trucks Cache'),

  // Clear all caches (on logout)
  clearAllCaches: createAction('[Cache] Clear All Caches'),
};
```

## State Transitions

### Cache Status Flow

```
                    ┌─────────┐
         ┌─────────►│  idle   │◄──────────┐
         │          └────┬────┘           │
         │               │ loadData()     │ clearCache()
         │               ▼                │
         │          ┌─────────┐           │
         │          │ loading │           │
         │          └────┬────┘           │
         │               │                │
         │    ┌──────────┼──────────┐     │
         │    │ success  │ failure  │     │
         │    ▼          ▼          │     │
         │┌───────┐  ┌───────┐      │     │
         ││ fresh │  │ error │──────┘     │
         │└───┬───┘  └───────┘            │
         │    │ TTL expired               │
         │    ▼                           │
         │┌───────┐                       │
         └┤ stale │───────────────────────┘
          └───────┘ invalidate()
```

### Stale-While-Revalidate Behavior

| Current Status | User Action | Immediate Response | Background Action |
|----------------|-------------|-------------------|-------------------|
| `idle` | Navigate to page | Show loading | Fetch from API |
| `fresh` | Navigate to page | Show cached data | None |
| `stale` | Navigate to page | Show cached data | Fetch from API |
| `loading` | Navigate to page | Show loading | Wait for current fetch |
| `error` | Navigate to page | Show error + retry button | None (user must retry) |

## Entity Relationships

```
┌─────────────────┐     ┌─────────────────┐
│   CacheConfig   │     │   CacheEntry    │
│─────────────────│     │─────────────────│
│ + prefix        │     │ + data: T       │
│ + ttl           │────►│ + cachedAt      │
│ + entityType    │     │ + cacheKey      │
└─────────────────┘     │ + ttl           │
                        └─────────────────┘
                                │
                                │ wraps
                                ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Truck       │     │     Driver      │     │     Group       │
│  (existing)     │     │   (existing)    │     │   (existing)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Validation Rules

### Backend

| Rule | Constraint | Error Response |
|------|------------|----------------|
| TTL minimum | >= 10 seconds | Configuration error (startup) |
| TTL maximum | <= 1 hour | Configuration error (startup) |
| Cache key format | Matches pattern `{type}:{scope}:{id}` | IllegalArgumentException |
| Redis availability | Connection established | Fallback to DB (warning logged) |

### Frontend

| Rule | Constraint | Behavior |
|------|------------|----------|
| Stale threshold | `now - lastUpdated > TTL` | Trigger background refresh |
| Concurrent fetches | Max 1 per entity type | Subsequent requests wait for ongoing |
| Error retry | Max 3 automatic retries | Show error state after 3 failures |

## Performance Considerations

### Cache Size Limits

| Cache Type | Estimated Size | Max Entries |
|------------|---------------|-------------|
| Trucks list | ~5KB per group | 1000 groups |
| Drivers list | ~3KB per group | 1000 groups |
| Groups list | ~1KB per user | 10000 users |
| Dashboard stats | ~2KB per group | 1000 groups |

**Total estimated Redis memory**: ~20MB (with full utilization)

### Serialization

- Backend: Jackson JSON serialization (existing)
- Redis: JSON strings (human-readable for debugging)
- Frontend: NgRx uses default JS object serialization

## Migration Notes

No database migrations required. This feature only adds:
1. New Java classes for cache management
2. New TypeScript interfaces and NgRx modules
3. Redis keys (auto-created on first write)
