package com.trucktrack.location.dto;

import com.trucktrack.location.model.ConfigHistory;
import java.time.Instant;

/**
 * Configuration history response DTO
 * Feature: 002-admin-panel (US4 - Config)
 */
public record ConfigHistoryResponse(
    Long id,
    String configKey,
    String oldValue,
    String newValue,
    String changedBy,
    Instant changedAt,
    String reason
) {
    public static ConfigHistoryResponse fromEntity(ConfigHistory history) {
        return new ConfigHistoryResponse(
            history.getId(),
            history.getConfigKey(),
            history.getOldValue(),
            history.getNewValue(),
            history.getChangedBy(),
            history.getChangedAt(),
            history.getReason()
        );
    }
}
