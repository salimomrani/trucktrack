package com.trucktrack.auth.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing user-to-group assignment.
 * T023: Create UserGroupAssignment entity
 * Feature: 002-admin-panel
 *
 * Note: truck_group_id has no FK constraint as groups are in location-service database.
 */
@Entity
@Table(name = "user_truck_groups", indexes = {
    @Index(name = "idx_user_truck_groups_user", columnList = "user_id"),
    @Index(name = "idx_user_truck_groups_group", columnList = "truck_group_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(UserGroupAssignment.UserGroupAssignmentId.class)
public class UserGroupAssignment {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "truck_group_id", nullable = false)
    private UUID truckGroupId;

    @Column(name = "assigned_at", nullable = false)
    @Builder.Default
    private Instant assignedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    /**
     * Composite primary key class.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGroupAssignmentId implements Serializable {
        private UUID userId;
        private UUID truckGroupId;
    }

    /**
     * Creates a new assignment.
     */
    public static UserGroupAssignment create(UUID userId, UUID truckGroupId) {
        return UserGroupAssignment.builder()
            .userId(userId)
            .truckGroupId(truckGroupId)
            .assignedAt(Instant.now())
            .build();
    }
}
