package com.trucktrack.location.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for trip analytics and statistics.
 * T054: Create TripAnalyticsDTO with summary stats
 * Feature: 010-trip-management (US5: Trip History and Analytics)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripAnalyticsDTO {

    // Count statistics
    private long totalTrips;
    private long pendingTrips;
    private long assignedTrips;
    private long inProgressTrips;
    private long completedTrips;
    private long cancelledTrips;

    // Performance metrics
    private Double averageDurationMinutes;
    private Double completionRate;
    private Double cancellationRate;

    // Time-based metrics
    private long tripsToday;
    private long tripsThisWeek;
    private long tripsThisMonth;

    // Trend indicators (compared to previous period)
    private Double tripsTrendPercent;
    private Double completionRateTrendPercent;

    // Period info
    private Instant periodStart;
    private Instant periodEnd;

    /**
     * Calculate completion rate from counts.
     */
    public static Double calculateCompletionRate(long completed, long total) {
        if (total == 0) return 0.0;
        return (completed * 100.0) / total;
    }

    /**
     * Calculate cancellation rate from counts.
     */
    public static Double calculateCancellationRate(long cancelled, long total) {
        if (total == 0) return 0.0;
        return (cancelled * 100.0) / total;
    }
}
