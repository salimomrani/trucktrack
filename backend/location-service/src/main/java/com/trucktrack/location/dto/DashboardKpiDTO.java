package com.trucktrack.location.dto;

/**
 * T001: Dashboard KPI metrics DTO.
 * Feature: 022-dashboard-real-data
 */
public record DashboardKpiDTO(
    int totalTrucks,
    int activeTrucks,
    int tripsToday,
    int alertsUnread,
    Double totalTrucksTrend,
    Double activeTrucksTrend,
    Double tripsTodayTrend,
    Double alertsTrend
) {
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private int totalTrucks;
        private int activeTrucks;
        private int tripsToday;
        private int alertsUnread;
        private Double totalTrucksTrend;
        private Double activeTrucksTrend;
        private Double tripsTodayTrend;
        private Double alertsTrend;

        public Builder totalTrucks(int totalTrucks) {
            this.totalTrucks = totalTrucks;
            return this;
        }

        public Builder activeTrucks(int activeTrucks) {
            this.activeTrucks = activeTrucks;
            return this;
        }

        public Builder tripsToday(int tripsToday) {
            this.tripsToday = tripsToday;
            return this;
        }

        public Builder alertsUnread(int alertsUnread) {
            this.alertsUnread = alertsUnread;
            return this;
        }

        public Builder totalTrucksTrend(Double totalTrucksTrend) {
            this.totalTrucksTrend = totalTrucksTrend;
            return this;
        }

        public Builder activeTrucksTrend(Double activeTrucksTrend) {
            this.activeTrucksTrend = activeTrucksTrend;
            return this;
        }

        public Builder tripsTodayTrend(Double tripsTodayTrend) {
            this.tripsTodayTrend = tripsTodayTrend;
            return this;
        }

        public Builder alertsTrend(Double alertsTrend) {
            this.alertsTrend = alertsTrend;
            return this;
        }

        public DashboardKpiDTO build() {
            return new DashboardKpiDTO(
                totalTrucks, activeTrucks, tripsToday, alertsUnread,
                totalTrucksTrend, activeTrucksTrend, tripsTodayTrend, alertsTrend
            );
        }
    }
}
