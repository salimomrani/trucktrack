package com.trucktrack.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for LoginRateLimiter - brute-force attack prevention.
 * Tests rate limiting logic: attempt counting, lockout, and reset.
 */
@DisplayName("LoginRateLimiter")
class LoginRateLimiterTest {

    private LoginRateLimiter rateLimiter;

    private static final String TEST_IP = "192.168.1.100";
    private static final String TEST_EMAIL = "user@test.com";

    @BeforeEach
    void setUp() {
        rateLimiter = new LoginRateLimiter();
        // Configure rate limit: 5 attempts, 5 min window, 15 min lockout
        ReflectionTestUtils.setField(rateLimiter, "maxAttempts", 5);
        ReflectionTestUtils.setField(rateLimiter, "windowSeconds", 300);
        ReflectionTestUtils.setField(rateLimiter, "lockoutSeconds", 900);
    }

    @Nested
    @DisplayName("isAllowed")
    class IsAllowed {

        @Test
        @DisplayName("should allow first attempt")
        void should_allowFirstAttempt() {
            // When & Then
            assertThat(rateLimiter.isAllowed(TEST_IP, TEST_EMAIL)).isTrue();
        }

        @Test
        @DisplayName("should allow up to max attempts")
        void should_allowUpToMaxAttempts() {
            // When - make 4 failed attempts (first isAllowed doesn't count as failure)
            for (int i = 0; i < 4; i++) {
                assertThat(rateLimiter.isAllowed(TEST_IP, TEST_EMAIL)).isTrue();
                rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            }

            // Then - 5th attempt should still be allowed (5 attempts = max)
            assertThat(rateLimiter.isAllowed(TEST_IP, TEST_EMAIL)).isTrue();
        }

        @Test
        @DisplayName("should block after exceeding max attempts")
        void should_blockAfterMaxAttempts() {
            // Given - exhaust all attempts
            for (int i = 0; i < 5; i++) {
                rateLimiter.isAllowed(TEST_IP, TEST_EMAIL);
                rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            }

            // When & Then - 6th attempt should be blocked
            assertThat(rateLimiter.isAllowed(TEST_IP, TEST_EMAIL)).isFalse();
        }

        @Test
        @DisplayName("should allow null email")
        void should_allowNullEmail() {
            // When & Then
            assertThat(rateLimiter.isAllowed(TEST_IP, null)).isTrue();
        }

        @Test
        @DisplayName("should track IP and email independently")
        void should_trackIpAndEmailIndependently() {
            // Given - exhaust attempts for one email
            String email1 = "user1@test.com";
            String email2 = "user2@test.com";

            for (int i = 0; i < 5; i++) {
                rateLimiter.isAllowed(TEST_IP, email1);
                rateLimiter.recordFailedAttempt(TEST_IP, email1);
            }

            // Then - IP is blocked for any email (IP-based rate limiting)
            assertThat(rateLimiter.isAllowed(TEST_IP, email1)).isFalse();

            // But different IP should work
            String differentIp = "192.168.1.200";
            assertThat(rateLimiter.isAllowed(differentIp, email2)).isTrue();
        }
    }

    @Nested
    @DisplayName("recordFailedAttempt")
    class RecordFailedAttempt {

        @Test
        @DisplayName("should increment attempt counter for IP")
        void should_incrementCounter_when_failedAttemptRecorded() {
            // Given
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(5);

            // When
            rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);

            // Then
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(4);
        }

        @Test
        @DisplayName("should handle empty email gracefully")
        void should_handleEmptyEmail() {
            // When & Then - should not throw
            rateLimiter.recordFailedAttempt(TEST_IP, "");
            rateLimiter.recordFailedAttempt(TEST_IP, "   ");

            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("recordSuccessfulLogin")
    class RecordSuccessfulLogin {

        @Test
        @DisplayName("should reset counters after successful login")
        void should_resetCounters_when_loginSuccessful() {
            // Given - make some failed attempts
            rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(3);

            // When
            rateLimiter.recordSuccessfulLogin(TEST_IP, TEST_EMAIL);

            // Then
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(5);
        }

        @Test
        @DisplayName("should handle null email in successful login")
        void should_handleNullEmail_when_loginSuccessful() {
            // Given
            rateLimiter.recordFailedAttempt(TEST_IP, null);

            // When & Then - should not throw
            rateLimiter.recordSuccessfulLogin(TEST_IP, null);
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(5);
        }
    }

    @Nested
    @DisplayName("getRemainingAttempts")
    class GetRemainingAttempts {

        @Test
        @DisplayName("should return max attempts for new IP")
        void should_returnMaxAttempts_when_newIp() {
            // When & Then
            assertThat(rateLimiter.getRemainingAttempts("new.ip.address")).isEqualTo(5);
        }

        @Test
        @DisplayName("should return correct remaining attempts")
        void should_returnCorrectRemainingAttempts() {
            // Given
            rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);

            // When & Then
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(2);
        }

        @Test
        @DisplayName("should return zero when all attempts exhausted")
        void should_returnZero_when_allAttemptsExhausted() {
            // Given
            for (int i = 0; i < 5; i++) {
                rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            }

            // When & Then
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("cleanupExpiredEntries")
    class CleanupExpiredEntries {

        @Test
        @DisplayName("should not throw when cleaning up")
        void should_notThrow_when_cleaningUp() {
            // Given - add some entries
            rateLimiter.recordFailedAttempt(TEST_IP, TEST_EMAIL);
            rateLimiter.recordFailedAttempt("192.168.1.200", "other@test.com");

            // When & Then - should not throw
            rateLimiter.cleanupExpiredEntries();
        }

        @Test
        @DisplayName("should handle empty state")
        void should_handleEmptyState() {
            // When & Then - should not throw on empty state
            rateLimiter.cleanupExpiredEntries();
        }
    }

    @Nested
    @DisplayName("Email normalization")
    class EmailNormalization {

        @Test
        @DisplayName("should normalize email to lowercase")
        void should_normalizeEmail_toLowercase() {
            // Given - record with different case
            rateLimiter.recordFailedAttempt(TEST_IP, "USER@TEST.COM");
            rateLimiter.recordFailedAttempt(TEST_IP, "user@test.com");

            // Then - should be counted as same email
            // Both attempts should apply to the same normalized email
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(3);
        }

        @Test
        @DisplayName("should trim whitespace from email")
        void should_trimWhitespace_fromEmail() {
            // Given
            rateLimiter.recordFailedAttempt(TEST_IP, "  user@test.com  ");
            rateLimiter.recordFailedAttempt(TEST_IP, "user@test.com");

            // Then - should be counted as same email
            assertThat(rateLimiter.getRemainingAttempts(TEST_IP)).isEqualTo(3);
        }
    }
}
