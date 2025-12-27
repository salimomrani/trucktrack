package com.trucktrack.location.integration;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.location.consumer.LocationKafkaConsumer;
import com.trucktrack.location.service.LocationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LocationKafkaConsumer - Kafka message consumption.
 * Tests the consumer's interaction with LocationService.
 * Note: Full integration tests with embedded Kafka require additional infrastructure setup.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Kafka Consumer Integration Tests")
class KafkaIntegrationTest {

    @Mock
    private LocationService locationService;

    @InjectMocks
    private LocationKafkaConsumer locationKafkaConsumer;

    private GPSPositionEvent testEvent;
    private UUID truckId;

    @BeforeEach
    void setUp() {
        truckId = UUID.randomUUID();

        testEvent = new GPSPositionEvent();
        testEvent.setEventId(UUID.randomUUID().toString());
        testEvent.setTruckId(truckId.toString());
        testEvent.setTruckIdReadable("TRK-TEST-001");
        testEvent.setLatitude(48.8566);
        testEvent.setLongitude(2.3522);
        testEvent.setAltitude(35.0);
        testEvent.setSpeed(60.0);
        testEvent.setHeading(180);
        testEvent.setAccuracy(5.0);
        testEvent.setSatellites(8);
        testEvent.setTimestamp(Instant.now());
        testEvent.setIngestedAt(Instant.now());
    }

    @Nested
    @DisplayName("consumeGPSPosition")
    class ConsumeGPSPosition {

        @Test
        @DisplayName("should call LocationService to process GPS event")
        void should_callLocationService_when_eventReceived() {
            // When
            locationKafkaConsumer.consumeGPSPosition(testEvent, 0, 100L);

            // Then
            verify(locationService).processGPSPosition(testEvent);
        }

        @Test
        @DisplayName("should process events from different partitions")
        void should_processEventsFromDifferentPartitions() {
            // Given
            GPSPositionEvent event2 = createEvent(UUID.randomUUID());

            // When
            locationKafkaConsumer.consumeGPSPosition(testEvent, 0, 100L);
            locationKafkaConsumer.consumeGPSPosition(event2, 1, 50L);

            // Then
            verify(locationService, times(2)).processGPSPosition(any(GPSPositionEvent.class));
        }

        @Test
        @DisplayName("should rethrow exception when processing fails")
        void should_rethrowException_when_processingFails() {
            // Given
            doThrow(new RuntimeException("Database connection failed"))
                .when(locationService).processGPSPosition(any());

            // When & Then
            assertThatThrownBy(() ->
                locationKafkaConsumer.consumeGPSPosition(testEvent, 0, 100L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Database connection failed");
        }

        @Test
        @DisplayName("should process event with all GPS fields")
        void should_processEvent_withAllGpsFields() {
            // Given - event with all fields populated
            testEvent.setAltitude(500.0);
            testEvent.setSpeed(80.0);
            testEvent.setHeading(270);
            testEvent.setAccuracy(3.0);
            testEvent.setSatellites(12);

            // When
            locationKafkaConsumer.consumeGPSPosition(testEvent, 0, 100L);

            // Then
            verify(locationService).processGPSPosition(testEvent);
        }

        @Test
        @DisplayName("should process event with minimal GPS fields")
        void should_processEvent_withMinimalGpsFields() {
            // Given - event with only required fields
            GPSPositionEvent minimalEvent = new GPSPositionEvent();
            minimalEvent.setEventId(UUID.randomUUID().toString());
            minimalEvent.setTruckId(truckId.toString());
            minimalEvent.setLatitude(48.8566);
            minimalEvent.setLongitude(2.3522);
            minimalEvent.setTimestamp(Instant.now());

            // When
            locationKafkaConsumer.consumeGPSPosition(minimalEvent, 0, 100L);

            // Then
            verify(locationService).processGPSPosition(minimalEvent);
        }
    }

    @Nested
    @DisplayName("Error Handling")
    class ErrorHandling {

        @Test
        @DisplayName("should propagate service exceptions for retry mechanism")
        void should_propagateExceptions_forRetryMechanism() {
            // Given
            RuntimeException serviceException = new RuntimeException("Service unavailable");
            doThrow(serviceException).when(locationService).processGPSPosition(any());

            // When & Then - exception should propagate to trigger Kafka retry
            assertThatThrownBy(() ->
                locationKafkaConsumer.consumeGPSPosition(testEvent, 0, 100L))
                .isSameAs(serviceException);
        }
    }

    private GPSPositionEvent createEvent(UUID truckId) {
        GPSPositionEvent event = new GPSPositionEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setTruckId(truckId.toString());
        event.setLatitude(48.8566);
        event.setLongitude(2.3522);
        event.setTimestamp(Instant.now());
        return event;
    }
}
