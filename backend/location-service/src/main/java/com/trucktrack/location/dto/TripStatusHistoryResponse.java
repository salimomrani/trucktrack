package com.trucktrack.location.dto;

import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.model.TripStatusHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for trip status history response.
 * T009: Create Trip DTOs
 * Feature: 010-trip-management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripStatusHistoryResponse {

    private UUID id;
    private UUID tripId;
    private TripStatus previousStatus;
    private String previousStatusDisplay;
    private TripStatus newStatus;
    private String newStatusDisplay;
    private UUID changedBy;
    private String changedByName;
    private Instant changedAt;
    private String notes;

    /**
     * Factory method to create response from entity.
     */
    public static TripStatusHistoryResponse fromEntity(TripStatusHistory history) {
        return TripStatusHistoryResponse.builder()
            .id(history.getId())
            .tripId(history.getTripId())
            .previousStatus(history.getPreviousStatus())
            .previousStatusDisplay(getStatusDisplay(history.getPreviousStatus()))
            .newStatus(history.getNewStatus())
            .newStatusDisplay(getStatusDisplay(history.getNewStatus()))
            .changedBy(history.getChangedBy())
            .changedByName(history.getChangedByName())
            .changedAt(history.getChangedAt())
            .notes(history.getNotes())
            .build();
    }

    private static String getStatusDisplay(TripStatus status) {
        if (status == null) return null;
        return switch (status) {
            case PENDING -> "Pending";
            case ASSIGNED -> "Assigned";
            case IN_PROGRESS -> "In Progress";
            case COMPLETED -> "Completed";
            case CANCELLED -> "Cancelled";
        };
    }
}
