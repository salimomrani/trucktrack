package com.trucktrack.gateway.controller;

import com.trucktrack.gateway.dto.HealthAggregateDTO;
import com.trucktrack.gateway.dto.HealthAggregateDTO.OverallStatus;
import com.trucktrack.gateway.dto.HealthAggregateDTO.ServiceHealth;
import com.trucktrack.gateway.dto.HealthAggregateDTO.ServiceStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Controller that aggregates health status from all backend microservices.
 * Provides a single endpoint for the frontend to check overall system health.
 */
@RestController
@RequestMapping("/health")
public class HealthAggregatorController {

    private static final Logger log = LoggerFactory.getLogger(HealthAggregatorController.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final WebClient webClient;

    /**
     * Service configuration: name, display name, URL, and criticality
     */
    private static final List<ServiceConfig> SERVICES = List.of(
            new ServiceConfig("auth-service", "Auth Service", "http://localhost:8083", true),
            new ServiceConfig("location-service", "Location Service", "http://localhost:8081", true),
            new ServiceConfig("notification-service", "Notification Service", "http://localhost:8082", false),
            new ServiceConfig("gps-service", "GPS Service", "http://localhost:8080", false)
    );

    public HealthAggregatorController(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Get aggregated health status of all services.
     *
     * @return HealthAggregateDTO with overall status and individual service statuses
     */
    @GetMapping(value = "/aggregate", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<HealthAggregateDTO> getAggregatedHealth() {
        log.debug("Checking health of all services");

        return Flux.fromIterable(SERVICES)
                .flatMap(service ->
                        checkServiceHealth(service)
                                .onErrorResume(e -> {
                                    log.error("Error checking health for {}", service, e);
                                    return Mono.just(new ServiceHealth(
                                            service.name(),
                                            service.displayName(),
                                            ServiceStatus.DOWN,
                                            null,
                                            getErrorMessage(e),
                                            service.critical()
                                    ));
                                })
                )
                .collectList()
                .map(this::buildAggregateResponse);
    }

    /**
     * Check health of a single service.
     */
    private Mono<ServiceHealth> checkServiceHealth(ServiceConfig config) {
        long startTime = System.currentTimeMillis();

        return webClient.get()
                .uri(config.baseUrl() + "/actuator/health")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(TIMEOUT)
                .map(response -> {
                    long responseTime = System.currentTimeMillis() - startTime;
                    log.debug("Service {} is UP, response time: {}ms", config.name(), responseTime);
                    return new ServiceHealth(
                            config.name(),
                            config.displayName(),
                            ServiceStatus.UP,
                            responseTime,
                            null,
                            config.critical()
                    );
                })
                .onErrorResume(error -> {
                    log.warn("Service {} is DOWN: {}", config.name(), error.getMessage());
                    return Mono.just(new ServiceHealth(
                            config.name(),
                            config.displayName(),
                            ServiceStatus.DOWN,
                            null,
                            getErrorMessage(error),
                            config.critical()
                    ));
                });
    }

    /**
     * Build the aggregate response from individual service health checks.
     */
    private HealthAggregateDTO buildAggregateResponse(List<ServiceHealth> services) {
        // Determine overall status
        boolean anyCriticalDown = services.stream()
                .anyMatch(s -> s.isCritical() && s.getStatus() == ServiceStatus.DOWN);

        boolean anyDown = services.stream()
                .anyMatch(s -> s.getStatus() == ServiceStatus.DOWN);

        OverallStatus overallStatus;
        if (anyCriticalDown) {
            overallStatus = OverallStatus.DOWN;
        } else if (anyDown) {
            overallStatus = OverallStatus.DEGRADED;
        } else {
            overallStatus = OverallStatus.UP;
        }

        return new HealthAggregateDTO(overallStatus, Instant.now(), services);
    }

    /**
     * Extract a user-friendly error message from an exception.
     */
    private String getErrorMessage(Throwable error) {
        if (error.getMessage() != null && error.getMessage().contains("Connection refused")) {
            return "Connection refused";
        }
        if (error instanceof java.util.concurrent.TimeoutException) {
            return "Timeout";
        }
        return error.getMessage() != null ? error.getMessage() : "Unknown error";
    }

    /**
     * Service configuration record.
     */
    private record ServiceConfig(String name, String displayName, String baseUrl, boolean critical) {}
}
