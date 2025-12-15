package com.trucktrack.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for JWT token generation and validation
 * T033: Implement JWT token generation in auth-service AuthService.java
 */
@Service
public class AuthService {

    @Value("${jwt.secret:changeme-this-should-be-a-very-long-secret-key-for-production}")
    private String secret;

    @Value("${jwt.expiration:3600000}") // 1 hour in milliseconds for access token
    private Long expiration;

    @Value("${jwt.refresh-expiration:604800000}") // 7 days in milliseconds for refresh token
    private Long refreshExpiration;

    /**
     * Get expiration time in seconds for frontend
     */
    public long getExpirationInSeconds() {
        return expiration / 1000;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Generate JWT token for authenticated user
     *
     * @param username User email/username
     * @param userId   User UUID
     * @param role     User role (FLEET_MANAGER, DISPATCHER, VIEWER)
     * @return JWT token string
     */
    public String generateToken(String username, String userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("username", username);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validate JWT token
     *
     * @param token JWT token string
     * @return true if token is valid
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extract username from JWT token
     *
     * @param token JWT token string
     * @return username
     */
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    /**
     * Extract user ID from JWT token
     *
     * @param token JWT token string
     * @return user UUID
     */
    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("userId", String.class);
    }

    /**
     * Extract user role from JWT token
     *
     * @param token JWT token string
     * @return user role
     */
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("role", String.class);
    }

    /**
     * Check if token is expired
     *
     * @param token JWT token string
     * @return true if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Generate refresh token with longer expiration
     *
     * @param username User email/username
     * @param userId   User UUID
     * @param role     User role
     * @return Refresh token string
     */
    public String generateRefreshToken(String username, String userId, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("username", username);
        claims.put("type", "refresh");

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validate refresh token and check it's a refresh token type
     *
     * @param token Refresh token string
     * @return true if valid refresh token
     */
    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Check if it's a refresh token
            String type = claims.get("type", String.class);
            return "refresh".equals(type) && !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
