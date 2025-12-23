package com.trucktrack.notification.client;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Client for calling location-service APIs via API Gateway.
 *
 * All inter-service calls go through the gateway for:
 * - Unified authentication (JWT)
 * - Centralized logging and monitoring
 * - Consistent security model
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LocationServiceClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${gateway.url:http://localhost:8000}")
    private String gatewayUrl;

    @Value("${gateway.service-token:}")
    private String serviceToken;

    @Value("${gateway.timeout:5000}")
    private int timeoutMillis;

    private WebClient webClient;

    @PostConstruct
    public void init() {
        if (serviceToken == null || serviceToken.isBlank()) {
            log.warn("SERVICE_ACCOUNT_JWT not configured - inter-service calls will fail authentication");
        } else {
            log.info("LocationServiceClient initialized with gateway: {}", gatewayUrl);
        }

        // Build WebClient with default Authorization header
        WebClient.Builder builder = webClientBuilder
                .baseUrl(gatewayUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json");

        if (serviceToken != null && !serviceToken.isBlank()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceToken);
        }

        this.webClient = builder.build();
    }

    /**
     * Check if a point is inside a specific geofence.
     *
     * @param geofenceId Geofence ID to check
     * @param latitude   GPS latitude
     * @param longitude  GPS longitude
     * @return true if point is inside the geofence
     */
    public boolean isPointInsideGeofence(UUID geofenceId, double latitude, double longitude) {
        try {
            Map<String, Object> result = webClient
                    .get()
                    .uri("/location/v1/geofences/{id}/check?lat={lat}&lon={lon}",
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
     * Get distance from a point to a geofence boundary.
     *
     * @param geofenceId Geofence ID
     * @param latitude   GPS latitude
     * @param longitude  GPS longitude
     * @return Distance in meters, or null if error
     */
    public Double getDistanceToGeofence(UUID geofenceId, double latitude, double longitude) {
        try {
            Map<String, Object> result = webClient
                    .get()
                    .uri("/location/v1/geofences/{id}/check?lat={lat}&lon={lon}",
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
