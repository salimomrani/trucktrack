package com.trucktrack.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.RecipientType;
import com.trucktrack.notification.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class EtaAlertConsumer {

    private final PushNotificationService pushNotificationService;
    private final ObjectMapper objectMapper;

    // Track sent alerts to prevent duplicates
    // Key: tripId + alertType, Value: timestamp of last send
    private final Map<String, Long> sentAlerts = new ConcurrentHashMap<>();

    // Deduplication window in milliseconds (1 hour)
    private static final long DEDUP_WINDOW_MS = 3600000;

    @KafkaListener(topics = "truck-track.trips.eta-alert", groupId = "notification-service-group")
    public void handleEtaAlert(ConsumerRecord<String, String> record) {
        try {
            EtaAlertPayload payload = objectMapper.readValue(record.value(), EtaAlertPayload.class);
            log.info("Received ETA alert for trip: {} (type: {})", payload.tripId, payload.alertType);

            // Check for duplicate
            String dedupKey = payload.tripId + "_" + payload.alertType;
            Long lastSent = sentAlerts.get(dedupKey);
            long now = System.currentTimeMillis();

            if (lastSent != null && (now - lastSent) < DEDUP_WINDOW_MS) {
                log.debug("Skipping duplicate ETA alert for trip: {} (type: {})", payload.tripId, payload.alertType);
                return;
            }

            // Determine notification type
            NotificationType notificationType;
            if ("ETA_30MIN".equals(payload.alertType)) {
                notificationType = NotificationType.ETA_30MIN;
            } else if ("ETA_10MIN".equals(payload.alertType)) {
                notificationType = NotificationType.ETA_10MIN;
            } else {
                log.warn("Unknown ETA alert type: {}", payload.alertType);
                return;
            }

            Map<String, Object> variables = new HashMap<>();
            variables.put("tripId", payload.tripId);
            variables.put("etaMinutes", payload.etaMinutes);
            variables.put("estimatedArrival", payload.estimatedArrival);

            // Send push to client if they have an account
            if (payload.recipientUserId != null) {
                pushNotificationService.sendPushToUser(
                        payload.recipientUserId,
                        notificationType,
                        variables,
                        "fr",
                        RecipientType.CLIENT
                );
            }

            // Mark as sent
            sentAlerts.put(dedupKey, now);

            // Cleanup old entries (every 100 alerts, remove entries older than dedup window)
            if (sentAlerts.size() > 100) {
                cleanupOldAlerts();
            }

        } catch (Exception e) {
            log.error("Error processing ETA alert event: {}", e.getMessage(), e);
        }
    }

    private void cleanupOldAlerts() {
        long cutoff = System.currentTimeMillis() - DEDUP_WINDOW_MS;
        sentAlerts.entrySet().removeIf(entry -> entry.getValue() < cutoff);
    }

    @lombok.Data
    static class EtaAlertPayload {
        String tripId;
        String alertType; // ETA_30MIN, ETA_10MIN
        Integer etaMinutes;
        String estimatedArrival;
        String recipientEmail;
        String recipientName;
        UUID recipientUserId;
    }
}
