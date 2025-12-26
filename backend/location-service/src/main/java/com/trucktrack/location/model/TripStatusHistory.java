package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Trip status history entity for audit trail.
 * Feature: 010-trip-management
 *
 * Records every status change on a trip for audit and timeline display.
 */
@Entity
@Table(name = "trip_status_history", indexes = {
    @Index(name = "idx_trip_history_trip", columnList = "trip_id, changed_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class TripStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "Trip ID is required")
    @Column(name = "trip_id", nullable = false)
    private UUID tripId;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 20)
    private TripStatus previousStatus;

    @NotNull(message = "New status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private TripStatus newStatus;

    @NotNull(message = "Changed by is required")
    @Column(name = "changed_by", nullable = false)
    private UUID changedBy;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private Instant changedAt;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    @Column(name = "notes", length = 500)
    private String notes;

    // Transient field for response enrichment
    @Transient
    private String changedByName;

    /**
     * Create a history entry for a status change.
     */
    public static TripStatusHistory of(UUID tripId, TripStatus previousStatus, TripStatus newStatus, UUID changedBy, String notes) {
        return TripStatusHistory.builder()
                .tripId(tripId)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .notes(notes)
                .build();
    }
}
