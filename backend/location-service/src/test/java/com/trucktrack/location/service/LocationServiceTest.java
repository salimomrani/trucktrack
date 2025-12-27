package com.trucktrack.location.service;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.GPSPositionRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.websocket.LocationWebSocketHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LocationService - GPS position processing.
 * Tests position updates, status calculations, and cache/WebSocket interactions.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LocationService")
class LocationServiceTest {

    @Mock
    private GPSPositionRepository gpsPositionRepository;

    @Mock
    private TruckRepository truckRepository;

    @Mock
    private RedisCacheService redisCacheService;

    @Mock
    private TruckStatusService truckStatusService;

    @Mock
    private LocationWebSocketHandler webSocketHandler;

    @InjectMocks
    private LocationService locationService;

    private UUID truckId;
    private Truck testTruck;
    private GPSPositionEvent testEvent;

    @BeforeEach
    void setUp() {
        truckId = UUID.randomUUID();

        testTruck = new Truck();
        testTruck.setId(truckId);
        testTruck.setTruckId("TRK-001");
        testTruck.setStatus(TruckStatus.IDLE);
        testTruck.setCurrentLatitude(BigDecimal.valueOf(48.8566));
        testTruck.setCurrentLongitude(BigDecimal.valueOf(2.3522));

        testEvent = createTestEvent(truckId.toString(), 48.8570, 2.3525, 45.0);
    }

    private GPSPositionEvent createTestEvent(String truckId, Double lat, Double lon, Double speed) {
        GPSPositionEvent event = new GPSPositionEvent();
        event.setTruckId(truckId);
        event.setLatitude(lat);
        event.setLongitude(lon);
        event.setSpeed(speed);
        event.setHeading(180);
        event.setAccuracy(5.0);
        event.setTimestamp(Instant.now());
        event.setEventId(UUID.randomUUID().toString());
        return event;
    }

    @Nested
    @DisplayName("processGPSPosition")
    class ProcessGPSPosition {

        @Test
        @DisplayName("should save GPS position to database")
        void should_savePosition_when_eventProcessed() {
            // Given
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(anyDouble(), any(Instant.class))).thenReturn(TruckStatus.ACTIVE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            verify(gpsPositionRepository).save(any());
        }

        @Test
        @DisplayName("should update truck current position")
        void should_updateTruckPosition_when_eventProcessed() {
            // Given
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(anyDouble(), any(Instant.class))).thenReturn(TruckStatus.ACTIVE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            ArgumentCaptor<Truck> truckCaptor = ArgumentCaptor.forClass(Truck.class);
            verify(truckRepository).save(truckCaptor.capture());

            Truck savedTruck = truckCaptor.getValue();
            assertThat(savedTruck.getCurrentLatitude().doubleValue()).isEqualTo(testEvent.getLatitude());
            assertThat(savedTruck.getCurrentLongitude().doubleValue()).isEqualTo(testEvent.getLongitude());
            assertThat(savedTruck.getCurrentSpeed().doubleValue()).isEqualTo(testEvent.getSpeed());
        }

        @Test
        @DisplayName("should update Redis cache with current position")
        void should_updateCache_when_eventProcessed() {
            // Given
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(anyDouble(), any(Instant.class))).thenReturn(TruckStatus.ACTIVE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            verify(redisCacheService).cacheCurrentPosition(eq(truckId), eq(testEvent));
        }

        @Test
        @DisplayName("should broadcast WebSocket update")
        void should_broadcastWebSocket_when_eventProcessed() {
            // Given
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(anyDouble(), any(Instant.class))).thenReturn(TruckStatus.ACTIVE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            verify(webSocketHandler).sendPositionUpdate(eq(testEvent));
        }

        @Test
        @DisplayName("should throw exception when truck not found")
        void should_throwException_when_truckNotFound() {
            // Given
            when(truckRepository.findById(truckId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> locationService.processGPSPosition(testEvent))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Truck not found");
        }

        @Test
        @DisplayName("should calculate and update truck status")
        void should_updateStatus_when_eventProcessed() {
            // Given
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(anyDouble(), any(Instant.class))).thenReturn(TruckStatus.ACTIVE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            verify(truckStatusService).calculateStatus(eq(testEvent.getSpeed()), any(Instant.class));

            ArgumentCaptor<Truck> truckCaptor = ArgumentCaptor.forClass(Truck.class);
            verify(truckRepository).save(truckCaptor.capture());
            assertThat(truckCaptor.getValue().getStatus()).isEqualTo(TruckStatus.ACTIVE);
        }

        @Test
        @DisplayName("should notify WebSocket on status change")
        void should_notifyStatusChange_when_statusChanges() {
            // Given
            testTruck.setStatus(TruckStatus.IDLE);
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(anyDouble(), any(Instant.class))).thenReturn(TruckStatus.ACTIVE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            verify(webSocketHandler).notifyStatusChange(eq(truckId), eq("IDLE"), eq("ACTIVE"));
        }

        @Test
        @DisplayName("should not notify when status unchanged")
        void should_notNotifyStatusChange_when_statusUnchanged() {
            // Given
            testTruck.setStatus(TruckStatus.ACTIVE);
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(anyDouble(), any(Instant.class))).thenReturn(TruckStatus.ACTIVE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            verify(webSocketHandler, never()).notifyStatusChange(any(), anyString(), anyString());
        }

        @Test
        @DisplayName("should handle null speed in event")
        void should_handleNullSpeed_when_speedMissing() {
            // Given
            testEvent.setSpeed(null);
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(truckStatusService.calculateStatus(isNull(), any(Instant.class))).thenReturn(TruckStatus.IDLE);

            // When
            locationService.processGPSPosition(testEvent);

            // Then
            ArgumentCaptor<Truck> truckCaptor = ArgumentCaptor.forClass(Truck.class);
            verify(truckRepository).save(truckCaptor.capture());
            assertThat(truckCaptor.getValue().getCurrentSpeed()).isNull();
        }
    }
}
