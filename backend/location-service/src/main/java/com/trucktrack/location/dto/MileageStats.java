package com.trucktrack.location.dto;

import java.util.List;

/**
 * T077: Fleet mileage statistics DTO
 * Feature: 002-admin-panel (US3 - Dashboard)
 */
public record MileageStats(
    double totalKilometers,
    double averagePerTruck,
    List<TruckMileage> topTrucks
) {
    public record TruckMileage(
        String truckId,
        String licensePlate,
        double kilometers
    ) {}

    public static MileageStats empty() {
        return new MileageStats(0.0, 0.0, List.of());
    }
}
