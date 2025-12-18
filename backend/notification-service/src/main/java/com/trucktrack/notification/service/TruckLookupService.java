package com.trucktrack.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for looking up truck readable IDs
 * Caches results to avoid repeated database queries
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TruckLookupService {

    private final JdbcTemplate jdbcTemplate;

    // Simple cache for truck readable IDs
    private final Map<UUID, String> truckIdCache = new ConcurrentHashMap<>();

    /**
     * Get the readable truck ID (e.g., "TRK-001") for a given truck UUID
     * Returns the first 8 chars of UUID if not found
     */
    public String getTruckReadableId(UUID truckId) {
        return truckIdCache.computeIfAbsent(truckId, this::lookupTruckId);
    }

    /**
     * Get the readable truck ID from a string UUID
     */
    public String getTruckReadableId(String truckIdStr) {
        try {
            UUID truckId = UUID.fromString(truckIdStr);
            return getTruckReadableId(truckId);
        } catch (IllegalArgumentException e) {
            return truckIdStr.substring(0, Math.min(8, truckIdStr.length()));
        }
    }

    private String lookupTruckId(UUID truckId) {
        try {
            String sql = "SELECT truck_id FROM trucks WHERE id = ?";
            String truckReadableId = jdbcTemplate.queryForObject(sql, String.class, truckId);
            if (truckReadableId != null) {
                log.debug("Found truck readable ID {} for UUID {}", truckReadableId, truckId);
                return truckReadableId;
            }
        } catch (Exception e) {
            log.warn("Could not find truck with ID {}: {}", truckId, e.getMessage());
        }
        // Fallback to first 8 chars of UUID
        return truckId.toString().substring(0, 8);
    }

    /**
     * Clear the cache (useful for testing or when trucks are updated)
     */
    public void clearCache() {
        truckIdCache.clear();
    }
}
