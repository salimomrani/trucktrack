package com.trucktrack.common.cache;

import java.time.Duration;

/**
 * Cache configuration constants for the multi-level cache system.
 * Defines TTL values and key prefixes for different entity types.
 */
public final class CacheConstants {

    private CacheConstants() {
        // Prevent instantiation
    }

    // Cache names
    public static final String CACHE_TRUCKS = "trucks";
    public static final String CACHE_TRUCKS_BY_ID = "trucks-by-id";
    public static final String CACHE_DRIVERS = "drivers";
    public static final String CACHE_GROUPS = "groups";
    public static final String CACHE_STATS = "stats";

    // TTL values in seconds
    public static final long TTL_TRUCKS_SECONDS = 300;      // 5 minutes
    public static final long TTL_DRIVERS_SECONDS = 300;     // 5 minutes
    public static final long TTL_GROUPS_SECONDS = 600;      // 10 minutes
    public static final long TTL_STATS_SECONDS = 60;        // 1 minute

    // TTL as Duration
    public static final Duration TTL_TRUCKS = Duration.ofSeconds(TTL_TRUCKS_SECONDS);
    public static final Duration TTL_DRIVERS = Duration.ofSeconds(TTL_DRIVERS_SECONDS);
    public static final Duration TTL_GROUPS = Duration.ofSeconds(TTL_GROUPS_SECONDS);
    public static final Duration TTL_STATS = Duration.ofSeconds(TTL_STATS_SECONDS);

    // Key prefixes for Redis
    public static final String KEY_PREFIX_TRUCKS = "trucks:";
    public static final String KEY_PREFIX_TRUCKS_LIST = "trucks:list:";
    public static final String KEY_PREFIX_TRUCKS_DETAIL = "trucks:detail:";
    public static final String KEY_PREFIX_DRIVERS = "drivers:";
    public static final String KEY_PREFIX_DRIVERS_LIST = "drivers:list:";
    public static final String KEY_PREFIX_GROUPS = "groups:";
    public static final String KEY_PREFIX_GROUPS_LIST = "groups:list:";
    public static final String KEY_PREFIX_STATS = "stats:";
    public static final String KEY_PREFIX_STATS_DASHBOARD = "stats:dashboard:";

    // Key pattern for wildcard invalidation
    public static final String KEY_PATTERN_ALL_TRUCKS = "trucks:*";
    public static final String KEY_PATTERN_ALL_DRIVERS = "drivers:*";
    public static final String KEY_PATTERN_ALL_GROUPS = "groups:*";
    public static final String KEY_PATTERN_ALL_STATS = "stats:*";
}
