package com.trucktrack.location.dto;

import com.trucktrack.location.model.SystemConfig;
import java.time.Instant;
import java.util.UUID;

/**
 * T104: Configuration response DTO
 * Feature: 002-admin-panel (US4 - Config)
 */
public record ConfigResponse(
    UUID id,
    String key,
    String value,
    String description,
    Integer version,
    Instant updatedAt,
    UUID updatedBy
) {
    public static ConfigResponse fromEntity(SystemConfig config) {
        return new ConfigResponse(
            config.getId(),
            config.getKey(),
            config.getValue(),
            config.getDescription(),
            config.getVersion(),
            config.getUpdatedAt(),
            config.getUpdatedBy()
        );
    }
}
