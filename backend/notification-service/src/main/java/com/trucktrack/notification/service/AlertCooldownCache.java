package com.trucktrack.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache to prevent alert flooding by enforcing cooldown periods.
 * After an alert is triggered for a truck+rule combination,
 * subsequent alerts are suppressed for the cooldown period.
 */
@Slf4j
@Service
public class AlertCooldownCache {

    // Key: "truckId:ruleId", Value: last alert timestamp
    private final Map<String, Instant> lastAlertTimes = new ConcurrentHashMap<>();

    @Value("${alert.cooldown-minutes:5}")
    private int cooldownMinutes;

    /**
     * Check if an alert can be triggered (cooldown has passed)
     * @return true if alert is allowed, false if still in cooldown
     */
    public boolean canTriggerAlert(String truckId, UUID ruleId) {
        String key = buildKey(truckId, ruleId);
        Instant lastAlert = lastAlertTimes.get(key);

        if (lastAlert == null) {
            return true; // No previous alert, allowed
        }

        Instant cooldownEnd = lastAlert.plus(cooldownMinutes, ChronoUnit.MINUTES);
        boolean allowed = Instant.now().isAfter(cooldownEnd);

        if (!allowed) {
            log.debug("Alert suppressed for truck {} rule {} - cooldown active until {}",
                    truckId, ruleId, cooldownEnd);
        }

        return allowed;
    }

    /**
     * Record that an alert was triggered
     */
    public void recordAlert(String truckId, UUID ruleId) {
        String key = buildKey(truckId, ruleId);
        lastAlertTimes.put(key, Instant.now());
        log.debug("Recorded alert for key: {}", key);
    }

    /**
     * Check and record in one atomic operation
     * @return true if alert was allowed and recorded, false if suppressed
     */
    public boolean checkAndRecord(String truckId, UUID ruleId) {
        String key = buildKey(truckId, ruleId);
        Instant now = Instant.now();

        Instant lastAlert = lastAlertTimes.get(key);
        if (lastAlert != null) {
            Instant cooldownEnd = lastAlert.plus(cooldownMinutes, ChronoUnit.MINUTES);
            if (now.isBefore(cooldownEnd)) {
                log.debug("Alert suppressed for {} - {} minutes remaining",
                        key, ChronoUnit.MINUTES.between(now, cooldownEnd));
                return false;
            }
        }

        lastAlertTimes.put(key, now);
        return true;
    }

    /**
     * Clear cooldown for a specific truck+rule (useful for testing)
     */
    public void clearCooldown(String truckId, UUID ruleId) {
        String key = buildKey(truckId, ruleId);
        lastAlertTimes.remove(key);
    }

    /**
     * Clear all cooldowns (useful for testing)
     */
    public void clearAll() {
        lastAlertTimes.clear();
    }

    /**
     * Get remaining cooldown time in seconds
     */
    public long getRemainingCooldownSeconds(String truckId, UUID ruleId) {
        String key = buildKey(truckId, ruleId);
        Instant lastAlert = lastAlertTimes.get(key);

        if (lastAlert == null) {
            return 0;
        }

        Instant cooldownEnd = lastAlert.plus(cooldownMinutes, ChronoUnit.MINUTES);
        long remaining = ChronoUnit.SECONDS.between(Instant.now(), cooldownEnd);
        return Math.max(0, remaining);
    }

    /**
     * Cleanup expired entries every 10 minutes to prevent memory leaks
     */
    @Scheduled(fixedRate = 600000) // 10 minutes
    public void cleanupExpiredEntries() {
        Instant cutoff = Instant.now().minus(cooldownMinutes * 2L, ChronoUnit.MINUTES);
        int removed = 0;

        var iterator = lastAlertTimes.entrySet().iterator();
        while (iterator.hasNext()) {
            if (iterator.next().getValue().isBefore(cutoff)) {
                iterator.remove();
                removed++;
            }
        }

        if (removed > 0) {
            log.debug("Cleaned up {} expired cooldown entries", removed);
        }
    }

    private String buildKey(String truckId, UUID ruleId) {
        return truckId + ":" + ruleId.toString();
    }

    /**
     * Get current cooldown duration in minutes
     */
    public int getCooldownMinutes() {
        return cooldownMinutes;
    }
}
