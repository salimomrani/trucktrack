package com.trucktrack.auth.controller;

import com.trucktrack.auth.dto.ChangePasswordRequest;
import com.trucktrack.auth.dto.LoginRequest;
import com.trucktrack.auth.dto.LoginResponse;
import com.trucktrack.auth.dto.RefreshTokenRequest;
import com.trucktrack.auth.dto.RefreshTokenResponse;
import com.trucktrack.auth.dto.UpdatePushTokenRequest;
import com.trucktrack.auth.dto.UserResponse;
import com.trucktrack.auth.model.User;
import com.trucktrack.auth.repository.UserGroupAssignmentRepository;
import com.trucktrack.auth.repository.UserRepository;
import com.trucktrack.auth.service.AuthService;
import com.trucktrack.auth.service.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Authentication controller for login/register endpoints.
 * P0 Fixes:
 * - Real database authentication instead of hardcoded credentials
 * - Rate limiting to prevent brute-force attacks
 */
@Slf4j
@RestController
@RequestMapping("/auth/v1")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserGroupAssignmentRepository userGroupAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginRateLimiter rateLimiter;

    /**
     * Authenticate user and return JWT tokens.
     * P0 Fixes:
     * - Validates against database with BCrypt password verification
     * - Rate limiting to prevent brute-force attacks
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {

        String clientIp = getClientIp(request);
        String email = loginRequest.getEmail();

        log.info("Login attempt for user: {} from IP: {}", email, maskIp(clientIp));

        // Check rate limit before processing
        if (!rateLimiter.isAllowed(clientIp, email)) {
            int remaining = rateLimiter.getRemainingAttempts(clientIp);
            log.warn("Rate limit exceeded for IP: {} email: {}", maskIp(clientIp), email);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", "900") // 15 minutes
                    .header("X-RateLimit-Remaining", String.valueOf(remaining))
                    .body(Map.of(
                            "error", "RATE_LIMITED",
                            "message", "Too many login attempts. Please try again later.",
                            "retryAfter", 900
                    ));
        }

        // Find user by email
        User user = userRepository.findByEmail(email).orElse(null);

        // Check if user exists
        if (user == null) {
            log.warn("Login failed: user not found for email: {}", email);
            rateLimiter.recordFailedAttempt(clientIp, email);
            // Use same message to prevent user enumeration
            return unauthorizedResponse("Invalid email or password", clientIp);
        }

        // Check if account is active
        if (!user.getIsActive()) {
            log.warn("Login failed: account disabled for user: {}", email);
            rateLimiter.recordFailedAttempt(clientIp, email);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .header("X-RateLimit-Remaining", String.valueOf(rateLimiter.getRemainingAttempts(clientIp)))
                    .body(Map.of(
                            "error", "ACCOUNT_DISABLED",
                            "message", "Your account has been disabled. Please contact an administrator."
                    ));
        }

        // Verify password using BCrypt
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: invalid password for user: {}", email);
            rateLimiter.recordFailedAttempt(clientIp, email);
            return unauthorizedResponse("Invalid email or password", clientIp);
        }

        // Login successful - reset rate limit counters
        rateLimiter.recordSuccessfulLogin(clientIp, email);

        // Update last login timestamp
        user.setLastLogin(Instant.now());
        userRepository.save(user);

        // Fetch user's group assignments for JWT
        List<UUID> groupIds = userGroupAssignmentRepository.findGroupIdsByUserId(user.getId());
        log.debug("User {} has {} group assignments", user.getEmail(), groupIds.size());

        // Generate tokens with user info and groups
        String token = authService.generateToken(
                user.getEmail(),
                user.getId().toString(),
                user.getRole().name(),
                groupIds
        );

        String refreshToken = authService.generateRefreshToken(
                user.getEmail(),
                user.getId().toString(),
                user.getRole().name(),
                groupIds
        );

        log.info("User logged in successfully: {} (role: {})", user.getEmail(), user.getRole());

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setRefreshToken(refreshToken);
        response.setType("Bearer");
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        response.setExpiresIn(authService.getExpirationInSeconds());

        return ResponseEntity.ok(response);
    }

    /**
     * Refresh access token using refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Token refresh attempt");

        String refreshToken = request.getRefreshToken();

        // Validate refresh token
        if (!authService.validateRefreshToken(refreshToken)) {
            log.warn("Invalid refresh token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "INVALID_TOKEN",
                            "message", "Invalid or expired refresh token"
                    ));
        }

        // Extract user info from refresh token
        String userId = authService.getUserIdFromToken(refreshToken);

        // Verify user still exists and is active
        User user = userRepository.findById(UUID.fromString(userId))
                .orElse(null);

        if (user == null || !user.getIsActive()) {
            log.warn("Token refresh failed: user not found or disabled for userId: {}", userId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "USER_INVALID",
                            "message", "User account no longer valid"
                    ));
        }

        // Get fresh group assignments (in case they changed)
        List<UUID> groupIds = userGroupAssignmentRepository.findGroupIdsByUserId(user.getId());

        // Generate new tokens with fresh data
        String newAccessToken = authService.generateToken(
                user.getEmail(),
                user.getId().toString(),
                user.getRole().name(),
                groupIds
        );
        String newRefreshToken = authService.generateRefreshToken(
                user.getEmail(),
                user.getId().toString(),
                user.getRole().name(),
                groupIds
        );

        log.info("Token refreshed successfully for user: {}", user.getEmail());

        RefreshTokenResponse response = new RefreshTokenResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(authService.getExpirationInSeconds());

        return ResponseEntity.ok(response);
    }

    /**
     * Get current user info from database.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        log.debug("Getting current user info");

        try {
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Invalid Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_HEADER", "message", "Invalid Authorization header"));
            }

            String token = authHeader.substring(7);

            // Validate token
            if (!authService.validateToken(token)) {
                log.warn("Invalid or expired token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_TOKEN", "message", "Invalid or expired token"));
            }

            // Extract user ID from token and fetch full user from database
            String userId = authService.getUserIdFromToken(token);
            User user = userRepository.findById(UUID.fromString(userId)).orElse(null);

            if (user == null) {
                log.warn("User not found for ID: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "USER_NOT_FOUND", "message", "User not found"));
            }

            UserResponse userResponse = new UserResponse(user);

            log.debug("Returning user info for: {}", user.getEmail());
            return ResponseEntity.ok(userResponse);

        } catch (Exception e) {
            log.error("Error getting current user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Error processing request"));
        }
    }

    /**
     * Change user password.
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody ChangePasswordRequest request) {

        log.debug("Password change request");

        try {
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Invalid Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_HEADER", "message", "Invalid Authorization header"));
            }

            String token = authHeader.substring(7);

            // Validate token
            if (!authService.validateToken(token)) {
                log.warn("Invalid or expired token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_TOKEN", "message", "Invalid or expired token"));
            }

            // Get user from database
            String userId = authService.getUserIdFromToken(token);
            User user = userRepository.findById(UUID.fromString(userId)).orElse(null);

            if (user == null) {
                log.warn("User not found for ID: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "USER_NOT_FOUND", "message", "User not found"));
            }

            // Verify current password
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                log.warn("Invalid current password for user: {}", user.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "INVALID_PASSWORD", "message", "Current password is incorrect"));
            }

            // Check that new password is different from current
            if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "SAME_PASSWORD", "message", "New password must be different from current password"));
            }

            // Update password
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            log.info("Password changed successfully for user: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));

        } catch (Exception e) {
            log.error("Error changing password", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Error processing request"));
        }
    }

    /**
     * Update user's Expo push notification token.
     * T033: Add endpoint POST /auth/v1/me/push-token
     * Feature: 010-trip-management (US3: Push Notifications)
     */
    @PostMapping("/me/push-token")
    public ResponseEntity<?> updatePushToken(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody UpdatePushTokenRequest request) {

        log.debug("Push token update request");

        try {
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Invalid Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_HEADER", "message", "Invalid Authorization header"));
            }

            String token = authHeader.substring(7);

            // Validate token
            if (!authService.validateToken(token)) {
                log.warn("Invalid or expired token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_TOKEN", "message", "Invalid or expired token"));
            }

            // Get user from database
            String userId = authService.getUserIdFromToken(token);
            User user = userRepository.findById(UUID.fromString(userId)).orElse(null);

            if (user == null) {
                log.warn("User not found for ID: {}", userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "USER_NOT_FOUND", "message", "User not found"));
            }

            // Update push token
            user.setExpoPushToken(request.getPushToken());
            userRepository.save(user);

            log.info("Push token updated for user: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("message", "Push token updated successfully"));

        } catch (Exception e) {
            log.error("Error updating push token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Error processing request"));
        }
    }

    /**
     * Delete user's Expo push notification token (on logout).
     */
    @DeleteMapping("/me/push-token")
    public ResponseEntity<?> deletePushToken(@RequestHeader("Authorization") String authHeader) {

        log.debug("Push token delete request");

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_HEADER", "message", "Invalid Authorization header"));
            }

            String token = authHeader.substring(7);

            if (!authService.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "INVALID_TOKEN", "message", "Invalid or expired token"));
            }

            String userId = authService.getUserIdFromToken(token);
            User user = userRepository.findById(UUID.fromString(userId)).orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "USER_NOT_FOUND", "message", "User not found"));
            }

            user.setExpoPushToken(null);
            userRepository.save(user);

            log.info("Push token deleted for user: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("message", "Push token deleted successfully"));

        } catch (Exception e) {
            log.error("Error deleting push token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "INTERNAL_ERROR", "message", "Error processing request"));
        }
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is healthy");
    }

    /**
     * Creates a consistent unauthorized response with rate limit header.
     * Uses the same message for both "user not found" and "wrong password" to prevent enumeration.
     */
    private ResponseEntity<Map<String, String>> unauthorizedResponse(String message, String clientIp) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header("X-RateLimit-Remaining", String.valueOf(rateLimiter.getRemainingAttempts(clientIp)))
                .body(Map.of(
                        "error", "INVALID_CREDENTIALS",
                        "message", message
                ));
    }

    /**
     * Extract client IP address from request.
     * Handles proxies via X-Forwarded-For header.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // First IP in the list is the original client
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    /**
     * Mask IP address for logging (privacy).
     */
    private String maskIp(String ip) {
        if (ip == null) return "unknown";
        int lastDot = ip.lastIndexOf('.');
        if (lastDot > 0) {
            return ip.substring(0, lastDot) + ".***";
        }
        return "***";
    }
}
