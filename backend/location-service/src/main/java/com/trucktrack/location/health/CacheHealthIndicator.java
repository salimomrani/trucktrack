package com.trucktrack.location.health;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Custom health indicator that checks Redis cache connectivity.
 * Tests both connection and basic operations.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CacheHealthIndicator implements HealthIndicator {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public Health health() {
        try {
            long start = System.currentTimeMillis();

            // Test connection with PING
            RedisConnectionFactory factory = redisTemplate.getConnectionFactory();
            if (factory == null) {
                return Health.down()
                        .withDetail("error", "Redis connection factory is null")
                        .build();
            }

            String pong = factory.getConnection().ping();
            long duration = System.currentTimeMillis() - start;

            if ("PONG".equals(pong)) {
                return Health.up()
                        .withDetail("cache", "Redis")
                        .withDetail("ping", "PONG")
                        .withDetail("responseTime", duration + "ms")
                        .build();
            } else {
                return Health.down()
                        .withDetail("error", "Unexpected PING response: " + pong)
                        .build();
            }
        } catch (Exception e) {
            log.warn("Redis health check failed - cache may be unavailable", e);
            // Return degraded instead of down since cache is optional
            return Health.status("DEGRADED")
                    .withDetail("cache", "Redis")
                    .withDetail("error", e.getMessage())
                    .withDetail("impact", "Cache disabled, using database directly")
                    .build();
        }
    }
}
