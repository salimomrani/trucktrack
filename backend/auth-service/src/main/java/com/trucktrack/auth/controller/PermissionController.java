package com.trucktrack.auth.controller;

import com.trucktrack.auth.service.AuthService;
import com.trucktrack.auth.service.PermissionService;
import com.trucktrack.common.dto.UserPermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for permission-related endpoints.
 * Feature: 008-rbac-permissions
 * T006: Create PermissionController
 */
@Slf4j
@RestController
@RequestMapping("/auth/v1/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;
    private final AuthService authService;

    /**
     * Get current user's permissions.
     * GET /auth/v1/permissions/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserPermissions(
            @RequestHeader("Authorization") String authHeader) {

        try {
            UUID userId = extractUserId(authHeader);
            if (userId == null) {
                return unauthorized("Invalid or missing token");
            }

            return permissionService.getUserPermissions(userId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Error getting user permissions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Error processing request"));
        }
    }

    /**
     * Get list of accessible pages for current user.
     * GET /auth/v1/permissions/pages
     */
    @GetMapping("/pages")
    public ResponseEntity<?> getAccessiblePages(
            @RequestHeader("Authorization") String authHeader) {

        try {
            UUID userId = extractUserId(authHeader);
            if (userId == null) {
                return unauthorized("Invalid or missing token");
            }

            List<String> pages = permissionService.getAccessiblePages(userId);
            return ResponseEntity.ok(Map.of("pages", pages));

        } catch (Exception e) {
            log.error("Error getting accessible pages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Error processing request"));
        }
    }

    /**
     * Check if current user can access a specific page.
     * POST /auth/v1/permissions/check
     */
    @PostMapping("/check")
    public ResponseEntity<?> checkPageAccess(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {

        try {
            UUID userId = extractUserId(authHeader);
            if (userId == null) {
                return unauthorized("Invalid or missing token");
            }

            String page = request.get("page");
            if (page == null || page.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "INVALID_REQUEST", "message", "Page parameter is required"));
            }

            boolean allowed = permissionService.canAccessPage(userId, page);

            if (!allowed) {
                permissionService.logAccessDenial(userId, page, "ACCESS_CHECK");
            }

            return ResponseEntity.ok(Map.of(
                    "allowed", allowed,
                    "page", page.toUpperCase(),
                    "reason", allowed ? "" : "Role does not have access to this page"
            ));

        } catch (Exception e) {
            log.error("Error checking page access", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Error processing request"));
        }
    }

    /**
     * Extract user ID from Authorization header.
     */
    private UUID extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        if (!authService.validateToken(token)) {
            return null;
        }

        String userIdStr = authService.getUserIdFromToken(token);
        try {
            return UUID.fromString(userIdStr);
        } catch (Exception e) {
            log.warn("Invalid user ID in token: {}", userIdStr);
            return null;
        }
    }

    /**
     * Create unauthorized response.
     */
    private ResponseEntity<Map<String, String>> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "UNAUTHORIZED", "message", message));
    }
}
