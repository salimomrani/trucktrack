package com.trucktrack.location.dto;

import java.time.LocalDate;

/**
 * T004: Performance metrics DTO for dashboard overview.
 * Feature: 022-dashboard-real-data
 */
public record PerformanceMetricsDTO(
    double tripCompletionRate,
    double onTimeDelivery,
    double fleetUtilization,
    Double driverSatisfaction,
    LocalDate periodStart,
    LocalDate periodEnd,
    String periodLabel
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private double tripCompletionRate;
        private double onTimeDelivery;
        private double fleetUtilization;
        private Double driverSatisfaction;
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private String periodLabel;

        public Builder tripCompletionRate(double tripCompletionRate) {
            this.tripCompletionRate = tripCompletionRate;
            return this;
        }

        public Builder onTimeDelivery(double onTimeDelivery) {
            this.onTimeDelivery = onTimeDelivery;
            return this;
        }

        public Builder fleetUtilization(double fleetUtilization) {
            this.fleetUtilization = fleetUtilization;
            return this;
        }

        public Builder driverSatisfaction(Double driverSatisfaction) {
            this.driverSatisfaction = driverSatisfaction;
            return this;
        }

        public Builder periodStart(LocalDate periodStart) {
            this.periodStart = periodStart;
            return this;
        }

        public Builder periodEnd(LocalDate periodEnd) {
            this.periodEnd = periodEnd;
            return this;
        }

        public Builder periodLabel(String periodLabel) {
            this.periodLabel = periodLabel;
            return this;
        }

        public PerformanceMetricsDTO build() {
            return new PerformanceMetricsDTO(
                tripCompletionRate, onTimeDelivery, fleetUtilization,
                driverSatisfaction, periodStart, periodEnd, periodLabel
            );
        }
    }
}
