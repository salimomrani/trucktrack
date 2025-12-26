package com.trucktrack.location.repository;

import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.model.TripStatusHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TripStatusHistory entity.
 * T007: Create TripStatusHistoryRepository
 * Feature: 010-trip-management
 */
@Repository
public interface TripStatusHistoryRepository extends JpaRepository<TripStatusHistory, UUID> {

    /**
     * Find all status history for a trip, ordered by change time descending.
     */
    List<TripStatusHistory> findByTripIdOrderByChangedAtDesc(UUID tripId);

    /**
     * Find all status history for a trip with pagination.
     */
    Page<TripStatusHistory> findByTripId(UUID tripId, Pageable pageable);

    /**
     * Find the most recent status change for a trip.
     */
    Optional<TripStatusHistory> findFirstByTripIdOrderByChangedAtDesc(UUID tripId);

    /**
     * Find status history by the user who made the change.
     */
    List<TripStatusHistory> findByChangedByOrderByChangedAtDesc(UUID changedBy);

    /**
     * Find status changes within a time range.
     */
    @Query("SELECT h FROM TripStatusHistory h WHERE h.changedAt BETWEEN :start AND :end ORDER BY h.changedAt DESC")
    List<TripStatusHistory> findByChangedAtBetween(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * Find status changes to a specific status.
     */
    List<TripStatusHistory> findByNewStatusOrderByChangedAtDesc(TripStatus newStatus);

    /**
     * Count status changes for a trip.
     */
    long countByTripId(UUID tripId);

    /**
     * Find all status transitions from one status to another within a time range.
     * Useful for analytics (e.g., how many trips moved from ASSIGNED to IN_PROGRESS).
     */
    @Query("SELECT h FROM TripStatusHistory h WHERE h.previousStatus = :from AND h.newStatus = :to " +
           "AND h.changedAt BETWEEN :start AND :end")
    List<TripStatusHistory> findTransitions(
        @Param("from") TripStatus from,
        @Param("to") TripStatus to,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    /**
     * Count transitions to a specific status within a time range.
     */
    @Query("SELECT COUNT(h) FROM TripStatusHistory h WHERE h.newStatus = :status " +
           "AND h.changedAt BETWEEN :start AND :end")
    long countTransitionsToStatus(
        @Param("status") TripStatus status,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    /**
     * Delete all history for a trip (used when deleting a trip).
     */
    void deleteByTripId(UUID tripId);
}
