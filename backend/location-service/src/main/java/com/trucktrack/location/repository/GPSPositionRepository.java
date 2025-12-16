package com.trucktrack.location.repository;

import com.trucktrack.location.model.GPSPosition;
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
 * Repository for GPSPosition entity with JPA and partitioning support
 * T061: Create GPSPositionRepository with JPA and partitioning support
 *
 * Note: The gps_positions table is partitioned by timestamp for optimal query performance
 * Partition pruning happens automatically when queries include timestamp filters
 */
@Repository
public interface GPSPositionRepository extends JpaRepository<GPSPosition, UUID> {

    /**
     * Find the most recent GPS position for a truck
     * Used for displaying current truck location
     */
    @Query("SELECT g FROM GPSPosition g WHERE g.truckId = :truckId " +
           "ORDER BY g.timestamp DESC LIMIT 1")
    GPSPosition findLatestByTruckId(@Param("truckId") UUID truckId);

    /**
     * Find GPS positions for a truck within a time range (for historical routes)
     * Uses partition pruning for performance (timestamp filter triggers it)
     * User Story 3: View Truck Movement History
     */
    @Query("SELECT g FROM GPSPosition g WHERE g.truckId = :truckId " +
           "AND g.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY g.timestamp ASC")
    List<GPSPosition> findByTruckIdAndTimestampBetween(
        @Param("truckId") UUID truckId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    /**
     * Find GPS positions for a truck within a time range with pagination
     * Useful when historical data is large
     */
    Page<GPSPosition> findByTruckIdAndTimestampBetween(
        UUID truckId,
        Instant startTime,
        Instant endTime,
        Pageable pageable
    );

    /**
     * Find all GPS positions for a truck (paginated)
     */
    Page<GPSPosition> findByTruckId(UUID truckId, Pageable pageable);

    /**
     * Find GPS positions for multiple trucks within a time range
     * Used for batch processing or analytics
     */
    @Query("SELECT g FROM GPSPosition g WHERE g.truckId IN :truckIds " +
           "AND g.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY g.truckId, g.timestamp ASC")
    List<GPSPosition> findByTruckIdsAndTimestampBetween(
        @Param("truckIds") List<UUID> truckIds,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    /**
     * Count GPS positions for a truck within a time range
     */
    long countByTruckIdAndTimestampBetween(UUID truckId, Instant startTime, Instant endTime);

    /**
     * Delete old GPS positions (for data retention policy)
     * Called by scheduled job to remove data older than retention period
     */
    @Query("DELETE FROM GPSPosition g WHERE g.timestamp < :threshold")
    void deleteOlderThan(@Param("threshold") Instant threshold);

    /**
     * Check if any GPS position exists for a truck within time range
     */
    boolean existsByTruckIdAndTimestampBetween(UUID truckId, Instant startTime, Instant endTime);

    /**
     * Find sampled GPS positions for historical route (reduce points for large datasets)
     * Samples every Nth position based on modulo operation
     * Used when route has >500 points to reduce frontend payload
     * Note: CAST syntax used instead of :: to avoid Spring Data parameter parsing issues
     */
    @Query(value = "SELECT * FROM gps_positions WHERE truck_id = :truckId " +
                   "AND timestamp BETWEEN :startTime AND :endTime " +
                   "AND MOD(CAST(EXTRACT(EPOCH FROM timestamp) AS integer), :sampleRate) = 0 " +
                   "ORDER BY timestamp ASC",
           nativeQuery = true)
    List<GPSPosition> findSampledPositions(
        @Param("truckId") UUID truckId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("sampleRate") int sampleRate
    );

    /**
     * Find GPS positions within a geographic bounding box and time range
     * Used for spatial queries (e.g., "show all GPS points in this area today")
     */
    @Query("SELECT g FROM GPSPosition g WHERE " +
           "g.latitude BETWEEN :minLat AND :maxLat AND " +
           "g.longitude BETWEEN :minLng AND :maxLng AND " +
           "g.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY g.timestamp DESC")
    List<GPSPosition> findInBoundingBoxAndTimeRange(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLng") Double minLng,
        @Param("maxLng") Double maxLng,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    /**
     * Get statistics: average speed for a truck in time range
     */
    @Query("SELECT AVG(g.speed) FROM GPSPosition g WHERE g.truckId = :truckId " +
           "AND g.timestamp BETWEEN :startTime AND :endTime " +
           "AND g.speed IS NOT NULL")
    Double getAverageSpeed(
        @Param("truckId") UUID truckId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    /**
     * Get total distance traveled (approximation using consecutive GPS points)
     * Note: This is a simplified calculation; production should use PostGIS ST_Distance
     */
    @Query(value = "SELECT SUM(distance) FROM (" +
                   "  SELECT ST_Distance(" +
                   "    ST_MakePoint(longitude, latitude)::geography," +
                   "    ST_MakePoint(" +
                   "      LAG(longitude) OVER (ORDER BY timestamp)," +
                   "      LAG(latitude) OVER (ORDER BY timestamp)" +
                   "    )::geography" +
                   "  ) as distance " +
                   "  FROM gps_positions " +
                   "  WHERE truck_id = :truckId " +
                   "  AND timestamp BETWEEN :startTime AND :endTime" +
                   ") distances",
           nativeQuery = true)
    Double getTotalDistanceTraveled(
        @Param("truckId") UUID truckId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    /**
     * Find all GPS positions within a time range (for all trucks)
     * Used for global history view
     */
    @Query("SELECT g FROM GPSPosition g WHERE g.timestamp BETWEEN :startTime AND :endTime " +
           "ORDER BY g.timestamp DESC")
    List<GPSPosition> findAllByTimestampBetween(
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    /**
     * Count all GPS positions within a time range
     */
    @Query("SELECT COUNT(g) FROM GPSPosition g WHERE g.timestamp BETWEEN :startTime AND :endTime")
    long countAllByTimestampBetween(
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime
    );

    /**
     * Find sampled GPS positions for all trucks (reduce points for large datasets)
     */
    @Query(value = "SELECT * FROM gps_positions WHERE timestamp BETWEEN :startTime AND :endTime " +
                   "AND MOD(CAST(EXTRACT(EPOCH FROM timestamp) AS integer), :sampleRate) = 0 " +
                   "ORDER BY timestamp DESC",
           nativeQuery = true)
    List<GPSPosition> findAllSampledPositions(
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("sampleRate") int sampleRate
    );
}
