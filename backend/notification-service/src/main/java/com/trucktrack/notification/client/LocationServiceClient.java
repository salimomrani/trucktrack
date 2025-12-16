package com.trucktrack.notification.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Client for calling location-service APIs
 * T150: Implement geofence evaluation in AlertRuleEngine
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LocationServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.location.url:http://localhost:8081}")
    private String locationServiceUrl;

    @Value("${services.location.timeout:5000}")
    private int timeoutMillis;

    /**
     * Check if a point is inside a specific geofence
     *
     * @param geofenceId Geofence ID to check
     * @param latitude   GPS latitude
     * @param longitude  GPS longitude
     * @return true if point is inside the geofence
     */
    public boolean isPointInsideGeofence(UUID geofenceId, double latitude, double longitude) {
        try {
            Map<String, Object> result = webClientBuilder.build()
                    .get()
                    .uri(locationServiceUrl + "/location/v1/geofences/{id}/check?lat={lat}&lon={lon}",
                            geofenceId, latitude, longitude)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofMillis(timeoutMillis))
                    .onErrorResume(e -> {
                        log.error("Error checking geofence {}: {}", geofenceId, e.getMessage());
                        return Mono.empty();
                    })
                    .block();

            if (result != null && result.containsKey("inside")) {
                return Boolean.TRUE.equals(result.get("inside"));
            }
            return false;
        } catch (Exception e) {
            log.error("Failed to check geofence {}: {}", geofenceId, e.getMessage());
            return false;
        }
    }

    /**
     * Get distance from a point to a geofence boundary
     *
     * @param geofenceId Geofence ID
     * @param latitude   GPS latitude
     * @param longitude  GPS longitude
     * @return Distance in meters, or null if error
     */
    public Double getDistanceToGeofence(UUID geofenceId, double latitude, double longitude) {
        try {
            Map<String, Object> result = webClientBuilder.build()
                    .get()
                    .uri(locationServiceUrl + "/location/v1/geofences/{id}/check?lat={lat}&lon={lon}",
                            geofenceId, latitude, longitude)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofMillis(timeoutMillis))
                    .onErrorResume(e -> {
                        log.error("Error getting distance to geofence {}: {}", geofenceId, e.getMessage());
                        return Mono.empty();
                    })
                    .block();

            if (result != null && result.containsKey("distanceMeters")) {
                Object distance = result.get("distanceMeters");
                if (distance instanceof Number) {
                    return ((Number) distance).doubleValue();
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to get distance to geofence {}: {}", geofenceId, e.getMessage());
            return null;
        }
    }
}
