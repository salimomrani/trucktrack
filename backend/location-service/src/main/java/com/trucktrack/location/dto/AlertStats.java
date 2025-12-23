package com.trucktrack.location.dto;

import java.util.Map;

/**
 * T078: Alert statistics DTO
 * Feature: 002-admin-panel (US3 - Dashboard)
 */
public record AlertStats(
    long total,
    long unread,
    Map<String, Long> byType,
    Map<String, Long> bySeverity
) {
    public static AlertStats empty() {
        return new AlertStats(0, 0, Map.of(), Map.of());
    }
}
