package com.trucktrack.location.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.stereotype.Component;

/**
 * Graceful cache error handler that logs errors and allows fallback to database.
 * Ensures Redis failures don't break the application.
 */
@Component
public class GracefulCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(GracefulCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Cache GET error for cache '{}' with key '{}': {}. Falling back to database.",
                cache.getName(), key, exception.getMessage());
        // Don't rethrow - allow fallback to database
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        log.warn("Cache PUT error for cache '{}' with key '{}': {}. Data was saved to database but not cached.",
                cache.getName(), key, exception.getMessage());
        // Don't rethrow - data is in database, cache miss is acceptable
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Cache EVICT error for cache '{}' with key '{}': {}. Cache may contain stale data until TTL expires.",
                cache.getName(), key, exception.getMessage());
        // Don't rethrow - stale data will be handled by TTL
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.error("Cache CLEAR error for cache '{}': {}. Cache may contain stale data.",
                cache.getName(), exception.getMessage());
        // Don't rethrow - TTL will eventually clear stale data
    }
}
