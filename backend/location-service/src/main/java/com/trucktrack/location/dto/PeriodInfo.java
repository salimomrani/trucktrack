package com.trucktrack.location.dto;

import java.time.LocalDate;

/**
 * Embedded DTO for period information in analytics responses.
 * Feature: 006-fleet-analytics
 */
public record PeriodInfo(
    PeriodType type,
    LocalDate startDate,
    LocalDate endDate,
    int daysCount
) {
    public enum PeriodType {
        TODAY, WEEK, MONTH, CUSTOM
    }

    public static PeriodInfo today() {
        LocalDate today = LocalDate.now();
        return new PeriodInfo(PeriodType.TODAY, today, today, 1);
    }

    public static PeriodInfo week() {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);
        return new PeriodInfo(PeriodType.WEEK, weekAgo, today, 7);
    }

    public static PeriodInfo month() {
        LocalDate today = LocalDate.now();
        LocalDate monthAgo = today.minusDays(29);
        return new PeriodInfo(PeriodType.MONTH, monthAgo, today, 30);
    }

    public static PeriodInfo custom(LocalDate startDate, LocalDate endDate) {
        int days = (int) (endDate.toEpochDay() - startDate.toEpochDay()) + 1;
        return new PeriodInfo(PeriodType.CUSTOM, startDate, endDate, days);
    }
}
