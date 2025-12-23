package com.trucktrack.common.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

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
 * - Access denied handler with WARN logging (T036)
 */
@Slf4j
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
     * Access denied handler that logs 403 responses.
     * Feature: 008-rbac-permissions, T036
     */
    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex) -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String user = auth != null ? auth.getName() : "anonymous";
            String role = auth != null && auth.getAuthorities() != null
                    ? auth.getAuthorities().toString()
                    : "none";

            log.warn("Access denied: user={}, role={}, uri={}, method={}",
                    user, role, request.getRequestURI(), request.getMethod());

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Access denied\",\"message\":\"You don't have permission to access this resource\"}");
        };
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
            .exceptionHandling(ex -> ex.accessDeniedHandler(accessDeniedHandler()))
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
