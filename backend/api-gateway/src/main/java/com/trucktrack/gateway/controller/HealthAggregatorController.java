package com.trucktrack.gateway.controller;

import com.trucktrack.gateway.dto.HealthAggregateDTO;
import com.trucktrack.gateway.dto.HealthAggregateDTO.OverallStatus;
import com.trucktrack.gateway.dto.HealthAggregateDTO.ServiceHealth;
import com.trucktrack.gateway.dto.HealthAggregateDTO.ServiceStatus;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.reactor.circuitbreaker.operator.CircuitBreakerOperator;
import io.github.resilience4j.reactor.retry.RetryOperator;
import io.github.resilience4j.reactor.timelimiter.TimeLimiterOperator;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
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
import java.util.Map;

/**
 * Controller that aggregates health status from all backend microservices.
 * Provides a single endpoint for the frontend to check overall system health.
 *
 * Uses Resilience4j for:
 * - Circuit Breaker: Prevents cascading failures when a service is down
 * - Retry: Automatically retries transient failures
 * - Time Limiter: Enforces timeout on service calls
 */
@RestController
@RequestMapping("/health")
public class HealthAggregatorController {

    private static final Logger log = LoggerFactory.getLogger(HealthAggregatorController.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final WebClient webClient;
    private final CircuitBreakerRegistry circuitBreakerRegistry;
    private final RetryRegistry retryRegistry;
    private final TimeLimiterRegistry timeLimiterRegistry;

    /**
     * Service configuration: name, display name, URL, criticality, and resilience4j instance name
     */
    private static final List<ServiceConfig> SERVICES = List.of(
            new ServiceConfig("auth-service", "Auth Service", "http://localhost:8083", true, "authService"),
            new ServiceConfig("location-service", "Location Service", "http://localhost:8081", true, "locationService"),
            new ServiceConfig("notification-service", "Notification Service", "http://localhost:8082", false, "notificationService"),
            new ServiceConfig("gps-service", "GPS Service", "http://localhost:8080", false, "gpsService")
    );

    public HealthAggregatorController(
            WebClient webClient,
            CircuitBreakerRegistry circuitBreakerRegistry,
            RetryRegistry retryRegistry,
            TimeLimiterRegistry timeLimiterRegistry) {
        this.webClient = webClient;
        this.circuitBreakerRegistry = circuitBreakerRegistry;
        this.retryRegistry = retryRegistry;
        this.timeLimiterRegistry = timeLimiterRegistry;
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
     * Check health of a single service with Resilience4j protection.
     *
     * Order of operators (inside-out execution):
     * 1. TimeLimiter - enforces timeout
     * 2. CircuitBreaker - prevents calls when open
     * 3. Retry - retries on transient failures
     */
    private Mono<ServiceHealth> checkServiceHealth(ServiceConfig config) {
        long startTime = System.currentTimeMillis();

        // Get Resilience4j instances for this service
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(config.resilience4jName());
        Retry retry = retryRegistry.retry(config.resilience4jName());
        TimeLimiter timeLimiter = timeLimiterRegistry.timeLimiter(config.resilience4jName());

        // Check if circuit breaker is open - return DOWN immediately without making the call
        if (circuitBreaker.getState() == CircuitBreaker.State.OPEN) {
            log.debug("Circuit breaker OPEN for service {}, skipping health check", config.name());
            return Mono.just(new ServiceHealth(
                    config.name(),
                    config.displayName(),
                    ServiceStatus.DOWN,
                    null,
                    "Circuit breaker open",
                    config.critical()
            ));
        }

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
                // Apply Resilience4j operators (executed in reverse order)
                .transformDeferred(TimeLimiterOperator.of(timeLimiter))
                .transformDeferred(CircuitBreakerOperator.of(circuitBreaker))
                .transformDeferred(RetryOperator.of(retry))
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
     *
     * @param name Service identifier
     * @param displayName Human-readable name for UI
     * @param baseUrl Base URL of the service
     * @param critical Whether the service is critical (affects overall status)
     * @param resilience4jName Name of Resilience4j instance to use
     */
    private record ServiceConfig(
            String name,
            String displayName,
            String baseUrl,
            boolean critical,
            String resilience4jName) {}
}
