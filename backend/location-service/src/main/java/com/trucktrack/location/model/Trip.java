package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Trip entity representing a delivery assignment.
 * Feature: 010-trip-management
 *
 * A trip has origin/destination, can be assigned to a truck and driver,
 * and progresses through status: PENDING -> ASSIGNED -> IN_PROGRESS -> COMPLETED
 */
@Entity
@Table(name = "trips", indexes = {
    @Index(name = "idx_trips_status", columnList = "status"),
    @Index(name = "idx_trips_driver", columnList = "assigned_driver_id"),
    @Index(name = "idx_trips_truck", columnList = "assigned_truck_id"),
    @Index(name = "idx_trips_scheduled", columnList = "scheduled_at"),
    @Index(name = "idx_trips_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Origin is required")
    @Size(max = 500, message = "Origin must not exceed 500 characters")
    @Column(name = "origin", nullable = false, length = 500)
    private String origin;

    @NotBlank(message = "Destination is required")
    @Size(max = 500, message = "Destination must not exceed 500 characters")
    @Column(name = "destination", nullable = false, length = 500)
    private String destination;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TripStatus status = TripStatus.PENDING;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "assigned_truck_id")
    private UUID assignedTruckId;

    @Column(name = "assigned_driver_id")
    private UUID assignedDriverId;

    @NotNull(message = "Created by is required")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Transient fields for response enrichment (not persisted)
    @Transient
    private String assignedTruckName;

    @Transient
    private String assignedDriverName;

    /**
     * Check if the trip can transition to the given status.
     */
    public boolean canTransitionTo(TripStatus newStatus) {
        return status.canTransitionTo(newStatus);
    }

    /**
     * Check if the trip is in a terminal state.
     */
    public boolean isTerminal() {
        return status.isTerminal();
    }

    /**
     * Check if the trip is assigned to a specific driver.
     */
    public boolean isAssignedTo(UUID driverId) {
        return assignedDriverId != null && assignedDriverId.equals(driverId);
    }
}
