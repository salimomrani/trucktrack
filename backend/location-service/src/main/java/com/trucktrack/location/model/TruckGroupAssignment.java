package com.trucktrack.location.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Junction table for many-to-many relationship between Trucks and TruckGroups.
 * T050: Create TruckGroupAssignment entity
 * Feature: 002-admin-panel
 */
@Entity
@Table(name = "truck_group_assignments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"truck_id", "group_id"}),
    indexes = {
        @Index(name = "idx_tga_truck_id", columnList = "truck_id"),
        @Index(name = "idx_tga_group_id", columnList = "group_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class TruckGroupAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "truck_id", nullable = false)
    private UUID truckId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;

    /**
     * Factory method for creating a new assignment.
     */
    public static TruckGroupAssignment create(UUID truckId, UUID groupId, UUID assignedBy) {
        return TruckGroupAssignment.builder()
            .truckId(truckId)
            .groupId(groupId)
            .assignedBy(assignedBy)
            .build();
    }
}
