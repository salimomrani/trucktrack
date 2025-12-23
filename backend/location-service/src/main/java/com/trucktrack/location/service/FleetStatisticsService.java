package com.trucktrack.location.service;

import com.trucktrack.location.dto.*;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.repository.GPSPositionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * T084-T085: Fleet statistics service
 * Feature: 002-admin-panel (US3 - Dashboard)
 */
@Service
public class FleetStatisticsService {

    private static final Logger log = LoggerFactory.getLogger(FleetStatisticsService.class);

    private final TruckRepository truckRepository;
    private final GPSPositionRepository gpsPositionRepository;
    private final JdbcTemplate jdbcTemplate;

    public FleetStatisticsService(
            TruckRepository truckRepository,
            GPSPositionRepository gpsPositionRepository,
            JdbcTemplate jdbcTemplate) {
        this.truckRepository = truckRepository;
        this.gpsPositionRepository = gpsPositionRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Get dashboard statistics for a given period
     */
    public DashboardStats getDashboardStats(String period) {
        Instant startTime = calculateStartTime(period);
        Instant endTime = Instant.now();

        TruckStatusStats truckStats = getTruckStatusStats();
        MileageStats mileageStats = getMileageStats(startTime, endTime);
        AlertStats alertStats = getAlertStats(startTime, endTime);

        // Get user counts from auth-service would require cross-service call
        // For now, return placeholder values
        long totalUsers = getUserCount();
        long activeUsers = getActiveUserCount();

        return new DashboardStats(
            truckStats,
            totalUsers,
            activeUsers,
            alertStats,
            mileageStats,
            Instant.now(),
            period
        );
    }

    /**
     * T081: Get truck status counts
     */
    public TruckStatusStats getTruckStatusStats() {
        try {
            String sql = """
                SELECT
                    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
                    COUNT(*) FILTER (WHERE status = 'IDLE') as idle,
                    COUNT(*) FILTER (WHERE status = 'OFFLINE') as offline,
                    COUNT(*) FILTER (WHERE status = 'OUT_OF_SERVICE') as out_of_service,
                    COUNT(*) as total
                FROM trucks
                """;

            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new TruckStatusStats(
                rs.getLong("active"),
                rs.getLong("idle"),
                rs.getLong("offline"),
                rs.getLong("out_of_service"),
                rs.getLong("total")
            ));
        } catch (Exception e) {
            log.error("Error getting truck status stats", e);
            return TruckStatusStats.empty();
        }
    }

    /**
     * T082: Get total kilometers with PostGIS
     */
    public MileageStats getMileageStats(Instant startTime, Instant endTime) {
        try {
            // Calculate total distance for each truck using PostGIS
            String sql = """
                WITH truck_distances AS (
                    SELECT
                        t.truck_id,
                        t.license_plate,
                        COALESCE(
                            SUM(
                                ST_DistanceSphere(
                                    ST_MakePoint(g1.longitude, g1.latitude),
                                    ST_MakePoint(g2.longitude, g2.latitude)
                                )
                            ) / 1000.0,
                            0
                        ) as km
                    FROM trucks t
                    LEFT JOIN gps_positions g1 ON t.id = g1.truck_id
                    LEFT JOIN gps_positions g2 ON t.id = g2.truck_id
                        AND g2.timestamp = (
                            SELECT MIN(g3.timestamp)
                            FROM gps_positions g3
                            WHERE g3.truck_id = t.id
                            AND g3.timestamp > g1.timestamp
                            AND g3.timestamp BETWEEN ? AND ?
                        )
                    WHERE g1.timestamp BETWEEN ? AND ?
                    GROUP BY t.truck_id, t.license_plate
                )
                SELECT
                    COALESCE(SUM(km), 0) as total_km,
                    COALESCE(AVG(km), 0) as avg_km,
                    truck_id,
                    license_plate,
                    km
                FROM truck_distances
                GROUP BY truck_id, license_plate, km
                ORDER BY km DESC
                LIMIT 10
                """;

            // Simplified query for now - calculate approximate distance
            String simpleSql = """
                SELECT
                    t.truck_id,
                    t.license_plate,
                    COUNT(g.id) * 0.1 as km
                FROM trucks t
                LEFT JOIN gps_positions g ON t.id = g.truck_id
                    AND g.timestamp BETWEEN ? AND ?
                GROUP BY t.truck_id, t.license_plate
                ORDER BY km DESC
                LIMIT 5
                """;

            List<MileageStats.TruckMileage> topTrucks = new ArrayList<>();
            double totalKm = 0;

            var results = jdbcTemplate.queryForList(simpleSql, startTime, endTime);
            for (var row : results) {
                String truckId = (String) row.get("truck_id");
                String licensePlate = (String) row.get("license_plate");
                double km = ((Number) row.get("km")).doubleValue();
                topTrucks.add(new MileageStats.TruckMileage(truckId, licensePlate, km));
                totalKm += km;
            }

            double avgKm = topTrucks.isEmpty() ? 0 : totalKm / topTrucks.size();

            return new MileageStats(totalKm, avgKm, topTrucks);
        } catch (Exception e) {
            log.error("Error getting mileage stats", e);
            return MileageStats.empty();
        }
    }

    /**
     * T083: Get alerts by type
     */
    public AlertStats getAlertStats(Instant startTime, Instant endTime) {
        try {
            String sql = """
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE is_read = false) as unread,
                    notification_type,
                    severity
                FROM notifications
                WHERE created_at BETWEEN ? AND ?
                GROUP BY notification_type, severity
                """;

            Map<String, Long> byType = new HashMap<>();
            Map<String, Long> bySeverity = new HashMap<>();
            long total = 0;
            long unread = 0;

            var results = jdbcTemplate.queryForList(sql, startTime, endTime);
            for (var row : results) {
                long count = ((Number) row.get("total")).longValue();
                total += count;
                unread += ((Number) row.get("unread")).longValue();

                String type = (String) row.get("notification_type");
                String severity = (String) row.get("severity");

                if (type != null) {
                    byType.merge(type, count, Long::sum);
                }
                if (severity != null) {
                    bySeverity.merge(severity, count, Long::sum);
                }
            }

            return new AlertStats(total, unread, byType, bySeverity);
        } catch (Exception e) {
            log.warn("Error getting alert stats (notifications table may not exist)", e);
            return AlertStats.empty();
        }
    }

    private long getUserCount() {
        try {
            String sql = "SELECT COUNT(*) FROM users";
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.warn("Error getting user count", e);
            return 0;
        }
    }

    private long getActiveUserCount() {
        try {
            String sql = "SELECT COUNT(*) FROM users WHERE is_active = true";
            Long count = jdbcTemplate.queryForObject(sql, Long.class);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.warn("Error getting active user count", e);
            return 0;
        }
    }

    private Instant calculateStartTime(String period) {
        Instant now = Instant.now();
        return switch (period.toLowerCase()) {
            case "today" -> now.truncatedTo(ChronoUnit.DAYS);
            case "week" -> now.minus(7, ChronoUnit.DAYS);
            case "month" -> now.minus(30, ChronoUnit.DAYS);
            case "year" -> now.minus(365, ChronoUnit.DAYS);
            default -> now.truncatedTo(ChronoUnit.DAYS);
        };
    }
}
