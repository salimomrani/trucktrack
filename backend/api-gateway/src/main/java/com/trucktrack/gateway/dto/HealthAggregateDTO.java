package com.trucktrack.gateway.dto;

import java.time.Instant;
import java.util.List;

/**
 * DTO for aggregated health status of all backend services.
 */
public class HealthAggregateDTO {

    /**
     * Overall status: UP, DEGRADED, or DOWN
     * - UP: All services are healthy
     * - DEGRADED: Some non-critical services are down
     * - DOWN: Critical services (auth, location) are down
     */
    private OverallStatus status;

    /**
     * Timestamp of the health check
     */
    private Instant timestamp;

    /**
     * Individual service statuses
     */
    private List<ServiceHealth> services;

    public HealthAggregateDTO() {
    }

    public HealthAggregateDTO(OverallStatus status, Instant timestamp, List<ServiceHealth> services) {
        this.status = status;
        this.timestamp = timestamp;
        this.services = services;
    }

    public OverallStatus getStatus() {
        return status;
    }

    public void setStatus(OverallStatus status) {
        this.status = status;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public List<ServiceHealth> getServices() {
        return services;
    }

    public void setServices(List<ServiceHealth> services) {
        this.services = services;
    }

    public enum OverallStatus {
        UP,
        DEGRADED,
        DOWN
    }

    public static class ServiceHealth {
        /**
         * Service name (e.g., "auth-service", "location-service")
         */
        private String name;

        /**
         * Service display name for UI
         */
        private String displayName;

        /**
         * Service status: UP or DOWN
         */
        private ServiceStatus status;

        /**
         * Response time in milliseconds (null if DOWN)
         */
        private Long responseTimeMs;

        /**
         * Error message if service is DOWN
         */
        private String error;

        /**
         * Whether this service is critical for the application
         */
        private boolean critical;

        public ServiceHealth() {
        }

        public ServiceHealth(String name, String displayName, ServiceStatus status,
                             Long responseTimeMs, String error, boolean critical) {
            this.name = name;
            this.displayName = displayName;
            this.status = status;
            this.responseTimeMs = responseTimeMs;
            this.error = error;
            this.critical = critical;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public ServiceStatus getStatus() {
            return status;
        }

        public void setStatus(ServiceStatus status) {
            this.status = status;
        }

        public Long getResponseTimeMs() {
            return responseTimeMs;
        }

        public void setResponseTimeMs(Long responseTimeMs) {
            this.responseTimeMs = responseTimeMs;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public boolean isCritical() {
            return critical;
        }

        public void setCritical(boolean critical) {
            this.critical = critical;
        }
    }

    public enum ServiceStatus {
        UP,
        DOWN
    }
}
