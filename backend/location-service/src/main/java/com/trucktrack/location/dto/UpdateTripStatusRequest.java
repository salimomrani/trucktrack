package com.trucktrack.location.dto;

import com.trucktrack.location.model.TripStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating trip status.
 * T009: Create Trip DTOs
 * Feature: 010-trip-management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTripStatusRequest {

    @NotNull(message = "Status is required")
    private TripStatus status;

    /**
     * Optional notes for the status change (e.g., reason for cancellation).
     */
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
