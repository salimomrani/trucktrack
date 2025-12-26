package com.trucktrack.location.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for updating a truck.
 * T054: Create UpdateTruckRequest DTO
 * Feature: 002-admin-panel
 *
 * All fields are optional - only provided fields will be updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTruckRequest {

    @Size(max = 100, message = "License plate must not exceed 100 characters")
    private String licensePlate;

    @Size(max = 50, message = "Vehicle type must not exceed 50 characters")
    private String vehicleType;

    @Size(max = 100, message = "Driver name must not exceed 100 characters")
    private String driverName;

    @Size(max = 50, message = "Driver phone must not exceed 50 characters")
    private String driverPhone;

    /**
     * ID of the driver (user) assigned to this truck.
     * Set to null to unassign the current driver.
     */
    private UUID driverId;
}
