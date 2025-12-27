package com.trucktrack.location.service;

import com.trucktrack.location.model.TruckStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for TruckStatusService - truck status calculation logic.
 * Tests status determination based on speed and last update time.
 */
@DisplayName("TruckStatusService")
class TruckStatusServiceTest {

    private TruckStatusService truckStatusService;

    @BeforeEach
    void setUp() {
        truckStatusService = new TruckStatusService();
    }

    @Nested
    @DisplayName("calculateStatus")
    class CalculateStatus {

        @Test
        @DisplayName("should return ACTIVE when speed above threshold and recent update")
        void should_returnActive_when_movingAndRecent() {
            // Given
            Double speed = 60.0; // km/h - above 5 km/h threshold
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(1)); // 1 min ago

            // When
            TruckStatus status = truckStatusService.calculateStatus(speed, lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.ACTIVE);
        }

        @Test
        @DisplayName("should return IDLE when speed below threshold and recent update")
        void should_returnIdle_when_stationaryAndRecent() {
            // Given
            Double speed = 2.0; // km/h - below 5 km/h threshold
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(1)); // 1 min ago

            // When
            TruckStatus status = truckStatusService.calculateStatus(speed, lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.IDLE);
        }

        @Test
        @DisplayName("should return IDLE when speed equals threshold")
        void should_returnIdle_when_speedEqualsThreshold() {
            // Given
            Double speed = 5.0; // km/h - exactly at threshold
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(1));

            // When
            TruckStatus status = truckStatusService.calculateStatus(speed, lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.IDLE);
        }

        @Test
        @DisplayName("should return OFFLINE when update is older than 5 minutes")
        void should_returnOffline_when_updateIsStale() {
            // Given
            Double speed = 60.0; // Even with high speed
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(6)); // 6 min ago

            // When
            TruckStatus status = truckStatusService.calculateStatus(speed, lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.OFFLINE);
        }

        @Test
        @DisplayName("should return OFFLINE when lastUpdate is null")
        void should_returnOffline_when_lastUpdateIsNull() {
            // When
            TruckStatus status = truckStatusService.calculateStatus(60.0, null);

            // Then
            assertThat(status).isEqualTo(TruckStatus.OFFLINE);
        }

        @Test
        @DisplayName("should return IDLE when speed is null but update is recent")
        void should_returnIdle_when_speedIsNull() {
            // Given
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(1));

            // When
            TruckStatus status = truckStatusService.calculateStatus(null, lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.IDLE);
        }

        @Test
        @DisplayName("should return ACTIVE for speed just above threshold")
        void should_returnActive_when_speedJustAboveThreshold() {
            // Given
            Double speed = 5.1; // Just above 5 km/h threshold
            Instant lastUpdate = Instant.now();

            // When
            TruckStatus status = truckStatusService.calculateStatus(speed, lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.ACTIVE);
        }

        @Test
        @DisplayName("should handle edge case just under 5 minute mark")
        void should_returnActive_when_justUnderThreshold() {
            // Given - just under 5 minute threshold (4 min 59 sec)
            Double speed = 10.0;
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(4).plusSeconds(59));

            // When
            TruckStatus status = truckStatusService.calculateStatus(speed, lastUpdate);

            // Then - under 5 min threshold, should be ACTIVE (speed > 5)
            assertThat(status).isEqualTo(TruckStatus.ACTIVE);
        }
    }

    @Nested
    @DisplayName("calculateStatusFromLastUpdate")
    class CalculateStatusFromLastUpdate {

        @Test
        @DisplayName("should return IDLE for recent update without speed")
        void should_returnIdle_when_recentUpdate() {
            // Given
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(1));

            // When
            TruckStatus status = truckStatusService.calculateStatusFromLastUpdate(lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.IDLE);
        }

        @Test
        @DisplayName("should return OFFLINE for stale update")
        void should_returnOffline_when_staleUpdate() {
            // Given
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(10));

            // When
            TruckStatus status = truckStatusService.calculateStatusFromLastUpdate(lastUpdate);

            // Then
            assertThat(status).isEqualTo(TruckStatus.OFFLINE);
        }
    }

    @Nested
    @DisplayName("isOffline")
    class IsOffline {

        @Test
        @DisplayName("should return true when update is stale")
        void should_returnTrue_when_updateIsStale() {
            // Given
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(10));

            // When & Then
            assertThat(truckStatusService.isOffline(lastUpdate)).isTrue();
        }

        @Test
        @DisplayName("should return false when update is recent")
        void should_returnFalse_when_updateIsRecent() {
            // Given
            Instant lastUpdate = Instant.now().minus(Duration.ofMinutes(2));

            // When & Then
            assertThat(truckStatusService.isOffline(lastUpdate)).isFalse();
        }

        @Test
        @DisplayName("should return true when lastUpdate is null")
        void should_returnTrue_when_lastUpdateIsNull() {
            // When & Then
            assertThat(truckStatusService.isOffline(null)).isTrue();
        }
    }

    @Nested
    @DisplayName("getThresholds")
    class GetThresholds {

        @Test
        @DisplayName("should return correct offline threshold")
        void should_returnCorrectOfflineThreshold() {
            // When & Then
            assertThat(truckStatusService.getOfflineThreshold()).isEqualTo(Duration.ofMinutes(5));
        }

        @Test
        @DisplayName("should return correct speed threshold")
        void should_returnCorrectSpeedThreshold() {
            // When & Then
            assertThat(truckStatusService.getSpeedThreshold()).isEqualTo(5.0);
        }
    }
}
