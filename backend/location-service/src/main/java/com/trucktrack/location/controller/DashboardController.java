package com.trucktrack.location.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.*;
import com.trucktrack.location.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * T013: Dashboard controller with base endpoint structure.
 * Feature: 022-dashboard-real-data
 *
 * Endpoints:
 * - GET /admin/dashboard - Aggregated dashboard data
 * - GET /admin/dashboard/kpis - KPIs only
 * - GET /admin/dashboard/fleet-status - Fleet status breakdown
 * - GET /admin/dashboard/activity - Recent activity feed
 * - GET /admin/dashboard/performance - Performance metrics
 */
@Slf4j
@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DISPATCHER')")
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * T051: GET /admin/dashboard - Aggregated dashboard data.
     * Returns all dashboard sections in a single API call.
     */
    @GetMapping
    public ResponseEntity<DashboardDataDTO> getDashboardData(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam(defaultValue = "week") String performancePeriod) {
        log.debug("Getting dashboard data for user: {}", getUserId(principal));

        DashboardDataDTO data = dashboardService.getDashboardData(
            getGroups(principal),
            getUserId(principal),
            performancePeriod
        );

        return ResponseEntity.ok(data);
    }

    /**
     * T019: GET /admin/dashboard/kpis - KPIs only.
     * Returns total trucks, active trucks, trips today, alerts.
     */
    @GetMapping("/kpis")
    public ResponseEntity<DashboardKpiDTO> getKpis(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {
        log.debug("Getting KPIs for user: {}", getUserId(principal));

        DashboardKpiDTO kpis = dashboardService.getKpis(getGroups(principal));
        return ResponseEntity.ok(kpis);
    }

    /**
     * T027: GET /admin/dashboard/fleet-status - Fleet status breakdown.
     * Returns truck counts by status for donut chart.
     */
    @GetMapping("/fleet-status")
    public ResponseEntity<FleetStatusDTO> getFleetStatus(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {
        log.debug("Getting fleet status for user: {}", getUserId(principal));

        FleetStatusDTO status = dashboardService.getFleetStatus(getGroups(principal));
        return ResponseEntity.ok(status);
    }

    /**
     * T035: GET /admin/dashboard/activity - Recent activity feed.
     * Returns last N activity events (trips, alerts, deliveries).
     */
    @GetMapping("/activity")
    public ResponseEntity<List<ActivityEventDTO>> getRecentActivity(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam(defaultValue = "5") int limit) {
        log.debug("Getting recent activity for user: {}, limit: {}", getUserId(principal), limit);

        // Enforce max limit
        int effectiveLimit = Math.min(Math.max(limit, 1), 20);
        List<ActivityEventDTO> activity = dashboardService.getRecentActivity(
            getGroups(principal),
            effectiveLimit
        );

        return ResponseEntity.ok(activity);
    }

    /**
     * T043: GET /admin/dashboard/performance - Performance metrics.
     * Returns trip completion rate, on-time delivery, fleet utilization.
     */
    @GetMapping("/performance")
    public ResponseEntity<PerformanceMetricsDTO> getPerformanceMetrics(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam(defaultValue = "week") String period) {
        log.debug("Getting performance metrics for user: {}, period: {}", getUserId(principal), period);

        // Validate period
        String effectivePeriod = "month".equalsIgnoreCase(period) ? "month" : "week";
        PerformanceMetricsDTO metrics = dashboardService.getPerformanceMetrics(
            getGroups(principal),
            effectivePeriod
        );

        return ResponseEntity.ok(metrics);
    }

    // Helper methods for GatewayUserPrincipal

    private String getUserId(GatewayUserPrincipal principal) {
        return principal != null ? principal.userId() : null;
    }

    private String getGroups(GatewayUserPrincipal principal) {
        return principal != null ? principal.groups() : null;
    }
}
