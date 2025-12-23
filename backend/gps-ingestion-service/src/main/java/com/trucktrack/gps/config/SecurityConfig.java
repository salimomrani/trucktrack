package com.trucktrack.gps.config;

import com.trucktrack.common.security.GatewaySecurityConfig;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

/**
 * Security configuration for GPS Ingestion Service.
 * Uses shared GatewaySecurityConfig for gateway authentication.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig extends GatewaySecurityConfig {

    @Override
    protected void configureAuthorization(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            // GPS endpoints require authentication (checked by gateway)
            .requestMatchers("/gps/**").permitAll()
            // Health/metrics endpoints
            .requestMatchers("/actuator/**").permitAll()
            // Everything else permitted
            .anyRequest().permitAll()
        );
    }
}
