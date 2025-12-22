package com.trucktrack.location.repository;

import com.trucktrack.common.audit.AuditAction;
import com.trucktrack.location.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repository for AuditLog entity.
 * T013: Create AuditLogRepository in location-service
 * Feature: 002-admin-panel
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Find all audit logs for a specific entity.
     */
    Page<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(
        String entityType, UUID entityId, Pageable pageable);

    /**
     * Find all audit logs by a specific user.
     */
    Page<AuditLog> findByUserIdOrderByTimestampDesc(UUID userId, Pageable pageable);

    /**
     * Find all audit logs by action type.
     */
    Page<AuditLog> findByActionOrderByTimestampDesc(AuditAction action, Pageable pageable);

    /**
     * Find audit logs within a time range.
     */
    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :startTime AND :endTime ORDER BY a.timestamp DESC")
    Page<AuditLog> findByTimestampBetween(
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        Pageable pageable);

    /**
     * Find recent audit logs for an entity type.
     */
    @Query("SELECT a FROM AuditLog a WHERE a.entityType = :entityType ORDER BY a.timestamp DESC")
    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(
        @Param("entityType") String entityType, Pageable pageable);

    /**
     * Find audit logs with combined filters.
     */
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:entityType IS NULL OR a.entityType = :entityType) AND " +
           "(:action IS NULL OR a.action = :action) AND " +
           "(:userId IS NULL OR a.userId = :userId) AND " +
           "(:startTime IS NULL OR a.timestamp >= :startTime) AND " +
           "(:endTime IS NULL OR a.timestamp <= :endTime) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> findWithFilters(
        @Param("entityType") String entityType,
        @Param("action") AuditAction action,
        @Param("userId") UUID userId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        Pageable pageable);

    /**
     * Get recent logs (last N entries).
     */
    List<AuditLog> findTop50ByOrderByTimestampDesc();

    /**
     * Count logs by entity type for statistics.
     */
    @Query("SELECT a.entityType, COUNT(a) FROM AuditLog a " +
           "WHERE a.timestamp >= :since GROUP BY a.entityType")
    List<Object[]> countByEntityTypeSince(@Param("since") Instant since);

    /**
     * Delete logs older than retention period (90 days).
     */
    void deleteByTimestampBefore(Instant cutoff);
}
