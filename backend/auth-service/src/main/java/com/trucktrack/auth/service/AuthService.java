package com.trucktrack.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for JWT token generation and validation.
 * P0 Fix: Validates JWT secret on startup to fail fast if misconfigured.
 */
@Slf4j
@Service
public class AuthService {

    private static final int MIN_SECRET_LENGTH = 64; // 512 bits for HS512
    private static final List<String> INSECURE_SECRETS = List.of(
            "changeme",
            "secret",
            "password",
            "default",
            "test"
    );

    @Value("${jwt.secret:}")
    private String secret;

    @Value("${jwt.access-expiration:3600000}") // 1 hour default
    private Long accessExpiration;

    @Value("${jwt.refresh-expiration:604800000}") // 7 days default
    private Long refreshExpiration;

    private SecretKey signingKey;

    /**
     * Validates JWT configuration on startup.
     * Fails fast if secret is missing, too short, or obviously insecure.
     */
    @PostConstruct
    public void init() {
        log.info("Initializing JWT authentication service...");

        // Check if secret is set
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is not set! " +
                    "Generate a secure 64-byte secret with: openssl rand -base64 64"
            );
        }

        // Check for obviously insecure secrets
        String lowerSecret = secret.toLowerCase();
        for (String insecure : INSECURE_SECRETS) {
            if (lowerSecret.contains(insecure)) {
                throw new IllegalStateException(
                        "JWT_SECRET contains insecure pattern '" + insecure + "'. " +
                        "Use a cryptographically random secret in production!"
                );
            }
        }

        // Decode secret (support both Base64 and raw)
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret);
            log.debug("JWT secret decoded from Base64 ({} bytes)", keyBytes.length);
        } catch (IllegalArgumentException e) {
            // Not Base64, use raw bytes
            keyBytes = secret.getBytes();
            log.debug("JWT secret used as raw bytes ({} bytes)", keyBytes.length);
        }

        // Validate minimum length for HS512
        if (keyBytes.length < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    String.format(
                            "JWT_SECRET is too short (%d bytes). Minimum required: %d bytes (512 bits) for HS512. " +
                            "Generate with: openssl rand -base64 64",
                            keyBytes.length, MIN_SECRET_LENGTH
                    )
            );
        }

        // Create signing key
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);

        log.info("JWT service initialized successfully (access token TTL: {}s, refresh token TTL: {}s)",
                accessExpiration / 1000, refreshExpiration / 1000);
    }

    /**
     * Get expiration time in seconds for frontend.
     */
    public long getExpirationInSeconds() {
        return accessExpiration / 1000;
    }

    /**
     * Generate JWT access token for authenticated user.
     */
    public String generateToken(String username, String userId, String role) {
        return generateToken(username, userId, role, List.of());
    }

    /**
     * Generate JWT access token with group assignments.
     * Groups are embedded to avoid inter-service calls for authorization.
     */
    public String generateToken(String username, String userId, String role, List<UUID> groupIds) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("username", username);
        claims.put("type", "access");

        // Store groups as comma-separated string
        if (groupIds != null && !groupIds.isEmpty()) {
            String groupsStr = groupIds.stream()
                    .map(UUID::toString)
                    .collect(Collectors.joining(","));
            claims.put("groups", groupsStr);
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Validate JWT token signature and expiration.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract username (subject) from JWT token.
     */
    public String getUsernameFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Extract user ID from JWT token.
     */
    public String getUserIdFromToken(String token) {
        return parseClaims(token).get("userId", String.class);
    }

    /**
     * Extract user role from JWT token.
     */
    public String getRoleFromToken(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /**
     * Extract user groups from JWT token.
     * @return Comma-separated group UUIDs, or empty string if none
     */
    public String getGroupsFromToken(String token) {
        String groups = parseClaims(token).get("groups", String.class);
        return groups != null ? groups : "";
    }

    /**
     * Check if token is expired.
     */
    public boolean isTokenExpired(String token) {
        try {
            return parseClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Generate refresh token with longer expiration.
     */
    public String generateRefreshToken(String username, String userId, String role) {
        return generateRefreshToken(username, userId, role, List.of());
    }

    /**
     * Generate refresh token with group assignments.
     */
    public String generateRefreshToken(String username, String userId, String role, List<UUID> groupIds) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("username", username);
        claims.put("type", "refresh");

        if (groupIds != null && !groupIds.isEmpty()) {
            String groupsStr = groupIds.stream()
                    .map(UUID::toString)
                    .collect(Collectors.joining(","));
            claims.put("groups", groupsStr);
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Validate refresh token (checks type claim and expiration).
     */
    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = parseClaims(token);
            String type = claims.get("type", String.class);
            return "refresh".equals(type) && !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            log.debug("Refresh token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Generate a long-lived service account token for inter-service communication.
     * This token is used by services to authenticate when calling other services via the gateway.
     *
     * @param serviceName Name of the service (e.g., "notification-service")
     * @param expirationDays Number of days until token expires (default: 365)
     * @return JWT token for the service account
     */
    public String generateServiceAccountToken(String serviceName, int expirationDays) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", "00000000-0000-0000-0000-000000000001"); // System user ID
        claims.put("role", "SYSTEM");
        claims.put("type", "service");
        claims.put("serviceName", serviceName);

        Date now = new Date();
        long expirationMillis = (long) expirationDays * 24 * 60 * 60 * 1000;
        Date expiryDate = new Date(now.getTime() + expirationMillis);

        log.info("Generating service account token for: {} (expires: {})", serviceName, expiryDate);

        return Jwts.builder()
                .claims(claims)
                .subject(serviceName)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Parse and validate token claims.
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
