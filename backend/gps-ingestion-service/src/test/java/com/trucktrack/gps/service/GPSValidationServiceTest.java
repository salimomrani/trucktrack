package com.trucktrack.gps.service;

import com.trucktrack.gps.dto.GPSPositionDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for GPSValidationService - GPS data validation logic.
 * Tests coordinate validation, timestamp checks, and speed/altitude limits.
 */
@DisplayName("GPSValidationService")
class GPSValidationServiceTest {

    private GPSValidationService validationService;

    @BeforeEach
    void setUp() {
        validationService = new GPSValidationService();
    }

    private GPSPositionDTO createValidPosition() {
        GPSPositionDTO dto = new GPSPositionDTO();
        dto.setTruckId(UUID.randomUUID());
        dto.setLatitude(48.8566);
        dto.setLongitude(2.3522);
        dto.setTimestamp(Instant.now());
        dto.setSpeed(60.0);
        dto.setHeading(180);
        dto.setAccuracy(5.0);
        return dto;
    }

    @Nested
    @DisplayName("Coordinate Validation")
    class CoordinateValidation {

        @Test
        @DisplayName("should accept valid coordinates")
        void should_acceptValidCoordinates() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLatitude(48.8566);
            dto.setLongitude(2.3522);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should reject latitude greater than 90")
        void should_rejectLatitudeAbove90() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLatitude(91.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude must be between -90 and 90");
        }

        @Test
        @DisplayName("should reject latitude less than -90")
        void should_rejectLatitudeBelow90() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLatitude(-91.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude must be between -90 and 90");
        }

        @Test
        @DisplayName("should reject longitude greater than 180")
        void should_rejectLongitudeAbove180() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLongitude(181.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Longitude must be between -180 and 180");
        }

        @Test
        @DisplayName("should reject longitude less than -180")
        void should_rejectLongitudeBelow180() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLongitude(-181.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Longitude must be between -180 and 180");
        }

        @Test
        @DisplayName("should reject coordinates at 0,0 (null island)")
        void should_rejectNullIslandCoordinates() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLatitude(0.0);
            dto.setLongitude(0.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid GPS coordinates: (0, 0)");
        }

        @Test
        @DisplayName("should reject null latitude")
        void should_rejectNullLatitude() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLatitude(null);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude and longitude are required");
        }

        @Test
        @DisplayName("should reject null longitude")
        void should_rejectNullLongitude() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLongitude(null);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude and longitude are required");
        }

        @Test
        @DisplayName("should accept boundary coordinates")
        void should_acceptBoundaryCoordinates() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setLatitude(90.0);
            dto.setLongitude(180.0);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Timestamp Validation")
    class TimestampValidation {

        @Test
        @DisplayName("should accept current timestamp")
        void should_acceptCurrentTimestamp() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setTimestamp(Instant.now());

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should accept timestamp within 5 minutes in past")
        void should_acceptRecentPastTimestamp() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setTimestamp(Instant.now().minus(4, ChronoUnit.MINUTES));

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should reject timestamp too far in past")
        void should_rejectOldTimestamp() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setTimestamp(Instant.now().minus(10, ChronoUnit.MINUTES));

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Timestamp is too old");
        }

        @Test
        @DisplayName("should reject timestamp too far in future")
        void should_rejectFutureTimestamp() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setTimestamp(Instant.now().plus(10, ChronoUnit.MINUTES));

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be more than");
        }

        @Test
        @DisplayName("should reject null timestamp")
        void should_rejectNullTimestamp() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setTimestamp(null);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Timestamp is required");
        }
    }

    @Nested
    @DisplayName("Speed Validation")
    class SpeedValidation {

        @Test
        @DisplayName("should accept valid speed")
        void should_acceptValidSpeed() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setSpeed(80.0);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should reject speed above 200 km/h")
        void should_rejectExcessiveSpeed() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setSpeed(250.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Speed seems invalid");
        }

        @Test
        @DisplayName("should accept null speed")
        void should_acceptNullSpeed() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setSpeed(null);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should accept zero speed")
        void should_acceptZeroSpeed() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setSpeed(0.0);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Altitude Validation")
    class AltitudeValidation {

        @Test
        @DisplayName("should accept valid altitude")
        void should_acceptValidAltitude() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setAltitude(500.0);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should reject altitude below -500m")
        void should_rejectTooLowAltitude() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setAltitude(-600.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Altitude seems invalid");
        }

        @Test
        @DisplayName("should reject altitude above 9000m")
        void should_rejectTooHighAltitude() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setAltitude(10000.0);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Altitude seems invalid");
        }

        @Test
        @DisplayName("should accept null altitude")
        void should_acceptNullAltitude() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setAltitude(null);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Heading Validation")
    class HeadingValidation {

        @Test
        @DisplayName("should accept valid heading")
        void should_acceptValidHeading() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setHeading(180);

            // When & Then
            assertThatCode(() -> validationService.validate(dto))
                .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should reject heading below 0")
        void should_rejectNegativeHeading() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setHeading(-10);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Heading must be between 0 and 359");
        }

        @Test
        @DisplayName("should reject heading above 359")
        void should_rejectHeadingAbove359() {
            // Given
            GPSPositionDTO dto = createValidPosition();
            dto.setHeading(360);

            // When & Then
            assertThatThrownBy(() -> validationService.validate(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Heading must be between 0 and 359");
        }
    }
}
