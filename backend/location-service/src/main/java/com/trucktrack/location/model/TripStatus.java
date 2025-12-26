package com.trucktrack.location.model;

/**
 * Trip status enumeration for delivery assignments.
 * Feature: 010-trip-management
 *
 * State transitions:
 * PENDING -> ASSIGNED (when truck/driver assigned)
 * ASSIGNED -> IN_PROGRESS (when driver starts trip)
 * IN_PROGRESS -> COMPLETED (when driver completes trip)
 * PENDING/ASSIGNED/IN_PROGRESS -> CANCELLED (when dispatcher cancels)
 */
public enum TripStatus {
    /**
     * Trip created but not yet assigned to a truck/driver
     */
    PENDING,

    /**
     * Trip assigned to a truck and driver, waiting to start
     */
    ASSIGNED,

    /**
     * Driver has started the trip, currently in transit
     */
    IN_PROGRESS,

    /**
     * Trip completed successfully
     */
    COMPLETED,

    /**
     * Trip was cancelled before completion
     */
    CANCELLED;

    /**
     * Check if this status can transition to the target status.
     */
    public boolean canTransitionTo(TripStatus target) {
        return switch (this) {
            case PENDING -> target == ASSIGNED || target == CANCELLED;
            case ASSIGNED -> target == IN_PROGRESS || target == CANCELLED;
            case IN_PROGRESS -> target == COMPLETED || target == CANCELLED;
            case COMPLETED, CANCELLED -> false; // Terminal states
        };
    }

    /**
     * Check if this is a terminal state (no further transitions allowed).
     */
    public boolean isTerminal() {
        return this == COMPLETED || this == CANCELLED;
    }
}
