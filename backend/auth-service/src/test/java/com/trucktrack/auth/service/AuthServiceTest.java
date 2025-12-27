package com.trucktrack.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AuthService - JWT token generation and validation.
 * Tests business logic: token generation, validation, expiration, claims extraction.
 */
@DisplayName("AuthService")
class AuthServiceTest {

    private AuthService authService;
    private Environment environment;

    // Valid 64-byte secret for HS512
    private static final String VALID_SECRET = "VGhpc0lzQVZlcnlMb25nU2VjcmV0S2V5Rm9yVGVzdGluZ1B1cnBvc2VzT25seURvTm90VXNlSW5Qcm9kdWN0aW9uMTIzNDU2Nzg5MA==";

    @BeforeEach
    void setUp() {
        environment = mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"local"});

        authService = new AuthService(environment);
        ReflectionTestUtils.setField(authService, "secret", VALID_SECRET);
        ReflectionTestUtils.setField(authService, "accessExpiration", 3600000L); // 1 hour
        ReflectionTestUtils.setField(authService, "refreshExpiration", 604800000L); // 7 days

        authService.init();
    }

    @Nested
    @DisplayName("Token Generation")
    class TokenGeneration {

        @Test
        @DisplayName("should generate valid JWT token for user")
        void should_generateValidToken_when_validUserCredentials() {
            // Given
            String username = "test@example.com";
            String userId = UUID.randomUUID().toString();
            String role = "ADMIN";

            // When
            String token = authService.generateToken(username, userId, role);

            // Then
            assertThat(token).isNotNull().isNotEmpty();
            assertThat(authService.validateToken(token)).isTrue();
            assertThat(authService.getUsernameFromToken(token)).isEqualTo(username);
            assertThat(authService.getUserIdFromToken(token)).isEqualTo(userId);
            assertThat(authService.getRoleFromToken(token)).isEqualTo(role);
        }

        @Test
        @DisplayName("should include group IDs in token when provided")
        void should_includeGroups_when_groupsProvided() {
            // Given
            String username = "manager@example.com";
            String userId = UUID.randomUUID().toString();
            String role = "FLEET_MANAGER";
            List<UUID> groupIds = List.of(UUID.randomUUID(), UUID.randomUUID());

            // When
            String token = authService.generateToken(username, userId, role, groupIds);

            // Then
            assertThat(token).isNotNull();
            String groups = authService.getGroupsFromToken(token);
            assertThat(groups).isNotEmpty();
            assertThat(groups.split(",")).hasSize(2);
        }

        @Test
        @DisplayName("should handle empty group list gracefully")
        void should_handleEmptyGroups_when_noGroupsProvided() {
            // Given
            String username = "user@example.com";
            String userId = UUID.randomUUID().toString();
            String role = "DRIVER";

            // When
            String token = authService.generateToken(username, userId, role, List.of());

            // Then
            assertThat(token).isNotNull();
            assertThat(authService.getGroupsFromToken(token)).isEmpty();
        }
    }

    @Nested
    @DisplayName("Token Validation")
    class TokenValidation {

        @Test
        @DisplayName("should validate correct token")
        void should_returnTrue_when_tokenIsValid() {
            // Given
            String token = authService.generateToken("user@test.com", UUID.randomUUID().toString(), "ADMIN");

            // When & Then
            assertThat(authService.validateToken(token)).isTrue();
        }

        @Test
        @DisplayName("should reject malformed token")
        void should_returnFalse_when_tokenIsMalformed() {
            // Given
            String malformedToken = "not.a.valid.jwt.token";

            // When & Then
            assertThat(authService.validateToken(malformedToken)).isFalse();
        }

        @Test
        @DisplayName("should reject token with invalid signature")
        void should_returnFalse_when_signatureIsInvalid() {
            // Given - create a token and tamper with it
            String token = authService.generateToken("user@test.com", UUID.randomUUID().toString(), "ADMIN");
            String tamperedToken = token.substring(0, token.length() - 5) + "XXXXX";

            // When & Then
            assertThat(authService.validateToken(tamperedToken)).isFalse();
        }

        @Test
        @DisplayName("should reject empty token")
        void should_returnFalse_when_tokenIsEmpty() {
            assertThat(authService.validateToken("")).isFalse();
            assertThat(authService.validateToken(null)).isFalse();
        }
    }

    @Nested
    @DisplayName("Refresh Token")
    class RefreshToken {

        @Test
        @DisplayName("should generate valid refresh token")
        void should_generateValidRefreshToken_when_called() {
            // Given
            String username = "user@test.com";
            String userId = UUID.randomUUID().toString();
            String role = "FLEET_MANAGER";

            // When
            String refreshToken = authService.generateRefreshToken(username, userId, role);

            // Then
            assertThat(refreshToken).isNotNull().isNotEmpty();
            assertThat(authService.validateRefreshToken(refreshToken)).isTrue();
        }

        @Test
        @DisplayName("should distinguish refresh token from access token")
        void should_rejectAccessToken_when_validatingAsRefreshToken() {
            // Given
            String accessToken = authService.generateToken("user@test.com", UUID.randomUUID().toString(), "ADMIN");

            // When & Then - access token should not validate as refresh token
            assertThat(authService.validateRefreshToken(accessToken)).isFalse();
        }

        @Test
        @DisplayName("should include groups in refresh token")
        void should_includeGroups_when_generatingRefreshToken() {
            // Given
            List<UUID> groupIds = List.of(UUID.randomUUID());

            // When
            String refreshToken = authService.generateRefreshToken(
                "user@test.com",
                UUID.randomUUID().toString(),
                "FLEET_MANAGER",
                groupIds
            );

            // Then
            assertThat(refreshToken).isNotNull();
            assertThat(authService.validateRefreshToken(refreshToken)).isTrue();
        }
    }

    @Nested
    @DisplayName("Token Expiration")
    class TokenExpiration {

        @Test
        @DisplayName("should detect non-expired token")
        void should_returnFalse_when_tokenNotExpired() {
            // Given
            String token = authService.generateToken("user@test.com", UUID.randomUUID().toString(), "ADMIN");

            // When & Then
            assertThat(authService.isTokenExpired(token)).isFalse();
        }

        @Test
        @DisplayName("should return true for invalid token in expiration check")
        void should_returnTrue_when_tokenIsInvalid() {
            // Given
            String invalidToken = "invalid.token.here";

            // When & Then
            assertThat(authService.isTokenExpired(invalidToken)).isTrue();
        }
    }

    @Nested
    @DisplayName("Service Account Token")
    class ServiceAccountToken {

        @Test
        @DisplayName("should generate service account token with long expiration")
        void should_generateServiceToken_when_serviceNameProvided() {
            // Given
            String serviceName = "notification-service";
            int expirationDays = 365;

            // When
            String token = authService.generateServiceAccountToken(serviceName, expirationDays);

            // Then
            assertThat(token).isNotNull().isNotEmpty();
            assertThat(authService.validateToken(token)).isTrue();
            assertThat(authService.getRoleFromToken(token)).isEqualTo("SYSTEM");
        }
    }

    @Nested
    @DisplayName("Initialization")
    class Initialization {

        @Test
        @DisplayName("should throw exception when secret is missing")
        void should_throwException_when_secretIsMissing() {
            // Given
            AuthService service = new AuthService(environment);
            ReflectionTestUtils.setField(service, "secret", "");
            ReflectionTestUtils.setField(service, "accessExpiration", 3600000L);
            ReflectionTestUtils.setField(service, "refreshExpiration", 604800000L);

            // When & Then
            assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
        }

        @Test
        @DisplayName("should throw exception when secret is too short")
        void should_throwException_when_secretIsTooShort() {
            // Given
            AuthService service = new AuthService(environment);
            ReflectionTestUtils.setField(service, "secret", "tooshort");
            ReflectionTestUtils.setField(service, "accessExpiration", 3600000L);
            ReflectionTestUtils.setField(service, "refreshExpiration", 604800000L);

            // When & Then
            assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("too short");
        }

        @Test
        @DisplayName("should return correct expiration in seconds")
        void should_returnExpirationInSeconds() {
            // Given - accessExpiration is set to 3600000ms (1 hour)

            // When & Then
            assertThat(authService.getExpirationInSeconds()).isEqualTo(3600L);
        }
    }
}
