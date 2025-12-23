package com.trucktrack.location.dto;

import com.trucktrack.location.model.SystemConfig;
import java.time.Instant;

/**
 * T104: Configuration response DTO
 * Feature: 002-admin-panel (US4 - Config)
 */
public record ConfigResponse(
    Long id,
    String key,
    String value,
    String description,
    String category,
    String valueType,
    Long version,
    Instant updatedAt,
    String updatedBy
) {
    public static ConfigResponse fromEntity(SystemConfig config) {
        return new ConfigResponse(
            config.getId(),
            config.getKey(),
            config.getValue(),
            config.getDescription(),
            config.getCategory(),
            config.getValueType(),
            config.getVersion(),
            config.getUpdatedAt(),
            config.getUpdatedBy()
        );
    }
}
