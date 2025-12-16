package com.trucktrack.location.service;

import com.trucktrack.location.dto.GeofenceDTO;
import com.trucktrack.location.model.Geofence;
import com.trucktrack.location.model.GeofenceZoneType;
import com.trucktrack.location.repository.GeofenceRepository;
import com.trucktrack.common.exception.ResourceNotFoundException;
import com.trucktrack.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for Geofence operations
 * T143: Create GeofenceRepository (service layer)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GeofenceService {

    private final GeofenceRepository geofenceRepository;

    // SRID 4326 = WGS84 (GPS coordinate system)
    private static final int SRID_WGS84 = 4326;
    private final GeometryFactory geometryFactory = new GeometryFactory(
            new PrecisionModel(), SRID_WGS84);

    /**
     * Create a new geofence
     */
    @Transactional(readOnly = false)
    public GeofenceDTO createGeofence(GeofenceDTO dto, UUID userId) {
        log.info("Creating geofence '{}' by user {}", dto.getName(), userId);

        validateCoordinates(dto.getCoordinates());

        Geofence geofence = new Geofence();
        geofence.setName(dto.getName());
        geofence.setDescription(dto.getDescription());
        geofence.setZoneType(dto.getZoneType());
        geofence.setBoundary(createPolygon(dto.getCoordinates()));
        geofence.setRadiusMeters(dto.getRadiusMeters());
        geofence.setCenterLatitude(dto.getCenterLatitude());
        geofence.setCenterLongitude(dto.getCenterLongitude());
        geofence.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        geofence.setCreatedBy(userId);

        Geofence saved = geofenceRepository.save(geofence);
        log.info("Created geofence with ID {}", saved.getId());

        return toDTO(saved);
    }

    /**
     * Update an existing geofence
     */
    @Transactional(readOnly = false)
    public GeofenceDTO updateGeofence(UUID id, GeofenceDTO dto, UUID userId) {
        log.info("Updating geofence {} by user {}", id, userId);

        Geofence geofence = geofenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence", "id", id));

        if (dto.getName() != null) {
            geofence.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            geofence.setDescription(dto.getDescription());
        }
        if (dto.getZoneType() != null) {
            geofence.setZoneType(dto.getZoneType());
        }
        if (dto.getCoordinates() != null && !dto.getCoordinates().isEmpty()) {
            validateCoordinates(dto.getCoordinates());
            geofence.setBoundary(createPolygon(dto.getCoordinates()));
        }
        if (dto.getRadiusMeters() != null) {
            geofence.setRadiusMeters(dto.getRadiusMeters());
        }
        if (dto.getCenterLatitude() != null) {
            geofence.setCenterLatitude(dto.getCenterLatitude());
        }
        if (dto.getCenterLongitude() != null) {
            geofence.setCenterLongitude(dto.getCenterLongitude());
        }
        if (dto.getIsActive() != null) {
            geofence.setIsActive(dto.getIsActive());
        }

        Geofence saved = geofenceRepository.save(geofence);
        log.info("Updated geofence {}", id);

        return toDTO(saved);
    }

    /**
     * Delete a geofence
     */
    @Transactional(readOnly = false)
    public void deleteGeofence(UUID id, UUID userId) {
        log.info("Deleting geofence {} by user {}", id, userId);

        if (!geofenceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Geofence", "id", id);
        }

        geofenceRepository.deleteById(id);
        log.info("Deleted geofence {}", id);
    }

    /**
     * Get a geofence by ID
     */
    public GeofenceDTO getGeofence(UUID id) {
        Geofence geofence = geofenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence", "id", id));
        return toDTO(geofence);
    }

    /**
     * Get all active geofences
     */
    public List<GeofenceDTO> getAllActiveGeofences() {
        return geofenceRepository.findByIsActiveTrue()
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Get all geofences by zone type
     */
    public List<GeofenceDTO> getGeofencesByType(GeofenceZoneType zoneType) {
        return geofenceRepository.findByZoneTypeAndIsActiveTrue(zoneType)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Get geofences by user
     */
    public Page<GeofenceDTO> getGeofencesByUser(UUID userId, Pageable pageable) {
        return geofenceRepository.findByCreatedBy(userId, pageable)
                .map(this::toDTO);
    }

    /**
     * Search geofences by name
     */
    public Page<GeofenceDTO> searchGeofences(String name, Pageable pageable) {
        return geofenceRepository.findByNameContainingIgnoreCase(name, pageable)
                .map(this::toDTO);
    }

    /**
     * Find geofences containing a point
     */
    public List<GeofenceDTO> findGeofencesContainingPoint(double latitude, double longitude) {
        return geofenceRepository.findGeofencesContainingPoint(latitude, longitude)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Check if point is inside any geofence
     */
    public boolean isPointInsideAnyGeofence(double latitude, double longitude) {
        return geofenceRepository.isPointInsideAnyGeofence(latitude, longitude);
    }

    /**
     * Check if point is inside a specific geofence
     */
    public boolean isPointInsideGeofence(UUID geofenceId, double latitude, double longitude) {
        return geofenceRepository.isPointInsideGeofence(geofenceId, latitude, longitude);
    }

    /**
     * Get geofences in bounding box (for map viewport)
     */
    public List<GeofenceDTO> getGeofencesInBoundingBox(
            double minLon, double minLat, double maxLon, double maxLat) {
        return geofenceRepository.findGeofencesInBoundingBox(minLon, minLat, maxLon, maxLat)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Get distance to geofence
     */
    public Double getDistanceToGeofence(UUID geofenceId, double latitude, double longitude) {
        return geofenceRepository.getDistanceToGeofence(geofenceId, latitude, longitude);
    }

    /**
     * Find restricted zones within distance
     */
    public List<GeofenceDTO> findRestrictedZonesWithinDistance(
            double latitude, double longitude, double distanceMeters) {
        return geofenceRepository.findRestrictedZonesWithinDistance(
                        latitude, longitude, distanceMeters)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    /**
     * Convert coordinates to JTS Polygon
     */
    private Polygon createPolygon(List<List<Double>> coordinates) {
        Coordinate[] coords = coordinates.stream()
                .map(coord -> new Coordinate(coord.get(0), coord.get(1))) // [lon, lat]
                .toArray(Coordinate[]::new);

        LinearRing ring = geometryFactory.createLinearRing(coords);
        Polygon polygon = geometryFactory.createPolygon(ring, null);
        polygon.setSRID(SRID_WGS84);
        return polygon;
    }

    /**
     * Validate polygon coordinates
     */
    private void validateCoordinates(List<List<Double>> coordinates) {
        if (coordinates == null || coordinates.size() < 4) {
            throw new ValidationException(
                    "Polygon must have at least 4 points (including closing point)");
        }

        // Check that polygon is closed (first point == last point)
        List<Double> first = coordinates.get(0);
        List<Double> last = coordinates.get(coordinates.size() - 1);
        if (!first.get(0).equals(last.get(0)) || !first.get(1).equals(last.get(1))) {
            throw new ValidationException(
                    "Polygon must be closed (first and last points must be identical)");
        }

        // Validate each coordinate
        for (List<Double> coord : coordinates) {
            if (coord.size() != 2) {
                throw new ValidationException(
                        "Each coordinate must have exactly 2 values [longitude, latitude]");
            }
            double lon = coord.get(0);
            double lat = coord.get(1);
            if (lon < -180 || lon > 180) {
                throw new ValidationException("Longitude must be between -180 and 180");
            }
            if (lat < -90 || lat > 90) {
                throw new ValidationException("Latitude must be between -90 and 90");
            }
        }
    }

    /**
     * Convert entity to DTO
     */
    private GeofenceDTO toDTO(Geofence geofence) {
        GeofenceDTO dto = new GeofenceDTO();
        dto.setId(geofence.getId());
        dto.setName(geofence.getName());
        dto.setDescription(geofence.getDescription());
        dto.setZoneType(geofence.getZoneType());
        dto.setRadiusMeters(geofence.getRadiusMeters());
        dto.setCenterLatitude(geofence.getCenterLatitude());
        dto.setCenterLongitude(geofence.getCenterLongitude());
        dto.setIsActive(geofence.getIsActive());
        dto.setCreatedBy(geofence.getCreatedBy());
        dto.setCreatedAt(geofence.getCreatedAt());
        dto.setUpdatedAt(geofence.getUpdatedAt());

        // Convert polygon to coordinate array
        if (geofence.getBoundary() != null) {
            Coordinate[] coords = geofence.getBoundary().getCoordinates();
            List<List<Double>> coordList = java.util.Arrays.stream(coords)
                    .map(c -> java.util.Arrays.asList(c.x, c.y)) // [lon, lat]
                    .toList();
            dto.setCoordinates(coordList);
        }

        return dto;
    }
}
