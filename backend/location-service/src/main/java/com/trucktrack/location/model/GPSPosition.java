package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * GPS Position entity with PostGIS spatial support
 * T057: Create GPSPosition entity with JPA + PostGIS Point type
 *
 * Stored in partitioned table gps_positions (partitioned by timestamp)
 */
@Entity
@Table(name = "gps_positions", indexes = {
    @Index(name = "idx_gps_positions_truck_time", columnList = "truck_id, timestamp"),
    @Index(name = "idx_gps_positions_timestamp", columnList = "timestamp")
})
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

    @Column(name = "created_at", nullable = false)
    private Instant receivedAt;

    @Transient
    private String eventId;

    // Constructors
    public GPSPosition() {
        this.receivedAt = Instant.now();
    }

    public GPSPosition(UUID truckId, BigDecimal latitude, BigDecimal longitude, Instant timestamp) {
        this();
        this.truckId = truckId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getTruckId() {
        return truckId;
    }

    public void setTruckId(UUID truckId) {
        this.truckId = truckId;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public BigDecimal getAltitude() {
        return altitude;
    }

    public void setAltitude(BigDecimal altitude) {
        this.altitude = altitude;
    }

    public BigDecimal getSpeed() {
        return speed;
    }

    public void setSpeed(BigDecimal speed) {
        this.speed = speed;
    }

    public Integer getHeading() {
        return heading;
    }

    public void setHeading(Integer heading) {
        this.heading = heading;
    }

    public BigDecimal getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(BigDecimal accuracy) {
        this.accuracy = accuracy;
    }

    public Integer getSatellites() {
        return satellites;
    }

    public void setSatellites(Integer satellites) {
        this.satellites = satellites;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Instant receivedAt) {
        this.receivedAt = receivedAt;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    @Override
    public String toString() {
        return "GPSPosition{" +
                "id=" + id +
                ", truckId=" + truckId +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", timestamp=" + timestamp +
                '}';
    }
}
