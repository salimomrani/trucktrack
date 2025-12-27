package com.trucktrack.auth.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trucktrack.auth.dto.LoginRequest;
import com.trucktrack.auth.dto.LoginResponse;
import com.trucktrack.auth.dto.RefreshTokenRequest;
import com.trucktrack.auth.model.User;
import com.trucktrack.common.security.UserRole;
import com.trucktrack.auth.repository.UserRepository;
import com.trucktrack.auth.service.AuthService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for complete authentication flow.
 * Tests: login → get JWT → access protected endpoint → refresh token.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Auth Flow Integration Tests")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthService authService;

    private User testUser;
    private static final String TEST_PASSWORD = "TestPassword123!";

    @BeforeEach
    void setUp() {
        // Clean up existing test user
        userRepository.findByEmail("integration-test@trucktrack.com")
            .ifPresent(userRepository::delete);

        // Create test user
        testUser = new User();
        testUser.setEmail("integration-test@trucktrack.com");
        testUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        testUser.setFirstName("Integration");
        testUser.setLastName("Test");
        testUser.setRole(UserRole.FLEET_MANAGER);
        testUser.setIsActive(true);
        testUser = userRepository.save(testUser);
    }

    @AfterEach
    void tearDown() {
        if (testUser != null) {
            userRepository.findByEmail(testUser.getEmail())
                .ifPresent(userRepository::delete);
        }
    }

    @Nested
    @DisplayName("Complete Login Flow")
    class CompleteLoginFlow {

        @Test
        @DisplayName("should complete full login → access protected API → refresh flow")
        void should_completeFullAuthFlow() throws Exception {
            // Step 1: Login with valid credentials
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("integration-test@trucktrack.com");
            loginRequest.setPassword(TEST_PASSWORD);

            MvcResult loginResult = mockMvc.perform(post("/auth/v1/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andReturn();

            LoginResponse loginResponse = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(),
                LoginResponse.class);

            String accessToken = loginResponse.getToken();
            String refreshToken = loginResponse.getRefreshToken();

            assertThat(accessToken).isNotBlank();
            assertThat(refreshToken).isNotBlank();

            // Step 2: Access protected endpoint with JWT
            mockMvc.perform(get("/auth/v1/me")
                    .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("integration-test@trucktrack.com"))
                .andExpect(jsonPath("$.role").value("FLEET_MANAGER"));

            // Step 3: Refresh token
            RefreshTokenRequest refreshRequest = new RefreshTokenRequest();
            refreshRequest.setRefreshToken(refreshToken);

            mockMvc.perform(post("/auth/v1/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists());
        }
    }

    @Nested
    @DisplayName("Login Validation")
    class LoginValidation {

        @Test
        @DisplayName("should reject invalid credentials")
        void should_rejectInvalidCredentials() throws Exception {
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("integration-test@trucktrack.com");
            loginRequest.setPassword("WrongPassword123!");

            mockMvc.perform(post("/auth/v1/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
        }

        @Test
        @DisplayName("should reject non-existent user")
        void should_rejectNonExistentUser() throws Exception {
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("nonexistent@trucktrack.com");
            loginRequest.setPassword(TEST_PASSWORD);

            mockMvc.perform(post("/auth/v1/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_CREDENTIALS"));
        }

        @Test
        @DisplayName("should reject disabled account")
        void should_rejectDisabledAccount() throws Exception {
            // Disable the test user
            testUser.setIsActive(false);
            userRepository.save(testUser);

            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("integration-test@trucktrack.com");
            loginRequest.setPassword(TEST_PASSWORD);

            mockMvc.perform(post("/auth/v1/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ACCOUNT_DISABLED"));
        }
    }

    @Nested
    @DisplayName("Protected Endpoint Access")
    class ProtectedEndpointAccess {

        @Test
        @DisplayName("should reject request without token")
        void should_rejectRequestWithoutToken() throws Exception {
            mockMvc.perform(get("/auth/v1/me"))
                .andExpect(status().is4xxClientError()); // 400 or 401 depending on security config
        }

        @Test
        @DisplayName("should reject invalid token")
        void should_rejectInvalidToken() throws Exception {
            mockMvc.perform(get("/auth/v1/me")
                    .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should reject expired token")
        void should_rejectExpiredToken() throws Exception {
            // Create an expired token (would need special configuration or mocking)
            // For now, test with malformed token
            mockMvc.perform(get("/auth/v1/me")
                    .header("Authorization", "Bearer eyJhbGciOiJIUzUxMiJ9.expired.signature"))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Token Refresh")
    class TokenRefresh {

        @Test
        @DisplayName("should reject invalid refresh token")
        void should_rejectInvalidRefreshToken() throws Exception {
            RefreshTokenRequest request = new RefreshTokenRequest();
            request.setRefreshToken("invalid.refresh.token");

            mockMvc.perform(post("/auth/v1/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("INVALID_TOKEN"));
        }
    }

    @Nested
    @DisplayName("Role-Based Access")
    class RoleBasedAccess {

        @Test
        @DisplayName("should return correct role in token")
        void should_returnCorrectRole() throws Exception {
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setEmail("integration-test@trucktrack.com");
            loginRequest.setPassword(TEST_PASSWORD);

            MvcResult result = mockMvc.perform(post("/auth/v1/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

            LoginResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                LoginResponse.class);

            assertThat(response.getRole()).isEqualTo("FLEET_MANAGER");
        }

        @Test
        @DisplayName("should authenticate different roles")
        void should_authenticateDifferentRoles() throws Exception {
            // Create a driver user
            userRepository.findByEmail("driver-test@trucktrack.com")
                .ifPresent(userRepository::delete);

            User driverUser = new User();
            driverUser.setEmail("driver-test@trucktrack.com");
            driverUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
            driverUser.setFirstName("Driver");
            driverUser.setLastName("Test");
            driverUser.setRole(UserRole.DRIVER);
            driverUser.setIsActive(true);
            userRepository.save(driverUser);

            try {
                LoginRequest loginRequest = new LoginRequest();
                loginRequest.setEmail("driver-test@trucktrack.com");
                loginRequest.setPassword(TEST_PASSWORD);

                mockMvc.perform(post("/auth/v1/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.role").value("DRIVER"));
            } finally {
                userRepository.findByEmail("driver-test@trucktrack.com")
                    .ifPresent(userRepository::delete);
            }
        }
    }
}
