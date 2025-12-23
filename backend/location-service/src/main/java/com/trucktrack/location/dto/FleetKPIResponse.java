package com.trucktrack.location.dto;

/**
 * Response DTO for aggregated fleet KPIs.
 * Feature: 006-fleet-analytics
 */
public record FleetKPIResponse(
    PeriodInfo period,
    EntityInfo entity,
    double totalDistanceKm,
    long drivingTimeMinutes,
    long idleTimeMinutes,
    double avgSpeedKmh,
    double maxSpeedKmh,
    int alertCount,
    int geofenceEntries,
    int geofenceExits
) {
    /**
     * Builder for constructing FleetKPIResponse.
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private PeriodInfo period;
        private EntityInfo entity;
        private double totalDistanceKm;
        private long drivingTimeMinutes;
        private long idleTimeMinutes;
        private double avgSpeedKmh;
        private double maxSpeedKmh;
        private int alertCount;
        private int geofenceEntries;
        private int geofenceExits;

        public Builder period(PeriodInfo period) {
            this.period = period;
            return this;
        }

        public Builder entity(EntityInfo entity) {
            this.entity = entity;
            return this;
        }

        public Builder totalDistanceKm(double totalDistanceKm) {
            this.totalDistanceKm = totalDistanceKm;
            return this;
        }

        public Builder drivingTimeMinutes(long drivingTimeMinutes) {
            this.drivingTimeMinutes = drivingTimeMinutes;
            return this;
        }

        public Builder idleTimeMinutes(long idleTimeMinutes) {
            this.idleTimeMinutes = idleTimeMinutes;
            return this;
        }

        public Builder avgSpeedKmh(double avgSpeedKmh) {
            this.avgSpeedKmh = avgSpeedKmh;
            return this;
        }

        public Builder maxSpeedKmh(double maxSpeedKmh) {
            this.maxSpeedKmh = maxSpeedKmh;
            return this;
        }

        public Builder alertCount(int alertCount) {
            this.alertCount = alertCount;
            return this;
        }

        public Builder geofenceEntries(int geofenceEntries) {
            this.geofenceEntries = geofenceEntries;
            return this;
        }

        public Builder geofenceExits(int geofenceExits) {
            this.geofenceExits = geofenceExits;
            return this;
        }

        public FleetKPIResponse build() {
            return new FleetKPIResponse(
                period, entity, totalDistanceKm, drivingTimeMinutes, idleTimeMinutes,
                avgSpeedKmh, maxSpeedKmh, alertCount, geofenceEntries, geofenceExits
            );
        }
    }
}
