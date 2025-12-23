package com.trucktrack.location.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security Configuration for Location Service.
 * Reads user info from headers passed by API Gateway.
 * Feature: 002-admin-panel
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Enables @PreAuthorize annotations
public class SecurityConfig {

    private final GatewayAuthenticationFilter gatewayAuthenticationFilter;

    public SecurityConfig(GatewayAuthenticationFilter gatewayAuthenticationFilter) {
        this.gatewayAuthenticationFilter = gatewayAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            // CORS is handled by API Gateway
            .cors(cors -> cors.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Add our filter before the standard authentication filter
            .addFilterBefore(gatewayAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // Admin endpoints require ADMIN role (also checked via @PreAuthorize)
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // Health and metrics endpoints are public
                .requestMatchers("/actuator/**").permitAll()
                // All other endpoints are accessible (auth checked by gateway)
                .anyRequest().permitAll()
            );

        return http.build();
    }
}
