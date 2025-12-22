package com.trucktrack.location.repository;

import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
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
 * Repository for Truck entity with Spring Data JPA and spatial queries
 * T060: Create TruckRepository with Spring Data JPA and spatial queries
 */
@Repository
public interface TruckRepository extends JpaRepository<Truck, UUID> {

    /**
     * Find truck by truck ID (e.g., "TRUCK-001")
     */
    Optional<Truck> findByTruckId(String truckId);

    /**
     * Find all trucks in a specific group
     */
    List<Truck> findByTruckGroupId(UUID truckGroupId);

    /**
     * Find all trucks with a specific status
     */
    List<Truck> findByStatus(TruckStatus status);

    /**
     * Find trucks by status with pagination
     */
    Page<Truck> findByStatus(TruckStatus status, Pageable pageable);

    /**
     * Find trucks in a group with specific status
     */
    List<Truck> findByTruckGroupIdAndStatus(UUID truckGroupId, TruckStatus status);

    /**
     * Find trucks in a group with specific status (paginated)
     */
    Page<Truck> findByTruckGroupIdAndStatus(UUID truckGroupId, TruckStatus status, Pageable pageable);

    /**
     * Search trucks by truck ID or driver name (case-insensitive)
     * Used for User Story 2: Search and Filter
     */
    @Query("SELECT t FROM Truck t WHERE " +
           "LOWER(t.truckId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.driverName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Truck> searchByTruckIdOrDriverName(@Param("query") String query);

    /**
     * Find trucks that haven't updated in specified duration (for detecting offline trucks)
     */
    @Query("SELECT t FROM Truck t WHERE t.lastUpdate < :threshold")
    List<Truck> findStalePositions(@Param("threshold") Instant threshold);

    /**
     * Find trucks within a bounding box (spatial query for map viewport)
     * Uses spatial index for performance
     */
    @Query("SELECT t FROM Truck t WHERE " +
           "t.currentLatitude BETWEEN :minLat AND :maxLat AND " +
           "t.currentLongitude BETWEEN :minLng AND :maxLng")
    List<Truck> findTrucksInBoundingBox(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLng") Double minLng,
        @Param("maxLng") Double maxLng
    );

    /**
     * Count trucks by status
     */
    long countByStatus(TruckStatus status);

    /**
     * Check if truck exists by truck ID
     */
    boolean existsByTruckId(String truckId);

    /**
     * Find trucks with license plate (exact match)
     */
    Optional<Truck> findByLicensePlate(String licensePlate);

    /**
     * Check if license plate exists (excluding a specific truck).
     * Used for uniqueness validation on update.
     */
    @Query("SELECT COUNT(t) > 0 FROM Truck t WHERE t.licensePlate = :licensePlate AND t.id != :excludeId")
    boolean existsByLicensePlateAndIdNot(@Param("licensePlate") String licensePlate, @Param("excludeId") UUID excludeId);

    /**
     * Check if license plate exists.
     */
    boolean existsByLicensePlate(String licensePlate);

    /**
     * Admin search with filters and pagination.
     * Searches by truckId, licensePlate, driverName, or vehicleType.
     */
    @Query("SELECT t FROM Truck t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.truckId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.licensePlate) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.driverName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.vehicleType) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:groupId IS NULL OR t.truckGroupId = :groupId)")
    Page<Truck> searchWithFilters(
        @Param("search") String search,
        @Param("status") TruckStatus status,
        @Param("groupId") UUID groupId,
        Pageable pageable
    );
}
