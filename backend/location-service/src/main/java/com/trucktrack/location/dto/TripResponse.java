package com.trucktrack.location.dto;

import com.trucktrack.common.util.ConversionUtils;
import com.trucktrack.location.model.ProofStatus;
import com.trucktrack.location.model.Trip;
import com.trucktrack.location.model.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for trip response.
 * T009: Create Trip DTOs
 * Feature: 010-trip-management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripResponse {

    private UUID id;
    private String origin;
    private Double originLat;
    private Double originLng;
    private String destination;
    private Double destinationLat;
    private Double destinationLng;
    private TripStatus status;
    private String statusDisplay;
    private Instant scheduledAt;
    private Instant startedAt;
    private Instant completedAt;
    private String notes;

    // Assignment info
    private UUID assignedTruckId;
    private String assignedTruckName;
    private UUID assignedDriverId;
    private String assignedDriverName;

    // Audit info
    private UUID createdBy;
    private String createdByName;
    private Instant createdAt;
    private Instant updatedAt;

    // Proof of Delivery info (Feature: 015-proof-of-delivery)
    private ProofStatus proofStatus;
    private String proofStatusDisplay;

    /**
     * Factory method to create response from entity.
     */
    public static TripResponse fromEntity(Trip trip) {
        return TripResponse.builder()
            .id(trip.getId())
            .origin(trip.getOrigin())
            .originLat(ConversionUtils.toDouble(trip.getOriginLat()))
            .originLng(ConversionUtils.toDouble(trip.getOriginLng()))
            .destination(trip.getDestination())
            .destinationLat(ConversionUtils.toDouble(trip.getDestinationLat()))
            .destinationLng(ConversionUtils.toDouble(trip.getDestinationLng()))
            .status(trip.getStatus())
            .statusDisplay(getStatusDisplay(trip.getStatus()))
            .scheduledAt(trip.getScheduledAt())
            .startedAt(trip.getStartedAt())
            .completedAt(trip.getCompletedAt())
            .notes(trip.getNotes())
            .assignedTruckId(trip.getAssignedTruckId())
            .assignedTruckName(trip.getAssignedTruckName())
            .assignedDriverId(trip.getAssignedDriverId())
            .assignedDriverName(trip.getAssignedDriverName())
            .createdBy(trip.getCreatedBy())
            .createdAt(trip.getCreatedAt())
            .updatedAt(trip.getUpdatedAt())
            .build();
    }

    /**
     * Factory method with enriched user info.
     */
    public static TripResponse fromEntity(Trip trip, String createdByName) {
        TripResponse response = fromEntity(trip);
        response.setCreatedByName(createdByName);
        return response;
    }

    private static String getStatusDisplay(TripStatus status) {
        if (status == null) return "Unknown";
        return switch (status) {
            case PENDING -> "Pending";
            case ASSIGNED -> "Assigned";
            case IN_PROGRESS -> "In Progress";
            case COMPLETED -> "Completed";
            case CANCELLED -> "Cancelled";
        };
    }
}
