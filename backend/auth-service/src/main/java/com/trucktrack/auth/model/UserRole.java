package com.trucktrack.auth.model;

/**
 * User role enumeration for authorization.
 * Feature: 002-admin-panel
 *
 * ADMIN: Full system access, can manage users and configuration
 * FLEET_MANAGER: Manage assigned truck groups, alerts, and reports
 * DISPATCHER: Can view and manage trucks and alerts in assigned groups
 * DRIVER: Mobile app access for assigned truck only
 * VIEWER: Read-only access to maps and reports
 */
public enum UserRole {
    ADMIN,
    FLEET_MANAGER,
    DISPATCHER,
    DRIVER,
    VIEWER;

    /**
     * Checks if this role has admin privileges.
     */
    public boolean isAdmin() {
        return this == ADMIN;
    }

    /**
     * Checks if this role can manage users.
     */
    public boolean canManageUsers() {
        return this == ADMIN;
    }

    /**
     * Checks if this role can manage trucks.
     */
    public boolean canManageTrucks() {
        return this == ADMIN || this == FLEET_MANAGER;
    }

    /**
     * Checks if this role can view trucks.
     */
    public boolean canViewTrucks() {
        return this != DRIVER; // All except DRIVER can view multiple trucks
    }
}
