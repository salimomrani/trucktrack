package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Truck entity representing a vehicle in the fleet
 * T056: Create Truck entity with JPA + validation
 */
@Entity
@Table(name = "trucks", indexes = {
    @Index(name = "idx_trucks_truck_id", columnList = "truck_id"),
    @Index(name = "idx_trucks_status", columnList = "status"),
    @Index(name = "idx_trucks_truck_group", columnList = "truck_group_id")
})
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Truck ID is required")
    @Size(max = 50, message = "Truck ID must not exceed 50 characters")
    @Column(name = "truck_id", unique = true, nullable = false, length = 50)
    private String truckId;

    @Size(max = 100, message = "License plate must not exceed 100 characters")
    @Column(name = "license_plate", length = 100)
    private String licensePlate;

    @Size(max = 100, message = "Driver name must not exceed 100 characters")
    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Size(max = 50, message = "Driver phone must not exceed 50 characters")
    @Column(name = "driver_phone", length = 50)
    private String driverPhone;

    @NotNull(message = "Vehicle type is required")
    @Size(max = 50, message = "Vehicle type must not exceed 50 characters")
    @Column(name = "vehicle_type", nullable = false, length = 50)
    private String vehicleType;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TruckStatus status = TruckStatus.OFFLINE;

    @Column(name = "current_latitude", precision = 10, scale = 8)
    private BigDecimal currentLatitude;

    @Column(name = "current_longitude", precision = 11, scale = 8)
    private BigDecimal currentLongitude;

    @Column(name = "current_speed", precision = 5, scale = 2)
    private BigDecimal currentSpeed;

    @Column(name = "current_heading")
    private Integer currentHeading;

    @Column(name = "last_update")
    private Instant lastUpdate;

    @NotNull(message = "Truck group ID is required")
    @Column(name = "truck_group_id", nullable = false)
    private UUID truckGroupId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Constructors
    public Truck() {
    }

    public Truck(String truckId, UUID truckGroupId) {
        this.truckId = truckId;
        this.truckGroupId = truckGroupId;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTruckId() {
        return truckId;
    }

    public void setTruckId(String truckId) {
        this.truckId = truckId;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public TruckStatus getStatus() {
        return status;
    }

    public void setStatus(TruckStatus status) {
        this.status = status;
    }

    public BigDecimal getCurrentLatitude() {
        return currentLatitude;
    }

    public void setCurrentLatitude(BigDecimal currentLatitude) {
        this.currentLatitude = currentLatitude;
    }

    public BigDecimal getCurrentLongitude() {
        return currentLongitude;
    }

    public void setCurrentLongitude(BigDecimal currentLongitude) {
        this.currentLongitude = currentLongitude;
    }

    public BigDecimal getCurrentSpeed() {
        return currentSpeed;
    }

    public void setCurrentSpeed(BigDecimal currentSpeed) {
        this.currentSpeed = currentSpeed;
    }

    public Integer getCurrentHeading() {
        return currentHeading;
    }

    public void setCurrentHeading(Integer currentHeading) {
        this.currentHeading = currentHeading;
    }

    public Instant getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(Instant lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public UUID getTruckGroupId() {
        return truckGroupId;
    }

    public void setTruckGroupId(UUID truckGroupId) {
        this.truckGroupId = truckGroupId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "Truck{" +
                "id=" + id +
                ", truckId='" + truckId + '\'' +
                ", status=" + status +
                ", lastUpdate=" + lastUpdate +
                '}';
    }
}
