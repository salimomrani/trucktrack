package com.trucktrack.location.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

/**
 * Application configuration for location-service.
 * Feature: 010-trip-management (US3: Push Notifications)
 */
@Configuration
@EnableAsync
public class AppConfig {

    /**
     * RestTemplate bean for making HTTP calls to external services.
     * Used by PushNotificationService to call Expo Push API.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    /**
     * ObjectMapper bean with Java 8 time module support.
     */
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }
}
