package com.trucktrack.auth.controller;

import com.trucktrack.auth.dto.LoginRequest;
import com.trucktrack.auth.dto.LoginResponse;
import com.trucktrack.auth.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

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

        // For testing purposes, accept the admin user credentials from seed data
        if ("admin@trucktrack.com".equals(loginRequest.getEmail()) &&
            "AdminPass123!".equals(loginRequest.getPassword())) {

            // Generate JWT token
            String token = authService.generateToken(
                    loginRequest.getEmail(),
                    UUID.randomUUID().toString(),
                    "FLEET_MANAGER"
            );

            log.info("User logged in successfully: {}", loginRequest.getEmail());

            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setType("Bearer");
            response.setEmail(loginRequest.getEmail());
            response.setRole("FLEET_MANAGER");

            return ResponseEntity.ok(response);
        }

        log.warn("Invalid credentials for user: {}", loginRequest.getEmail());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Invalid credentials");
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is healthy");
    }
}
