package com.trucktrack.location.dto;

import java.util.UUID;

/**
 * Embedded DTO for entity information in analytics responses.
 * Feature: 006-fleet-analytics
 */
public record EntityInfo(
    EntityType type,
    UUID id,
    String name,
    int truckCount
) {
    public enum EntityType {
        TRUCK, GROUP, FLEET
    }

    public static EntityInfo fleet(int truckCount) {
        return new EntityInfo(EntityType.FLEET, null, "Toute la flotte", truckCount);
    }

    public static EntityInfo group(UUID groupId, String groupName, int truckCount) {
        return new EntityInfo(EntityType.GROUP, groupId, groupName, truckCount);
    }

    public static EntityInfo truck(UUID truckId, String truckName) {
        return new EntityInfo(EntityType.TRUCK, truckId, truckName, 1);
    }
}
