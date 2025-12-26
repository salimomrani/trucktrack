package com.trucktrack.location.config;

import com.trucktrack.common.cache.CacheConstants;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * T032: Interceptor that adds cache status headers to API responses.
 *
 * Headers added:
 * - X-Cache-Status: HIT, MISS, or BYPASS
 * - X-Cache-TTL: Time-to-live in seconds for the cache entry
 */
@Slf4j
@Component
public class CacheHeaderInterceptor implements HandlerInterceptor {

    public static final String HEADER_CACHE_STATUS = "X-Cache-Status";
    public static final String HEADER_CACHE_TTL = "X-Cache-TTL";
    public static final String CACHE_HIT_ATTRIBUTE = "cacheHit";

    private final CacheManager cacheManager;

    public CacheHeaderInterceptor(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public void afterCompletion(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler,
            Exception ex) {

        String uri = request.getRequestURI();
        String method = request.getMethod();

        // Only add cache headers for GET requests
        if (!"GET".equalsIgnoreCase(method)) {
            return;
        }

        // Determine cache status based on the endpoint
        CacheInfo cacheInfo = determineCacheInfo(uri);

        if (cacheInfo != null) {
            // Check if this was a cache hit
            Boolean cacheHit = (Boolean) request.getAttribute(CACHE_HIT_ATTRIBUTE);
            String status = cacheHit != null && cacheHit ? "HIT" : "MISS";

            response.setHeader(HEADER_CACHE_STATUS, status);
            response.setHeader(HEADER_CACHE_TTL, String.valueOf(cacheInfo.ttlSeconds()));

            log.debug("Added cache headers to {}: status={}, ttl={}s", uri, status, cacheInfo.ttlSeconds());
        }
    }

    /**
     * Determine cache configuration based on the request URI.
     */
    private CacheInfo determineCacheInfo(String uri) {
        if (uri.contains("/admin/trucks")) {
            return new CacheInfo(CacheConstants.CACHE_TRUCKS, CacheConstants.TTL_TRUCKS_SECONDS);
        }
        if (uri.contains("/admin/groups")) {
            return new CacheInfo(CacheConstants.CACHE_GROUPS, CacheConstants.TTL_GROUPS_SECONDS);
        }
        if (uri.contains("/admin/drivers")) {
            return new CacheInfo(CacheConstants.CACHE_DRIVERS, CacheConstants.TTL_DRIVERS_SECONDS);
        }
        if (uri.contains("/stats") || uri.contains("/analytics")) {
            return new CacheInfo(CacheConstants.CACHE_STATS, CacheConstants.TTL_STATS_SECONDS);
        }
        return null;
    }

    /**
     * Helper record for cache information.
     */
    private record CacheInfo(String cacheName, long ttlSeconds) {}

    /**
     * Mark the current request as a cache hit.
     * Call this from a cache aspect or interceptor when data is served from cache.
     */
    public static void markCacheHit(HttpServletRequest request) {
        request.setAttribute(CACHE_HIT_ATTRIBUTE, true);
    }

    /**
     * Mark the current request as a cache miss.
     * Call this from a cache aspect or interceptor when data is fetched from the database.
     */
    public static void markCacheMiss(HttpServletRequest request) {
        request.setAttribute(CACHE_HIT_ATTRIBUTE, false);
    }
}
