package com.trucktrack.location.controller;

import com.trucktrack.location.dto.GeofenceDTO;
import com.trucktrack.location.model.GeofenceZoneType;
import com.trucktrack.location.service.GeofenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Geofence CRUD operations
 * T152-T153: Create GeofenceController (CRUD)
 */
@RestController
@RequestMapping("/location/v1/geofences")
@RequiredArgsConstructor
@Slf4j
public class GeofenceController {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USERNAME = "X-Username";

    private final GeofenceService geofenceService;

    /**
     * Create a new geofence
     * POST /api/geofences
     */
    @PostMapping
    public ResponseEntity<GeofenceDTO> createGeofence(
            @RequestHeader(value = HEADER_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = HEADER_USERNAME, required = false) String username,
            @Valid @RequestBody GeofenceDTO dto) {

        UUID userId = parseUserId(userIdHeader);
        log.info("User {} ({}) creating geofence '{}'", username, userId, dto.getName());

        GeofenceDTO created = geofenceService.createGeofence(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing geofence
     * PUT /api/geofences/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<GeofenceDTO> updateGeofence(
            @PathVariable UUID id,
            @RequestHeader(value = HEADER_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = HEADER_USERNAME, required = false) String username,
            @Valid @RequestBody GeofenceDTO dto) {

        UUID userId = parseUserId(userIdHeader);
        log.info("User {} ({}) updating geofence {}", username, userId, id);

        GeofenceDTO updated = geofenceService.updateGeofence(id, dto, userId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a geofence
     * DELETE /api/geofences/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGeofence(
            @PathVariable UUID id,
            @RequestHeader(value = HEADER_USER_ID, required = false) String userIdHeader,
            @RequestHeader(value = HEADER_USERNAME, required = false) String username) {

        UUID userId = parseUserId(userIdHeader);
        log.info("User {} ({}) deleting geofence {}", username, userId, id);

        geofenceService.deleteGeofence(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get a geofence by ID
     * GET /api/geofences/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<GeofenceDTO> getGeofence(@PathVariable UUID id) {
        GeofenceDTO geofence = geofenceService.getGeofence(id);
        return ResponseEntity.ok(geofence);
    }

    /**
     * Get all active geofences
     * GET /api/geofences
     */
    @GetMapping
    public ResponseEntity<List<GeofenceDTO>> getAllActiveGeofences() {
        List<GeofenceDTO> geofences = geofenceService.getAllActiveGeofences();
        return ResponseEntity.ok(geofences);
    }

    /**
     * Get geofences by zone type
     * GET /api/geofences/type/{zoneType}
     */
    @GetMapping("/type/{zoneType}")
    public ResponseEntity<List<GeofenceDTO>> getGeofencesByType(
            @PathVariable GeofenceZoneType zoneType) {
        List<GeofenceDTO> geofences = geofenceService.getGeofencesByType(zoneType);
        return ResponseEntity.ok(geofences);
    }

    /**
     * Get geofences created by current user
     * GET /api/geofences/my
     */
    @GetMapping("/my")
    public ResponseEntity<Page<GeofenceDTO>> getMyGeofences(
            @RequestHeader(value = HEADER_USER_ID, required = false) String userIdHeader,
            @PageableDefault(size = 20) Pageable pageable) {

        UUID userId = parseUserId(userIdHeader);
        Page<GeofenceDTO> geofences = geofenceService.getGeofencesByUser(userId, pageable);
        return ResponseEntity.ok(geofences);
    }

    /**
     * Search geofences by name
     * GET /api/geofences/search?name=...
     */
    @GetMapping("/search")
    public ResponseEntity<Page<GeofenceDTO>> searchGeofences(
            @RequestParam String name,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<GeofenceDTO> geofences = geofenceService.searchGeofences(name, pageable);
        return ResponseEntity.ok(geofences);
    }

    /**
     * Get geofences in bounding box (for map viewport)
     * GET /api/geofences/bounds?minLon=...&minLat=...&maxLon=...&maxLat=...
     */
    @GetMapping("/bounds")
    public ResponseEntity<List<GeofenceDTO>> getGeofencesInBounds(
            @RequestParam double minLon,
            @RequestParam double minLat,
            @RequestParam double maxLon,
            @RequestParam double maxLat) {
        List<GeofenceDTO> geofences = geofenceService.getGeofencesInBoundingBox(
                minLon, minLat, maxLon, maxLat);
        return ResponseEntity.ok(geofences);
    }

    /**
     * Check if a point is inside any geofence
     * GET /api/geofences/check?lat=...&lon=...
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkPointInGeofences(
            @RequestParam double lat,
            @RequestParam double lon) {
        List<GeofenceDTO> containingGeofences = geofenceService
                .findGeofencesContainingPoint(lat, lon);
        boolean inside = !containingGeofences.isEmpty();

        return ResponseEntity.ok(Map.of(
                "inside", inside,
                "geofences", containingGeofences
        ));
    }

    /**
     * Check if a point is inside a specific geofence
     * GET /api/geofences/{id}/check?lat=...&lon=...
     */
    @GetMapping("/{id}/check")
    public ResponseEntity<Map<String, Object>> checkPointInGeofence(
            @PathVariable UUID id,
            @RequestParam double lat,
            @RequestParam double lon) {
        boolean inside = geofenceService.isPointInsideGeofence(id, lat, lon);
        Double distance = geofenceService.getDistanceToGeofence(id, lat, lon);

        return ResponseEntity.ok(Map.of(
                "inside", inside,
                "distanceMeters", distance != null ? distance : 0
        ));
    }

    /**
     * Find restricted zones within distance of a point
     * GET /api/geofences/restricted/nearby?lat=...&lon=...&distance=...
     */
    @GetMapping("/restricted/nearby")
    public ResponseEntity<List<GeofenceDTO>> findRestrictedZonesNearby(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "1000") double distance) {
        List<GeofenceDTO> zones = geofenceService
                .findRestrictedZonesWithinDistance(lat, lon, distance);
        return ResponseEntity.ok(zones);
    }

    /**
     * Parse user ID from header, falling back to a default for testing
     */
    private UUID parseUserId(String userIdHeader) {
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                return UUID.fromString(userIdHeader);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid user ID format: {}", userIdHeader);
            }
        }
        // Default user ID for testing (should not happen in production)
        return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }
}
