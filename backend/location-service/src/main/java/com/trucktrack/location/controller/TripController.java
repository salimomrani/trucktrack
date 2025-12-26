package com.trucktrack.location.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.TripResponse;
import com.trucktrack.location.dto.TripStatusHistoryResponse;
import com.trucktrack.location.dto.UpdateTripStatusRequest;
import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for driver trip operations.
 * T020-T026: Create TripController for driver endpoints
 * Feature: 010-trip-management (US2: Driver Views and Manages Trips)
 *
 * Endpoints for drivers to view and manage their assigned trips.
 */
@Slf4j
@RestController
@RequestMapping("/location/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    /**
     * Get trips assigned to the current driver.
     * T020: GET /location/v1/trips/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<TripResponse>> getMyTrips(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        String userId = getUserId(principal);
        log.info("User [{}] ({}) getting their assigned trips", getUsername(principal), userId);

        if ("anonymous".equals(userId)) {
            log.warn("Anonymous user trying to get trips");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<TripResponse> trips = tripService.getTripsForDriver(UUID.fromString(userId));
        return ResponseEntity.ok(trips);
    }

    /**
     * Get active trips for the current driver (ASSIGNED or IN_PROGRESS).
     */
    @GetMapping("/my/active")
    public ResponseEntity<List<TripResponse>> getMyActiveTrips(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        String userId = getUserId(principal);
        log.info("User [{}] ({}) getting their active trips", getUsername(principal), userId);

        if ("anonymous".equals(userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<TripResponse> trips = tripService.getActiveTripsForDriver(UUID.fromString(userId));
        return ResponseEntity.ok(trips);
    }

    /**
     * Get a specific trip by ID.
     * T021: GET /location/v1/trips/{id}
     * T026: Driver authorization check - can only access own trips
     */
    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        String userId = getUserId(principal);
        log.debug("User [{}] ({}) getting trip {}", getUsername(principal), userId, id);

        if ("anonymous".equals(userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        TripResponse trip = tripService.getTripById(id);

        // T026: Check if driver is authorized to view this trip
        if (!isDriverAuthorizedForTrip(trip, userId, principal)) {
            log.warn("User {} attempted to access trip {} that is not assigned to them", userId, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(trip);
    }

    /**
     * Start a trip.
     * T022-T023: POST /location/v1/trips/{id}/start
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<TripResponse> startTrip(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        String userId = getUserId(principal);
        log.info("User [{}] ({}) starting trip {}", getUsername(principal), userId, id);

        if ("anonymous".equals(userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID driverId = UUID.fromString(userId);

        // Verify driver is assigned to this trip
        TripResponse existingTrip = tripService.getTripById(id);
        if (existingTrip.getAssignedDriverId() == null ||
            !existingTrip.getAssignedDriverId().equals(driverId)) {
            log.warn("Driver {} attempted to start trip {} that is not assigned to them", userId, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Update status to IN_PROGRESS
        UpdateTripStatusRequest request = UpdateTripStatusRequest.builder()
            .status(TripStatus.IN_PROGRESS)
            .notes("Driver started trip")
            .build();

        TripResponse trip = tripService.updateTripStatus(id, request, driverId);
        return ResponseEntity.ok(trip);
    }

    /**
     * Complete a trip.
     * T024-T025: POST /location/v1/trips/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<TripResponse> completeTrip(
            @PathVariable UUID id,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        String userId = getUserId(principal);
        log.info("User [{}] ({}) completing trip {}", getUsername(principal), userId, id);

        if ("anonymous".equals(userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID driverId = UUID.fromString(userId);

        // Verify driver is assigned to this trip
        TripResponse existingTrip = tripService.getTripById(id);
        if (existingTrip.getAssignedDriverId() == null ||
            !existingTrip.getAssignedDriverId().equals(driverId)) {
            log.warn("Driver {} attempted to complete trip {} that is not assigned to them", userId, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Update status to COMPLETED
        UpdateTripStatusRequest request = UpdateTripStatusRequest.builder()
            .status(TripStatus.COMPLETED)
            .notes(notes != null ? notes : "Driver completed trip")
            .build();

        TripResponse trip = tripService.updateTripStatus(id, request, driverId);
        return ResponseEntity.ok(trip);
    }

    /**
     * Update trip status (generic endpoint).
     */
    @PostMapping("/{id}/status")
    public ResponseEntity<TripResponse> updateTripStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTripStatusRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        String userId = getUserId(principal);
        log.info("User [{}] ({}) updating trip {} status to {}",
            getUsername(principal), userId, id, request.getStatus());

        if ("anonymous".equals(userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID driverId = UUID.fromString(userId);

        // Verify driver is assigned to this trip
        TripResponse existingTrip = tripService.getTripById(id);
        if (existingTrip.getAssignedDriverId() == null ||
            !existingTrip.getAssignedDriverId().equals(driverId)) {
            log.warn("Driver {} attempted to update trip {} that is not assigned to them", userId, id);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        TripResponse trip = tripService.updateTripStatus(id, request, driverId);
        return ResponseEntity.ok(trip);
    }

    /**
     * Get trip status history.
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<TripStatusHistoryResponse>> getTripHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        String userId = getUserId(principal);
        log.debug("User [{}] ({}) getting history for trip {}", getUsername(principal), userId, id);

        if ("anonymous".equals(userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Verify driver can access this trip
        TripResponse trip = tripService.getTripById(id);
        if (!isDriverAuthorizedForTrip(trip, userId, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<TripStatusHistoryResponse> history = tripService.getTripHistory(id);
        return ResponseEntity.ok(history);
    }

    /**
     * Check if a driver is authorized to access a trip.
     * Drivers can only access trips assigned to them.
     * Admins and dispatchers can access all trips.
     */
    private boolean isDriverAuthorizedForTrip(TripResponse trip, String userId, GatewayUserPrincipal principal) {
        String role = getUserRole(principal);

        // Admins, dispatchers, and fleet managers can access all trips
        if ("ADMIN".equals(role) || "DISPATCHER".equals(role) || "FLEET_MANAGER".equals(role)) {
            return true;
        }

        // Drivers can only access their own trips
        if (trip.getAssignedDriverId() != null) {
            return trip.getAssignedDriverId().toString().equals(userId);
        }

        return false;
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
}
