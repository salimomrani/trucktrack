package com.trucktrack.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.RecipientType;
import com.trucktrack.notification.service.EmailService;
import com.trucktrack.notification.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TripEventConsumer {

    private final EmailService emailService;
    private final PushNotificationService pushNotificationService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @KafkaListener(topics = "truck-track.trips.completed", groupId = "notification-service-group")
    public void handleTripCompleted(ConsumerRecord<String, String> record) {
        try {
            TripCompletedPayload payload = objectMapper.readValue(record.value(), TripCompletedPayload.class);
            log.info("Received trip completed event for trip: {}", payload.tripId);

            // Send email to client
            if (payload.recipientEmail != null && !payload.recipientEmail.isBlank()) {
                Map<String, Object> variables = new HashMap<>();
                variables.put("recipientName", payload.recipientName != null ? payload.recipientName : "Client");
                variables.put("orderNumber", payload.orderNumber != null ? payload.orderNumber : payload.tripId);
                variables.put("deliveryDate", payload.completedAt != null ?
                        payload.completedAt : java.time.LocalDateTime.now().format(DATE_FORMATTER));
                variables.put("signerName", payload.signerName != null ? payload.signerName : "N/A");
                variables.put("signatureUrl", payload.signatureUrl);
                variables.put("photoUrls", payload.photoUrls);
                variables.put("destination", payload.destination);

                emailService.sendEmail(
                        payload.recipientEmail,
                        payload.recipientName,
                        NotificationType.DELIVERY_CONFIRMED,
                        variables,
                        null, // Client may not have user ID
                        RecipientType.CLIENT,
                        "fr"
                );

                // Also send push if client has user account
                if (payload.recipientUserId != null) {
                    pushNotificationService.sendPushToUser(
                            payload.recipientUserId,
                            NotificationType.DELIVERY_CONFIRMED,
                            variables,
                            "fr",
                            RecipientType.CLIENT
                    );
                }
            }

        } catch (Exception e) {
            log.error("Error processing trip completed event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "truck-track.trips.started", groupId = "notification-service-group")
    public void handleTripStarted(ConsumerRecord<String, String> record) {
        try {
            TripStartedPayload payload = objectMapper.readValue(record.value(), TripStartedPayload.class);
            log.info("Received trip started event for trip: {}", payload.tripId);

            // Send email to client when driver starts delivery
            if (payload.recipientEmail != null && !payload.recipientEmail.isBlank()) {
                Map<String, Object> variables = new HashMap<>();
                variables.put("recipientName", payload.recipientName != null ? payload.recipientName : "Client");
                variables.put("orderNumber", payload.orderNumber != null ? payload.orderNumber : payload.tripId);
                variables.put("origin", payload.origin);
                variables.put("destination", payload.destination);
                variables.put("vehiclePlate", payload.vehiclePlate);
                variables.put("startedAt", payload.startedAt != null ?
                        payload.startedAt : java.time.LocalDateTime.now().format(DATE_FORMATTER));

                emailService.sendEmail(
                        payload.recipientEmail,
                        payload.recipientName,
                        NotificationType.TRIP_STARTED,
                        variables,
                        null,
                        RecipientType.CLIENT,
                        "fr"
                );
            }

        } catch (Exception e) {
            log.error("Error processing trip started event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "truck-track.trips.assigned", groupId = "notification-service-group")
    public void handleTripAssigned(ConsumerRecord<String, String> record) {
        try {
            TripAssignedPayload payload = objectMapper.readValue(record.value(), TripAssignedPayload.class);
            log.info("Received trip assigned event for trip: {} (type: {})", payload.tripId, payload.type);

            Map<String, Object> variables = new HashMap<>();
            variables.put("destination", payload.destination);
            variables.put("departureTime", payload.scheduledDeparture);
            variables.put("tripId", payload.tripId);

            switch (payload.type) {
                case "NEW_ASSIGNMENT":
                    // Notify driver
                    if (payload.newDriverId != null) {
                        pushNotificationService.sendPushToUser(
                                payload.newDriverId,
                                NotificationType.TRIP_ASSIGNED,
                                variables,
                                "fr",
                                RecipientType.DRIVER
                        );
                    }

                    // Notify client
                    if (payload.recipientEmail != null && !payload.recipientEmail.isBlank()) {
                        variables.put("recipientName", payload.recipientName != null ? payload.recipientName : "Client");
                        variables.put("vehiclePlate", payload.vehiclePlate);
                        variables.put("estimatedDate", payload.estimatedArrival);

                        emailService.sendEmail(
                                payload.recipientEmail,
                                payload.recipientName,
                                NotificationType.TRIP_ASSIGNED,
                                variables,
                                null,
                                RecipientType.CLIENT,
                                "fr"
                        );
                    }
                    break;

                case "REASSIGNMENT":
                    // Notify old driver
                    if (payload.previousDriverId != null) {
                        pushNotificationService.sendPushToUser(
                                payload.previousDriverId,
                                NotificationType.TRIP_REASSIGNED,
                                variables,
                                "fr",
                                RecipientType.DRIVER
                        );
                    }

                    // Notify new driver
                    if (payload.newDriverId != null) {
                        pushNotificationService.sendPushToUser(
                                payload.newDriverId,
                                NotificationType.TRIP_ASSIGNED,
                                variables,
                                "fr",
                                RecipientType.DRIVER
                        );
                    }
                    break;

                case "CANCELLATION":
                    variables.put("reason", payload.cancellationReason != null ? payload.cancellationReason : "Non spécifiée");

                    // Notify driver
                    if (payload.previousDriverId != null) {
                        pushNotificationService.sendPushToUser(
                                payload.previousDriverId,
                                NotificationType.TRIP_CANCELLED,
                                variables,
                                "fr",
                                RecipientType.DRIVER
                        );
                    }
                    break;
            }

        } catch (Exception e) {
            log.error("Error processing trip assigned event: {}", e.getMessage(), e);
        }
    }

    // Payload classes for deserialization
    @lombok.Data
    static class TripCompletedPayload {
        String tripId;
        String driverId;
        String truckId;
        String origin;
        String destination;
        String completedAt;
        String recipientEmail;
        String recipientName;
        java.util.UUID recipientUserId;
        String proofId;
        String signerName;
        String signatureUrl;
        java.util.List<String> photoUrls;
        String orderNumber;
    }

    @lombok.Data
    static class TripStartedPayload {
        String tripId;
        String driverId;
        String truckId;
        String vehiclePlate;
        String origin;
        String destination;
        String startedAt;
        String scheduledAt;
        String recipientEmail;
        String recipientName;
        String orderNumber;
    }

    @lombok.Data
    static class TripAssignedPayload {
        String tripId;
        String type; // NEW_ASSIGNMENT, REASSIGNMENT, CANCELLATION
        java.util.UUID newDriverId;
        String newTruckId;
        String vehiclePlate;
        java.util.UUID previousDriverId;
        String origin;
        String destination;
        String scheduledDeparture;
        String estimatedArrival;
        String recipientEmail;
        String recipientName;
        String cancellationReason;
    }
}
