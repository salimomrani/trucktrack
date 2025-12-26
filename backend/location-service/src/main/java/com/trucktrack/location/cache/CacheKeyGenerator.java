package com.trucktrack.location.cache;

import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Custom cache key generator for standardized key generation.
 * Generates keys in format: {methodName}:{param1}:{param2}:...
 */
@Component("cacheKeyGenerator")
public class CacheKeyGenerator implements KeyGenerator {

    private static final String KEY_SEPARATOR = ":";

    @Override
    public Object generate(Object target, Method method, Object... params) {
        if (params.length == 0) {
            return method.getName();
        }

        String paramsKey = Arrays.stream(params)
                .map(this::paramToString)
                .collect(Collectors.joining(KEY_SEPARATOR));

        return method.getName() + KEY_SEPARATOR + paramsKey;
    }

    /**
     * Generate a cache key for a specific entity type and identifier.
     *
     * @param prefix The cache key prefix (e.g., "trucks:list")
     * @param identifier The unique identifier (e.g., groupId)
     * @return The complete cache key
     */
    public static String generateKey(String prefix, Object identifier) {
        return prefix + paramToStringStatic(identifier);
    }

    /**
     * Generate a cache key for listing entities by group.
     *
     * @param entityType The entity type (e.g., "trucks", "drivers")
     * @param groupId The group identifier
     * @return The complete cache key
     */
    public static String generateListKey(String entityType, UUID groupId) {
        return entityType + ":list:" + (groupId != null ? groupId.toString() : "all");
    }

    /**
     * Generate a cache key for a single entity detail.
     *
     * @param entityType The entity type (e.g., "trucks", "drivers")
     * @param entityId The entity identifier
     * @return The complete cache key
     */
    public static String generateDetailKey(String entityType, Object entityId) {
        return entityType + ":detail:" + paramToStringStatic(entityId);
    }

    /**
     * Generate a cache key for paginated trucks list with filters.
     * Used by AdminTruckService.getTrucks() for caching paginated results.
     *
     * @param page Page number
     * @param size Page size
     * @param search Search term
     * @param status Truck status filter
     * @param groupId Group ID filter
     * @param sortBy Sort field
     * @param sortDir Sort direction
     * @return The complete cache key
     */
    public static String trucksListKey(int page, int size, String search, Object status, UUID groupId, String sortBy, String sortDir) {
        StringBuilder key = new StringBuilder("trucks:list:");
        key.append(page).append(":");
        key.append(size).append(":");
        key.append(search != null ? search.hashCode() : "null").append(":");
        key.append(status != null ? status.toString() : "null").append(":");
        key.append(groupId != null ? groupId.toString() : "null").append(":");
        key.append(sortBy != null ? sortBy : "null").append(":");
        key.append(sortDir != null ? sortDir : "null");
        return key.toString();
    }

    /**
     * Generate a cache key for paginated groups list with filters.
     * Used by AdminGroupService.getGroups() for caching paginated results.
     *
     * @param search Search term
     * @param page Page number
     * @param size Page size
     * @return The complete cache key
     */
    public static String groupsListKey(String search, int page, int size) {
        StringBuilder key = new StringBuilder("groups:list:");
        key.append(search != null ? search.hashCode() : "null").append(":");
        key.append(page).append(":");
        key.append(size);
        return key.toString();
    }

    private String paramToString(Object param) {
        return paramToStringStatic(param);
    }

    private static String paramToStringStatic(Object param) {
        if (param == null) {
            return "null";
        }
        if (param instanceof UUID) {
            return param.toString();
        }
        if (param instanceof String) {
            return (String) param;
        }
        if (param instanceof Number) {
            return param.toString();
        }
        // For complex objects, use hashCode
        return String.valueOf(param.hashCode());
    }
}
