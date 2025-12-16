package com.trucktrack.location.dto;

import com.trucktrack.location.model.GeofenceZoneType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for Geofence entity
 * T152: Create GeofenceController
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeofenceDTO {

    private UUID id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Zone type is required")
    private GeofenceZoneType zoneType;

    /**
     * Polygon coordinates as array of [longitude, latitude] pairs
     * GeoJSON format: first and last point must be the same (closed polygon)
     */
    @NotNull(message = "Coordinates are required")
    @Size(min = 4, message = "Polygon must have at least 4 points (including closing point)")
    private List<List<Double>> coordinates;

    /**
     * Optional: radius for circular geofences (in meters)
     */
    @DecimalMin(value = "10.0", message = "Radius must be at least 10 meters")
    @DecimalMax(value = "50000.0", message = "Radius must not exceed 50000 meters")
    private BigDecimal radiusMeters;

    /**
     * Optional: center latitude for circular geofences
     */
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    private BigDecimal centerLatitude;

    /**
     * Optional: center longitude for circular geofences
     */
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    private BigDecimal centerLongitude;

    private Boolean isActive;

    private UUID createdBy;

    private Instant createdAt;

    private Instant updatedAt;
}
