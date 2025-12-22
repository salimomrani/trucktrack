package com.trucktrack.location.model;

/**
 * Truck status enumeration
 * ACTIVE: Truck is moving (speed > 5 km/h)
 * IDLE: Truck is stationary but online (speed <= 5 km/h, last update < 5 min)
 * OFFLINE: Truck has not sent GPS data in > 5 minutes
 * MAINTENANCE: Truck is undergoing scheduled maintenance
 * OUT_OF_SERVICE: Truck is decommissioned or permanently unavailable
 */
public enum TruckStatus {
    ACTIVE,
    IDLE,
    OFFLINE,
    MAINTENANCE,
    OUT_OF_SERVICE
}
