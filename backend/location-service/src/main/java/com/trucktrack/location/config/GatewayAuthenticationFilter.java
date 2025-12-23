package com.trucktrack.location.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter that reads user information from headers passed by API Gateway.
 * Populates SecurityContext to enable @PreAuthorize annotations.
 * Feature: 002-admin-panel
 */
@Component
public class GatewayAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USERNAME = "X-Username";
    private static final String HEADER_USER_ROLE = "X-User-Role";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader(HEADER_USER_ID);
        String username = request.getHeader(HEADER_USERNAME);
        String role = request.getHeader(HEADER_USER_ROLE);

        if (username != null && role != null) {
            // Create authorities from role (add ROLE_ prefix for Spring Security)
            List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + role)
            );

            // Create authentication token with user details
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    new GatewayUserPrincipal(userId, username, role),
                    null,
                    authorities
                );

            // Set authentication in SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Simple principal to hold user info from gateway headers.
     */
    public record GatewayUserPrincipal(String userId, String username, String role) {
        @Override
        public String toString() {
            return username;
        }
    }
}
