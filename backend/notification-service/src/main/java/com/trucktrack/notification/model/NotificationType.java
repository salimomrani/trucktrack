package com.trucktrack.notification.model;

/**
 * Types of notifications
 */
public enum NotificationType {
    // Alert types (existing)
    OFFLINE,
    IDLE,
    GEOFENCE_ENTER,
    GEOFENCE_EXIT,
    SPEED_LIMIT,

    // Email/Push notification types (Feature 016)
    DELIVERY_CONFIRMED,
    TRIP_ASSIGNED,
    TRIP_STARTED,
    TRIP_REASSIGNED,
    TRIP_CANCELLED,
    ETA_30MIN,
    ETA_10MIN,
    DAILY_REPORT
}
