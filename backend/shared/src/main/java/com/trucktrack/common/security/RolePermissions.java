package com.trucktrack.common.security;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Static permission matrix defining which roles can access which pages.
 * Feature: 008-rbac-permissions
 * T002: Create RolePermissions static class
 *
 * This is the single source of truth for page-level permissions.
 */
public final class RolePermissions {

    private static final Map<UserRole, Set<Page>> PERMISSIONS = Map.of(
        UserRole.ADMIN, EnumSet.allOf(Page.class),
        UserRole.FLEET_MANAGER, EnumSet.of(Page.DASHBOARD, Page.MAP, Page.ANALYTICS, Page.ALERTS, Page.PROFILE),
        UserRole.DISPATCHER, EnumSet.of(Page.DASHBOARD, Page.MAP, Page.ALERTS, Page.PROFILE),
        UserRole.DRIVER, EnumSet.of(Page.DASHBOARD, Page.ALERTS, Page.PROFILE),
        UserRole.VIEWER, EnumSet.of(Page.DASHBOARD, Page.MAP, Page.ALERTS, Page.PROFILE)
    );

    private RolePermissions() {
        // Utility class - prevent instantiation
    }

    /**
     * Check if a role can access a specific page.
     *
     * @param role The user's role
     * @param page The page to check access for
     * @return true if the role can access the page
     */
    public static boolean canAccess(UserRole role, Page page) {
        if (role == null || page == null) {
            return false;
        }
        Set<Page> allowedPages = PERMISSIONS.get(role);
        return allowedPages != null && allowedPages.contains(page);
    }

    /**
     * Get all pages accessible by a role.
     *
     * @param role The user's role
     * @return Set of accessible pages (empty set if role is null or unknown)
     */
    public static Set<Page> getAccessiblePages(UserRole role) {
        if (role == null) {
            return EnumSet.noneOf(Page.class);
        }
        return PERMISSIONS.getOrDefault(role, EnumSet.noneOf(Page.class));
    }

    /**
     * Check if a role is admin (has full access).
     *
     * @param role The user's role
     * @return true if the role is ADMIN
     */
    public static boolean isAdmin(UserRole role) {
        return role == UserRole.ADMIN;
    }

    /**
     * Get all roles that can access a specific page.
     *
     * @param page The page to check
     * @return Set of roles that can access the page
     */
    public static Set<UserRole> getRolesWithAccess(Page page) {
        EnumSet<UserRole> roles = EnumSet.noneOf(UserRole.class);
        for (Map.Entry<UserRole, Set<Page>> entry : PERMISSIONS.entrySet()) {
            if (entry.getValue().contains(page)) {
                roles.add(entry.getKey());
            }
        }
        return roles;
    }
}
