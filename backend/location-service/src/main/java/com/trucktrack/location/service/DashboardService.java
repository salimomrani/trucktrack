package com.trucktrack.location.service;

import com.trucktrack.location.dto.*;

import java.util.List;

/**
 * T011: Dashboard service interface for aggregating dashboard data.
 * Feature: 022-dashboard-real-data
 */
public interface DashboardService {

    /**
     * Get KPI metrics for the dashboard.
     * @param userGroups comma-separated list of group UUIDs the user has access to
     * @return KPI data including total trucks, active trucks, trips today, alerts
     */
    DashboardKpiDTO getKpis(String userGroups);

    /**
     * Get fleet status breakdown for donut chart.
     * @param userGroups comma-separated list of group UUIDs the user has access to
     * @return Fleet status with counts and percentages per status
     */
    FleetStatusDTO getFleetStatus(String userGroups);

    /**
     * Get recent activity events.
     * @param userGroups comma-separated list of group UUIDs the user has access to
     * @param limit maximum number of events to return
     * @return List of recent activity events
     */
    List<ActivityEventDTO> getRecentActivity(String userGroups, int limit);

    /**
     * Get performance metrics for specified period.
     * @param userGroups comma-separated list of group UUIDs the user has access to
     * @param period "week" or "month"
     * @return Performance metrics for the period
     */
    PerformanceMetricsDTO getPerformanceMetrics(String userGroups, String period);

    /**
     * Get all dashboard data in a single call.
     * @param userGroups comma-separated list of group UUIDs the user has access to
     * @param userId the current user's ID
     * @param performancePeriod "week" or "month" for performance metrics
     * @return Aggregated dashboard data
     */
    DashboardDataDTO getDashboardData(String userGroups, String userId, String performancePeriod);
}
