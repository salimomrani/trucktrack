package com.trucktrack.location.controller;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.location.model.GPSPosition;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.GPSPositionRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.service.RedisCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for truck location queries
 * T070: Implement TruckController GET /location/v1/trucks (list trucks with filters)
 * T071: Implement TruckController GET /location/v1/trucks/{truckId}/current-position (read from Redis cache)
 * Refactored with Lombok best practices
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
     */
    @GetMapping("/trucks")
    public ResponseEntity<Page<Truck>> listTrucks(
            @RequestParam(required = false) TruckStatus status,
            @RequestParam(required = false) UUID truckGroupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Listing trucks - status: {}, groupId: {}, page: {}, size: {}",
                status, truckGroupId, page, size);

        Page<Truck> trucks;
        PageRequest pageRequest = PageRequest.of(page, size);

        // Apply filters
        if (status != null && truckGroupId != null) {
            trucks = truckRepository.findByTruckGroupIdAndStatus(truckGroupId, status, pageRequest);
        } else if (status != null) {
            trucks = truckRepository.findByStatus(status, pageRequest);
        } else if (truckGroupId != null) {
            List<Truck> truckList = truckRepository.findByTruckGroupId(truckGroupId);
            // Convert List to Page
            trucks = Page.empty(); // TODO: Convert properly
        } else {
            // No filters - return all trucks
            trucks = truckRepository.findAll(pageRequest);
        }

        return ResponseEntity.ok(trucks);
    }

    /**
     * Get truck by ID
     * GET /location/v1/trucks/{truckId}
     */
    @GetMapping("/trucks/{truckId}")
    public ResponseEntity<Truck> getTruckById(@PathVariable UUID truckId) {
        log.debug("Getting truck by ID: {}", truckId);

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
    public ResponseEntity<GPSPositionEvent> getCurrentPosition(@PathVariable UUID truckId) {
        log.debug("Getting current position for truck: {}", truckId);

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
    public ResponseEntity<List<Truck>> searchTrucks(@RequestParam String q) {
        log.debug("Searching trucks with query: {}", q);

        List<Truck> trucks = truckRepository.searchByTruckIdOrDriverName(q);
        return ResponseEntity.ok(trucks);
    }

    /**
     * Get trucks within a bounding box (for map viewport)
     * GET /location/v1/trucks/bbox?minLat=40.0&maxLat=41.0&minLng=-74.0&maxLng=-73.0
     */
    @GetMapping("/trucks/bbox")
    public ResponseEntity<List<Truck>> getTrucksInBoundingBox(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLng,
            @RequestParam Double maxLng) {

        log.debug("Getting trucks in bounding box: ({}, {}) to ({}, {})",
                minLat, minLng, maxLat, maxLng);

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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endTime,
            @RequestParam(required = false) UUID truckId) {

        List<GPSPosition> positions;
        long pointCount;

        if (truckId != null) {
            // Specific truck history
            log.debug("Getting history for truck {} from {} to {}", truckId, startTime, endTime);

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
            log.debug("Getting history for all trucks from {} to {}", startTime, endTime);

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
     * Health check
     * GET /location/v1/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Location Service is UP");
    }
}
