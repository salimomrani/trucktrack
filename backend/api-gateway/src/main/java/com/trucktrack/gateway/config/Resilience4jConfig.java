package com.trucktrack.gateway.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Resilience4j configuration for API Gateway.
 * Provides circuit breaker, retry, and time limiter for inter-service communication.
 */
@Configuration
public class Resilience4jConfig {

    private static final Logger log = LoggerFactory.getLogger(Resilience4jConfig.class);

    /**
     * WebClient bean for making HTTP requests to backend services.
     */
    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder.build();
    }

    /**
     * Log circuit breaker state changes for monitoring.
     */
    @Bean
    public CircuitBreakerRegistry circuitBreakerEventLogger(CircuitBreakerRegistry registry) {
        registry.getAllCircuitBreakers().forEach(this::registerCircuitBreakerEvents);
        registry.getEventPublisher()
                .onEntryAdded(event -> registerCircuitBreakerEvents(event.getAddedEntry()));
        return registry;
    }

    private void registerCircuitBreakerEvents(CircuitBreaker circuitBreaker) {
        circuitBreaker.getEventPublisher()
                .onStateTransition(event ->
                    log.warn("CircuitBreaker '{}' state changed from {} to {}",
                            event.getCircuitBreakerName(),
                            event.getStateTransition().getFromState(),
                            event.getStateTransition().getToState()))
                .onFailureRateExceeded(event ->
                    log.error("CircuitBreaker '{}' failure rate exceeded: {}%",
                            event.getCircuitBreakerName(),
                            event.getFailureRate()))
                .onSlowCallRateExceeded(event ->
                    log.warn("CircuitBreaker '{}' slow call rate exceeded: {}%",
                            event.getCircuitBreakerName(),
                            event.getSlowCallRate()));
    }

    /**
     * Log retry events for debugging.
     */
    @Bean
    public RetryRegistry retryEventLogger(RetryRegistry registry) {
        registry.getAllRetries().forEach(this::registerRetryEvents);
        registry.getEventPublisher()
                .onEntryAdded(event -> registerRetryEvents(event.getAddedEntry()));
        return registry;
    }

    private void registerRetryEvents(Retry retry) {
        retry.getEventPublisher()
                .onRetry(event ->
                    log.debug("Retry '{}' attempt #{} for {}",
                            event.getName(),
                            event.getNumberOfRetryAttempts(),
                            event.getLastThrowable() != null ?
                                event.getLastThrowable().getMessage() : "unknown error"))
                .onError(event ->
                    log.error("Retry '{}' exhausted after {} attempts",
                            event.getName(),
                            event.getNumberOfRetryAttempts()));
    }

    /**
     * Log time limiter events.
     */
    @Bean
    public TimeLimiterRegistry timeLimiterEventLogger(TimeLimiterRegistry registry) {
        registry.getAllTimeLimiters().forEach(this::registerTimeLimiterEvents);
        registry.getEventPublisher()
                .onEntryAdded(event -> registerTimeLimiterEvents(event.getAddedEntry()));
        return registry;
    }

    private void registerTimeLimiterEvents(TimeLimiter timeLimiter) {
        timeLimiter.getEventPublisher()
                .onTimeout(event ->
                    log.warn("TimeLimiter '{}' timed out", event.getTimeLimiterName()))
                .onError(event ->
                    log.error("TimeLimiter '{}' error: {}",
                            event.getTimeLimiterName(),
                            event.getThrowable().getMessage()));
    }
}
