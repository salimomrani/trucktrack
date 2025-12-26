package com.trucktrack.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * T041: Cache statistics response DTO.
 * Used by AdminCacheController to return cache status and metrics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CacheStatsDTO {

    /**
     * Whether Redis is currently available and responding.
     */
    private boolean redisAvailable;

    /**
     * Cache statistics per entity type.
     */
    private EntityCacheStats trucks;
    private EntityCacheStats drivers;
    private EntityCacheStats groups;
    private EntityCacheStats stats;

    /**
     * Timestamp when these stats were collected.
     */
    private Instant collectedAt;

    /**
     * Statistics for a single entity cache type.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityCacheStats {
        /**
         * Name of the cache (e.g., "trucks", "groups").
         */
        private String cacheName;

        /**
         * Number of keys currently in this cache.
         */
        private long keyCount;

        /**
         * Default TTL for entries in this cache (seconds).
         */
        private long ttlSeconds;
    }
}
