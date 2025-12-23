package com.trucktrack.auth.controller;

import com.trucktrack.auth.dto.CreateUserRequest;
import com.trucktrack.auth.dto.UpdateUserRequest;
import com.trucktrack.auth.dto.UserAdminResponse;
import com.trucktrack.auth.model.UserRole;
import com.trucktrack.auth.service.AdminUserService;
import com.trucktrack.auth.service.AuthService;
import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.common.security.GatewayUserPrincipal;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for admin user management.
 * T034-T040: Create AdminUserController
 * Feature: 002-admin-panel
 *
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);

    private final AdminUserService adminUserService;
    private final AuthService authService;

    public AdminUserController(AdminUserService adminUserService, AuthService authService) {
        this.adminUserService = adminUserService;
        this.authService = authService;
    }

    /**
     * Get paginated list of users with optional search and filters.
     * T035: Implement GET /admin/users with pagination, search, and filtering
     *
     * @param search   Search term for email, first name, or last name
     * @param role     Filter by user role
     * @param isActive Filter by active status
     * @param page     Page number (0-based)
     * @param size     Page size (default 25)
     * @param sortBy   Sort field (default: createdAt)
     * @param sortDir  Sort direction: asc or desc (default: desc)
     */
    @GetMapping
    public ResponseEntity<PageResponse<UserAdminResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/users - search: {}, role: {}, isActive: {}, page: {}, size: {}",
            search, role, isActive, page, size);

        PageResponse<UserAdminResponse> users = adminUserService.getUsers(
            search, role, isActive, page, size, sortBy, sortDir);

        return ResponseEntity.ok(users);
    }

    /**
     * Get user by ID with full details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserAdminResponse> getUserById(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/users/{}", id);
        UserAdminResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * Create a new user.
     * T036: Implement POST /admin/users for user creation
     */
    @PostMapping
    public ResponseEntity<UserAdminResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/users - Creating user: {}", request.email());

        UUID adminId = UUID.fromString(principal.userId());
        UserAdminResponse user = adminUserService.createUser(request, adminId, principal.username());

        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    /**
     * Update an existing user.
     * T037: Implement PUT /admin/users/{id} for user update
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserAdminResponse> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("PUT /admin/users/{}", id);

        UUID adminId = UUID.fromString(principal.userId());
        UserAdminResponse user = adminUserService.updateUser(id, request, adminId, principal.username());

        return ResponseEntity.ok(user);
    }

    /**
     * Deactivate a user account.
     * T038: Implement POST /admin/users/{id}/deactivate
     */
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<UserAdminResponse> deactivateUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/users/{}/deactivate", id);

        UUID adminId = UUID.fromString(principal.userId());
        UserAdminResponse user = adminUserService.deactivateUser(id, adminId, principal.username());

        return ResponseEntity.ok(user);
    }

    /**
     * Reactivate a user account.
     * T038: Implement POST /admin/users/{id}/reactivate
     */
    @PostMapping("/{id}/reactivate")
    public ResponseEntity<UserAdminResponse> reactivateUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/users/{}/reactivate", id);

        UUID adminId = UUID.fromString(principal.userId());
        UserAdminResponse user = adminUserService.reactivateUser(id, adminId, principal.username());

        return ResponseEntity.ok(user);
    }

    /**
     * Resend activation email to user.
     */
    @PostMapping("/{id}/resend-activation")
    public ResponseEntity<Map<String, String>> resendActivationEmail(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/users/{}/resend-activation", id);

        UUID adminId = UUID.fromString(principal.userId());
        adminUserService.resendActivationEmail(id, adminId, principal.username());

        return ResponseEntity.ok(Map.of("message", "Activation email sent"));
    }

    /**
     * Get groups assigned to a user.
     * T039: Implement GET /admin/users/{id}/groups
     */
    @GetMapping("/{id}/groups")
    public ResponseEntity<List<UUID>> getUserGroups(
            @PathVariable UUID id,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.debug("GET /admin/users/{}/groups", id);
        List<UUID> groupIds = adminUserService.getUserGroups(id);
        return ResponseEntity.ok(groupIds);
    }

    /**
     * Update groups assigned to a user.
     * T039: Implement PUT /admin/users/{id}/groups
     */
    @PutMapping("/{id}/groups")
    public ResponseEntity<List<UUID>> updateUserGroups(
            @PathVariable UUID id,
            @RequestBody List<UUID> groupIds,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("PUT /admin/users/{}/groups - groups: {}", id, groupIds.size());

        List<UUID> updatedGroups = adminUserService.updateUserGroups(id, groupIds);
        return ResponseEntity.ok(updatedGroups);
    }

    /**
     * Generate a service account JWT for inter-service communication.
     * This token allows services to authenticate when calling other services via the gateway.
     *
     * POST /admin/users/service-token
     *
     * @param serviceName Name of the service (e.g., "notification-service")
     * @param expirationDays Number of days until token expires (default: 365, max: 3650)
     * @return JWT token for the service account
     */
    @PostMapping("/service-token")
    public ResponseEntity<Map<String, Object>> generateServiceAccountToken(
            @RequestParam String serviceName,
            @RequestParam(defaultValue = "365") int expirationDays,
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("POST /admin/users/service-token - service: {}, days: {}, by: {}",
                serviceName, expirationDays, principal.username());

        // Validate input
        if (serviceName == null || serviceName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "INVALID_INPUT", "message", "serviceName is required"));
        }

        if (expirationDays < 1 || expirationDays > 3650) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "INVALID_INPUT", "message", "expirationDays must be between 1 and 3650"));
        }

        String token = authService.generateServiceAccountToken(serviceName, expirationDays);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "serviceName", serviceName,
                "expirationDays", expirationDays,
                "message", "Store this token securely. Set it as SERVICE_ACCOUNT_JWT environment variable."
        ));
    }
}
