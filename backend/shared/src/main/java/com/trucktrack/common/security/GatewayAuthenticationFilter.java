package com.trucktrack.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter that reads user information from headers passed by API Gateway.
 * Populates SecurityContext to enable @PreAuthorize annotations.
 *
 * Headers read:
 * - X-User-Id: User's unique identifier
 * - X-Username: User's username/email
 * - X-User-Role: User's role (e.g., ADMIN, DRIVER, FLEET_MANAGER)
 * - X-User-Groups: Comma-separated list of group UUIDs (for FLEET_MANAGER filtering)
 *
 * Usage: Register as a Spring bean in your service's configuration.
 */
public class GatewayAuthenticationFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USERNAME = "X-Username";
    public static final String HEADER_USER_ROLE = "X-User-Role";
    public static final String HEADER_USER_GROUPS = "X-User-Groups";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader(HEADER_USER_ID);
        String username = request.getHeader(HEADER_USERNAME);
        String role = request.getHeader(HEADER_USER_ROLE);
        String groups = request.getHeader(HEADER_USER_GROUPS);

        if (username != null && role != null) {
            // Create authorities from role (add ROLE_ prefix for Spring Security)
            List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + role)
            );

            // Create authentication token with user details (including groups)
            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    new GatewayUserPrincipal(userId, username, role, groups),
                    null,
                    authorities
                );

            // Set authentication in SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
