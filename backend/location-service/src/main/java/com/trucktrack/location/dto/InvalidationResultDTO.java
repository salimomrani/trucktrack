package com.trucktrack.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * T042: Cache invalidation result DTO.
 * Returned by AdminCacheController after invalidating caches.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvalidationResultDTO {

    /**
     * Whether the invalidation was successful.
     */
    private boolean success;

    /**
     * Number of keys that were evicted.
     */
    private long keysEvicted;

    /**
     * Which cache was invalidated (or "all" for full invalidation).
     */
    private String cacheTarget;

    /**
     * Message describing the result.
     */
    private String message;

    /**
     * When the invalidation occurred.
     */
    private Instant invalidatedAt;

    /**
     * Create a successful invalidation result.
     */
    public static InvalidationResultDTO success(String cacheTarget, long keysEvicted) {
        return InvalidationResultDTO.builder()
            .success(true)
            .cacheTarget(cacheTarget)
            .keysEvicted(keysEvicted)
            .message("Cache invalidated successfully")
            .invalidatedAt(Instant.now())
            .build();
    }

    /**
     * Create a failed invalidation result.
     */
    public static InvalidationResultDTO failure(String cacheTarget, String error) {
        return InvalidationResultDTO.builder()
            .success(false)
            .cacheTarget(cacheTarget)
            .keysEvicted(0)
            .message("Cache invalidation failed: " + error)
            .invalidatedAt(Instant.now())
            .build();
    }
}
