package com.trucktrack.location.service;

import com.trucktrack.common.cache.CacheConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Generic cache service wrapping RedisTemplate operations.
 * Provides typed get/put/evict operations with graceful error handling.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Get a value from cache.
     *
     * @param key The cache key
     * @param type The expected type
     * @return Optional containing the value, or empty if not found or error
     */
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null && type.isInstance(value)) {
                return Optional.of(type.cast(value));
            }
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Cache GET failed for key '{}': {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Put a value in cache with specified TTL.
     *
     * @param key The cache key
     * @param value The value to cache
     * @param ttl The time-to-live duration
     */
    public void put(String key, Object value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl.toMillis(), TimeUnit.MILLISECONDS);
            log.debug("Cached value for key '{}' with TTL {}s", key, ttl.toSeconds());
        } catch (Exception e) {
            log.warn("Cache PUT failed for key '{}': {}", key, e.getMessage());
        }
    }

    /**
     * Evict a specific key from cache.
     *
     * @param key The cache key to evict
     */
    public void evict(String key) {
        try {
            Boolean deleted = redisTemplate.delete(key);
            log.debug("Evicted cache key '{}': {}", key, deleted);
        } catch (Exception e) {
            log.warn("Cache EVICT failed for key '{}': {}", key, e.getMessage());
        }
    }

    /**
     * Evict all keys matching a pattern.
     *
     * @param pattern The key pattern (e.g., "trucks:*")
     * @return Number of keys evicted
     */
    public long evictByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                Long deleted = redisTemplate.delete(keys);
                log.info("Evicted {} keys matching pattern '{}'", deleted, pattern);
                return deleted != null ? deleted : 0;
            }
            return 0;
        } catch (Exception e) {
            log.warn("Cache EVICT by pattern failed for '{}': {}", pattern, e.getMessage());
            return 0;
        }
    }

    /**
     * Evict all truck-related caches.
     */
    public void evictAllTrucks() {
        evictByPattern(CacheConstants.KEY_PATTERN_ALL_TRUCKS);
    }

    /**
     * Evict all driver-related caches.
     */
    public void evictAllDrivers() {
        evictByPattern(CacheConstants.KEY_PATTERN_ALL_DRIVERS);
    }

    /**
     * Evict all group-related caches.
     */
    public void evictAllGroups() {
        evictByPattern(CacheConstants.KEY_PATTERN_ALL_GROUPS);
    }

    /**
     * Evict all stats-related caches.
     */
    public void evictAllStats() {
        evictByPattern(CacheConstants.KEY_PATTERN_ALL_STATS);
    }

    /**
     * Check if Redis is available.
     *
     * @return true if Redis is responding
     */
    public boolean isAvailable() {
        try {
            String pong = redisTemplate.getConnectionFactory()
                    .getConnection()
                    .ping();
            return "PONG".equals(pong);
        } catch (Exception e) {
            log.warn("Redis health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get cache statistics (key count for a pattern).
     *
     * @param pattern The key pattern
     * @return Number of keys matching the pattern
     */
    public long getKeyCount(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            return keys != null ? keys.size() : 0;
        } catch (Exception e) {
            log.warn("Failed to get key count for pattern '{}': {}", pattern, e.getMessage());
            return 0;
        }
    }
}
