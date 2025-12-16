package com.trucktrack.location.repository;

import com.trucktrack.location.model.Geofence;
import com.trucktrack.location.model.GeofenceZoneType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Geofence entity with PostGIS spatial queries
 * T143: Create GeofenceRepository
 */
@Repository
public interface GeofenceRepository extends JpaRepository<Geofence, UUID> {

    /**
     * Find all geofences containing a specific point (lat/lon)
     * Uses PostGIS ST_Contains to check if point is inside polygon
     *
     * @param latitude  GPS latitude
     * @param longitude GPS longitude
     * @return List of geofences containing the point
     */
    @Query(value = """
        SELECT g.* FROM geofences g
        WHERE g.is_active = true
        AND ST_Contains(g.boundary, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))
        """, nativeQuery = true)
    List<Geofence> findGeofencesContainingPoint(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude);

    /**
     * Find all geofences of a specific type containing a point
     *
     * @param latitude  GPS latitude
     * @param longitude GPS longitude
     * @param zoneType  Type of zone to filter
     * @return List of matching geofences
     */
    @Query(value = """
        SELECT g.* FROM geofences g
        WHERE g.is_active = true
        AND g.zone_type = :zoneType
        AND ST_Contains(g.boundary, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))
        """, nativeQuery = true)
    List<Geofence> findGeofencesContainingPointByType(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("zoneType") String zoneType);

    /**
     * Check if a point is inside any active geofence
     *
     * @param latitude  GPS latitude
     * @param longitude GPS longitude
     * @return true if point is inside at least one geofence
     */
    @Query(value = """
        SELECT EXISTS(
            SELECT 1 FROM geofences g
            WHERE g.is_active = true
            AND ST_Contains(g.boundary, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))
        )
        """, nativeQuery = true)
    boolean isPointInsideAnyGeofence(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude);

    /**
     * Check if a point is inside a specific geofence
     *
     * @param geofenceId Geofence ID
     * @param latitude   GPS latitude
     * @param longitude  GPS longitude
     * @return true if point is inside the geofence
     */
    @Query(value = """
        SELECT EXISTS(
            SELECT 1 FROM geofences g
            WHERE g.id = :geofenceId
            AND g.is_active = true
            AND ST_Contains(g.boundary, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))
        )
        """, nativeQuery = true)
    boolean isPointInsideGeofence(
            @Param("geofenceId") UUID geofenceId,
            @Param("latitude") double latitude,
            @Param("longitude") double longitude);

    /**
     * Find all active geofences
     */
    List<Geofence> findByIsActiveTrue();

    /**
     * Find all geofences by zone type
     */
    List<Geofence> findByZoneTypeAndIsActiveTrue(GeofenceZoneType zoneType);

    /**
     * Find all geofences created by a specific user
     */
    Page<Geofence> findByCreatedBy(UUID userId, Pageable pageable);

    /**
     * Find geofences by name (partial match, case-insensitive)
     */
    Page<Geofence> findByNameContainingIgnoreCase(String name, Pageable pageable);

    /**
     * Find geofences that intersect with a bounding box (for map viewport)
     *
     * @param minLon Minimum longitude
     * @param minLat Minimum latitude
     * @param maxLon Maximum longitude
     * @param maxLat Maximum latitude
     * @return List of geofences within/intersecting the bounding box
     */
    @Query(value = """
        SELECT g.* FROM geofences g
        WHERE g.is_active = true
        AND ST_Intersects(
            g.boundary,
            ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)
        )
        """, nativeQuery = true)
    List<Geofence> findGeofencesInBoundingBox(
            @Param("minLon") double minLon,
            @Param("minLat") double minLat,
            @Param("maxLon") double maxLon,
            @Param("maxLat") double maxLat);

    /**
     * Calculate distance from a point to the nearest edge of a geofence
     * Useful for "approaching geofence" alerts
     *
     * @param geofenceId Geofence ID
     * @param latitude   GPS latitude
     * @param longitude  GPS longitude
     * @return Distance in meters (negative if inside, positive if outside)
     */
    @Query(value = """
        SELECT ST_Distance(
            CAST(g.boundary AS geography),
            CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography)
        ) FROM geofences g
        WHERE g.id = :geofenceId
        """, nativeQuery = true)
    Double getDistanceToGeofence(
            @Param("geofenceId") UUID geofenceId,
            @Param("latitude") double latitude,
            @Param("longitude") double longitude);

    /**
     * Check if a point is within a specified distance of any restricted zone
     * Useful for pre-emptive alerts
     *
     * @param latitude        GPS latitude
     * @param longitude       GPS longitude
     * @param distanceMeters  Distance threshold in meters
     * @return List of restricted zones within distance
     */
    @Query(value = """
        SELECT g.* FROM geofences g
        WHERE g.is_active = true
        AND g.zone_type = 'RESTRICTED_ZONE'
        AND ST_DWithin(
            CAST(g.boundary AS geography),
            CAST(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326) AS geography),
            :distanceMeters
        )
        """, nativeQuery = true)
    List<Geofence> findRestrictedZonesWithinDistance(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("distanceMeters") double distanceMeters);
}
