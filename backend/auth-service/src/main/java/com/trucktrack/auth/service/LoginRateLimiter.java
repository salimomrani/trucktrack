package com.trucktrack.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory rate limiter for login attempts.
 * Prevents brute-force attacks by limiting login attempts per IP/email.
 *
 * P0 Security Fix: Rate limit login attempts to prevent credential stuffing.
 *
 * For production with multiple instances, consider Redis-based rate limiting.
 */
@Slf4j
@Service
public class LoginRateLimiter {

    // Rate limit configuration
    @Value("${security.rate-limit.max-attempts:5}")
    private int maxAttempts;

    @Value("${security.rate-limit.window-seconds:300}")
    private int windowSeconds;

    @Value("${security.rate-limit.lockout-seconds:900}")
    private int lockoutSeconds;

    // Track attempts by IP address
    private final ConcurrentHashMap<String, AttemptInfo> attemptsByIp = new ConcurrentHashMap<>();

    // Track attempts by email (for targeted attacks)
    private final ConcurrentHashMap<String, AttemptInfo> attemptsByEmail = new ConcurrentHashMap<>();

    /**
     * Check if login attempt is allowed.
     * @param ipAddress Client IP address
     * @param email User email
     * @return true if attempt is allowed, false if rate limited
     */
    public boolean isAllowed(String ipAddress, String email) {
        Instant now = Instant.now();

        // Check IP-based rate limit
        AttemptInfo ipInfo = attemptsByIp.compute(ipAddress, (key, info) -> {
            if (info == null) {
                return new AttemptInfo(now);
            }
            return info.isExpired(now, windowSeconds) ? new AttemptInfo(now) : info;
        });

        if (ipInfo.isLocked(now, lockoutSeconds)) {
            log.warn("Rate limit: IP {} is locked out until {}",
                    maskIp(ipAddress), ipInfo.getUnlockTime(lockoutSeconds));
            return false;
        }

        if (ipInfo.getAttempts() >= maxAttempts) {
            log.warn("Rate limit: IP {} exceeded {} attempts, locking out",
                    maskIp(ipAddress), maxAttempts);
            ipInfo.lock(now);
            return false;
        }

        // Check email-based rate limit (prevents targeted attacks on specific accounts)
        if (email != null && !email.isBlank()) {
            String normalizedEmail = email.toLowerCase().trim();
            AttemptInfo emailInfo = attemptsByEmail.compute(normalizedEmail, (key, info) -> {
                if (info == null) {
                    return new AttemptInfo(now);
                }
                return info.isExpired(now, windowSeconds) ? new AttemptInfo(now) : info;
            });

            if (emailInfo.isLocked(now, lockoutSeconds)) {
                log.warn("Rate limit: Email {} is locked out", maskEmail(normalizedEmail));
                return false;
            }

            if (emailInfo.getAttempts() >= maxAttempts) {
                log.warn("Rate limit: Email {} exceeded {} attempts, locking out",
                        maskEmail(normalizedEmail), maxAttempts);
                emailInfo.lock(now);
                return false;
            }
        }

        return true;
    }

    /**
     * Record a failed login attempt.
     * @param ipAddress Client IP address
     * @param email User email
     */
    public void recordFailedAttempt(String ipAddress, String email) {
        Instant now = Instant.now();

        attemptsByIp.compute(ipAddress, (key, info) -> {
            if (info == null || info.isExpired(now, windowSeconds)) {
                AttemptInfo newInfo = new AttemptInfo(now);
                newInfo.incrementAttempts();
                return newInfo;
            }
            info.incrementAttempts();
            return info;
        });

        if (email != null && !email.isBlank()) {
            String normalizedEmail = email.toLowerCase().trim();
            attemptsByEmail.compute(normalizedEmail, (key, info) -> {
                if (info == null || info.isExpired(now, windowSeconds)) {
                    AttemptInfo newInfo = new AttemptInfo(now);
                    newInfo.incrementAttempts();
                    return newInfo;
                }
                info.incrementAttempts();
                return info;
            });
        }

        log.debug("Recorded failed login attempt for IP: {}, email: {}",
                maskIp(ipAddress), maskEmail(email));
    }

    /**
     * Record a successful login (resets attempt counter).
     * @param ipAddress Client IP address
     * @param email User email
     */
    public void recordSuccessfulLogin(String ipAddress, String email) {
        attemptsByIp.remove(ipAddress);
        if (email != null && !email.isBlank()) {
            attemptsByEmail.remove(email.toLowerCase().trim());
        }
        log.debug("Reset rate limit counters for IP: {}, email: {}",
                maskIp(ipAddress), maskEmail(email));
    }

    /**
     * Get remaining attempts for an IP address.
     */
    public int getRemainingAttempts(String ipAddress) {
        AttemptInfo info = attemptsByIp.get(ipAddress);
        if (info == null) {
            return maxAttempts;
        }
        if (info.isExpired(Instant.now(), windowSeconds)) {
            return maxAttempts;
        }
        return Math.max(0, maxAttempts - info.getAttempts());
    }

    /**
     * Cleanup expired entries periodically (every 5 minutes).
     */
    @Scheduled(fixedRate = 300000)
    public void cleanupExpiredEntries() {
        Instant now = Instant.now();
        int expiredWindow = windowSeconds + lockoutSeconds;

        int ipRemoved = 0;
        int emailRemoved = 0;

        for (String key : attemptsByIp.keySet()) {
            AttemptInfo info = attemptsByIp.get(key);
            if (info != null && info.isExpired(now, expiredWindow)) {
                attemptsByIp.remove(key);
                ipRemoved++;
            }
        }

        for (String key : attemptsByEmail.keySet()) {
            AttemptInfo info = attemptsByEmail.get(key);
            if (info != null && info.isExpired(now, expiredWindow)) {
                attemptsByEmail.remove(key);
                emailRemoved++;
            }
        }

        if (ipRemoved > 0 || emailRemoved > 0) {
            log.debug("Rate limiter cleanup: removed {} IP entries, {} email entries",
                    ipRemoved, emailRemoved);
        }
    }

    /**
     * Mask IP address for logging (privacy).
     */
    private String maskIp(String ip) {
        if (ip == null) return "unknown";
        int lastDot = ip.lastIndexOf('.');
        if (lastDot > 0) {
            return ip.substring(0, lastDot) + ".***";
        }
        return "***";
    }

    /**
     * Mask email for logging (privacy).
     */
    private String maskEmail(String email) {
        if (email == null) return "unknown";
        int at = email.indexOf('@');
        if (at > 2) {
            return email.substring(0, 2) + "***" + email.substring(at);
        }
        return "***";
    }

    /**
     * Tracks login attempt information.
     */
    private static class AttemptInfo {
        private final Instant firstAttempt;
        private final AtomicInteger attempts = new AtomicInteger(0);
        private volatile Instant lockedAt = null;

        AttemptInfo(Instant now) {
            this.firstAttempt = now;
        }

        int getAttempts() {
            return attempts.get();
        }

        void incrementAttempts() {
            attempts.incrementAndGet();
        }

        void lock(Instant now) {
            this.lockedAt = now;
        }

        boolean isLocked(Instant now, int lockoutSeconds) {
            if (lockedAt == null) return false;
            return now.isBefore(lockedAt.plusSeconds(lockoutSeconds));
        }

        boolean isExpired(Instant now, int windowSeconds) {
            return now.isAfter(firstAttempt.plusSeconds(windowSeconds));
        }

        Instant getUnlockTime(int lockoutSeconds) {
            return lockedAt != null ? lockedAt.plusSeconds(lockoutSeconds) : null;
        }
    }
}
