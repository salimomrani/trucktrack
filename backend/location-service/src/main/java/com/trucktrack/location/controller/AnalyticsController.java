package com.trucktrack.location.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.*;
import com.trucktrack.location.dto.EntityInfo.EntityType;
import com.trucktrack.location.dto.PeriodInfo.PeriodType;
import com.trucktrack.location.dto.TruckRankingResponse.RankingMetric;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckGroup;
import com.trucktrack.location.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for fleet analytics endpoints.
 * Feature: 006-fleet-analytics
 * T015: Create AnalyticsController with 4 endpoints
 *
 * Endpoints:
 * - GET /location/v1/analytics/kpis - Fleet KPIs
 * - GET /location/v1/analytics/daily-metrics - Daily metrics for charts
 * - GET /location/v1/analytics/alert-breakdown - Alert distribution
 * - GET /location/v1/analytics/truck-ranking - Truck ranking by metric
 */
@Slf4j
@RestController
@RequestMapping("/location/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Get fleet KPIs for the specified period and entity.
     * GET /api/v1/analytics/kpis?period=WEEK&entityType=FLEET&entityId=xxx
     */
    @GetMapping("/kpis")
    public ResponseEntity<FleetKPIResponse> getFleetKPIs(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam PeriodType period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam EntityType entityType,
            @RequestParam(required = false) UUID entityId) {

        log.info("User [{}] requesting KPIs - period: {}, entityType: {}, entityId: {}",
                getUsername(principal), period, entityType, entityId);

        validatePeriodParams(period, startDate, endDate);
        validateEntityParams(entityType, entityId);

        List<UUID> userGroupIds = getUserGroups(principal);

        FleetKPIResponse response = analyticsService.getFleetKPIs(
                period, startDate, endDate, entityType, entityId, userGroupIds);

        return ResponseEntity.ok(response);
    }

    /**
     * Get daily metrics for charts.
     * GET /api/v1/analytics/daily-metrics?period=MONTH&entityType=FLEET
     */
    @GetMapping("/daily-metrics")
    public ResponseEntity<DailyMetricsResponse> getDailyMetrics(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam PeriodType period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam EntityType entityType,
            @RequestParam(required = false) UUID entityId) {

        log.info("User [{}] requesting daily metrics - period: {}, entityType: {}, entityId: {}",
                getUsername(principal), period, entityType, entityId);

        validatePeriodParams(period, startDate, endDate);
        validateEntityParams(entityType, entityId);

        List<UUID> userGroupIds = getUserGroups(principal);

        DailyMetricsResponse response = analyticsService.getDailyMetrics(
                period, startDate, endDate, entityType, entityId, userGroupIds);

        return ResponseEntity.ok(response);
    }

    /**
     * Get alert breakdown by type.
     * GET /api/v1/analytics/alert-breakdown?period=WEEK&entityType=FLEET
     */
    @GetMapping("/alert-breakdown")
    public ResponseEntity<AlertBreakdownResponse> getAlertBreakdown(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam PeriodType period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam EntityType entityType,
            @RequestParam(required = false) UUID entityId) {

        log.info("User [{}] requesting alert breakdown - period: {}, entityType: {}, entityId: {}",
                getUsername(principal), period, entityType, entityId);

        validatePeriodParams(period, startDate, endDate);
        validateEntityParams(entityType, entityId);

        List<UUID> userGroupIds = getUserGroups(principal);

        AlertBreakdownResponse response = analyticsService.getAlertBreakdown(
                period, startDate, endDate, entityType, entityId, userGroupIds);

        return ResponseEntity.ok(response);
    }

    /**
     * Get truck ranking by metric.
     * GET /api/v1/analytics/truck-ranking?period=WEEK&metric=DISTANCE&limit=10
     */
    @GetMapping("/truck-ranking")
    public ResponseEntity<TruckRankingResponse> getTruckRanking(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @RequestParam PeriodType period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam RankingMetric metric,
            @RequestParam(defaultValue = "10") int limit) {

        log.info("User [{}] requesting truck ranking - period: {}, metric: {}, limit: {}",
                getUsername(principal), period, metric, limit);

        validatePeriodParams(period, startDate, endDate);
        validateLimit(limit);

        List<UUID> userGroupIds = getUserGroups(principal);

        TruckRankingResponse response = analyticsService.getTruckRanking(
                period, startDate, endDate, metric, limit, userGroupIds);

        return ResponseEntity.ok(response);
    }

    /**
     * Get accessible trucks for filters.
     * GET /api/v1/analytics/trucks
     */
    @GetMapping("/trucks")
    public ResponseEntity<List<Truck>> getAccessibleTrucks(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("User [{}] requesting accessible trucks for filters", getUsername(principal));

        List<UUID> userGroupIds = getUserGroups(principal);
        List<Truck> trucks = analyticsService.getAccessibleTrucks(userGroupIds);

        return ResponseEntity.ok(trucks);
    }

    /**
     * Get accessible groups for filters.
     * GET /api/v1/analytics/groups
     */
    @GetMapping("/groups")
    public ResponseEntity<List<TruckGroup>> getAccessibleGroups(
            @AuthenticationPrincipal GatewayUserPrincipal principal) {

        log.info("User [{}] requesting accessible groups for filters", getUsername(principal));

        List<UUID> userGroupIds = getUserGroups(principal);
        List<TruckGroup> groups = analyticsService.getAccessibleGroups(userGroupIds);

        return ResponseEntity.ok(groups);
    }

    // === Validation methods ===

    private void validatePeriodParams(PeriodType period, LocalDate startDate, LocalDate endDate) {
        if (period == PeriodType.CUSTOM) {
            if (startDate == null || endDate == null) {
                throw new IllegalArgumentException("startDate and endDate are required for CUSTOM period");
            }
            if (endDate.isBefore(startDate)) {
                throw new IllegalArgumentException("endDate must be after startDate");
            }
            if (startDate.isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("startDate cannot be in the future");
            }
            long days = endDate.toEpochDay() - startDate.toEpochDay();
            if (days > 365) {
                throw new IllegalArgumentException("Period cannot exceed 365 days");
            }
        }
    }

    private void validateEntityParams(EntityType entityType, UUID entityId) {
        if (entityType != EntityType.FLEET && entityId == null) {
            throw new IllegalArgumentException("entityId is required for " + entityType + " entity type");
        }
    }

    private void validateLimit(int limit) {
        if (limit < 1 || limit > 50) {
            throw new IllegalArgumentException("limit must be between 1 and 50");
        }
    }

    // === Helper methods ===

    private String getUsername(GatewayUserPrincipal principal) {
        return principal != null ? principal.username() : "anonymous";
    }

    private List<UUID> getUserGroups(GatewayUserPrincipal principal) {
        if (principal == null || principal.groups() == null || principal.groups().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(principal.groups().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }
}
