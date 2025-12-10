package com.trucktrack.auth.model;

/**
 * User role enumeration for authorization
 * FLEET_MANAGER: Full access to all features
 * DISPATCHER: Can view and manage trucks and alerts
 * VIEWER: Read-only access to maps and reports
 */
public enum UserRole {
    FLEET_MANAGER,
    DISPATCHER,
    VIEWER
}
