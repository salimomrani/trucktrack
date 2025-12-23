package com.trucktrack.auth.dto;

import com.trucktrack.common.security.UserRole;
import com.trucktrack.auth.validator.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * DTO for updating an existing user.
 * T026: Create UpdateUserRequest DTO
 * Feature: 002-admin-panel
 *
 * All fields are optional - only provided fields will be updated.
 */
public record UpdateUserRequest(
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    String email,

    @ValidPassword
    String password,

    @Size(max = 100, message = "First name must not exceed 100 characters")
    String firstName,

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    String lastName,

    UserRole role,

    List<UUID> groupIds
) {
    /**
     * Checks if email should be updated.
     */
    public boolean hasEmail() {
        return email != null && !email.isBlank();
    }

    /**
     * Checks if password should be updated.
     */
    public boolean hasPassword() {
        return password != null && !password.isBlank();
    }

    /**
     * Checks if first name should be updated.
     */
    public boolean hasFirstName() {
        return firstName != null && !firstName.isBlank();
    }

    /**
     * Checks if last name should be updated.
     */
    public boolean hasLastName() {
        return lastName != null && !lastName.isBlank();
    }

    /**
     * Checks if role should be updated.
     */
    public boolean hasRole() {
        return role != null;
    }

    /**
     * Checks if groups should be updated.
     */
    public boolean hasGroupIds() {
        return groupIds != null;
    }
}
