package com.trucktrack.location.controller;

import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.*;
import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.service.TripService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for admin trip management.
 * T013-T018: Create AdminTripController
 * Feature: 010-trip-management (US1: Dispatcher Creates and Assigns Trips)
 *
 * All endpoints require DISPATCHER or ADMIN role.
 */
@RestController
@RequestMapping("/admin/trips")
@PreAuthorize("hasAnyRole('ADMIN', 'DISPATCHER', 'FLEET_MANAGER')")
public class AdminTripController {

    private static final Logger log = LoggerFactory.getLogger(AdminTripController.class);

    private final TripService tripService;

    public AdminTripController(TripService tripService) {
        this.tripService = tripService;
    }

    /**
     * Get paginated list of trips with optional search and filters.
     * T014: GET /admin/trips with pagination and filters
     * T053: Added date range filter parameters
     *
     * @param search    Search term for origin, destination, or notes
     * @param status    Filter by trip status
     * @param driverId  Filter by assigned driver
     * @param truckId   Filter by assigned truck
     * @param startDate Filter trips created after this date (ISO-8601)
     * @param endDate   Filter trips created before this date (ISO-8601)
     * @param page      Page number (0-based)
     * @param size      Page size (default 25)
     * @param sortBy    Sort field (default: createdAt)
     * @param sortDir   Sort direction: asc or desc (default: desc)
     */
    @GetMapping
    public ResponseEntity<PageResponse<TripResponse>> getTrips(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TripStatus status,
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) UUID truckId,
            @RequestParam(required = false) Instant startDate,
            @RequestParam(required = false) Instant endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trips - search: {}, status: {}, driverId: {}, truckId: {}, startDate: {}, endDate: {}, page: {}, size: {}",
            search, status, driverId, truckId, startDate, endDate, page, size);

        PageResponse<TripResponse> trips = tripService.getTrips(
            page, size, search, status, driverId, truckId, startDate, endDate, sortBy, sortDir);

        return ResponseEntity.ok(trips);
    }

    /**
     * Get trip by ID with full details.
     * T015: GET /admin/trips/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trips/{}", id);
        TripResponse trip = tripService.getTripById(id);
        return ResponseEntity.ok(trip);
    }

    /**
     * Create a new trip.
     * T013: POST /admin/trips
     */
    @PostMapping
    public ResponseEntity<TripResponse> createTrip(
            @Valid @RequestBody CreateTripRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/trips - Creating trip from {} to {}",
            request.getOrigin(), request.getDestination());

        UUID createdBy = UUID.fromString(principal.userId());
        TripResponse trip = tripService.createTrip(request, createdBy);

        return ResponseEntity.status(HttpStatus.CREATED).body(trip);
    }

    /**
     * Update an existing trip.
     * T016: PUT /admin/trips/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<TripResponse> updateTrip(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTripRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("PUT /admin/trips/{}", id);

        UUID actorId = UUID.fromString(principal.userId());
        TripResponse trip = tripService.updateTrip(id, request, actorId);

        return ResponseEntity.ok(trip);
    }

    /**
     * Assign a trip to a truck and driver.
     * T017: POST /admin/trips/{id}/assign
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<TripResponse> assignTrip(
            @PathVariable UUID id,
            @Valid @RequestBody AssignTripRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/trips/{}/assign - truck: {}, driver: {}",
            id, request.getTruckId(), request.getDriverId());

        UUID actorId = UUID.fromString(principal.userId());
        TripResponse trip = tripService.assignTrip(id, request, actorId);

        return ResponseEntity.ok(trip);
    }

    /**
     * Cancel a trip.
     * T061: Add POST /admin/trips/{id}/cancel endpoint
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<TripResponse> cancelTrip(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/trips/{}/cancel - reason: {}", id, reason);

        UUID actorId = UUID.fromString(principal.userId());
        TripResponse trip = tripService.cancelTrip(id, reason, actorId);

        return ResponseEntity.ok(trip);
    }

    /**
     * Reassign a trip to a different truck and driver.
     * T063: Add POST /admin/trips/{id}/reassign endpoint
     */
    @PostMapping("/{id}/reassign")
    public ResponseEntity<TripResponse> reassignTrip(
            @PathVariable UUID id,
            @Valid @RequestBody AssignTripRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/trips/{}/reassign - truck: {}, driver: {}",
            id, request.getTruckId(), request.getDriverId());

        UUID actorId = UUID.fromString(principal.userId());
        TripResponse trip = tripService.reassignTrip(id, request, actorId);

        return ResponseEntity.ok(trip);
    }

    /**
     * Get trip status history.
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<TripStatusHistoryResponse>> getTripHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trips/{}/history", id);
        List<TripStatusHistoryResponse> history = tripService.getTripHistory(id);
        return ResponseEntity.ok(history);
    }

    /**
     * Get pending trips (not yet assigned).
     */
    @GetMapping("/pending")
    public ResponseEntity<List<TripResponse>> getPendingTrips(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trips/pending");
        List<TripResponse> trips = tripService.getPendingTrips();
        return ResponseEntity.ok(trips);
    }

    /**
     * Get active trips (assigned or in progress).
     */
    @GetMapping("/active")
    public ResponseEntity<PageResponse<TripResponse>> getActiveTrips(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trips/active - page: {}, size: {}", page, size);
        PageResponse<TripResponse> trips = tripService.getActiveTrips(page, size);
        return ResponseEntity.ok(trips);
    }

    /**
     * Get trip statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getTripStats(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trips/stats");
        Map<String, Long> stats = tripService.getTripStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get detailed trip analytics.
     * T054-T055: Analytics endpoint with KPIs
     */
    @GetMapping("/analytics")
    public ResponseEntity<TripAnalyticsDTO> getAnalytics(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trips/analytics");
        TripAnalyticsDTO analytics = tripService.getAnalytics();
        return ResponseEntity.ok(analytics);
    }
}
