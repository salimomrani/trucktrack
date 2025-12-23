package com.trucktrack.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Base security configuration for services behind the API Gateway.
 *
 * Services should extend this or use it as a reference for their own config.
 *
 * Features:
 * - CSRF disabled (stateless API)
 * - CORS disabled (handled by gateway)
 * - Stateless session management
 * - Gateway authentication filter
 * - Method security enabled (@PreAuthorize)
 */
@EnableMethodSecurity
public abstract class GatewaySecurityConfig {

    /**
     * Creates the gateway authentication filter.
     * Override this method to customize filter behavior.
     */
    @Bean
    public GatewayAuthenticationFilter gatewayAuthenticationFilter() {
        return new GatewayAuthenticationFilter();
    }

    /**
     * Creates the security filter chain.
     * Override configureAuthorization() to customize endpoint security.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(gatewayAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        configureAuthorization(http);

        return http.build();
    }

    /**
     * Override to configure endpoint authorization rules.
     * Default: /admin/** requires ADMIN role, everything else permitted.
     */
    protected void configureAuthorization(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .requestMatchers("/actuator/**").permitAll()
            .anyRequest().permitAll()
        );
    }
}
