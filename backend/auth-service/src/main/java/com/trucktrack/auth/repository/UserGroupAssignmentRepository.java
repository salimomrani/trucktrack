package com.trucktrack.auth.repository;

import com.trucktrack.auth.model.UserGroupAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for UserGroupAssignment entity.
 * T024: Create UserGroupAssignmentRepository
 * Feature: 002-admin-panel
 */
@Repository
public interface UserGroupAssignmentRepository
    extends JpaRepository<UserGroupAssignment, UserGroupAssignment.UserGroupAssignmentId> {

    /**
     * Find all group assignments for a user.
     */
    List<UserGroupAssignment> findByUserId(UUID userId);

    /**
     * Find all user assignments for a group.
     */
    List<UserGroupAssignment> findByTruckGroupId(UUID truckGroupId);

    /**
     * Get group IDs assigned to a user.
     */
    @Query("SELECT uga.truckGroupId FROM UserGroupAssignment uga WHERE uga.userId = :userId")
    List<UUID> findGroupIdsByUserId(@Param("userId") UUID userId);

    /**
     * Get user IDs assigned to a group.
     */
    @Query("SELECT uga.userId FROM UserGroupAssignment uga WHERE uga.truckGroupId = :groupId")
    List<UUID> findUserIdsByGroupId(@Param("groupId") UUID groupId);

    /**
     * Check if user is assigned to a group.
     */
    boolean existsByUserIdAndTruckGroupId(UUID userId, UUID truckGroupId);

    /**
     * Delete all assignments for a user.
     */
    @Modifying
    void deleteByUserId(UUID userId);

    /**
     * Delete all assignments for a group.
     */
    @Modifying
    void deleteByTruckGroupId(UUID truckGroupId);

    /**
     * Delete specific assignment.
     */
    @Modifying
    void deleteByUserIdAndTruckGroupId(UUID userId, UUID truckGroupId);

    /**
     * Count users in a group.
     */
    long countByTruckGroupId(UUID truckGroupId);

    /**
     * Count groups for a user.
     */
    long countByUserId(UUID userId);
}
