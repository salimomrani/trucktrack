package com.trucktrack.location.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for updating an existing trip.
 * T009: Create Trip DTOs
 * Feature: 010-trip-management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTripRequest {

    @Size(max = 500, message = "Origin must not exceed 500 characters")
    private String origin;

    @Size(max = 500, message = "Destination must not exceed 500 characters")
    private String destination;

    /**
     * Updated scheduled time.
     */
    private Instant scheduledAt;

    /**
     * Updated notes.
     */
    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;
}
