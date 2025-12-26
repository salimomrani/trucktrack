package com.trucktrack.location.config;

import com.trucktrack.common.cache.CacheConstants;
import com.trucktrack.location.cache.GracefulCacheErrorHandler;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis configuration for caching with custom TTL per cache name.
 */
@Configuration
public class RedisConfig implements CachingConfigurer {

    private final GracefulCacheErrorHandler gracefulCacheErrorHandler;

    public RedisConfig(GracefulCacheErrorHandler gracefulCacheErrorHandler) {
        this.gracefulCacheErrorHandler = gracefulCacheErrorHandler;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Default cache configuration with 5 minute TTL
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        // Custom TTL per cache name
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Trucks cache - 5 minutes TTL
        cacheConfigurations.put(CacheConstants.CACHE_TRUCKS,
                defaultConfig.entryTtl(CacheConstants.TTL_TRUCKS));
        cacheConfigurations.put(CacheConstants.CACHE_TRUCKS_BY_ID,
                defaultConfig.entryTtl(CacheConstants.TTL_TRUCKS));

        // Drivers cache - 5 minutes TTL
        cacheConfigurations.put(CacheConstants.CACHE_DRIVERS,
                defaultConfig.entryTtl(CacheConstants.TTL_DRIVERS));

        // Groups cache - 10 minutes TTL
        cacheConfigurations.put(CacheConstants.CACHE_GROUPS,
                defaultConfig.entryTtl(CacheConstants.TTL_GROUPS));

        // Stats cache - 1 minute TTL
        cacheConfigurations.put(CacheConstants.CACHE_STATS,
                defaultConfig.entryTtl(CacheConstants.TTL_STATS));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return gracefulCacheErrorHandler;
    }
}
