package com.trucktrack.location.controller;

import com.trucktrack.location.dto.*;
import com.trucktrack.location.service.FleetStatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * T086-T090: Admin statistics controller
 * Feature: 002-admin-panel (US3 - Dashboard)
 */
@RestController
@RequestMapping("/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final FleetStatisticsService statisticsService;

    public AdminStatsController(FleetStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    /**
     * T087: GET /admin/stats/dashboard
     * Get combined dashboard statistics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboardStats(
            @RequestParam(defaultValue = "today") String period) {
        DashboardStats stats = statisticsService.getDashboardStats(period);
        return ResponseEntity.ok(stats);
    }

    /**
     * T088: GET /admin/stats/trucks
     * Get truck status counts
     */
    @GetMapping("/trucks")
    public ResponseEntity<TruckStatusStats> getTruckStats() {
        TruckStatusStats stats = statisticsService.getTruckStatusStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * T089: GET /admin/stats/mileage
     * Get fleet mileage statistics
     */
    @GetMapping("/mileage")
    public ResponseEntity<MileageStats> getMileageStats(
            @RequestParam(defaultValue = "today") String period) {
        java.time.Instant startTime = calculateStartTime(period);
        java.time.Instant endTime = java.time.Instant.now();
        MileageStats stats = statisticsService.getMileageStats(startTime, endTime);
        return ResponseEntity.ok(stats);
    }

    /**
     * T090: GET /admin/stats/alerts
     * Get alert summary statistics
     */
    @GetMapping("/alerts")
    public ResponseEntity<AlertStats> getAlertStats(
            @RequestParam(defaultValue = "today") String period) {
        java.time.Instant startTime = calculateStartTime(period);
        java.time.Instant endTime = java.time.Instant.now();
        AlertStats stats = statisticsService.getAlertStats(startTime, endTime);
        return ResponseEntity.ok(stats);
    }

    private java.time.Instant calculateStartTime(String period) {
        java.time.Instant now = java.time.Instant.now();
        return switch (period.toLowerCase()) {
            case "today" -> now.truncatedTo(java.time.temporal.ChronoUnit.DAYS);
            case "week" -> now.minus(7, java.time.temporal.ChronoUnit.DAYS);
            case "month" -> now.minus(30, java.time.temporal.ChronoUnit.DAYS);
            case "year" -> now.minus(365, java.time.temporal.ChronoUnit.DAYS);
            default -> now.truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        };
    }
}
