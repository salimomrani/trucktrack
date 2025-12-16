package com.trucktrack.auth.controller;

import com.trucktrack.auth.dto.LoginRequest;
import com.trucktrack.auth.dto.LoginResponse;
import com.trucktrack.auth.dto.RefreshTokenRequest;
import com.trucktrack.auth.dto.RefreshTokenResponse;
import com.trucktrack.auth.dto.UserResponse;
import com.trucktrack.auth.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for login/register endpoints
 * Simplified version for testing - validates only the test admin user
 */
@RestController
@RequestMapping("/auth/v1")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getEmail());

        // For testing: validate against seed data credentials
        // and use the actual user ID from the database
        if ("admin@trucktrack.com".equals(loginRequest.getEmail()) &&
            "AdminPass123!".equals(loginRequest.getPassword())) {

            // Use the actual admin user ID from the database (from seed data)
            String userId = "00000000-0000-0000-0000-000000000002";
            String role = "FLEET_MANAGER";

            // Generate JWT access token
            String token = authService.generateToken(
                    loginRequest.getEmail(),
                    userId,
                    role
            );

            // Generate refresh token
            String refreshToken = authService.generateRefreshToken(
                    loginRequest.getEmail(),
                    userId,
                    role
            );

            log.info("User logged in successfully: {}", loginRequest.getEmail());

            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setRefreshToken(refreshToken);
            response.setType("Bearer");
            response.setEmail(loginRequest.getEmail());
            response.setRole(role);
            response.setExpiresIn(authService.getExpirationInSeconds());

            return ResponseEntity.ok(response);
        }

        // Also support dispatcher user
        if ("dispatcher@trucktrack.com".equals(loginRequest.getEmail()) &&
            "DispatcherPass123!".equals(loginRequest.getPassword())) {

            String userId = "00000000-0000-0000-0000-000000000003";
            String role = "DISPATCHER";

            String token = authService.generateToken(
                    loginRequest.getEmail(),
                    userId,
                    role
            );

            String refreshToken = authService.generateRefreshToken(
                    loginRequest.getEmail(),
                    userId,
                    role
            );

            log.info("User logged in successfully: {}", loginRequest.getEmail());

            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setRefreshToken(refreshToken);
            response.setType("Bearer");
            response.setEmail(loginRequest.getEmail());
            response.setRole(role);
            response.setExpiresIn(authService.getExpirationInSeconds());

            return ResponseEntity.ok(response);
        }

        log.warn("Invalid credentials for user: {}", loginRequest.getEmail());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid credentials");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Token refresh attempt");

        String refreshToken = request.getRefreshToken();

        // Validate refresh token
        if (!authService.validateRefreshToken(refreshToken)) {
            log.warn("Invalid refresh token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired refresh token");
        }

        // Extract user info from refresh token
        String username = authService.getUsernameFromToken(refreshToken);
        String userId = authService.getUserIdFromToken(refreshToken);
        String role = authService.getRoleFromToken(refreshToken);

        // Generate new tokens
        String newAccessToken = authService.generateToken(username, userId, role);
        String newRefreshToken = authService.generateRefreshToken(username, userId, role);

        log.info("Token refreshed successfully for user: {}", username);

        RefreshTokenResponse response = new RefreshTokenResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(authService.getExpirationInSeconds());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        log.info("Getting current user info");

        try {
            // Extract token from Authorization header (Bearer token)
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Invalid Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid Authorization header");
            }

            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Validate token
            if (!authService.validateToken(token)) {
                log.warn("Invalid or expired token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid or expired token");
            }

            // Extract user info from token
            String userId = authService.getUserIdFromToken(token);
            String email = authService.getUsernameFromToken(token);
            String role = authService.getRoleFromToken(token);

            UserResponse userResponse = new UserResponse(userId, email, role);

            log.info("Returning user info for: {}", email);
            return ResponseEntity.ok(userResponse);

        } catch (Exception e) {
            log.error("Error getting current user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing request");
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is healthy");
    }
}
