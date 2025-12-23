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
     * Uses native query with explicit UUID casting to handle null parameters correctly.
     */
    @Query(value = "SELECT * FROM trucks t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.truck_id) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.license_plate) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.driver_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.vehicle_type) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:groupId AS UUID) IS NULL OR t.truck_group_id = CAST(:groupId AS UUID))",
           countQuery = "SELECT COUNT(*) FROM trucks t WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(t.truck_id) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.license_plate) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.driver_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.vehicle_type) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:groupId AS UUID) IS NULL OR t.truck_group_id = CAST(:groupId AS UUID))",
           nativeQuery = true)
    Page<Truck> searchWithFilters(
        @Param("search") String search,
        @Param("status") String status,
        @Param("groupId") UUID groupId,
        Pageable pageable
    );

    /**
     * T136: Find trucks that belong to any of the specified groups.
     * Uses a JOIN with truck_group_assignments to filter by allowed groups.
     * Optimized single-query approach (no N+1 problem).
     */
    @Query(value = "SELECT DISTINCT t.* FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds",
           countQuery = "SELECT COUNT(DISTINCT t.id) FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds",
           nativeQuery = true)
    Page<Truck> findByAllowedGroups(
        @Param("allowedGroupIds") List<UUID> allowedGroupIds,
        Pageable pageable
    );

    /**
     * T136: Find trucks by status that belong to any of the specified groups.
     * Uses a JOIN with truck_group_assignments to filter by allowed groups and status.
     */
    @Query(value = "SELECT DISTINCT t.* FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status)",
           countQuery = "SELECT COUNT(DISTINCT t.id) FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status)",
           nativeQuery = true)
    Page<Truck> findByAllowedGroupsAndStatus(
        @Param("allowedGroupIds") List<UUID> allowedGroupIds,
        @Param("status") String status,
        Pageable pageable
    );

    /**
     * T136: Find trucks in a specific group that also belong to user's allowed groups.
     * Ensures user can only see trucks in groups they have access to.
     */
    @Query(value = "SELECT DISTINCT t.* FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds " +
           "AND t.truck_group_id = CAST(:truckGroupId AS UUID)",
           countQuery = "SELECT COUNT(DISTINCT t.id) FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds " +
           "AND t.truck_group_id = CAST(:truckGroupId AS UUID)",
           nativeQuery = true)
    Page<Truck> findByAllowedGroupsAndTruckGroupId(
        @Param("allowedGroupIds") List<UUID> allowedGroupIds,
        @Param("truckGroupId") UUID truckGroupId,
        Pageable pageable
    );

    /**
     * T136: Full filtered query with status, group, and user access control.
     * Combines all filtering options in a single optimized query.
     */
    @Query(value = "SELECT DISTINCT t.* FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:truckGroupId AS UUID) IS NULL OR t.truck_group_id = CAST(:truckGroupId AS UUID))",
           countQuery = "SELECT COUNT(DISTINCT t.id) FROM trucks t " +
           "JOIN truck_group_assignments tga ON t.id = tga.truck_id " +
           "WHERE tga.group_id IN :allowedGroupIds " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR t.status = :status) " +
           "AND (CAST(:truckGroupId AS UUID) IS NULL OR t.truck_group_id = CAST(:truckGroupId AS UUID))",
           nativeQuery = true)
    Page<Truck> findByAllowedGroupsWithFilters(
        @Param("allowedGroupIds") List<UUID> allowedGroupIds,
        @Param("status") String status,
        @Param("truckGroupId") UUID truckGroupId,
        Pageable pageable
    );
}
