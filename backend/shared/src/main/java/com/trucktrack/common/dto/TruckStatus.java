package com.trucktrack.common.dto;

/**
 * Common enum for truck status
 * T039: Create common DTO classes in backend/shared
 */
public enum TruckStatus {
    /**
     * Truck is actively moving (speed > 5 km/h and last_update < 2 minutes)
     */
    ACTIVE,

    /**
     * Truck is idle (speed <= 5 km/h and last_update < 5 minutes)
     */
    IDLE,

    /**
     * Truck is offline (last_update >= 5 minutes)
     */
    OFFLINE
}
