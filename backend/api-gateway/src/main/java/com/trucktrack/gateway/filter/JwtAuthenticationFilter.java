package com.trucktrack.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.List;

/**
 * JWT Authentication Filter for API Gateway.
 * P0 Fix: Validates JWT secret on startup to fail fast if misconfigured.
 */
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private static final int MIN_SECRET_LENGTH = 64; // 512 bits for HS512
    private static final List<String> INSECURE_SECRETS = List.of(
            "changeme",
            "secret",
            "password",
            "default",
            "test"
    );

    @Value("${jwt.secret:}")
    private String secret;

    private SecretKey signingKey;

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    /**
     * Validates JWT configuration on startup.
     * Fails fast if secret is missing, too short, or obviously insecure.
     */
    @PostConstruct
    public void init() {
        log.info("Initializing JWT Gateway Filter...");

        // Check if secret is set
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is not set! " +
                    "Generate a secure 64-byte secret with: openssl rand -base64 64"
            );
        }

        // Check for obviously insecure secrets
        String lowerSecret = secret.toLowerCase();
        for (String insecure : INSECURE_SECRETS) {
            if (lowerSecret.contains(insecure)) {
                throw new IllegalStateException(
                        "JWT_SECRET contains insecure pattern '" + insecure + "'. " +
                        "Use a cryptographically random secret in production!"
                );
            }
        }

        // Decode secret (support both Base64 and raw)
        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secret);
            log.debug("JWT secret decoded from Base64 ({} bytes)", keyBytes.length);
        } catch (IllegalArgumentException e) {
            // Not Base64, use raw bytes
            keyBytes = secret.getBytes();
            log.debug("JWT secret used as raw bytes ({} bytes)", keyBytes.length);
        }

        // Validate minimum length for HS512
        if (keyBytes.length < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    String.format(
                            "JWT_SECRET is too short (%d bytes). Minimum required: %d bytes (512 bits) for HS512. " +
                            "Generate with: openssl rand -base64 64",
                            keyBytes.length, MIN_SECRET_LENGTH
                    )
            );
        }

        // Create signing key (cached for performance)
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);

        log.info("JWT Gateway Filter initialized successfully");
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // Skip authentication for CORS preflight requests
            if (request.getMethod() == HttpMethod.OPTIONS) {
                return chain.filter(exchange);
            }

            // Skip authentication for public endpoints
            if (isPublicPath(request.getPath().toString())) {
                return chain.filter(exchange);
            }

            // Extract Authorization header
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Invalid authorization header format", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7); // Remove "Bearer " prefix

            try {
                // Parse and validate JWT using cached signing key
                Claims claims = Jwts.parser()
                        .verifyWith(signingKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                // Extract groups from JWT (comma-separated UUIDs)
                String groups = claims.get("groups", String.class);

                // Add user information to request headers for downstream services
                ServerHttpRequest.Builder requestBuilder = request.mutate()
                        .header("X-User-Id", claims.get("userId", String.class))
                        .header("X-Username", claims.getSubject())
                        .header("X-User-Role", claims.get("role", String.class));

                // Add groups header if present in token
                if (groups != null && !groups.isEmpty()) {
                    requestBuilder.header("X-User-Groups", groups);
                }

                ServerHttpRequest modifiedRequest = requestBuilder.build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());

            } catch (Exception e) {
                log.debug("JWT validation failed: {}", e.getMessage());
                return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
            }
        };
    }

    /**
     * Check if the requested path is public (no authentication required).
     */
    private boolean isPublicPath(String path) {
        return path.startsWith("/auth/") ||
                path.startsWith("/actuator/health") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs");
    }

    /**
     * Handle authentication errors with consistent JSON response.
     */
    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");
        String errorResponse = String.format(
                "{\"error\":\"%s\",\"message\":\"%s\"}",
                status.getReasonPhrase(), message
        );
        return response.writeWith(Mono.just(response.bufferFactory().wrap(errorResponse.getBytes())));
    }

    public static class Config {
        // Configuration properties (if needed)
    }
}
