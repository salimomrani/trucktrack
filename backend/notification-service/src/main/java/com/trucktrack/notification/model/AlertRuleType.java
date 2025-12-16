package com.trucktrack.notification.model;

/**
 * Types of alert rules
 */
public enum AlertRuleType {
    OFFLINE,
    IDLE,
    GEOFENCE_ENTER,
    GEOFENCE_EXIT,
    SPEED_LIMIT
}
