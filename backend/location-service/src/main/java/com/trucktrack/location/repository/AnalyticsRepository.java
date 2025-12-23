package com.trucktrack.location.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Repository for analytics queries using the daily_truck_metrics materialized view.
 * Feature: 006-fleet-analytics
 * T008: Create AnalyticsRepository with custom SQL queries
 */
@Repository
public class AnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Get aggregated KPIs for a list of trucks over a date range.
     */
    public Map<String, Object> getAggregatedKPIs(List<UUID> truckIds, LocalDate startDate, LocalDate endDate) {
        if (truckIds.isEmpty()) {
            return emptyKPIs();
        }

        String sql = """
            SELECT
                COALESCE(SUM(total_distance_km), 0) as total_distance_km,
                COALESCE(SUM(driving_minutes), 0) as driving_minutes,
                COALESCE(SUM(idle_minutes), 0) as idle_minutes,
                COALESCE(MAX(max_speed), 0) as max_speed,
                COALESCE(AVG(NULLIF(avg_speed, 0)), 0) as avg_speed
            FROM daily_truck_metrics
            WHERE truck_id = ANY(?::uuid[])
              AND day BETWEEN ? AND ?
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        return jdbcTemplate.queryForMap(sql, truckIdsArray, startDate, endDate);
    }

    /**
     * Get alert counts for a list of trucks over a date range.
     */
    public int getAlertCount(List<UUID> truckIds, LocalDate startDate, LocalDate endDate) {
        if (truckIds.isEmpty()) {
            return 0;
        }

        String sql = """
            SELECT COUNT(*)
            FROM notifications
            WHERE truck_id = ANY(?::uuid[])
              AND DATE(triggered_at) BETWEEN ? AND ?
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, truckIdsArray, startDate, endDate);
        return count != null ? count : 0;
    }

    /**
     * Get geofence entry/exit counts for a list of trucks over a date range.
     */
    public Map<String, Integer> getGeofenceEventCounts(List<UUID> truckIds, LocalDate startDate, LocalDate endDate) {
        if (truckIds.isEmpty()) {
            return Map.of("entries", 0, "exits", 0);
        }

        String sql = """
            SELECT
                SUM(CASE WHEN notification_type = 'GEOFENCE_ENTER' THEN 1 ELSE 0 END) as entries,
                SUM(CASE WHEN notification_type = 'GEOFENCE_EXIT' THEN 1 ELSE 0 END) as exits
            FROM notifications
            WHERE truck_id = ANY(?::uuid[])
              AND DATE(triggered_at) BETWEEN ? AND ?
              AND notification_type IN ('GEOFENCE_ENTER', 'GEOFENCE_EXIT')
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        Map<String, Object> result = jdbcTemplate.queryForMap(sql, truckIdsArray, startDate, endDate);

        Number entries = (Number) result.get("entries");
        Number exits = (Number) result.get("exits");
        return Map.of(
            "entries", entries != null ? entries.intValue() : 0,
            "exits", exits != null ? exits.intValue() : 0
        );
    }

    /**
     * Get daily metrics for a list of trucks over a date range.
     */
    public List<Map<String, Object>> getDailyMetrics(List<UUID> truckIds, LocalDate startDate, LocalDate endDate) {
        if (truckIds.isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT
                day as date,
                SUM(total_distance_km) as distance_km,
                SUM(driving_minutes) as driving_minutes,
                (SELECT COUNT(*) FROM notifications n
                 WHERE n.truck_id = ANY(?::uuid[])
                   AND DATE(n.triggered_at) = dtm.day) as alert_count
            FROM daily_truck_metrics dtm
            WHERE truck_id = ANY(?::uuid[])
              AND day BETWEEN ? AND ?
            GROUP BY day
            ORDER BY day
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        return jdbcTemplate.queryForList(sql, truckIdsArray, truckIdsArray, startDate, endDate);
    }

    /**
     * Get alert breakdown by type for a list of trucks over a date range.
     */
    public List<Map<String, Object>> getAlertBreakdown(List<UUID> truckIds, LocalDate startDate, LocalDate endDate) {
        if (truckIds.isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT
                notification_type as alert_type,
                COUNT(*) as count
            FROM notifications
            WHERE truck_id = ANY(?::uuid[])
              AND DATE(triggered_at) BETWEEN ? AND ?
            GROUP BY notification_type
            ORDER BY count DESC
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        return jdbcTemplate.queryForList(sql, truckIdsArray, startDate, endDate);
    }

    /**
     * Get truck ranking by distance for a list of trucks over a date range.
     */
    public List<Map<String, Object>> getTruckRankingByDistance(List<UUID> truckIds, LocalDate startDate, LocalDate endDate, int limit) {
        if (truckIds.isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT
                t.id as truck_id,
                t.truck_id as truck_name,
                t.license_plate,
                COALESCE(SUM(dtm.total_distance_km), 0) as value
            FROM trucks t
            LEFT JOIN daily_truck_metrics dtm ON t.id = dtm.truck_id
                AND dtm.day BETWEEN ? AND ?
            WHERE t.id = ANY(?::uuid[])
            GROUP BY t.id, t.truck_id, t.license_plate
            ORDER BY value DESC
            LIMIT ?
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        return jdbcTemplate.queryForList(sql, startDate, endDate, truckIdsArray, limit);
    }

    /**
     * Get truck ranking by driving time for a list of trucks over a date range.
     */
    public List<Map<String, Object>> getTruckRankingByDrivingTime(List<UUID> truckIds, LocalDate startDate, LocalDate endDate, int limit) {
        if (truckIds.isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT
                t.id as truck_id,
                t.truck_id as truck_name,
                t.license_plate,
                COALESCE(SUM(dtm.driving_minutes), 0) as value
            FROM trucks t
            LEFT JOIN daily_truck_metrics dtm ON t.id = dtm.truck_id
                AND dtm.day BETWEEN ? AND ?
            WHERE t.id = ANY(?::uuid[])
            GROUP BY t.id, t.truck_id, t.license_plate
            ORDER BY value DESC
            LIMIT ?
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        return jdbcTemplate.queryForList(sql, startDate, endDate, truckIdsArray, limit);
    }

    /**
     * Get truck ranking by alert count for a list of trucks over a date range.
     */
    public List<Map<String, Object>> getTruckRankingByAlerts(List<UUID> truckIds, LocalDate startDate, LocalDate endDate, int limit) {
        if (truckIds.isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT
                t.id as truck_id,
                t.truck_id as truck_name,
                t.license_plate,
                COUNT(n.id) as value
            FROM trucks t
            LEFT JOIN notifications n ON t.id = n.truck_id
                AND DATE(n.triggered_at) BETWEEN ? AND ?
            WHERE t.id = ANY(?::uuid[])
            GROUP BY t.id, t.truck_id, t.license_plate
            ORDER BY value DESC
            LIMIT ?
            """;

        String truckIdsArray = "{" + String.join(",", truckIds.stream().map(UUID::toString).toList()) + "}";

        return jdbcTemplate.queryForList(sql, startDate, endDate, truckIdsArray, limit);
    }

    /**
     * Get truck IDs for a specific group.
     */
    public List<UUID> getTruckIdsByGroupId(UUID groupId) {
        String sql = """
            SELECT DISTINCT t.id
            FROM trucks t
            JOIN truck_group_assignments tga ON t.id = tga.truck_id
            WHERE tga.group_id = ?
            """;

        return jdbcTemplate.queryForList(sql, UUID.class, groupId);
    }

    /**
     * Get truck IDs accessible to a user (by their group assignments).
     */
    public List<UUID> getAccessibleTruckIds(List<UUID> userGroupIds) {
        if (userGroupIds.isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT DISTINCT t.id
            FROM trucks t
            JOIN truck_group_assignments tga ON t.id = tga.truck_id
            WHERE tga.group_id = ANY(?::uuid[])
            """;

        String groupIdsArray = "{" + String.join(",", userGroupIds.stream().map(UUID::toString).toList()) + "}";

        return jdbcTemplate.queryForList(sql, UUID.class, groupIdsArray);
    }

    /**
     * Refresh the materialized view.
     */
    public void refreshMaterializedView() {
        jdbcTemplate.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY daily_truck_metrics");
    }

    private Map<String, Object> emptyKPIs() {
        return Map.of(
            "total_distance_km", BigDecimal.ZERO,
            "driving_minutes", 0L,
            "idle_minutes", 0L,
            "max_speed", BigDecimal.ZERO,
            "avg_speed", BigDecimal.ZERO
        );
    }
}
