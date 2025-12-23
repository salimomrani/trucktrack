package com.trucktrack.notification.config;

import com.trucktrack.common.security.GatewaySecurityConfig;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

/**
 * Security configuration for Notification Service.
 * Extends shared GatewaySecurityConfig for gateway authentication.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig extends GatewaySecurityConfig {

    @Override
    protected void configureAuthorization(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            // Notification endpoints require authentication (checked by gateway)
            .requestMatchers("/notification/**").permitAll()
            // WebSocket endpoint
            .requestMatchers("/ws/**").permitAll()
            // Health/metrics endpoints
            .requestMatchers("/actuator/**").permitAll()
            // Everything else permitted
            .anyRequest().permitAll()
        );
    }
}
