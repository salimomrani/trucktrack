package com.trucktrack.location.dto;

/**
 * T002: Fleet status breakdown DTO for donut chart.
 * Feature: 022-dashboard-real-data
 */
public record FleetStatusDTO(
    int total,
    int active,
    int idle,
    int offline,
    Double activePercent,
    Double idlePercent,
    Double offlinePercent
) {
    public static FleetStatusDTO empty() {
        return new FleetStatusDTO(0, 0, 0, 0, 0.0, 0.0, 0.0);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int total;
        private int active;
        private int idle;
        private int offline;

        public Builder total(int total) {
            this.total = total;
            return this;
        }

        public Builder active(int active) {
            this.active = active;
            return this;
        }

        public Builder idle(int idle) {
            this.idle = idle;
            return this;
        }

        public Builder offline(int offline) {
            this.offline = offline;
            return this;
        }

        public FleetStatusDTO build() {
            double activePercent = total > 0 ? (active * 100.0 / total) : 0.0;
            double idlePercent = total > 0 ? (idle * 100.0 / total) : 0.0;
            double offlinePercent = total > 0 ? (offline * 100.0 / total) : 0.0;

            return new FleetStatusDTO(
                total, active, idle, offline,
                activePercent, idlePercent, offlinePercent
            );
        }
    }
}
