package com.trucktrack.location.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for sending push notifications via Expo Push API.
 * T034-T036: Create PushNotificationService
 * Feature: 010-trip-management (US3: Push Notifications)
 *
 * Uses direct HTTP calls to Expo Push API instead of a separate notification-service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private static final String EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.notifications.enabled:true}")
    private boolean notificationsEnabled;

    /**
     * Send a push notification for trip assignment.
     * Called asynchronously to not block the main flow.
     *
     * @param pushToken The Expo push token of the driver
     * @param tripId The assigned trip ID
     * @param origin Trip origin
     * @param destination Trip destination
     */
    @Async
    public void sendTripAssignedNotification(String pushToken, UUID tripId, String origin, String destination) {
        if (!notificationsEnabled) {
            log.debug("Push notifications disabled, skipping notification for trip {}", tripId);
            return;
        }

        if (pushToken == null || pushToken.isBlank()) {
            log.warn("No push token available for trip assignment notification, tripId: {}", tripId);
            return;
        }

        if (!isValidExpoPushToken(pushToken)) {
            log.warn("Invalid Expo push token format: {}", pushToken);
            return;
        }

        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("to", pushToken);
            notification.put("title", "New Trip Assigned");
            notification.put("body", String.format("From %s to %s", truncate(origin, 30), truncate(destination, 30)));
            notification.put("sound", "default");
            notification.put("priority", "high");

            // Data payload for navigation
            Map<String, Object> data = new HashMap<>();
            data.put("tripId", tripId.toString());
            data.put("type", "TRIP_ASSIGNED");
            notification.put("data", data);

            sendNotification(notification);
            log.info("Trip assignment notification sent for trip {} to token {}", tripId, maskToken(pushToken));

        } catch (Exception e) {
            log.error("Failed to send trip assignment notification for trip {}: {}", tripId, e.getMessage());
        }
    }

    /**
     * Send a push notification for trip cancellation.
     * T064: Add sendTripCancelledNotification()
     */
    @Async
    public void sendTripCancelledNotification(String pushToken, UUID tripId, String origin, String destination) {
        if (!notificationsEnabled) {
            log.debug("Push notifications disabled, skipping cancellation notification for trip {}", tripId);
            return;
        }

        if (pushToken == null || pushToken.isBlank() || !isValidExpoPushToken(pushToken)) {
            log.warn("Invalid or missing push token for trip cancellation notification, tripId: {}", tripId);
            return;
        }

        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("to", pushToken);
            notification.put("title", "Trip Cancelled");
            notification.put("body", String.format("Trip from %s to %s has been cancelled",
                truncate(origin, 25), truncate(destination, 25)));
            notification.put("sound", "default");
            notification.put("priority", "high");

            Map<String, Object> data = new HashMap<>();
            data.put("tripId", tripId.toString());
            data.put("type", "TRIP_CANCELLED");
            notification.put("data", data);

            sendNotification(notification);
            log.info("Trip cancellation notification sent for trip {} to token {}", tripId, maskToken(pushToken));

        } catch (Exception e) {
            log.error("Failed to send trip cancellation notification for trip {}: {}", tripId, e.getMessage());
        }
    }

    /**
     * Send a push notification for trip reassignment.
     * T065: Add sendTripReassignedNotification()
     *
     * @param pushToken The Expo push token of the driver
     * @param tripId The trip ID
     * @param origin Trip origin
     * @param destination Trip destination
     * @param isNewDriver true if notifying the newly assigned driver, false for the previous driver
     */
    @Async
    public void sendTripReassignedNotification(String pushToken, UUID tripId, String origin, String destination, boolean isNewDriver) {
        if (!notificationsEnabled) {
            log.debug("Push notifications disabled, skipping reassignment notification for trip {}", tripId);
            return;
        }

        if (pushToken == null || pushToken.isBlank() || !isValidExpoPushToken(pushToken)) {
            log.warn("Invalid or missing push token for trip reassignment notification, tripId: {}", tripId);
            return;
        }

        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("to", pushToken);

            if (isNewDriver) {
                notification.put("title", "Trip Assigned to You");
                notification.put("body", String.format("You've been assigned to trip: %s to %s",
                    truncate(origin, 25), truncate(destination, 25)));
            } else {
                notification.put("title", "Trip Reassigned");
                notification.put("body", String.format("Trip from %s to %s has been reassigned to another driver",
                    truncate(origin, 20), truncate(destination, 20)));
            }

            notification.put("sound", "default");
            notification.put("priority", "high");

            Map<String, Object> data = new HashMap<>();
            data.put("tripId", tripId.toString());
            data.put("type", isNewDriver ? "TRIP_ASSIGNED" : "TRIP_REASSIGNED");
            notification.put("data", data);

            sendNotification(notification);
            log.info("Trip reassignment notification sent for trip {} to token {} (isNewDriver: {})",
                tripId, maskToken(pushToken), isNewDriver);

        } catch (Exception e) {
            log.error("Failed to send trip reassignment notification for trip {}: {}", tripId, e.getMessage());
        }
    }

    /**
     * Send a push notification for trip status update.
     */
    @Async
    public void sendTripStatusUpdateNotification(String pushToken, UUID tripId, String status, String message) {
        if (!notificationsEnabled || pushToken == null || pushToken.isBlank()) {
            return;
        }

        if (!isValidExpoPushToken(pushToken)) {
            log.warn("Invalid Expo push token format: {}", pushToken);
            return;
        }

        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("to", pushToken);
            notification.put("title", "Trip Update");
            notification.put("body", message);
            notification.put("sound", "default");

            Map<String, Object> data = new HashMap<>();
            data.put("tripId", tripId.toString());
            data.put("type", "TRIP_STATUS_UPDATE");
            data.put("status", status);
            notification.put("data", data);

            sendNotification(notification);
            log.info("Trip status notification sent for trip {} (status: {})", tripId, status);

        } catch (Exception e) {
            log.error("Failed to send trip status notification for trip {}: {}", tripId, e.getMessage());
        }
    }

    /**
     * Send multiple notifications in batch.
     */
    @Async
    public void sendBatchNotifications(List<Map<String, Object>> notifications) {
        if (!notificationsEnabled || notifications.isEmpty()) {
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            String jsonBody = objectMapper.writeValueAsString(notifications);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                EXPO_PUSH_API_URL,
                HttpMethod.POST,
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Batch notifications sent successfully: {} notifications", notifications.size());
            } else {
                log.warn("Batch notifications returned status: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to send batch notifications: {}", e.getMessage());
        }
    }

    /**
     * Send a single notification to Expo Push API.
     */
    private void sendNotification(Map<String, Object> notification) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            String jsonBody = objectMapper.writeValueAsString(notification);
            HttpEntity<String> request = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                EXPO_PUSH_API_URL,
                HttpMethod.POST,
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("Notification sent successfully: {}", response.getBody());
            } else {
                log.warn("Notification returned status: {}, body: {}", response.getStatusCode(), response.getBody());
            }

        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
            // Don't rethrow - notification failures should not break the main flow
        }
    }

    /**
     * Validate Expo push token format.
     * Valid format: ExponentPushToken[xxxxxxxxxxxxx]
     */
    private boolean isValidExpoPushToken(String token) {
        return token != null &&
               (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["));
    }

    /**
     * Mask push token for logging (privacy).
     */
    private String maskToken(String token) {
        if (token == null || token.length() < 20) {
            return "***";
        }
        return token.substring(0, 20) + "***";
    }

    /**
     * Truncate string for notification display.
     */
    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    }
}
