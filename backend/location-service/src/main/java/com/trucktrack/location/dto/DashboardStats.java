package com.trucktrack.location.dto;

import java.time.Instant;

/**
 * T079: Combined dashboard statistics DTO
 * Feature: 002-admin-panel (US3 - Dashboard)
 */
public record DashboardStats(
    TruckStatusStats trucks,
    long totalUsers,
    long activeUsers,
    AlertStats alerts,
    MileageStats mileage,
    Instant generatedAt,
    String period
) {
    public static DashboardStats empty(String period) {
        return new DashboardStats(
            TruckStatusStats.empty(),
            0,
            0,
            AlertStats.empty(),
            MileageStats.empty(),
            Instant.now(),
            period
        );
    }
}
