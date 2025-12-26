package com.trucktrack.location.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for assigning a trip to a truck and driver.
 * T009: Create Trip DTOs
 * Feature: 010-trip-management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTripRequest {

    @NotNull(message = "Truck ID is required")
    private UUID truckId;

    @NotNull(message = "Driver ID is required")
    private UUID driverId;
}
