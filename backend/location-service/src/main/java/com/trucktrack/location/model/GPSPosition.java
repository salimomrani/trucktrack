package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * GPS Position entity with PostGIS spatial support
 * T057: Create GPSPosition entity with JPA + PostGIS Point type
 *
 * Stored in partitioned table gps_positions (partitioned by timestamp)
 * Refactored with Lombok best practices
 */
@Entity
@Table(name = "gps_positions", indexes = {
    @Index(name = "idx_gps_positions_truck_time", columnList = "truck_id, timestamp"),
    @Index(name = "idx_gps_positions_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class GPSPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", updatable = false, nullable = false)
    private Long id;

    @NotNull(message = "Truck ID is required")
    @Column(name = "truck_id", nullable = false)
    private UUID truckId;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    @Column(name = "latitude", nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    @Column(name = "longitude", nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    /**
     * PostGIS Point geometry for spatial queries
     * SRID 4326 (WGS84) - standard GPS coordinate system
     */
    @Column(name = "geom", columnDefinition = "geometry(Point, 4326)")
    private Point location;

    @DecimalMin(value = "0.0", message = "Altitude must be >= 0")
    @Column(name = "altitude", precision = 7, scale = 2)
    private BigDecimal altitude;

    @DecimalMin(value = "0.0", message = "Speed must be >= 0")
    @Column(name = "speed", precision = 5, scale = 2)
    private BigDecimal speed;

    @Min(value = 0, message = "Heading must be >= 0")
    @Max(value = 359, message = "Heading must be <= 359")
    @Column(name = "heading")
    private Integer heading;

    @DecimalMin(value = "0.0", message = "Accuracy must be >= 0")
    @Column(name = "accuracy", precision = 5, scale = 2)
    private BigDecimal accuracy;

    @Min(value = 0, message = "Satellite count must be >= 0")
    @Column(name = "satellites")
    private Integer satellites;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private Instant receivedAt = Instant.now();

    @Transient
    private String eventId;
}
