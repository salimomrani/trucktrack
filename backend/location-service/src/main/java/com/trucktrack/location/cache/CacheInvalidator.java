package com.trucktrack.location.cache;

import com.trucktrack.common.cache.CacheConstants;
import com.trucktrack.location.service.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * T031: Event listener for cross-entity cache invalidation.
 * Handles cache eviction when related entities change (e.g., driver assignment affects trucks cache).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CacheInvalidator {

    private final CacheService cacheService;

    /**
     * Event triggered when a driver is assigned to a truck.
     */
    public record DriverAssignedEvent(String truckId, String driverId) {}

    /**
     * Event triggered when a driver is unassigned from a truck.
     */
    public record DriverUnassignedEvent(String truckId, String previousDriverId) {}

    /**
     * Event triggered when a truck is added to or removed from a group.
     */
    public record TruckGroupChangedEvent(String truckId, String groupId, boolean added) {}

    /**
     * Event triggered when a group is modified (trucks list may be affected).
     */
    public record GroupModifiedEvent(String groupId) {}

    /**
     * Handle driver assignment - invalidate both trucks and drivers caches.
     */
    @EventListener
    @Async
    public void onDriverAssigned(DriverAssignedEvent event) {
        log.info("Driver {} assigned to truck {} - invalidating caches", event.driverId(), event.truckId());
        cacheService.evictAllTrucks();
        cacheService.evictAllDrivers();
    }

    /**
     * Handle driver unassignment - invalidate both trucks and drivers caches.
     */
    @EventListener
    @Async
    public void onDriverUnassigned(DriverUnassignedEvent event) {
        log.info("Driver {} unassigned from truck {} - invalidating caches", event.previousDriverId(), event.truckId());
        cacheService.evictAllTrucks();
        cacheService.evictAllDrivers();
    }

    /**
     * Handle truck group changes - invalidate trucks and groups caches.
     */
    @EventListener
    @Async
    public void onTruckGroupChanged(TruckGroupChangedEvent event) {
        log.info("Truck {} {} group {} - invalidating caches",
            event.truckId(), event.added() ? "added to" : "removed from", event.groupId());
        cacheService.evictAllTrucks();
        cacheService.evictAllGroups();
    }

    /**
     * Handle group modification - invalidate groups cache.
     */
    @EventListener
    @Async
    public void onGroupModified(GroupModifiedEvent event) {
        log.info("Group {} modified - invalidating groups cache", event.groupId());
        cacheService.evictAllGroups();
    }

    /**
     * Invalidate all caches (for admin use or bulk operations).
     */
    public void invalidateAll() {
        log.info("Invalidating all caches");
        cacheService.evictAllTrucks();
        cacheService.evictAllDrivers();
        cacheService.evictAllGroups();
        cacheService.evictAllStats();
    }

    /**
     * Invalidate truck-related caches.
     */
    public void invalidateTrucks() {
        log.info("Invalidating trucks cache");
        cacheService.evictAllTrucks();
    }

    /**
     * Invalidate driver-related caches.
     */
    public void invalidateDrivers() {
        log.info("Invalidating drivers cache");
        cacheService.evictAllDrivers();
    }

    /**
     * Invalidate group-related caches.
     */
    public void invalidateGroups() {
        log.info("Invalidating groups cache");
        cacheService.evictAllGroups();
    }

    /**
     * Invalidate stats caches (short TTL, but can be force-invalidated).
     */
    public void invalidateStats() {
        log.info("Invalidating stats cache");
        cacheService.evictAllStats();
    }
}
