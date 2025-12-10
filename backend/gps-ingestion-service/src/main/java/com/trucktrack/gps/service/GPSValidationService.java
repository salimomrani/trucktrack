package com.trucktrack.gps.service;

import com.trucktrack.gps.dto.GPSPositionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Service for GPS position validation beyond basic annotations
 * T065: Implement GPS validation logic (lat/lng range, timestamp within ±5 min)
 */
@Service
public class GPSValidationService {

    private static final Logger logger = LoggerFactory.getLogger(GPSValidationService.class);

    // Allow timestamps within ±5 minutes of current time
    private static final Duration MAX_TIME_DRIFT = Duration.ofMinutes(5);

    /**
     * Validate GPS position data
     * Throws IllegalArgumentException if validation fails
     */
    public void validate(GPSPositionDTO position) {
        validateTimestamp(position.getTimestamp());
        validateCoordinates(position.getLatitude(), position.getLongitude());
        validateOptionalFields(position);
    }

    /**
     * Validate timestamp is within acceptable range (not too old, not in future)
     */
    private void validateTimestamp(Instant timestamp) {
        if (timestamp == null) {
            throw new IllegalArgumentException("Timestamp is required");
        }

        Instant now = Instant.now();
        Duration timeDiff = Duration.between(timestamp, now);

        // Check if timestamp is too far in the past
        if (timeDiff.compareTo(MAX_TIME_DRIFT) > 0) {
            logger.warn("GPS timestamp is too old: {} (current: {})", timestamp, now);
            throw new IllegalArgumentException(
                    String.format("Timestamp is too old. Must be within %d minutes of current time",
                            MAX_TIME_DRIFT.toMinutes())
            );
        }

        // Check if timestamp is in the future (with tolerance)
        if (timeDiff.negated().compareTo(MAX_TIME_DRIFT) > 0) {
            logger.warn("GPS timestamp is in the future: {} (current: {})", timestamp, now);
            throw new IllegalArgumentException(
                    String.format("Timestamp cannot be more than %d minutes in the future",
                            MAX_TIME_DRIFT.toMinutes())
            );
        }
    }

    /**
     * Validate latitude and longitude are within valid ranges
     */
    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }

        // Latitude: -90 to 90
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException(
                    String.format("Latitude must be between -90 and 90, got: %.6f", latitude)
            );
        }

        // Longitude: -180 to 180
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException(
                    String.format("Longitude must be between -180 and 180, got: %.6f", longitude)
            );
        }

        // Check for invalid coordinates (0, 0) which often indicates GPS error
        if (latitude == 0.0 && longitude == 0.0) {
            logger.warn("Received potentially invalid GPS coordinates: (0, 0)");
            throw new IllegalArgumentException(
                    "Invalid GPS coordinates: (0, 0) likely indicates GPS signal loss"
            );
        }
    }

    /**
     * Validate optional fields if present
     */
    private void validateOptionalFields(GPSPositionDTO position) {
        // Validate altitude if present
        if (position.getAltitude() != null && position.getAltitude() < -500.0) {
            logger.warn("Suspicious altitude value: {} meters", position.getAltitude());
            throw new IllegalArgumentException(
                    String.format("Altitude seems invalid: %.2f meters (too low)", position.getAltitude())
            );
        }

        if (position.getAltitude() != null && position.getAltitude() > 9000.0) {
            logger.warn("Suspicious altitude value: {} meters (commercial trucks don't fly)", position.getAltitude());
            throw new IllegalArgumentException(
                    String.format("Altitude seems invalid: %.2f meters (too high for trucks)", position.getAltitude())
            );
        }

        // Validate speed if present (trucks shouldn't exceed 200 km/h)
        if (position.getSpeed() != null && position.getSpeed() > 200.0) {
            logger.warn("Suspicious speed value: {} km/h", position.getSpeed());
            throw new IllegalArgumentException(
                    String.format("Speed seems invalid: %.2f km/h (too fast for trucks)", position.getSpeed())
            );
        }

        // Validate heading if present
        if (position.getHeading() != null && (position.getHeading() < 0 || position.getHeading() > 359)) {
            throw new IllegalArgumentException(
                    String.format("Heading must be between 0 and 359, got: %d", position.getHeading())
            );
        }

        // Validate accuracy if present (GPS accuracy in meters, should be reasonable)
        if (position.getAccuracy() != null && position.getAccuracy() > 1000.0) {
            logger.warn("Poor GPS accuracy: {} meters", position.getAccuracy());
            // Note: We log but don't reject - poor accuracy data is still useful
        }
    }

    /**
     * Check if GPS coordinates are likely on land (basic check)
     * This is a simplified check - production should use a proper land/sea database
     */
    public boolean isLikelyOnLand(Double latitude, Double longitude) {
        // Very basic heuristic - reject if coordinates are in middle of ocean
        // This is oversimplified and should be replaced with proper geospatial check

        // For now, just accept all valid coordinates
        // TODO: Integrate with land/sea boundary database
        return true;
    }
}
