package com.trucktrack.gps.service;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.gps.dto.GPSPositionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.CompletableFuture;

/**
 * Service for publishing GPS position events to Kafka
 * T064: Implement KafkaProducerService to publish GPSPositionEvent to Kafka
 */
@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);

    private final KafkaTemplate<String, GPSPositionEvent> kafkaTemplate;

    @Value("${kafka.topics.gps-position:truck-track.gps.position}")
    private String gpsPositionTopic;

    public KafkaProducerService(KafkaTemplate<String, GPSPositionEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Publish GPS position to Kafka topic
     * Uses truck ID as partition key for ordered processing per truck
     */
    public void publishGPSPosition(GPSPositionDTO positionDTO, String eventId) {
        // Convert DTO to Event
        GPSPositionEvent event = convertToEvent(positionDTO, eventId);

        // Use truck ID as key for partitioning (ensures all events for same truck go to same partition)
        String key = positionDTO.getTruckId().toString();

        logger.debug("Publishing GPS position event: {} to topic: {}", eventId, gpsPositionTopic);

        // Send to Kafka asynchronously
        CompletableFuture<SendResult<String, GPSPositionEvent>> future =
                kafkaTemplate.send(gpsPositionTopic, key, event);

        // Add callback for success/failure logging
        future.whenComplete((result, ex) -> {
            if (ex != null) {
                logger.error("Failed to publish GPS position event {} for truck {}: {}",
                        eventId, positionDTO.getTruckId(), ex.getMessage(), ex);
            } else {
                logger.debug("Successfully published GPS position event {} to partition {} at offset {}",
                        eventId,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });
    }

    /**
     * Convert GPSPositionDTO to GPSPositionEvent
     */
    private GPSPositionEvent convertToEvent(GPSPositionDTO dto, String eventId) {
        GPSPositionEvent event = new GPSPositionEvent();
        event.setEventId(eventId);
        event.setTruckId(dto.getTruckId().toString());
        event.setLatitude(dto.getLatitude());
        event.setLongitude(dto.getLongitude());
        event.setAltitude(dto.getAltitude());
        event.setSpeed(dto.getSpeed());
        event.setHeading(dto.getHeading());
        event.setAccuracy(dto.getAccuracy());
        event.setSatellites(dto.getSatellites());
        event.setTimestamp(dto.getTimestamp());
        event.setIngestedAt(Instant.now());
        return event;
    }
}
