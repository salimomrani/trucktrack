package com.trucktrack.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.UUID;

/**
 * DTO pour créer un nouveau truck
 * Exemple de best practice : Record Java + @Builder + Bean Validation
 */
@Builder
public record CreateTruckRequestDTO(
    @NotBlank(message = "Truck ID is required")
    @Size(max = 50, message = "Truck ID must not exceed 50 characters")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "Truck ID must contain only uppercase letters, numbers, and hyphens")
    String truckId,

    @NotNull(message = "Truck group ID is required")
    UUID truckGroupId,

    @Size(max = 100, message = "License plate must not exceed 100 characters")
    String licensePlate,

    @Size(max = 100, message = "Driver name must not exceed 100 characters")
    String driverName,

    @Size(max = 50, message = "Driver phone must not exceed 50 characters")
    @Pattern(regexp = "^\\+?[0-9\\s-()]+$", message = "Invalid phone number format")
    String driverPhone,

    @NotBlank(message = "Vehicle type is required")
    @Size(max = 50, message = "Vehicle type must not exceed 50 characters")
    String vehicleType
) {}
