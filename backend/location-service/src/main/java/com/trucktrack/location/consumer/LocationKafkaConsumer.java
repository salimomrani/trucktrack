package com.trucktrack.location.consumer;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.location.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for GPS position events
 * T066: Implement LocationKafkaConsumer to consume truck-track.gps.position topic
 * Refactored with Lombok best practices
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LocationKafkaConsumer {

    private final LocationService locationService;

    /**
     * Consume GPS position events from Kafka
     * Consumer group: location-service-group
     * Topic: truck-track.gps.position
     * Concurrency: 3 (can process 3 partitions in parallel)
     */
    @KafkaListener(
        topics = "${kafka.topics.gps-position:truck-track.gps.position}",
        groupId = "${spring.kafka.consumer.group-id:location-service-group}",
        concurrency = "3"
    )
    public void consumeGPSPosition(
            @Payload GPSPositionEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {

        try {
            log.debug("Received GPS position event: {} from partition: {}, offset: {}",
                    event.getEventId(), partition, offset);

            // Process the GPS position (save to DB, update cache, calculate status)
            locationService.processGPSPosition(event);

            log.debug("Successfully processed GPS position event: {}", event.getEventId());

        } catch (Exception e) {
            log.error("Failed to process GPS position event: {} - Error: {}",
                    event.getEventId(), e.getMessage(), e);
            // Note: Exception will trigger retry based on Kafka consumer configuration
            // After max retries, message goes to DLQ (Dead Letter Queue) if configured
            throw e; // Rethrow to trigger Kafka retry mechanism
        }
    }
}
