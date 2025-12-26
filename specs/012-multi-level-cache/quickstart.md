# Quickstart: Multi-Level Cache System

**Feature**: 012-multi-level-cache | **Date**: 2025-12-26

## Prerequisites

- Redis 7+ running (already configured in docker-compose)
- Java 17 (backend)
- Node.js 18+ (frontend)
- Existing TruckTrack application running

## Quick Verification

### 1. Verify Redis Connection

```bash
# Check Redis is running
docker exec -it trucktrack-redis redis-cli ping
# Expected: PONG

# Check existing keys
docker exec -it trucktrack-redis redis-cli keys "*"
```

### 2. Backend Cache Test

After implementation, test cache behavior:

```bash
# First request (cache MISS)
curl -X GET "http://localhost:8081/admin/trucks" \
  -H "Authorization: Bearer $TOKEN" \
  -v 2>&1 | grep "X-Cache"
# Expected: X-Cache-Status: MISS

# Second request (cache HIT)
curl -X GET "http://localhost:8081/admin/trucks" \
  -H "Authorization: Bearer $TOKEN" \
  -v 2>&1 | grep "X-Cache"
# Expected: X-Cache-Status: HIT
```

### 3. Frontend Cache Test

Using browser DevTools:

1. Open Network tab
2. Navigate to Dashboard
3. Navigate away (Trips page)
4. Navigate back to Dashboard
5. Verify: No new API calls for trucks/drivers if within TTL

## Development Setup

### Backend

Add Spring Cache dependency (if not present):

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

Enable caching in main application:

```java
@SpringBootApplication
@EnableCaching
public class LocationServiceApplication {
    // ...
}
```

### Frontend

NgRx store already configured. Add cache module:

```bash
cd frontend
ng generate module store/cache --flat
```

## Key Files to Implement

### Backend

1. **CacheService.java** - Generic cache operations
2. **CacheConfig.java** - TTL configuration
3. **CacheInterceptor.java** - Add cache headers to responses

### Frontend

1. **cache.actions.ts** - NgRx actions for cache management
2. **cache.reducer.ts** - Cache state reducer
3. **cache.selectors.ts** - Memoized selectors
4. **cache.effects.ts** - Stale-while-revalidate logic

## Common Issues

### Redis Connection Failed

```
Error: Unable to connect to Redis
```

**Solution**: Ensure Redis container is running:
```bash
docker-compose up -d redis
```

### Cache Not Invalidating

**Symptom**: Old data shown after CRUD operation

**Solution**: Verify `@CacheEvict` annotation is on the write method:
```java
@CacheEvict(value = "trucks", allEntries = true)
public void updateTruck(...) { }
```

### Frontend Showing Stale Data

**Symptom**: Data not refreshing after TTL

**Solution**: Check cache timestamp in NgRx DevTools and verify effect is triggering refresh.

## Testing Commands

### Run Backend Cache Tests

```bash
cd backend/location-service
JAVA_HOME=/Users/salimomrani/Library/Java/JavaVirtualMachines/corretto-17.0.17/Contents/Home \
  mvn test -Dtest="*CacheService*"
```

### Run Frontend Cache Tests

```bash
cd frontend
npm test -- --include="**/cache*.spec.ts"
```

## Performance Validation

After implementation, verify targets are met:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Dashboard load (cached) | <500ms | Browser DevTools Performance tab |
| API response (cached) | <50ms | Check response headers or logs |
| API calls reduction | 70% | Compare Network tab before/after |

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement backend cache service first
3. Add cache to existing service methods
4. Implement frontend NgRx cache module
5. Integration testing
