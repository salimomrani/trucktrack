package com.trucktrack.location.controller;

import com.trucktrack.common.cache.CacheConstants;
import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.CacheStatsDTO;
import com.trucktrack.location.dto.InvalidationResultDTO;
import com.trucktrack.location.service.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

/**
 * T043: Admin cache management controller.
 * Provides endpoints for cache statistics, health check, and manual invalidation.
 */
@Slf4j
@RestController
@RequestMapping("/admin/cache")
@RequiredArgsConstructor
public class AdminCacheController {

    private final CacheService cacheService;

    /**
     * Get cache statistics including key counts and health status.
     *
     * @return Cache statistics for all entity types
     */
    @GetMapping("/stats")
    public ResponseEntity<CacheStatsDTO> getCacheStats(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("Cache stats requested by {}", getUsername(principal));

        boolean redisAvailable = cacheService.isAvailable();

        CacheStatsDTO stats = CacheStatsDTO.builder()
            .redisAvailable(redisAvailable)
            .trucks(CacheStatsDTO.EntityCacheStats.builder()
                .cacheName(CacheConstants.CACHE_TRUCKS)
                .keyCount(redisAvailable ? cacheService.getKeyCount(CacheConstants.KEY_PATTERN_ALL_TRUCKS) : 0)
                .ttlSeconds(CacheConstants.TTL_TRUCKS_SECONDS)
                .build())
            .drivers(CacheStatsDTO.EntityCacheStats.builder()
                .cacheName(CacheConstants.CACHE_DRIVERS)
                .keyCount(redisAvailable ? cacheService.getKeyCount(CacheConstants.KEY_PATTERN_ALL_DRIVERS) : 0)
                .ttlSeconds(CacheConstants.TTL_DRIVERS_SECONDS)
                .build())
            .groups(CacheStatsDTO.EntityCacheStats.builder()
                .cacheName(CacheConstants.CACHE_GROUPS)
                .keyCount(redisAvailable ? cacheService.getKeyCount(CacheConstants.KEY_PATTERN_ALL_GROUPS) : 0)
                .ttlSeconds(CacheConstants.TTL_GROUPS_SECONDS)
                .build())
            .stats(CacheStatsDTO.EntityCacheStats.builder()
                .cacheName(CacheConstants.CACHE_STATS)
                .keyCount(redisAvailable ? cacheService.getKeyCount(CacheConstants.KEY_PATTERN_ALL_STATS) : 0)
                .ttlSeconds(CacheConstants.TTL_STATS_SECONDS)
                .build())
            .collectedAt(Instant.now())
            .build();

        return ResponseEntity.ok(stats);
    }

    /**
     * Check cache health (Redis connectivity).
     *
     * @return Health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getCacheHealth() {
        boolean available = cacheService.isAvailable();
        return ResponseEntity.ok(Map.of(
            "status", available ? "UP" : "DOWN",
            "redis", Map.of(
                "available", available,
                "checkedAt", Instant.now().toString()
            )
        ));
    }

    /**
     * Invalidate a specific cache or all caches.
     *
     * @param cacheType Cache to invalidate: trucks, drivers, groups, stats, or all
     * @return Invalidation result
     */
    @PostMapping("/invalidate")
    public ResponseEntity<InvalidationResultDTO> invalidateCache(
            @RequestParam(defaultValue = "all") String cacheType,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("Cache invalidation requested by {} for cache: {}", getUsername(principal), cacheType);

        try {
            long keysEvicted = 0;

            switch (cacheType.toLowerCase()) {
                case "trucks":
                    cacheService.evictAllTrucks();
                    keysEvicted = 1; // Approximate, actual count from evictByPattern
                    break;
                case "drivers":
                    cacheService.evictAllDrivers();
                    keysEvicted = 1;
                    break;
                case "groups":
                    cacheService.evictAllGroups();
                    keysEvicted = 1;
                    break;
                case "stats":
                    cacheService.evictAllStats();
                    keysEvicted = 1;
                    break;
                case "all":
                    cacheService.evictAllTrucks();
                    cacheService.evictAllDrivers();
                    cacheService.evictAllGroups();
                    cacheService.evictAllStats();
                    keysEvicted = 4; // Approximate
                    break;
                default:
                    return ResponseEntity.badRequest()
                        .body(InvalidationResultDTO.failure(cacheType, "Unknown cache type. Use: trucks, drivers, groups, stats, or all"));
            }

            log.info("Cache invalidated successfully: {} by {}", cacheType, getUsername(principal));
            return ResponseEntity.ok(InvalidationResultDTO.success(cacheType, keysEvicted));

        } catch (Exception e) {
            log.error("Cache invalidation failed for {}: {}", cacheType, e.getMessage());
            return ResponseEntity.internalServerError()
                .body(InvalidationResultDTO.failure(cacheType, e.getMessage()));
        }
    }

    /**
     * Invalidate all caches (convenience endpoint).
     */
    @PostMapping("/invalidate/all")
    public ResponseEntity<InvalidationResultDTO> invalidateAllCaches(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {
        return invalidateCache("all", principal);
    }

    private String getUsername(GatewayUserPrincipal principal) {
        return principal != null ? principal.username() : "anonymous";
    }
}
