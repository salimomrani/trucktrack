package com.trucktrack.location.dto;

import java.util.List;
import java.util.UUID;

/**
 * Response DTO for truck ranking (bar chart).
 * Feature: 006-fleet-analytics
 */
public record TruckRankingResponse(
    PeriodInfo period,
    RankingMetric metric,
    List<TruckRankEntry> ranking,
    int limit
) {
    public enum RankingMetric {
        DISTANCE, DRIVING_TIME, ALERTS
    }

    /**
     * Single truck entry in the ranking.
     */
    public record TruckRankEntry(
        int rank,
        UUID truckId,
        String truckName,
        String licensePlate,
        double value,
        String unit
    ) {
        public static TruckRankEntry of(int rank, UUID truckId, String truckName, String licensePlate, double value, String unit) {
            return new TruckRankEntry(rank, truckId, truckName, licensePlate, value, unit);
        }
    }

    public static TruckRankingResponse of(PeriodInfo period, RankingMetric metric, List<TruckRankEntry> ranking, int limit) {
        return new TruckRankingResponse(period, metric, ranking, limit);
    }
}
