package com.trucktrack.location.controller;

import com.trucktrack.common.security.GatewayAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

/**
 * Test security configuration for controller integration tests.
 * Configures GatewayAuthenticationFilter to read user info from headers.
 */
@TestConfiguration
@EnableMethodSecurity
public class TestSecurityConfig {

    @Bean
    public GatewayAuthenticationFilter gatewayAuthenticationFilter() {
        return new GatewayAuthenticationFilter();
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Access denied\"}");
        };
    }

    @Bean
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.accessDeniedHandler(accessDeniedHandler()))
            .addFilterBefore(gatewayAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/admin/**").authenticated()
                .anyRequest().permitAll()
            );

        return http.build();
    }

    /**
     * Test exception handler for validation and access denied errors.
     */
    @ControllerAdvice
    public static class TestExceptionHandler {

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Validation failed"));
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Access denied"));
        }
    }
}
