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
     * Find truck by readable ID (e.g., "TRUCK-001")
     */
    Optional<Truck> findByTruckIdReadable(String truckIdReadable);

    /**
     * Find all trucks in a specific group
     */
    List<Truck> findByTruckGroupId(UUID truckGroupId);

    /**
     * Find all trucks with a specific status
     */
    List<Truck> findByStatus(TruckStatus status);

    /**
     * Find all active trucks in a group
     */
    List<Truck> findByTruckGroupIdAndIsActiveTrue(UUID truckGroupId);

    /**
     * Find trucks by status with pagination
     */
    Page<Truck> findByStatus(TruckStatus status, Pageable pageable);

    /**
     * Find trucks in a group with specific status
     */
    List<Truck> findByTruckGroupIdAndStatus(UUID truckGroupId, TruckStatus status);

    /**
     * Find all active trucks (for live map display)
     */
    List<Truck> findByIsActiveTrue();

    /**
     * Search trucks by truck ID or driver name (case-insensitive)
     * Used for User Story 2: Search and Filter
     */
    @Query("SELECT t FROM Truck t WHERE " +
           "LOWER(t.truckIdReadable) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(t.driverName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Truck> searchByTruckIdOrDriverName(@Param("query") String query);

    /**
     * Find trucks that haven't updated in specified duration (for detecting offline trucks)
     */
    @Query("SELECT t FROM Truck t WHERE t.lastUpdate < :threshold AND t.isActive = true")
    List<Truck> findStalePositions(@Param("threshold") Instant threshold);

    /**
     * Find trucks within a bounding box (spatial query for map viewport)
     * Uses spatial index for performance
     */
    @Query("SELECT t FROM Truck t WHERE " +
           "t.lastLatitude BETWEEN :minLat AND :maxLat AND " +
           "t.lastLongitude BETWEEN :minLng AND :maxLng AND " +
           "t.isActive = true")
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
     * Count active trucks in a group
     */
    long countByTruckGroupIdAndIsActiveTrue(UUID truckGroupId);

    /**
     * Check if truck exists by readable ID
     */
    boolean existsByTruckIdReadable(String truckIdReadable);

    /**
     * Find trucks with license plate (exact match)
     */
    Optional<Truck> findByLicensePlate(String licensePlate);
}
