package com.trucktrack.location.repository;

import com.trucktrack.location.model.TruckGroupAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for TruckGroupAssignment entity.
 * T051: Create TruckGroupAssignmentRepository
 * Feature: 002-admin-panel
 */
@Repository
public interface TruckGroupAssignmentRepository extends JpaRepository<TruckGroupAssignment, UUID> {

    /**
     * Find all assignments for a truck.
     */
    List<TruckGroupAssignment> findByTruckId(UUID truckId);

    /**
     * Find all assignments for a group.
     */
    List<TruckGroupAssignment> findByGroupId(UUID groupId);

    /**
     * Get group IDs for a truck.
     */
    @Query("SELECT tga.groupId FROM TruckGroupAssignment tga WHERE tga.truckId = :truckId")
    List<UUID> findGroupIdsByTruckId(@Param("truckId") UUID truckId);

    /**
     * Get truck IDs for a group.
     */
    @Query("SELECT tga.truckId FROM TruckGroupAssignment tga WHERE tga.groupId = :groupId")
    List<UUID> findTruckIdsByGroupId(@Param("groupId") UUID groupId);

    /**
     * Count trucks in a group.
     */
    long countByGroupId(UUID groupId);

    /**
     * Count groups for a truck.
     */
    long countByTruckId(UUID truckId);

    /**
     * Check if assignment exists.
     */
    boolean existsByTruckIdAndGroupId(UUID truckId, UUID groupId);

    /**
     * Delete all assignments for a truck.
     */
    @Modifying
    void deleteByTruckId(UUID truckId);

    /**
     * Delete all assignments for a group.
     */
    @Modifying
    void deleteByGroupId(UUID groupId);

    /**
     * Delete specific assignment.
     */
    @Modifying
    void deleteByTruckIdAndGroupId(UUID truckId, UUID groupId);
}
