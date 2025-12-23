package com.trucktrack.location.dto;

import com.trucktrack.location.model.TruckGroup;
import java.time.Instant;
import java.util.UUID;

/**
 * T122: Group detail response DTO with statistics
 * Feature: 002-admin-panel (US5 - Groups)
 */
public record GroupDetailResponse(
    UUID id,
    String name,
    String description,
    long truckCount,
    long userCount,
    Instant createdAt,
    Instant updatedAt
) {
    public static GroupDetailResponse fromEntity(TruckGroup group, long truckCount, long userCount) {
        return new GroupDetailResponse(
            group.getId(),
            group.getName(),
            group.getDescription(),
            truckCount,
            userCount,
            group.getCreatedAt(),
            group.getUpdatedAt()
        );
    }

    public static GroupDetailResponse fromEntity(TruckGroup group) {
        return fromEntity(group, 0, 0);
    }
}
