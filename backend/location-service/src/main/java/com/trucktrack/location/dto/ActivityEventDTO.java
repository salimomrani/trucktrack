package com.trucktrack.location.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * T003: Activity event DTO for recent activity feed.
 * Feature: 022-dashboard-real-data
 */
public record ActivityEventDTO(
    UUID id,
    ActivityType type,
    String title,
    String truckId,
    Instant timestamp,
    Map<String, Object> metadata
) {
    public enum ActivityType {
        TRIP_STARTED,
        TRIP_COMPLETED,
        DELIVERY_CONFIRMED,
        ALERT_TRIGGERED,
        MAINTENANCE_SCHEDULED
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private ActivityType type;
        private String title;
        private String truckId;
        private Instant timestamp;
        private Map<String, Object> metadata;

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder type(ActivityType type) {
            this.type = type;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder truckId(String truckId) {
            this.truckId = truckId;
            return this;
        }

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public ActivityEventDTO build() {
            return new ActivityEventDTO(id, type, title, truckId, timestamp, metadata);
        }
    }
}
