package com.trucktrack.auth.dto;

import com.trucktrack.auth.model.User;
import com.trucktrack.common.security.UserRole;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for admin user response with full details.
 * T027: Create UserAdminResponse DTO
 * Feature: 002-admin-panel
 */
public record UserAdminResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    String fullName,
    UserRole role,
    boolean isActive,
    Instant lastLogin,
    Instant createdAt,
    Instant updatedAt,
    List<UUID> groupIds,
    int groupCount
) {
    /**
     * Creates response from User entity.
     */
    public static UserAdminResponse from(User user) {
        return new UserAdminResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.getRole(),
            user.getIsActive(),
            user.getLastLogin(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            List.of(),
            0
        );
    }

    /**
     * Creates response from User entity with group information.
     */
    public static UserAdminResponse from(User user, List<UUID> groupIds) {
        return new UserAdminResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.getRole(),
            user.getIsActive(),
            user.getLastLogin(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            groupIds,
            groupIds.size()
        );
    }

    /**
     * Creates a minimal response (for lists).
     */
    public static UserAdminResponse minimal(User user, int groupCount) {
        return new UserAdminResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.getRole(),
            user.getIsActive(),
            user.getLastLogin(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            null,
            groupCount
        );
    }
}
