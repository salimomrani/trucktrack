package com.trucktrack.auth.config;

import com.trucktrack.common.security.GatewaySecurityConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Security configuration for Auth Service.
 * Extends shared GatewaySecurityConfig with auth-specific rules.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig extends GatewaySecurityConfig {

    /**
     * Password encoder using BCrypt
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Custom authorization rules for auth-service:
     * - /auth/** is public (login, register, refresh)
     * - /admin/users/** requires ADMIN role
     * - /actuator/** is public
     */
    @Override
    protected void configureAuthorization(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            // Auth endpoints are public (login, register, refresh token)
            .requestMatchers("/auth/**").permitAll()
            // Admin user management requires ADMIN role
            .requestMatchers("/admin/**").hasRole("ADMIN")
            // Health/metrics endpoints
            .requestMatchers("/actuator/**").permitAll()
            // Everything else permitted (gateway handles auth)
            .anyRequest().permitAll()
        );
    }
}
