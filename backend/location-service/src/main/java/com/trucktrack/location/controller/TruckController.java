package com.trucktrack.location.controller;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.model.GPSPosition;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.GPSPositionRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.service.RedisCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for truck location queries.
 * T070: Implement TruckController GET /location/v1/trucks (list trucks with filters)
 * T071: Implement TruckController GET /location/v1/trucks/{truckId}/current-position (read from Redis cache)
 * T136: FLEET_MANAGER group-based truck filtering (optimized via JWT groups)
 *
 * Uses @AuthenticationPrincipal for user context from gateway.
 * FLEET_MANAGER users only see trucks in their assigned groups.
 * ADMIN users see all trucks.
 */
@Slf4j
@RestController
@RequestMapping("/location/v1")
@RequiredArgsConstructor
public class TruckController {

    private final TruckRepository truckRepository;
    private final GPSPositionRepository gpsPositionRepository;
    private final RedisCacheService redisCacheService;

    // T119: Maximum points before sampling kicks in
    private static final int MAX_POINTS_THRESHOLD = 500;

    /**
     * List all trucks with optional filters
     * GET /location/v1/trucks?status=ACTIVE&truckGroupId=xxx&page=0&size=20
     *
     * T136: FLEET_MANAGER users only see trucks in their assigned groups.
     * ADMIN users see all trucks.
     * Groups are embedded in JWT token (no inter-service call needed).
     */
    @GetMapping("/trucks")
    public ResponseEntity<Page<Truck>> listTrucks(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam(required = false) TruckStatus status,
            @RequestParam(required = false) UUID truckGroupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String userRole = getUserRole(principal);
        log.info("User [{}] ({}) with role [{}] listing trucks - status: {}, groupId: {}",
                getUsername(principal), getUserId(principal), userRole, status, truckGroupId);

        PageRequest pageRequest = PageRequest.of(page, size);

        // T136: Parse allowed group IDs from principal (no HTTP call needed)
        List<UUID> allowedGroupIds = null;
        if (!"ADMIN".equals(userRole)) {
            allowedGroupIds = getUserGroups(principal);
            if (allowedGroupIds.isEmpty()) {
                // User has no group assignments - return empty page
                log.warn("User {} has no group assignments, returning empty result", getUserId(principal));
                return ResponseEntity.ok(Page.empty(pageRequest));
            }
            log.debug("User {} has access to {} groups (from JWT)", getUserId(principal), allowedGroupIds.size());
        }

        // T136: Use optimized SQL query with group filtering (no N+1 problem)
        Page<Truck> trucks;
        if (allowedGroupIds != null) {
            // Non-ADMIN user: filter by allowed groups using optimized SQL query
            String statusStr = status != null ? status.name() : null;
            trucks = truckRepository.findByAllowedGroupsWithFilters(
                    allowedGroupIds, statusStr, truckGroupId, pageRequest);
            log.debug("Found {} trucks for user with group access", trucks.getTotalElements());
        } else {
            // ADMIN user: no group filtering needed
            if (status != null && truckGroupId != null) {
                trucks = truckRepository.findByTruckGroupIdAndStatus(truckGroupId, status, pageRequest);
            } else if (status != null) {
                trucks = truckRepository.findByStatus(status, pageRequest);
            } else if (truckGroupId != null) {
                List<Truck> truckList = truckRepository.findByTruckGroupId(truckGroupId);
                trucks = new PageImpl<>(truckList, pageRequest, truckList.size());
            } else {
                trucks = truckRepository.findAll(pageRequest);
            }
        }

        return ResponseEntity.ok(trucks);
    }

    /**
     * Get truck assigned to the current driver
     * GET /location/v1/trucks/my-truck
     *
     * Returns the truck assigned to the authenticated driver.
     * Used by mobile app to get the driver's assigned truck.
     */
    @GetMapping("/trucks/my-truck")
    public ResponseEntity<Truck> getMyTruck(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {
        String userId = getUserId(principal);
        log.info("User [{}] ({}) getting their assigned truck", getUsername(principal), userId);

        if ("anonymous".equals(userId)) {
            log.warn("Anonymous user trying to get assigned truck");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return truckRepository.findByDriverId(UUID.fromString(userId))
                .map(truck -> {
                    log.info("Found truck {} assigned to driver {}", truck.getTruckId(), userId);
                    return ResponseEntity.ok(truck);
                })
                .orElseGet(() -> {
                    log.warn("No truck assigned to driver {}", userId);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
                });
    }

    /**
     * Get truck by ID
     * GET /location/v1/trucks/{truckId}
     */
    @GetMapping("/trucks/{truckId}")
    public ResponseEntity<Truck> getTruckById(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PathVariable UUID truckId) {
        log.info("User [{}] ({}) getting truck by ID: {}", getUsername(principal), getUserId(principal), truckId);

        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> new IllegalArgumentException("Truck not found: " + truckId));

        return ResponseEntity.ok(truck);
    }

    /**
     * Get truck's current position from Redis cache (fast!)
     * GET /location/v1/trucks/{truckId}/current-position
     *
     * Returns cached position if available (< 5 min old)
     * Falls back to database if cache miss
     */
    @GetMapping("/trucks/{truckId}/current-position")
    public ResponseEntity<GPSPositionEvent> getCurrentPosition(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PathVariable UUID truckId) {
        log.debug("User [{}] getting current position for truck: {}", getUsername(principal), truckId);

        // Try Redis cache first (fastest)
        GPSPositionEvent cachedPosition = redisCacheService.getCurrentPosition(truckId);
        if (cachedPosition != null) {
            log.debug("Cache hit for truck {}", truckId);
            return ResponseEntity.ok(cachedPosition);
        }

        // Cache miss - check if truck exists and return last known position
        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> new IllegalArgumentException("Truck not found: " + truckId));

        if (truck.getCurrentLatitude() == null || truck.getCurrentLongitude() == null) {
            log.warn("Truck {} has no position data", truckId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // Convert truck's last position to GPSPositionEvent format
        GPSPositionEvent position = new GPSPositionEvent();
        position.setTruckId(truckId.toString());
        position.setLatitude(truck.getCurrentLatitude() != null ? truck.getCurrentLatitude().doubleValue() : null);
        position.setLongitude(truck.getCurrentLongitude() != null ? truck.getCurrentLongitude().doubleValue() : null);
        position.setSpeed(truck.getCurrentSpeed() != null ? truck.getCurrentSpeed().doubleValue() : null);
        position.setHeading(truck.getCurrentHeading());
        position.setTimestamp(truck.getLastUpdate());

        return ResponseEntity.ok(position);
    }

    /**
     * Search trucks by truck ID or driver name
     * GET /location/v1/trucks/search?q=TRUCK-001
     */
    @GetMapping("/trucks/search")
    public ResponseEntity<List<Truck>> searchTrucks(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam String q) {
        log.info("User [{}] ({}) searching trucks with query: {}", getUsername(principal), getUserId(principal), q);

        List<Truck> trucks = truckRepository.searchByTruckIdOrDriverName(q);
        return ResponseEntity.ok(trucks);
    }

    /**
     * Get trucks within a bounding box (for map viewport)
     * GET /location/v1/trucks/bbox?minLat=40.0&maxLat=41.0&minLng=-74.0&maxLng=-73.0
     */
    @GetMapping("/trucks/bbox")
    public ResponseEntity<List<Truck>> getTrucksInBoundingBox(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLng,
            @RequestParam Double maxLng) {

        log.debug("User [{}] getting trucks in bounding box: ({}, {}) to ({}, {})",
                getUsername(principal), minLat, minLng, maxLat, maxLng);

        List<Truck> trucks = truckRepository.findTrucksInBoundingBox(minLat, maxLat, minLng, maxLng);
        return ResponseEntity.ok(trucks);
    }

    /**
     * Get trucks' historical GPS positions
     * GET /location/v1/trucks/history?startTime=...&endTime=...&truckId=... (optional)
     *
     * If truckId is provided, returns history for that specific truck
     * If truckId is omitted, returns history for all trucks
     * Automatic sampling if >500 points
     */
    @GetMapping("/trucks/history")
    public ResponseEntity<List<GPSPosition>> getTrucksHistory(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime,
            @RequestParam(required = false) UUID truckId) {

        List<GPSPosition> positions;
        long pointCount;

        if (truckId != null) {
            // Specific truck history
            log.info("User [{}] ({}) getting history for truck {} from {} to {}",
                    getUsername(principal), getUserId(principal), truckId, startTime, endTime);

            // Verify truck exists
            if (!truckRepository.existsById(truckId)) {
                log.warn("Truck not found: {}", truckId);
                return ResponseEntity.notFound().build();
            }

            pointCount = gpsPositionRepository.countByTruckIdAndTimestampBetween(truckId, startTime, endTime);
            log.debug("Found {} GPS positions for truck {}", pointCount, truckId);

            if (pointCount > MAX_POINTS_THRESHOLD) {
                int sampleRate = (int) Math.ceil((double) pointCount / MAX_POINTS_THRESHOLD);
                log.info("Sampling {} points with rate {} for truck {}", pointCount, sampleRate, truckId);
                positions = gpsPositionRepository.findSampledPositions(truckId, startTime, endTime, sampleRate);
            } else {
                positions = gpsPositionRepository.findByTruckIdAndTimestampBetween(truckId, startTime, endTime);
            }
        } else {
            // All trucks history
            log.info("User [{}] ({}) getting history for all trucks from {} to {}",
                    getUsername(principal), getUserId(principal), startTime, endTime);

            pointCount = gpsPositionRepository.countAllByTimestampBetween(startTime, endTime);
            log.debug("Found {} GPS positions for all trucks", pointCount);

            if (pointCount > MAX_POINTS_THRESHOLD) {
                int sampleRate = (int) Math.ceil((double) pointCount / MAX_POINTS_THRESHOLD);
                log.info("Sampling {} points with rate {} for all trucks", pointCount, sampleRate);
                positions = gpsPositionRepository.findAllSampledPositions(startTime, endTime, sampleRate);
            } else {
                positions = gpsPositionRepository.findAllByTimestampBetween(startTime, endTime);
            }
        }

        log.debug("Returning {} positions", positions.size());
        return ResponseEntity.ok(positions);
    }

    /**
     * Get trucks' historical GPS positions with PAGINATION
     * GET /location/v1/trucks/history/paged?startTime=...&endTime=...&truckId=...&page=0&size=50
     *
     * Returns paginated results for infinite scroll support
     */
    @GetMapping("/trucks/history/paged")
    public ResponseEntity<Page<GPSPosition>> getTrucksHistoryPaged(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime,
            @RequestParam(required = false) UUID truckId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        PageRequest pageRequest = PageRequest.of(page, size);

        if (truckId != null) {
            log.info("User [{}] ({}) getting paged history for truck {} from {} to {} (page {}, size {})",
                    getUsername(principal), getUserId(principal), truckId, startTime, endTime, page, size);

            // Verify truck exists
            if (!truckRepository.existsById(truckId)) {
                log.warn("Truck not found: {}", truckId);
                return ResponseEntity.notFound().build();
            }

            Page<GPSPosition> positions = gpsPositionRepository.findByTruckIdAndTimestampBetween(
                    truckId, startTime, endTime, pageRequest);
            return ResponseEntity.ok(positions);
        } else {
            log.info("User [{}] ({}) getting paged history for all trucks from {} to {} (page {}, size {})",
                    getUsername(principal), getUserId(principal), startTime, endTime, page, size);

            // Need to add a paginated method for all trucks - use native query with pagination
            Page<GPSPosition> positions = gpsPositionRepository.findAllByTimestampBetweenPaged(
                    startTime, endTime, pageRequest);
            return ResponseEntity.ok(positions);
        }
    }

    /**
     * Update truck status (for drivers)
     * PATCH /location/v1/trucks/{truckId}/status
     *
     * Allows drivers to update their truck's status.
     * Maps driver statuses to truck statuses:
     * - AVAILABLE → IDLE
     * - IN_DELIVERY → ACTIVE
     * - ON_BREAK → IDLE
     * - OFF_DUTY → OFFLINE
     */
    @PatchMapping("/trucks/{truckId}/status")
    public ResponseEntity<Truck> updateTruckStatus(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PathVariable UUID truckId,
            @RequestBody StatusUpdateRequest request) {

        log.info("User [{}] ({}) updating status for truck {} to {}",
                getUsername(principal), getUserId(principal), truckId, request.status());

        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> new IllegalArgumentException("Truck not found: " + truckId));

        // Map driver status to truck status
        TruckStatus newStatus = mapDriverStatusToTruckStatus(request.status());
        truck.setStatus(newStatus);
        truck.setLastUpdate(Instant.now());

        Truck savedTruck = truckRepository.save(truck);
        log.info("Truck {} status updated to {}", truckId, newStatus);

        return ResponseEntity.ok(savedTruck);
    }

    /**
     * Map driver status to truck status
     */
private TruckStatus mapDriverStatusToTruckStatus(String driverStatus) {
    if (driverStatus == null || driverStatus.isBlank()) {
        return TruckStatus.IDLE;
    }
    String normalized = driverStatus.trim().toUpperCase();
    return switch (normalized) {
        case "AVAILABLE", "ON_BREAK" -> TruckStatus.IDLE;
        case "IN_DELIVERY" -> TruckStatus.ACTIVE;
        case "OFF_DUTY" -> TruckStatus.OFFLINE;
        default -> TruckStatus.IDLE;
    };
}

    /**
     * Request body for status update
     */
    public record StatusUpdateRequest(String status) {}

    /**
     * Health check
     * GET /location/v1/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Location Service is UP");
    }

    /**
     * Extract user ID from principal with fallback.
     */
    private String getUserId(GatewayUserPrincipal principal) {
        return principal != null ? principal.userId() : "anonymous";
    }

    /**
     * Get username from principal with fallback.
     */
    private String getUsername(GatewayUserPrincipal principal) {
        return principal != null ? principal.username() : "anonymous";
    }

    /**
     * Get user role from principal with fallback.
     */
    private String getUserRole(GatewayUserPrincipal principal) {
        return principal != null ? principal.role() : "GUEST";
    }

    /**
     * Get user groups from principal.
     * @return List of group UUIDs, or empty list if none
     */
    private List<UUID> getUserGroups(GatewayUserPrincipal principal) {
        if (principal == null || principal.groups() == null || principal.groups().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(principal.groups().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }
}
