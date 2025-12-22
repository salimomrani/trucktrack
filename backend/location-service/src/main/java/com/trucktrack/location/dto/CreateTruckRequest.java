package com.trucktrack.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for creating a new truck.
 * T053: Create CreateTruckRequest DTO
 * Feature: 002-admin-panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTruckRequest {

    @NotBlank(message = "Truck ID is required")
    @Size(max = 50, message = "Truck ID must not exceed 50 characters")
    private String truckId;

    @Size(max = 100, message = "License plate must not exceed 100 characters")
    private String licensePlate;

    @NotBlank(message = "Vehicle type is required")
    @Size(max = 50, message = "Vehicle type must not exceed 50 characters")
    private String vehicleType;

    @Size(max = 100, message = "Driver name must not exceed 100 characters")
    private String driverName;

    @Size(max = 50, message = "Driver phone must not exceed 50 characters")
    private String driverPhone;

    /**
     * Primary group for the truck (required for backward compatibility).
     */
    @NotNull(message = "Primary group is required")
    private UUID primaryGroupId;

    /**
     * Additional groups to assign the truck to.
     */
    private List<UUID> additionalGroupIds;
}
