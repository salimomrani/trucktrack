package com.trucktrack.location.service;

import com.trucktrack.location.model.TruckStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Service for calculating truck status based on GPS data
 * T069: Implement TruckStatusService to calculate status: ACTIVE/IDLE/OFFLINE
 *
 * Status rules:
 * - ACTIVE: Truck is moving (speed > 5 km/h) and data is recent (< 5 min)
 * - IDLE: Truck is stationary (speed <= 5 km/h) but data is recent (< 5 min)
 * - OFFLINE: No GPS data received in last 5 minutes
 */
@Service
public class TruckStatusService {

    private static final Logger logger = LoggerFactory.getLogger(TruckStatusService.class);

    // Speed threshold to determine if truck is moving (in km/h)
    private static final double SPEED_THRESHOLD_KMH = 5.0;

    // Time threshold to determine if truck is offline (in minutes)
    private static final Duration OFFLINE_THRESHOLD = Duration.ofMinutes(5);

    /**
     * Calculate truck status based on speed and last update timestamp
     *
     * @param speed Current speed in km/h (can be null)
     * @param lastUpdate Timestamp of last GPS update
     * @return TruckStatus (ACTIVE, IDLE, or OFFLINE)
     */
    public TruckStatus calculateStatus(Double speed, Instant lastUpdate) {
        if (lastUpdate == null) {
            return TruckStatus.OFFLINE;
        }

        // Check if data is stale (older than 5 minutes)
        Duration timeSinceUpdate = Duration.between(lastUpdate, Instant.now());
        if (timeSinceUpdate.compareTo(OFFLINE_THRESHOLD) > 0) {
            logger.debug("Truck is OFFLINE - Last update: {} ({} minutes ago)",
                    lastUpdate, timeSinceUpdate.toMinutes());
            return TruckStatus.OFFLINE;
        }

        // If speed is not available, assume IDLE (at least it's online)
        if (speed == null) {
            return TruckStatus.IDLE;
        }

        // Check if truck is moving
        if (speed > SPEED_THRESHOLD_KMH) {
            logger.debug("Truck is ACTIVE - Speed: {} km/h", speed);
            return TruckStatus.ACTIVE;
        } else {
            logger.debug("Truck is IDLE - Speed: {} km/h (below {} km/h threshold)",
                    speed, SPEED_THRESHOLD_KMH);
            return TruckStatus.IDLE;
        }
    }

    /**
     * Calculate status from current time (for checking existing truck records)
     */
    public TruckStatus calculateStatusFromLastUpdate(Instant lastUpdate) {
        return calculateStatus(null, lastUpdate);
    }

    /**
     * Check if truck should be marked as offline based on last update
     */
    public boolean isOffline(Instant lastUpdate) {
        if (lastUpdate == null) {
            return true;
        }
        Duration timeSinceUpdate = Duration.between(lastUpdate, Instant.now());
        return timeSinceUpdate.compareTo(OFFLINE_THRESHOLD) > 0;
    }

    /**
     * Get the offline threshold duration
     */
    public Duration getOfflineThreshold() {
        return OFFLINE_THRESHOLD;
    }

    /**
     * Get the speed threshold for determining movement
     */
    public double getSpeedThreshold() {
        return SPEED_THRESHOLD_KMH;
    }
}
