package com.trucktrack.location.dto;

/**
 * T076: Truck status statistics DTO
 * Feature: 002-admin-panel (US3 - Dashboard)
 */
public record TruckStatusStats(
    long active,
    long idle,
    long offline,
    long outOfService,
    long total
) {
    public static TruckStatusStats empty() {
        return new TruckStatusStats(0, 0, 0, 0, 0);
    }
}
