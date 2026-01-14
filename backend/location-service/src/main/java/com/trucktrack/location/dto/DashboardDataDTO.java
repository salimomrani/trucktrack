package com.trucktrack.location.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * T005: Aggregated dashboard data DTO combining all sections.
 * Feature: 022-dashboard-real-data
 */
public record DashboardDataDTO(
    DashboardKpiDTO kpis,
    FleetStatusDTO fleetStatus,
    List<ActivityEventDTO> recentActivity,
    PerformanceMetricsDTO performance,
    Instant generatedAt,
    UUID userId
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private DashboardKpiDTO kpis;
        private FleetStatusDTO fleetStatus;
        private List<ActivityEventDTO> recentActivity;
        private PerformanceMetricsDTO performance;
        private Instant generatedAt;
        private UUID userId;

        public Builder kpis(DashboardKpiDTO kpis) {
            this.kpis = kpis;
            return this;
        }

        public Builder fleetStatus(FleetStatusDTO fleetStatus) {
            this.fleetStatus = fleetStatus;
            return this;
        }

        public Builder recentActivity(List<ActivityEventDTO> recentActivity) {
            this.recentActivity = recentActivity;
            return this;
        }

        public Builder performance(PerformanceMetricsDTO performance) {
            this.performance = performance;
            return this;
        }

        public Builder generatedAt(Instant generatedAt) {
            this.generatedAt = generatedAt;
            return this;
        }

        public Builder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public DashboardDataDTO build() {
            return new DashboardDataDTO(
                kpis, fleetStatus, recentActivity, performance, generatedAt, userId
            );
        }
    }
}
