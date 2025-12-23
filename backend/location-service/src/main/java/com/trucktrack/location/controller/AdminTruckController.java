package com.trucktrack.location.controller;

import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.CreateTruckRequest;
import com.trucktrack.location.dto.TruckAdminResponse;
import com.trucktrack.location.dto.UpdateTruckRequest;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.service.AdminTruckService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for admin truck management.
 * T061-T067: Create AdminTruckController
 * Feature: 002-admin-panel
 *
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/admin/trucks")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTruckController {

    private static final Logger log = LoggerFactory.getLogger(AdminTruckController.class);

    private final AdminTruckService adminTruckService;

    public AdminTruckController(AdminTruckService adminTruckService) {
        this.adminTruckService = adminTruckService;
    }

    /**
     * Get paginated list of trucks with optional search and filters.
     * T062: Implement GET /admin/trucks with pagination, search, filtering
     *
     * @param search  Search term for truckId, licensePlate, driverName, or vehicleType
     * @param status  Filter by truck status
     * @param groupId Filter by primary group
     * @param page    Page number (0-based)
     * @param size    Page size (default 25)
     * @param sortBy  Sort field (default: createdAt)
     * @param sortDir Sort direction: asc or desc (default: desc)
     */
    @GetMapping
    public ResponseEntity<PageResponse<TruckAdminResponse>> getTrucks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TruckStatus status,
            @RequestParam(required = false) UUID groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trucks - search: {}, status: {}, groupId: {}, page: {}, size: {}",
            search, status, groupId, page, size);

        PageResponse<TruckAdminResponse> trucks = adminTruckService.getTrucks(
            page, size, search, status, groupId, sortBy, sortDir);

        return ResponseEntity.ok(trucks);
    }

    /**
     * Get truck by ID with full details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TruckAdminResponse> getTruckById(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trucks/{}", id);
        TruckAdminResponse truck = adminTruckService.getTruckById(id);
        return ResponseEntity.ok(truck);
    }

    /**
     * Create a new truck.
     * T063: Implement POST /admin/trucks for truck creation
     */
    @PostMapping
    public ResponseEntity<TruckAdminResponse> createTruck(
            @Valid @RequestBody CreateTruckRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/trucks - Creating truck: {}", request.getTruckId());

        UUID adminId = UUID.fromString(principal.userId());
        TruckAdminResponse truck = adminTruckService.createTruck(request, adminId);

        return ResponseEntity.status(HttpStatus.CREATED).body(truck);
    }

    /**
     * Update an existing truck.
     * T064: Implement PUT /admin/trucks/{id} for truck update
     */
    @PutMapping("/{id}")
    public ResponseEntity<TruckAdminResponse> updateTruck(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTruckRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("PUT /admin/trucks/{}", id);

        UUID adminId = UUID.fromString(principal.userId());
        TruckAdminResponse truck = adminTruckService.updateTruck(id, request, adminId);

        return ResponseEntity.ok(truck);
    }

    /**
     * Mark truck as out of service.
     * T065: Implement POST /admin/trucks/{id}/out-of-service
     */
    @PostMapping("/{id}/out-of-service")
    public ResponseEntity<TruckAdminResponse> markOutOfService(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/trucks/{}/out-of-service", id);

        UUID adminId = UUID.fromString(principal.userId());
        TruckAdminResponse truck = adminTruckService.markOutOfService(id, adminId);

        return ResponseEntity.ok(truck);
    }

    /**
     * Activate a truck (set to OFFLINE status).
     * T065: Implement POST /admin/trucks/{id}/activate
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<TruckAdminResponse> activateTruck(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/trucks/{}/activate", id);

        UUID adminId = UUID.fromString(principal.userId());
        TruckAdminResponse truck = adminTruckService.activateTruck(id, adminId);

        return ResponseEntity.ok(truck);
    }

    /**
     * Get groups assigned to a truck.
     * T066: Implement GET /admin/trucks/{id}/groups
     */
    @GetMapping("/{id}/groups")
    public ResponseEntity<List<UUID>> getTruckGroups(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/trucks/{}/groups", id);
        List<UUID> groupIds = adminTruckService.getTruckGroups(id);
        return ResponseEntity.ok(groupIds);
    }

    /**
     * Update groups assigned to a truck.
     * T066: Implement PUT /admin/trucks/{id}/groups
     */
    @PutMapping("/{id}/groups")
    public ResponseEntity<List<UUID>> updateTruckGroups(
            @PathVariable UUID id,
            @RequestBody List<UUID> groupIds,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("PUT /admin/trucks/{}/groups - groups: {}", id, groupIds.size());

        UUID adminId = UUID.fromString(principal.userId());
        List<UUID> updatedGroups = adminTruckService.updateTruckGroups(id, groupIds, adminId);
        return ResponseEntity.ok(updatedGroups);
    }
}
