package com.trucktrack.location.dto;

import java.util.List;

/**
 * Response DTO for alert distribution (pie chart).
 * Feature: 006-fleet-analytics
 */
public record AlertBreakdownResponse(
    PeriodInfo period,
    EntityInfo entity,
    int totalAlerts,
    List<AlertTypeCount> breakdown
) {
    /**
     * Alert count by type with percentage.
     */
    public record AlertTypeCount(
        String alertType,
        int count,
        double percentage
    ) {
        public static AlertTypeCount of(String alertType, int count, int total) {
            double percentage = total > 0 ? (count * 100.0) / total : 0.0;
            return new AlertTypeCount(alertType, count, Math.round(percentage * 10) / 10.0);
        }
    }

    public static AlertBreakdownResponse of(PeriodInfo period, EntityInfo entity, List<AlertTypeCount> breakdown) {
        int total = breakdown.stream().mapToInt(AlertTypeCount::count).sum();
        return new AlertBreakdownResponse(period, entity, total, breakdown);
    }
}
