package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Truck entity representing a vehicle in the fleet
 * T056: Create Truck entity with JPA + validation
 */
@Entity
@Table(name = "trucks", indexes = {
    @Index(name = "idx_truck_id_readable", columnList = "truck_id_readable"),
    @Index(name = "idx_truck_status", columnList = "status"),
    @Index(name = "idx_truck_group_id", columnList = "truck_group_id")
})
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Truck ID is required")
    @Size(max = 50, message = "Truck ID must not exceed 50 characters")
    @Column(name = "truck_id_readable", unique = true, nullable = false, length = 50)
    private String truckIdReadable;

    @Size(max = 100, message = "License plate must not exceed 100 characters")
    @Column(name = "license_plate", length = 100)
    private String licensePlate;

    @Size(max = 100, message = "Make must not exceed 100 characters")
    @Column(name = "make", length = 100)
    private String make;

    @Size(max = 100, message = "Model must not exceed 100 characters")
    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "year")
    private Integer year;

    @Size(max = 100, message = "Driver name must not exceed 100 characters")
    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Size(max = 50, message = "Driver phone must not exceed 50 characters")
    @Column(name = "driver_phone", length = 50)
    private String driverPhone;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TruckStatus status = TruckStatus.OFFLINE;

    @Column(name = "last_latitude")
    private Double lastLatitude;

    @Column(name = "last_longitude")
    private Double lastLongitude;

    @Column(name = "last_speed")
    private Double lastSpeed;

    @Column(name = "last_heading")
    private Integer lastHeading;

    @Column(name = "last_update")
    private Instant lastUpdate;

    @NotNull(message = "Truck group ID is required")
    @Column(name = "truck_group_id", nullable = false)
    private UUID truckGroupId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Constructors
    public Truck() {
    }

    public Truck(String truckIdReadable, UUID truckGroupId) {
        this.truckIdReadable = truckIdReadable;
        this.truckGroupId = truckGroupId;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTruckIdReadable() {
        return truckIdReadable;
    }

    public void setTruckIdReadable(String truckIdReadable) {
        this.truckIdReadable = truckIdReadable;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
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

    public TruckStatus getStatus() {
        return status;
    }

    public void setStatus(TruckStatus status) {
        this.status = status;
    }

    public Double getLastLatitude() {
        return lastLatitude;
    }

    public void setLastLatitude(Double lastLatitude) {
        this.lastLatitude = lastLatitude;
    }

    public Double getLastLongitude() {
        return lastLongitude;
    }

    public void setLastLongitude(Double lastLongitude) {
        this.lastLongitude = lastLongitude;
    }

    public Double getLastSpeed() {
        return lastSpeed;
    }

    public void setLastSpeed(Double lastSpeed) {
        this.lastSpeed = lastSpeed;
    }

    public Integer getLastHeading() {
        return lastHeading;
    }

    public void setLastHeading(Integer lastHeading) {
        this.lastHeading = lastHeading;
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

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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
                ", truckIdReadable='" + truckIdReadable + '\'' +
                ", status=" + status +
                ", lastUpdate=" + lastUpdate +
                '}';
    }
}
