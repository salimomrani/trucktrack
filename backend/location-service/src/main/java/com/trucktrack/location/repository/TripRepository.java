package com.trucktrack.location.repository;

import com.trucktrack.location.model.Trip;
import com.trucktrack.location.model.TripStatus;
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
 * Repository for Trip entity with Spring Data JPA.
 * T006: Create TripRepository interface
 * Feature: 010-trip-management
 */
@Repository
public interface TripRepository extends JpaRepository<Trip, UUID> {

    /**
     * Find trips by status.
     */
    List<Trip> findByStatus(TripStatus status);

    /**
     * Find trips by status with pagination.
     */
    Page<Trip> findByStatus(TripStatus status, Pageable pageable);

    /**
     * Find trips assigned to a specific driver.
     */
    List<Trip> findByAssignedDriverId(UUID driverId);

    /**
     * Find trips assigned to a specific driver with pagination.
     */
    Page<Trip> findByAssignedDriverId(UUID driverId, Pageable pageable);

    /**
     * Find trips assigned to a specific driver with specific status.
     */
    List<Trip> findByAssignedDriverIdAndStatus(UUID driverId, TripStatus status);

    /**
     * Find active trips for a driver (ASSIGNED or IN_PROGRESS).
     */
    @Query("SELECT t FROM Trip t WHERE t.assignedDriverId = :driverId AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    List<Trip> findActiveTripsForDriver(@Param("driverId") UUID driverId);

    /**
     * Find trips assigned to a specific truck.
     */
    List<Trip> findByAssignedTruckId(UUID truckId);

    /**
     * Find trips assigned to a specific truck with pagination.
     */
    Page<Trip> findByAssignedTruckId(UUID truckId, Pageable pageable);

    /**
     * Find trips created by a specific user.
     */
    List<Trip> findByCreatedBy(UUID createdBy);

    /**
     * Find trips scheduled within a time range.
     */
    @Query("SELECT t FROM Trip t WHERE t.scheduledAt BETWEEN :start AND :end")
    List<Trip> findByScheduledAtBetween(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * Find trips in non-terminal status (for monitoring).
     */
    @Query("SELECT t FROM Trip t WHERE t.status NOT IN ('COMPLETED', 'CANCELLED')")
    List<Trip> findActiveTrips();

    /**
     * Find trips in non-terminal status with pagination.
     */
    @Query("SELECT t FROM Trip t WHERE t.status NOT IN ('COMPLETED', 'CANCELLED')")
    Page<Trip> findActiveTrips(Pageable pageable);

    /**
     * Count trips by status.
     */
    long countByStatus(TripStatus status);

    /**
     * Count active trips for a driver.
     */
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.assignedDriverId = :driverId AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    long countActiveTripsForDriver(@Param("driverId") UUID driverId);

    /**
     * Search trips with filters and pagination.
     * Searches by origin, destination, or notes.
     */
    @Query(value = "SELECT * FROM trips t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.origin) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.notes) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:driverId AS UUID) IS NULL OR t.assigned_driver_id = CAST(:driverId AS UUID)) " +
           "AND (CAST(:truckId AS UUID) IS NULL OR t.assigned_truck_id = CAST(:truckId AS UUID))",
           countQuery = "SELECT COUNT(*) FROM trips t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.origin) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.notes) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:driverId AS UUID) IS NULL OR t.assigned_driver_id = CAST(:driverId AS UUID)) " +
           "AND (CAST(:truckId AS UUID) IS NULL OR t.assigned_truck_id = CAST(:truckId AS UUID))",
           nativeQuery = true)
    Page<Trip> searchWithFilters(
        @Param("search") String search,
        @Param("status") String status,
        @Param("driverId") UUID driverId,
        @Param("truckId") UUID truckId,
        Pageable pageable
    );

    /**
     * Find completed trips for a driver within a time range (for history).
     */
    @Query("SELECT t FROM Trip t WHERE t.assignedDriverId = :driverId " +
           "AND t.status = 'COMPLETED' " +
           "AND t.completedAt BETWEEN :start AND :end " +
           "ORDER BY t.completedAt DESC")
    List<Trip> findCompletedTripsForDriverBetween(
        @Param("driverId") UUID driverId,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    /**
     * Find pending trips (not yet assigned).
     */
    List<Trip> findByStatusOrderByCreatedAtDesc(TripStatus status);

    /**
     * Check if truck has any active trips.
     */
    @Query("SELECT COUNT(t) > 0 FROM Trip t WHERE t.assignedTruckId = :truckId AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    boolean hasTruckActiveTrips(@Param("truckId") UUID truckId);

    /**
     * Check if driver has any active trips.
     */
    @Query("SELECT COUNT(t) > 0 FROM Trip t WHERE t.assignedDriverId = :driverId AND t.status IN ('ASSIGNED', 'IN_PROGRESS')")
    boolean hasDriverActiveTrips(@Param("driverId") UUID driverId);

    /**
     * Search trips with filters including date range.
     * T053: Add date range filter parameters
     */
    @Query(value = "SELECT * FROM trips t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.origin) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.notes) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:driverId AS UUID) IS NULL OR t.assigned_driver_id = CAST(:driverId AS UUID)) " +
           "AND (CAST(:truckId AS UUID) IS NULL OR t.assigned_truck_id = CAST(:truckId AS UUID)) " +
           "AND (CAST(:startDate AS TIMESTAMP) IS NULL OR t.created_at >= :startDate) " +
           "AND (CAST(:endDate AS TIMESTAMP) IS NULL OR t.created_at <= :endDate)",
           countQuery = "SELECT COUNT(*) FROM trips t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.origin) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.notes) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:driverId AS UUID) IS NULL OR t.assigned_driver_id = CAST(:driverId AS UUID)) " +
           "AND (CAST(:truckId AS UUID) IS NULL OR t.assigned_truck_id = CAST(:truckId AS UUID)) " +
           "AND (CAST(:startDate AS TIMESTAMP) IS NULL OR t.created_at >= :startDate) " +
           "AND (CAST(:endDate AS TIMESTAMP) IS NULL OR t.created_at <= :endDate)",
           nativeQuery = true)
    Page<Trip> searchWithFiltersAndDateRange(
        @Param("search") String search,
        @Param("status") String status,
        @Param("driverId") UUID driverId,
        @Param("truckId") UUID truckId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Count trips created within a date range.
     */
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.createdAt >= :start AND t.createdAt < :end")
    long countByCreatedAtBetween(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * Count completed trips within a date range.
     */
    @Query("SELECT COUNT(t) FROM Trip t WHERE t.status = 'COMPLETED' AND t.completedAt >= :start AND t.completedAt < :end")
    long countCompletedBetween(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * Get average trip duration in minutes for completed trips.
     * Uses native SQL for PostgreSQL EXTRACT(EPOCH...) function.
     */
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) " +
           "FROM trips " +
           "WHERE status = 'COMPLETED' " +
           "AND started_at IS NOT NULL " +
           "AND completed_at IS NOT NULL",
           nativeQuery = true)
    Double getAverageTripDurationMinutes();

    /**
     * Get average trip duration for trips completed within a date range.
     * Uses native SQL with explicit TIMESTAMP casting for Instant parameters.
     */
    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) " +
           "FROM trips " +
           "WHERE status = 'COMPLETED' " +
           "AND started_at IS NOT NULL " +
           "AND completed_at IS NOT NULL " +
           "AND completed_at >= CAST(:start AS TIMESTAMP) " +
           "AND completed_at < CAST(:end AS TIMESTAMP)",
           nativeQuery = true)
    Double getAverageTripDurationMinutesBetween(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * T034: Find recent trips ordered by most recent activity timestamp.
     * Uses GREATEST to find the most recent event (started, completed, or updated).
     * Feature: 022-dashboard-real-data
     */
    @Query("SELECT t FROM Trip t ORDER BY " +
           "COALESCE(t.completedAt, t.startedAt, t.updatedAt) DESC")
    List<Trip> findRecentTrips(Pageable pageable);

    /**
     * T034: Find recently started trips.
     * Feature: 022-dashboard-real-data
     */
    @Query("SELECT t FROM Trip t WHERE t.startedAt IS NOT NULL " +
           "ORDER BY t.startedAt DESC")
    List<Trip> findRecentlyStartedTrips(Pageable pageable);

    /**
     * T034: Find recently completed trips.
     * Feature: 022-dashboard-real-data
     */
    @Query("SELECT t FROM Trip t WHERE t.completedAt IS NOT NULL " +
           "ORDER BY t.completedAt DESC")
    List<Trip> findRecentlyCompletedTrips(Pageable pageable);

    /**
     * T034: Find trips with proof of delivery.
     * Feature: 022-dashboard-real-data
     */
    @Query("SELECT t FROM Trip t WHERE t.hasProof = true " +
           "ORDER BY t.completedAt DESC")
    List<Trip> findTripsWithProof(Pageable pageable);
}
