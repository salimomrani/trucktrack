package com.trucktrack.location.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Geofence entity representing a geographic boundary zone
 * T140: Create Geofence entity with PostGIS Polygon support
 *
 * Geofences are used to define areas of interest:
 * - DEPOT: Warehouse/depot locations
 * - DELIVERY_AREA: Authorized delivery zones
 * - RESTRICTED_ZONE: Areas trucks should not enter
 * - CUSTOM: User-defined zones
 */
@Entity
@Table(name = "geofences", indexes = {
    @Index(name = "idx_geofences_created_by", columnList = "created_by"),
    @Index(name = "idx_geofences_zone_type", columnList = "zone_type"),
    @Index(name = "idx_geofences_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "boundary")
public class Geofence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Zone type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "zone_type", nullable = false, columnDefinition = "geofence_zone_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private GeofenceZoneType zoneType;

    /**
     * PostGIS Polygon geometry for spatial queries
     * SRID 4326 (WGS84) - standard GPS coordinate system
     * Used for ST_Contains queries to check if truck is inside geofence
     */
    @JsonIgnore
    @Column(name = "boundary", columnDefinition = "geometry(Polygon, 4326)", nullable = false)
    private Polygon boundary;

    /**
     * Optional radius for circular geofences (in meters)
     * When set, the boundary is a circle centered at (center_latitude, center_longitude)
     */
    @DecimalMin(value = "10.0", message = "Radius must be at least 10 meters")
    @DecimalMax(value = "50000.0", message = "Radius must not exceed 50000 meters")
    @Column(name = "radius_meters", precision = 10, scale = 2)
    private BigDecimal radiusMeters;

    /**
     * Center latitude for circular geofences
     */
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    @Column(name = "center_latitude", precision = 10, scale = 8)
    private BigDecimal centerLatitude;

    /**
     * Center longitude for circular geofences
     */
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    @Column(name = "center_longitude", precision = 11, scale = 8)
    private BigDecimal centerLongitude;

    @NotNull
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @NotNull(message = "Created by user ID is required")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Check if this is a circular geofence (has radius and center point)
     */
    public boolean isCircular() {
        return radiusMeters != null && centerLatitude != null && centerLongitude != null;
    }
}
