package com.trucktrack.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * T123: Create group request DTO
 * Feature: 002-admin-panel (US5 - Groups)
 */
public record CreateGroupRequest(
    @NotBlank(message = "Group name is required")
    @Size(max = 100, message = "Group name must not exceed 100 characters")
    String name,

    @Size(max = 500, message = "Description must not exceed 500 characters")
    String description
) {}
