package com.trucktrack.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * T105: Update configuration request DTO
 * Feature: 002-admin-panel (US4 - Config)
 */
public record UpdateConfigRequest(
    @NotBlank(message = "Value is required")
    String value,

    @NotNull(message = "Version is required for optimistic locking")
    Long version,

    String reason
) {}
