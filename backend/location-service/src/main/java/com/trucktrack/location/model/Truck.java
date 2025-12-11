package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Truck entity representing a vehicle in the fleet
 * T056: Create Truck entity with JPA + validation
 * Refactored with Lombok best practices
 */
@Entity
@Table(name = "trucks", indexes = {
    @Index(name = "idx_trucks_truck_id", columnList = "truck_id"),
    @Index(name = "idx_trucks_status", columnList = "status"),
    @Index(name = "idx_trucks_truck_group", columnList = "truck_group_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
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
    @Convert(converter = com.trucktrack.location.converter.TruckStatusConverter.class)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
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
}
