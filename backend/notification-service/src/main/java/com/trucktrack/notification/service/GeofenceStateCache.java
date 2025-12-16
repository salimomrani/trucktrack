package com.trucktrack.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache for tracking truck positions relative to geofences
 * Used to detect geofence enter/exit events
 * T150: Implement geofence evaluation in AlertRuleEngine
 */
@Slf4j
@Component
public class GeofenceStateCache {

    /**
     * Key: truckId:geofenceId
     * Value: true if truck is inside, false if outside
     */
    private final Map<String, GeofenceState> stateMap = new ConcurrentHashMap<>();

    /**
     * Check if a truck's geofence state has changed
     *
     * @param truckId     Truck ID
     * @param geofenceId  Geofence ID
     * @param isNowInside Current position state
     * @return StateChange if state changed, null otherwise
     */
    public StateChange checkStateChange(UUID truckId, UUID geofenceId, boolean isNowInside) {
        String key = createKey(truckId, geofenceId);
        GeofenceState currentState = stateMap.get(key);

        // If no previous state, store current and report as initial state
        if (currentState == null) {
            stateMap.put(key, new GeofenceState(isNowInside, Instant.now()));
            log.debug("Initial geofence state for truck {} / geofence {}: inside={}",
                    truckId, geofenceId, isNowInside);
            return null; // No state change for initial state
        }

        boolean wasInside = currentState.inside();

        // Check if state changed
        if (wasInside != isNowInside) {
            // Update state
            stateMap.put(key, new GeofenceState(isNowInside, Instant.now()));

            StateChangeType changeType = isNowInside
                    ? StateChangeType.ENTERED
                    : StateChangeType.EXITED;

            log.info("Truck {} {} geofence {}", truckId, changeType.name(), geofenceId);
            return new StateChange(truckId, geofenceId, changeType, Instant.now());
        }

        return null; // No change
    }

    /**
     * Get current state for a truck/geofence combination
     */
    public Boolean getState(UUID truckId, UUID geofenceId) {
        String key = createKey(truckId, geofenceId);
        GeofenceState state = stateMap.get(key);
        return state != null ? state.inside() : null;
    }

    /**
     * Clear state for a truck (e.g., when truck goes offline)
     */
    public void clearTruckState(UUID truckId) {
        String prefix = truckId.toString() + ":";
        stateMap.keySet().removeIf(key -> key.startsWith(prefix));
        log.debug("Cleared geofence state for truck {}", truckId);
    }

    /**
     * Clear all state (for testing or reset)
     */
    public void clearAll() {
        stateMap.clear();
        log.info("Cleared all geofence state");
    }

    private String createKey(UUID truckId, UUID geofenceId) {
        return truckId.toString() + ":" + geofenceId.toString();
    }

    /**
     * State change types
     */
    public enum StateChangeType {
        ENTERED,
        EXITED
    }

    /**
     * Record of a state change
     */
    public record StateChange(
            UUID truckId,
            UUID geofenceId,
            StateChangeType changeType,
            Instant timestamp
    ) {}

    /**
     * Internal state record
     */
    private record GeofenceState(boolean inside, Instant lastUpdate) {}
}
