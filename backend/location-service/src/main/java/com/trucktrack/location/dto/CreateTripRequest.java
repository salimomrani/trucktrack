package com.trucktrack.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for creating a new trip.
 * T009: Create Trip DTOs
 * Feature: 010-trip-management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTripRequest {

    @NotBlank(message = "Origin is required")
    @Size(max = 500, message = "Origin must not exceed 500 characters")
    private String origin;

    @NotBlank(message = "Destination is required")
    @Size(max = 500, message = "Destination must not exceed 500 characters")
    private String destination;

    /**
     * Optional scheduled start time for the trip.
     */
    private Instant scheduledAt;

    /**
     * Optional notes for the trip.
     */
    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;

    /**
     * Optional: Pre-assign to a truck during creation.
     */
    private UUID assignedTruckId;

    /**
     * Optional: Pre-assign to a driver during creation.
     */
    private UUID assignedDriverId;
}
