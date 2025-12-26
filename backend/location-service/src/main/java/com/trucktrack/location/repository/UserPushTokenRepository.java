package com.trucktrack.location.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for fetching user push tokens from the shared users table.
 * Feature: 010-trip-management (US3: Push Notifications)
 *
 * Uses JDBC directly since the User entity is owned by auth-service.
 * This repository only reads the expo_push_token column.
 */
@Repository
public class UserPushTokenRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserPushTokenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Get the Expo push token for a user by their ID.
     *
     * @param userId The user's UUID
     * @return Optional containing the push token if present, empty otherwise
     */
    public Optional<String> findPushTokenByUserId(UUID userId) {
        String sql = "SELECT expo_push_token FROM users WHERE id = ?";

        try {
            String token = jdbcTemplate.queryForObject(sql, String.class, userId);
            return Optional.ofNullable(token);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Get the full name of a user by their ID.
     *
     * @param userId The user's UUID
     * @return Optional containing the full name if present
     */
    public Optional<String> findUserNameById(UUID userId) {
        String sql = "SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = ?";

        try {
            String name = jdbcTemplate.queryForObject(sql, String.class, userId);
            return Optional.ofNullable(name);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Check if a user has a valid push token registered.
     *
     * @param userId The user's UUID
     * @return true if the user has a push token
     */
    public boolean hasPushToken(UUID userId) {
        String sql = "SELECT COUNT(*) FROM users WHERE id = ? AND expo_push_token IS NOT NULL AND expo_push_token != ''";

        try {
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }
}
