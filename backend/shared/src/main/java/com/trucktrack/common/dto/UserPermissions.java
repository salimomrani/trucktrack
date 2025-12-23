package com.trucktrack.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for transferring user permission data to frontend.
 * Feature: 008-rbac-permissions
 * T003: Create UserPermissions DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissions {

    /**
     * User's unique identifier.
     */
    private UUID userId;

    /**
     * User's role name.
     */
    private String role;

    /**
     * List of page identifiers the user can access.
     */
    private List<String> accessiblePages;

    /**
     * List of truck group IDs the user is assigned to.
     */
    private List<UUID> groupIds;
}
