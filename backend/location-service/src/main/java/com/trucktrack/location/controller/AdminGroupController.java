package com.trucktrack.location.controller;

import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.CreateGroupRequest;
import com.trucktrack.location.dto.GroupDetailResponse;
import com.trucktrack.location.dto.UpdateGroupRequest;
import com.trucktrack.location.service.AdminGroupService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * T114-T117: Admin group management controller
 * Feature: 002-admin-panel (US5 - Groups)
 */
@RestController
@RequestMapping("/admin/groups")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGroupController {

    private final AdminGroupService groupService;

    public AdminGroupController(AdminGroupService groupService) {
        this.groupService = groupService;
    }

    /**
     * T115: GET /admin/groups
     * List all groups with pagination and search
     */
    @GetMapping
    public ResponseEntity<PageResponse<GroupDetailResponse>> getGroups(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        PageResponse<GroupDetailResponse> response = groupService.getGroups(search, pageable);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /admin/groups/{id}
     * Get single group details
     */
    @GetMapping("/{id}")
    public ResponseEntity<GroupDetailResponse> getGroup(@PathVariable UUID id) {
        GroupDetailResponse group = groupService.getGroupById(id);
        if (group == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(group);
    }

    /**
     * T116: POST /admin/groups
     * Create new group
     */
    @PostMapping
    public ResponseEntity<?> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {
        try {
            GroupDetailResponse created = groupService.createGroup(request, principal.username());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    /**
     * T117: PUT /admin/groups/{id}
     * Update existing group
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {
        try {
            GroupDetailResponse updated = groupService.updateGroup(id, request, principal.username());
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    /**
     * DELETE /admin/groups/{id}
     * Delete group
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {
        try {
            groupService.deleteGroup(id, principal.username());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
