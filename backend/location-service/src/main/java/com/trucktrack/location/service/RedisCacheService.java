package com.trucktrack.location.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.trucktrack.common.event.GPSPositionEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Service for caching truck positions in Redis
 * T068: Implement RedisCacheService to cache current truck positions with TTL=5min
 * Refactored with Lombok best practices
 */
@Slf4j
@Service
public class RedisCacheService {

    private static final String CURRENT_POSITION_PREFIX = "truck:position:";
    private static final Duration TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisCacheService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Cache current position for a truck
     * Key format: truck:position:{truckId}
     * TTL: 5 minutes
     */
    public void cacheCurrentPosition(UUID truckId, GPSPositionEvent position) {
        try {
            String key = CURRENT_POSITION_PREFIX + truckId;
            String value = objectMapper.writeValueAsString(position);

            redisTemplate.opsForValue().set(key, value, TTL);
            log.debug("Cached position for truck {} with TTL {}min", truckId, TTL.toMinutes());

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize GPS position for caching: {}", e.getMessage());
            // Don't throw - caching failure shouldn't break the flow
        }
    }

    /**
     * Get current position from cache
     * Returns null if not found or expired
     */
    public GPSPositionEvent getCurrentPosition(UUID truckId) {
        try {
            String key = CURRENT_POSITION_PREFIX + truckId;
            String value = redisTemplate.opsForValue().get(key);

            if (value == null) {
                log.debug("Cache miss for truck: {}", truckId);
                return null;
            }

            log.debug("Cache hit for truck: {}", truckId);
            return objectMapper.readValue(value, GPSPositionEvent.class);

        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize GPS position from cache: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Invalidate cache for a truck
     */
    public void invalidatePosition(UUID truckId) {
        String key = CURRENT_POSITION_PREFIX + truckId;
        redisTemplate.delete(key);
        log.debug("Invalidated cache for truck: {}", truckId);
    }

    /**
     * Check if truck position is cached
     */
    public boolean isCached(UUID truckId) {
        String key = CURRENT_POSITION_PREFIX + truckId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}
