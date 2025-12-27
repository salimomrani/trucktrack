package com.trucktrack.gps.service;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.gps.dto.GPSPositionDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for KafkaProducerService - GPS event publishing to Kafka.
 * Tests message construction and Kafka template interactions.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("KafkaProducerService")
class KafkaProducerServiceTest {

    @Mock
    private KafkaTemplate<String, GPSPositionEvent> kafkaTemplate;

    private KafkaProducerService kafkaProducerService;

    private GPSPositionDTO testPositionDTO;
    private String testEventId;
    private UUID testTruckId;

    @BeforeEach
    void setUp() {
        kafkaProducerService = new KafkaProducerService(kafkaTemplate);
        ReflectionTestUtils.setField(kafkaProducerService, "gpsPositionTopic", "test-gps-topic");

        testTruckId = UUID.randomUUID();
        testEventId = UUID.randomUUID().toString();

        testPositionDTO = new GPSPositionDTO();
        testPositionDTO.setTruckId(testTruckId);
        testPositionDTO.setLatitude(48.8566);
        testPositionDTO.setLongitude(2.3522);
        testPositionDTO.setAltitude(35.0);
        testPositionDTO.setSpeed(60.0);
        testPositionDTO.setHeading(180);
        testPositionDTO.setAccuracy(5.0);
        testPositionDTO.setSatellites(8);
        testPositionDTO.setTimestamp(Instant.now());
    }

    @Nested
    @DisplayName("publishGPSPosition")
    class PublishGPSPosition {

        @Test
        @DisplayName("should publish position to configured Kafka topic")
        void should_publishToKafka_when_positionProvided() {
            // Given
            CompletableFuture<SendResult<String, GPSPositionEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(GPSPositionEvent.class)))
                .thenReturn(future);

            // When
            kafkaProducerService.publishGPSPosition(testPositionDTO, testEventId);

            // Then
            verify(kafkaTemplate).send(eq("test-gps-topic"), eq(testTruckId.toString()), any(GPSPositionEvent.class));
        }

        @Test
        @DisplayName("should use truck ID as partition key")
        void should_useTruckIdAsKey_forPartitioning() {
            // Given
            CompletableFuture<SendResult<String, GPSPositionEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(GPSPositionEvent.class)))
                .thenReturn(future);

            // When
            kafkaProducerService.publishGPSPosition(testPositionDTO, testEventId);

            // Then
            ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
            verify(kafkaTemplate).send(anyString(), keyCaptor.capture(), any());

            assertThat(keyCaptor.getValue()).isEqualTo(testTruckId.toString());
        }

        @Test
        @DisplayName("should convert DTO to event correctly")
        void should_convertDtoToEvent_correctly() {
            // Given
            CompletableFuture<SendResult<String, GPSPositionEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(GPSPositionEvent.class)))
                .thenReturn(future);

            // When
            kafkaProducerService.publishGPSPosition(testPositionDTO, testEventId);

            // Then
            ArgumentCaptor<GPSPositionEvent> eventCaptor = ArgumentCaptor.forClass(GPSPositionEvent.class);
            verify(kafkaTemplate).send(anyString(), anyString(), eventCaptor.capture());

            GPSPositionEvent capturedEvent = eventCaptor.getValue();
            assertThat(capturedEvent.getEventId()).isEqualTo(testEventId);
            assertThat(capturedEvent.getTruckId()).isEqualTo(testTruckId.toString());
            assertThat(capturedEvent.getLatitude()).isEqualTo(testPositionDTO.getLatitude());
            assertThat(capturedEvent.getLongitude()).isEqualTo(testPositionDTO.getLongitude());
            assertThat(capturedEvent.getAltitude()).isEqualTo(testPositionDTO.getAltitude());
            assertThat(capturedEvent.getSpeed()).isEqualTo(testPositionDTO.getSpeed());
            assertThat(capturedEvent.getHeading()).isEqualTo(testPositionDTO.getHeading());
            assertThat(capturedEvent.getAccuracy()).isEqualTo(testPositionDTO.getAccuracy());
            assertThat(capturedEvent.getSatellites()).isEqualTo(testPositionDTO.getSatellites());
            assertThat(capturedEvent.getTimestamp()).isEqualTo(testPositionDTO.getTimestamp());
            assertThat(capturedEvent.getIngestedAt()).isNotNull();
        }

        @Test
        @DisplayName("should set ingestedAt timestamp on event")
        void should_setIngestedAt_onEvent() {
            // Given
            CompletableFuture<SendResult<String, GPSPositionEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(GPSPositionEvent.class)))
                .thenReturn(future);

            Instant before = Instant.now();

            // When
            kafkaProducerService.publishGPSPosition(testPositionDTO, testEventId);

            Instant after = Instant.now();

            // Then
            ArgumentCaptor<GPSPositionEvent> eventCaptor = ArgumentCaptor.forClass(GPSPositionEvent.class);
            verify(kafkaTemplate).send(anyString(), anyString(), eventCaptor.capture());

            Instant ingestedAt = eventCaptor.getValue().getIngestedAt();
            assertThat(ingestedAt).isAfterOrEqualTo(before);
            assertThat(ingestedAt).isBeforeOrEqualTo(after);
        }

        @Test
        @DisplayName("should handle null optional fields in DTO")
        void should_handleNullOptionalFields() {
            // Given
            testPositionDTO.setAltitude(null);
            testPositionDTO.setSpeed(null);
            testPositionDTO.setHeading(null);
            testPositionDTO.setAccuracy(null);
            testPositionDTO.setSatellites(null);

            CompletableFuture<SendResult<String, GPSPositionEvent>> future = new CompletableFuture<>();
            when(kafkaTemplate.send(anyString(), anyString(), any(GPSPositionEvent.class)))
                .thenReturn(future);

            // When
            kafkaProducerService.publishGPSPosition(testPositionDTO, testEventId);

            // Then
            ArgumentCaptor<GPSPositionEvent> eventCaptor = ArgumentCaptor.forClass(GPSPositionEvent.class);
            verify(kafkaTemplate).send(anyString(), anyString(), eventCaptor.capture());

            GPSPositionEvent capturedEvent = eventCaptor.getValue();
            assertThat(capturedEvent.getAltitude()).isNull();
            assertThat(capturedEvent.getSpeed()).isNull();
            assertThat(capturedEvent.getHeading()).isNull();
            assertThat(capturedEvent.getAccuracy()).isNull();
            assertThat(capturedEvent.getSatellites()).isNull();
        }
    }

    @Nested
    @DisplayName("Kafka Error Handling")
    class KafkaErrorHandling {

        @Test
        @DisplayName("should not throw when Kafka send fails")
        void should_notThrow_when_kafkaSendFails() {
            // Given
            CompletableFuture<SendResult<String, GPSPositionEvent>> future = new CompletableFuture<>();
            future.completeExceptionally(new RuntimeException("Kafka connection failed"));

            when(kafkaTemplate.send(anyString(), anyString(), any(GPSPositionEvent.class)))
                .thenReturn(future);

            // When & Then - should not throw
            kafkaProducerService.publishGPSPosition(testPositionDTO, testEventId);

            // Verify send was attempted
            verify(kafkaTemplate).send(anyString(), anyString(), any(GPSPositionEvent.class));
        }

        @Test
        @DisplayName("should handle successful send completion")
        void should_handleSuccessfulSend() {
            // Given
            @SuppressWarnings("unchecked")
            SendResult<String, GPSPositionEvent> mockResult = mock(SendResult.class);
            org.apache.kafka.clients.producer.RecordMetadata metadata =
                new org.apache.kafka.clients.producer.RecordMetadata(
                    new org.apache.kafka.common.TopicPartition("test-topic", 0),
                    0, 0, 0, 0, 0);
            when(mockResult.getRecordMetadata()).thenReturn(metadata);

            CompletableFuture<SendResult<String, GPSPositionEvent>> future =
                CompletableFuture.completedFuture(mockResult);

            when(kafkaTemplate.send(anyString(), anyString(), any(GPSPositionEvent.class)))
                .thenReturn(future);

            // When & Then - should not throw
            kafkaProducerService.publishGPSPosition(testPositionDTO, testEventId);

            verify(kafkaTemplate).send(anyString(), anyString(), any(GPSPositionEvent.class));
        }
    }
}
