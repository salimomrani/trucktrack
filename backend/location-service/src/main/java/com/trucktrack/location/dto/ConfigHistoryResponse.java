package com.trucktrack.location.dto;

import com.trucktrack.location.model.ConfigHistory;
import java.time.Instant;
import java.util.UUID;

/**
 * Configuration history response DTO
 * Feature: 002-admin-panel (US4 - Config)
 */
public record ConfigHistoryResponse(
    UUID id,
    String configKey,
    String oldValue,
    String newValue,
    UUID changedBy,
    Instant changedAt
) {
    public static ConfigHistoryResponse fromEntity(ConfigHistory history) {
        return new ConfigHistoryResponse(
            history.getId(),
            history.getConfigKey(),
            history.getOldValue(),
            history.getNewValue(),
            history.getChangedBy(),
            history.getChangedAt()
        );
    }
}
