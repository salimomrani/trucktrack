package com.trucktrack.location.service;

import com.trucktrack.location.model.Trip;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Publishes trip events to Kafka for notification-service consumption.
 * Feature: 016-email-notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TripEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.trips-completed:truck-track.trips.completed}")
    private String tripsCompletedTopic;

    @Value("${kafka.topics.trips-assigned:truck-track.trips.assigned}")
    private String tripsAssignedTopic;

    /**
     * Publish event when a trip is completed
     */
    public void publishTripCompleted(Trip trip, String signerName, String signatureUrl,
                                      java.util.List<String> photoUrls) {
        Map<String, Object> event = new HashMap<>();
        event.put("tripId", trip.getId().toString());
        event.put("driverId", trip.getAssignedDriverId() != null ? trip.getAssignedDriverId().toString() : null);
        event.put("truckId", trip.getAssignedTruckId() != null ? trip.getAssignedTruckId().toString() : null);
        event.put("origin", trip.getOrigin());
        event.put("destination", trip.getDestination());
        event.put("completedAt", trip.getCompletedAt() != null ? trip.getCompletedAt().toString() : Instant.now().toString());
        event.put("recipientEmail", trip.getRecipientEmail());
        event.put("recipientName", trip.getRecipientName());
        event.put("signerName", signerName);
        event.put("signatureUrl", signatureUrl);
        event.put("photoUrls", photoUrls);
        event.put("orderNumber", trip.getId().toString().substring(0, 8).toUpperCase());

        kafkaTemplate.send(tripsCompletedTopic, trip.getId().toString(), event);
        log.info("Published trip completed event for trip: {}", trip.getId());
    }

    /**
     * Publish event when a trip is assigned to a driver
     */
    public void publishTripAssigned(Trip trip, String vehiclePlate) {
        Map<String, Object> event = new HashMap<>();
        event.put("tripId", trip.getId().toString());
        event.put("type", "NEW_ASSIGNMENT");
        event.put("newDriverId", trip.getAssignedDriverId() != null ? trip.getAssignedDriverId().toString() : null);
        event.put("newTruckId", trip.getAssignedTruckId() != null ? trip.getAssignedTruckId().toString() : null);
        event.put("vehiclePlate", vehiclePlate);
        event.put("origin", trip.getOrigin());
        event.put("destination", trip.getDestination());
        event.put("scheduledDeparture", trip.getScheduledAt() != null ? trip.getScheduledAt().toString() : null);
        event.put("recipientEmail", trip.getRecipientEmail());
        event.put("recipientName", trip.getRecipientName());

        kafkaTemplate.send(tripsAssignedTopic, trip.getId().toString(), event);
        log.info("Published trip assigned event for trip: {}", trip.getId());
    }

    /**
     * Publish event when a trip is reassigned to a different driver
     */
    public void publishTripReassigned(Trip trip, UUID previousDriverId, String vehiclePlate) {
        Map<String, Object> event = new HashMap<>();
        event.put("tripId", trip.getId().toString());
        event.put("type", "REASSIGNMENT");
        event.put("newDriverId", trip.getAssignedDriverId() != null ? trip.getAssignedDriverId().toString() : null);
        event.put("previousDriverId", previousDriverId != null ? previousDriverId.toString() : null);
        event.put("newTruckId", trip.getAssignedTruckId() != null ? trip.getAssignedTruckId().toString() : null);
        event.put("vehiclePlate", vehiclePlate);
        event.put("origin", trip.getOrigin());
        event.put("destination", trip.getDestination());
        event.put("scheduledDeparture", trip.getScheduledAt() != null ? trip.getScheduledAt().toString() : null);

        kafkaTemplate.send(tripsAssignedTopic, trip.getId().toString(), event);
        log.info("Published trip reassigned event for trip: {}", trip.getId());
    }

    /**
     * Publish event when a trip is cancelled
     */
    public void publishTripCancelled(Trip trip, UUID previousDriverId, String reason) {
        Map<String, Object> event = new HashMap<>();
        event.put("tripId", trip.getId().toString());
        event.put("type", "CANCELLATION");
        event.put("previousDriverId", previousDriverId != null ? previousDriverId.toString() : null);
        event.put("origin", trip.getOrigin());
        event.put("destination", trip.getDestination());
        event.put("cancellationReason", reason);

        kafkaTemplate.send(tripsAssignedTopic, trip.getId().toString(), event);
        log.info("Published trip cancelled event for trip: {}", trip.getId());
    }
}
