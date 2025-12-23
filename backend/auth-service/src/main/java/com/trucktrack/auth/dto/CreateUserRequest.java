package com.trucktrack.auth.dto;

import com.trucktrack.common.security.UserRole;
import com.trucktrack.auth.validator.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * DTO for creating a new user.
 * T025: Create CreateUserRequest DTO
 * Feature: 002-admin-panel
 */
public record CreateUserRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    String email,

    @NotBlank(message = "Password is required")
    @ValidPassword
    String password,

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    String firstName,

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    String lastName,

    @NotNull(message = "Role is required")
    UserRole role,

    List<UUID> groupIds
) {
    /**
     * Returns group IDs or empty list if null.
     */
    public List<UUID> getGroupIdsOrEmpty() {
        return groupIds != null ? groupIds : List.of();
    }
}
