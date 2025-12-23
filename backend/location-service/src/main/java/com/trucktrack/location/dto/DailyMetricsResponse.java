package com.trucktrack.location.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO for daily metrics (chart data).
 * Feature: 006-fleet-analytics
 */
public record DailyMetricsResponse(
    PeriodInfo period,
    EntityInfo entity,
    List<DailyDataPoint> dailyData
) {
    /**
     * Single day data point for line charts.
     */
    public record DailyDataPoint(
        LocalDate date,
        double distanceKm,
        long drivingTimeMinutes,
        int alertCount
    ) {}

    public static DailyMetricsResponse of(PeriodInfo period, EntityInfo entity, List<DailyDataPoint> dailyData) {
        return new DailyMetricsResponse(period, entity, dailyData);
    }
}
