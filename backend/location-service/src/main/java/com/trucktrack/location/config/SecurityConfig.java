package com.trucktrack.location.config;

import com.trucktrack.common.security.GatewaySecurityConfig;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

/**
 * Security configuration for Location Service.
 * Extends shared GatewaySecurityConfig for common gateway authentication.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig extends GatewaySecurityConfig {
    // Uses default configuration from GatewaySecurityConfig:
    // - /admin/** requires ADMIN role
    // - /actuator/** is public
    // - All other endpoints permitted (auth via gateway)
}
