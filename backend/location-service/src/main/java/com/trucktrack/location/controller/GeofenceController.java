package com.trucktrack.location.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Geofence CRUD operations.
 * Uses @AuthenticationPrincipal for user context from gateway.
 */
@RestController
@RequestMapping("/location/v1/geofences")
@RequiredArgsConstructor
@Slf4j
public class GeofenceController {

    private final GeofenceService geofenceService;

    /**
     * Create a new geofence
     */
    @PostMapping
    public ResponseEntity<GeofenceDTO> createGeofence(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @Valid @RequestBody GeofenceDTO dto) {

        UUID userId = getUserId(principal);
        log.info("User {} ({}) creating geofence '{}'", getUsername(principal), userId, dto.getName());

        GeofenceDTO created = geofenceService.createGeofence(dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing geofence
     */
    @PutMapping("/{id}")
    public ResponseEntity<GeofenceDTO> updateGeofence(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @Valid @RequestBody GeofenceDTO dto) {

        UUID userId = getUserId(principal);
        log.info("User {} ({}) updating geofence {}", getUsername(principal), userId, id);

        GeofenceDTO updated = geofenceService.updateGeofence(id, dto, userId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a geofence
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGeofence(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        UUID userId = getUserId(principal);
        log.info("User {} ({}) deleting geofence {}", getUsername(principal), userId, id);

        geofenceService.deleteGeofence(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get a geofence by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<GeofenceDTO> getGeofence(@PathVariable UUID id) {
        GeofenceDTO geofence = geofenceService.getGeofence(id);
        return ResponseEntity.ok(geofence);
    }

    /**
     * Get all active geofences
     */
    @GetMapping
    public ResponseEntity<List<GeofenceDTO>> getAllActiveGeofences() {
        List<GeofenceDTO> geofences = geofenceService.getAllActiveGeofences();
        return ResponseEntity.ok(geofences);
    }

    /**
     * Get geofences by zone type
     */
    @GetMapping("/type/{zoneType}")
    public ResponseEntity<List<GeofenceDTO>> getGeofencesByType(
            @PathVariable GeofenceZoneType zoneType) {
        List<GeofenceDTO> geofences = geofenceService.getGeofencesByType(zoneType);
        return ResponseEntity.ok(geofences);
    }

    /**
     * Get geofences created by current user
     */
    @GetMapping("/my")
    public ResponseEntity<Page<GeofenceDTO>> getMyGeofences(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {

        UUID userId = getUserId(principal);
        Page<GeofenceDTO> geofences = geofenceService.getGeofencesByUser(userId, pageable);
        return ResponseEntity.ok(geofences);
    }

    /**
     * Search geofences by name
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
     * Extract user ID from principal with fallback for unauthenticated requests.
     */
    private UUID getUserId(GatewayUserPrincipal principal) {
        if (principal != null && principal.userId() != null) {
            try {
                return UUID.fromString(principal.userId());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid user ID format: {}", principal.userId());
            }
        }
        // Default for unauthenticated/system requests
        return UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    /**
     * Get username from principal with fallback.
     */
    private String getUsername(GatewayUserPrincipal principal) {
        return principal != null ? principal.username() : "anonymous";
    }
}
