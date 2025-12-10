package com.trucktrack.location.model;

/**
 * Truck status enumeration
 * ACTIVE: Truck is moving (speed > 5 km/h)
 * IDLE: Truck is stationary but online (speed <= 5 km/h, last update < 5 min)
 * OFFLINE: Truck has not sent GPS data in > 5 minutes
 */
public enum TruckStatus {
    ACTIVE,
    IDLE,
    OFFLINE
}
