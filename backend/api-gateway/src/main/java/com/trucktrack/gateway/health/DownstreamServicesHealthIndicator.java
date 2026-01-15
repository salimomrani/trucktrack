package com.trucktrack.gateway.health;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Health indicator that checks availability of downstream services.
 * Reports the status of each service the gateway routes to.
 */
@Slf4j
@Component
public class DownstreamServicesHealthIndicator implements HealthIndicator {

    private final WebClient webClient;
    private final String authServiceUrl;
    private final String locationServiceUrl;
    private final String notificationServiceUrl;

    public DownstreamServicesHealthIndicator(
            WebClient.Builder webClientBuilder,
            @Value("${services.auth-service.url:http://localhost:8081}") String authServiceUrl,
            @Value("${services.location-service.url:http://localhost:8082}") String locationServiceUrl,
            @Value("${services.notification-service.url:http://localhost:8085}") String notificationServiceUrl) {
        this.webClient = webClientBuilder.build();
        this.authServiceUrl = authServiceUrl;
        this.locationServiceUrl = locationServiceUrl;
        this.notificationServiceUrl = notificationServiceUrl;
    }

    @Override
    public Health health() {
        Map<String, Object> details = new HashMap<>();
        boolean allHealthy = true;

        // Check auth-service
        ServiceHealthResult authHealth = checkService("auth-service", authServiceUrl);
        details.put("auth-service", authHealth.toMap());
        if (!authHealth.healthy()) allHealthy = false;

        // Check location-service
        ServiceHealthResult locationHealth = checkService("location-service", locationServiceUrl);
        details.put("location-service", locationHealth.toMap());
        if (!locationHealth.healthy()) allHealthy = false;

        // Check notification-service
        ServiceHealthResult notificationHealth = checkService("notification-service", notificationServiceUrl);
        details.put("notification-service", notificationHealth.toMap());
        if (!notificationHealth.healthy()) allHealthy = false;

        Health.Builder builder = allHealthy ? Health.up() : Health.down();
        details.forEach(builder::withDetail);
        return builder.build();
    }

    private ServiceHealthResult checkService(String serviceName, String baseUrl) {
        try {
            long start = System.currentTimeMillis();
            String response = webClient.get()
                    .uri(baseUrl + "/actuator/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            long duration = System.currentTimeMillis() - start;

            if (response != null && response.contains("\"status\":\"UP\"")) {
                return new ServiceHealthResult(true, "UP", duration, null);
            } else {
                return new ServiceHealthResult(false, "DOWN", duration, "Service not healthy");
            }
        } catch (Exception e) {
            log.warn("Health check failed for {}: {}", serviceName, e.getMessage());
            return new ServiceHealthResult(false, "DOWN", 0, e.getMessage());
        }
    }

    private record ServiceHealthResult(boolean healthy, String status, long responseTime, String error) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("status", status);
            map.put("responseTime", responseTime + "ms");
            if (error != null) {
                map.put("error", error);
            }
            return map;
        }
    }
}
