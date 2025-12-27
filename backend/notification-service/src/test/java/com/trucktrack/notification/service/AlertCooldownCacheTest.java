package com.trucktrack.notification.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for AlertCooldownCache - alert flooding prevention.
 * Tests cooldown logic, expiration, and cleanup.
 */
@DisplayName("AlertCooldownCache")
class AlertCooldownCacheTest {

    private AlertCooldownCache cooldownCache;
    private UUID ruleId;
    private String truckId;

    @BeforeEach
    void setUp() {
        cooldownCache = new AlertCooldownCache();
        ReflectionTestUtils.setField(cooldownCache, "cooldownMinutes", 5);

        ruleId = UUID.randomUUID();
        truckId = UUID.randomUUID().toString();
    }

    @Nested
    @DisplayName("canTriggerAlert")
    class CanTriggerAlert {

        @Test
        @DisplayName("should allow first alert for new truck+rule combination")
        void should_allowFirstAlert() {
            // When
            boolean canTrigger = cooldownCache.canTriggerAlert(truckId, ruleId);

            // Then
            assertThat(canTrigger).isTrue();
        }

        @Test
        @DisplayName("should block alert within cooldown period")
        void should_blockDuringCooldown() {
            // Given
            cooldownCache.recordAlert(truckId, ruleId);

            // When
            boolean canTrigger = cooldownCache.canTriggerAlert(truckId, ruleId);

            // Then
            assertThat(canTrigger).isFalse();
        }

        @Test
        @DisplayName("should allow alert after cooldown expires")
        void should_allowAfterCooldown() {
            // Given - simulate old alert by directly manipulating the cache
            Map<String, Instant> lastAlertTimes = new ConcurrentHashMap<>();
            Instant oldTime = Instant.now().minus(10, ChronoUnit.MINUTES); // 10 min ago, cooldown is 5 min
            lastAlertTimes.put(truckId + ":" + ruleId, oldTime);
            ReflectionTestUtils.setField(cooldownCache, "lastAlertTimes", lastAlertTimes);

            // When
            boolean canTrigger = cooldownCache.canTriggerAlert(truckId, ruleId);

            // Then
            assertThat(canTrigger).isTrue();
        }

        @Test
        @DisplayName("should allow different rule for same truck")
        void should_allowDifferentRule() {
            // Given
            UUID differentRuleId = UUID.randomUUID();
            cooldownCache.recordAlert(truckId, ruleId);

            // When
            boolean canTrigger = cooldownCache.canTriggerAlert(truckId, differentRuleId);

            // Then
            assertThat(canTrigger).isTrue();
        }

        @Test
        @DisplayName("should allow same rule for different truck")
        void should_allowDifferentTruck() {
            // Given
            String differentTruckId = UUID.randomUUID().toString();
            cooldownCache.recordAlert(truckId, ruleId);

            // When
            boolean canTrigger = cooldownCache.canTriggerAlert(differentTruckId, ruleId);

            // Then
            assertThat(canTrigger).isTrue();
        }
    }

    @Nested
    @DisplayName("checkAndRecord")
    class CheckAndRecord {

        @Test
        @DisplayName("should allow and record first alert atomically")
        void should_allowAndRecordFirstAlert() {
            // When
            boolean result = cooldownCache.checkAndRecord(truckId, ruleId);

            // Then
            assertThat(result).isTrue();
            // Second call should be blocked
            assertThat(cooldownCache.canTriggerAlert(truckId, ruleId)).isFalse();
        }

        @Test
        @DisplayName("should block second alert within cooldown")
        void should_blockSecondAlertInCooldown() {
            // Given
            cooldownCache.checkAndRecord(truckId, ruleId);

            // When
            boolean result = cooldownCache.checkAndRecord(truckId, ruleId);

            // Then
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("should update timestamp when alert allowed after cooldown")
        void should_updateTimestampAfterCooldown() {
            // Given - old alert
            Map<String, Instant> lastAlertTimes = new ConcurrentHashMap<>();
            Instant oldTime = Instant.now().minus(10, ChronoUnit.MINUTES);
            String key = truckId + ":" + ruleId;
            lastAlertTimes.put(key, oldTime);
            ReflectionTestUtils.setField(cooldownCache, "lastAlertTimes", lastAlertTimes);

            // When
            Instant before = Instant.now();
            boolean result = cooldownCache.checkAndRecord(truckId, ruleId);
            Instant after = Instant.now();

            // Then
            assertThat(result).isTrue();
            @SuppressWarnings("unchecked")
            Map<String, Instant> updatedTimes = (Map<String, Instant>)
                ReflectionTestUtils.getField(cooldownCache, "lastAlertTimes");
            Instant newTime = updatedTimes.get(key);
            assertThat(newTime).isAfterOrEqualTo(before);
            assertThat(newTime).isBeforeOrEqualTo(after);
        }
    }

    @Nested
    @DisplayName("clearCooldown")
    class ClearCooldown {

        @Test
        @DisplayName("should clear cooldown for specific truck+rule")
        void should_clearSpecificCooldown() {
            // Given
            cooldownCache.recordAlert(truckId, ruleId);
            assertThat(cooldownCache.canTriggerAlert(truckId, ruleId)).isFalse();

            // When
            cooldownCache.clearCooldown(truckId, ruleId);

            // Then
            assertThat(cooldownCache.canTriggerAlert(truckId, ruleId)).isTrue();
        }

        @Test
        @DisplayName("should not affect other truck+rule combinations")
        void should_notAffectOtherCombinations() {
            // Given
            UUID otherRuleId = UUID.randomUUID();
            cooldownCache.recordAlert(truckId, ruleId);
            cooldownCache.recordAlert(truckId, otherRuleId);

            // When
            cooldownCache.clearCooldown(truckId, ruleId);

            // Then
            assertThat(cooldownCache.canTriggerAlert(truckId, ruleId)).isTrue();
            assertThat(cooldownCache.canTriggerAlert(truckId, otherRuleId)).isFalse();
        }
    }

    @Nested
    @DisplayName("clearAll")
    class ClearAll {

        @Test
        @DisplayName("should clear all cooldowns")
        void should_clearAllCooldowns() {
            // Given
            UUID ruleId2 = UUID.randomUUID();
            String truckId2 = UUID.randomUUID().toString();
            cooldownCache.recordAlert(truckId, ruleId);
            cooldownCache.recordAlert(truckId2, ruleId2);

            // When
            cooldownCache.clearAll();

            // Then
            assertThat(cooldownCache.canTriggerAlert(truckId, ruleId)).isTrue();
            assertThat(cooldownCache.canTriggerAlert(truckId2, ruleId2)).isTrue();
        }
    }

    @Nested
    @DisplayName("getRemainingCooldownSeconds")
    class GetRemainingCooldownSeconds {

        @Test
        @DisplayName("should return 0 when no cooldown exists")
        void should_returnZeroForNoCooldown() {
            // When
            long remaining = cooldownCache.getRemainingCooldownSeconds(truckId, ruleId);

            // Then
            assertThat(remaining).isEqualTo(0);
        }

        @Test
        @DisplayName("should return positive value during cooldown")
        void should_returnPositiveDuringCooldown() {
            // Given
            cooldownCache.recordAlert(truckId, ruleId);

            // When
            long remaining = cooldownCache.getRemainingCooldownSeconds(truckId, ruleId);

            // Then - should be close to 5 minutes (300 seconds) minus a few seconds for test execution
            assertThat(remaining).isGreaterThan(290);
            assertThat(remaining).isLessThanOrEqualTo(300);
        }

        @Test
        @DisplayName("should return 0 after cooldown expires")
        void should_returnZeroAfterCooldown() {
            // Given - old alert beyond cooldown
            Map<String, Instant> lastAlertTimes = new ConcurrentHashMap<>();
            Instant oldTime = Instant.now().minus(10, ChronoUnit.MINUTES);
            lastAlertTimes.put(truckId + ":" + ruleId, oldTime);
            ReflectionTestUtils.setField(cooldownCache, "lastAlertTimes", lastAlertTimes);

            // When
            long remaining = cooldownCache.getRemainingCooldownSeconds(truckId, ruleId);

            // Then
            assertThat(remaining).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("cleanupExpiredEntries")
    class CleanupExpiredEntries {

        @Test
        @DisplayName("should remove entries older than 2x cooldown period")
        void should_removeOldEntries() {
            // Given
            Map<String, Instant> lastAlertTimes = new ConcurrentHashMap<>();
            String oldKey = "old-truck:" + UUID.randomUUID();
            String recentKey = "recent-truck:" + UUID.randomUUID();

            // Old entry: 15 minutes ago (beyond 2x5min cutoff)
            lastAlertTimes.put(oldKey, Instant.now().minus(15, ChronoUnit.MINUTES));
            // Recent entry: 2 minutes ago (within cutoff)
            lastAlertTimes.put(recentKey, Instant.now().minus(2, ChronoUnit.MINUTES));

            ReflectionTestUtils.setField(cooldownCache, "lastAlertTimes", lastAlertTimes);

            // When
            cooldownCache.cleanupExpiredEntries();

            // Then
            @SuppressWarnings("unchecked")
            Map<String, Instant> remaining = (Map<String, Instant>)
                ReflectionTestUtils.getField(cooldownCache, "lastAlertTimes");
            assertThat(remaining).doesNotContainKey(oldKey);
            assertThat(remaining).containsKey(recentKey);
        }

        @Test
        @DisplayName("should handle empty cache gracefully")
        void should_handleEmptyCache() {
            // When & Then - should not throw
            cooldownCache.cleanupExpiredEntries();
        }
    }
}
