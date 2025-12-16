package com.trucktrack.notification.service;

import com.trucktrack.common.event.AlertTriggeredEvent;
import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.notification.model.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Engine for evaluating alert rules against GPS events
 * T149: Create AlertRuleEngine
 * T150: Implement rule evaluation logic
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertRuleEngine {

    private final AlertRuleService alertRuleService;
    private final NotificationService notificationService;
    private final KafkaTemplate<String, AlertTriggeredEvent> kafkaTemplate;

    @Value("${kafka.topics.alert:truck-track.notification.alert}")
    private String alertTopic;

    @Value("${alert.default-speed-limit:120}")
    private int defaultSpeedLimit;

    /**
     * Evaluate all enabled alert rules against a GPS event
     */
    public void evaluateRules(GPSPositionEvent event) {
        log.debug("Evaluating rules for truck: {}", event.getTruckId());

        // Check speed limit rules
        evaluateSpeedLimitRules(event);

        // Check geofence rules (if we have geofence data)
        // This would require geofence boundary checks - simplified for now
    }

    /**
     * Evaluate speed limit rules
     */
    private void evaluateSpeedLimitRules(GPSPositionEvent event) {
        if (event.getSpeed() == null) {
            return;
        }

        List<AlertRule> speedRules = alertRuleService.getEnabledSpeedLimitRules();

        for (AlertRule rule : speedRules) {
            int threshold = rule.getThresholdValue() != null
                    ? rule.getThresholdValue()
                    : defaultSpeedLimit;

            if (event.getSpeed() > threshold) {
                log.info("Speed limit exceeded for truck {}: {} km/h (limit: {})",
                        event.getTruckId(), event.getSpeed(), threshold);

                triggerAlert(rule, event, AlertTriggeredEvent.AlertType.SPEED_LIMIT,
                        AlertTriggeredEvent.Severity.WARNING,
                        String.format("Truck %s exceeded speed limit: %.1f km/h (limit: %d km/h)",
                                event.getTruckIdReadable(), event.getSpeed(), threshold));
            }
        }
    }

    /**
     * Trigger an alert and publish to Kafka
     */
    private void triggerAlert(AlertRule rule, GPSPositionEvent event,
                              AlertTriggeredEvent.AlertType alertType,
                              AlertTriggeredEvent.Severity severity,
                              String message) {

        AlertTriggeredEvent alertEvent = new AlertTriggeredEvent();
        alertEvent.setEventId(UUID.randomUUID().toString());
        alertEvent.setAlertRuleId(rule.getId().toString());
        alertEvent.setTruckId(event.getTruckId());
        alertEvent.setTruckIdReadable(event.getTruckIdReadable());
        alertEvent.setAlertType(alertType);
        alertEvent.setSeverity(severity);
        alertEvent.setMessage(message);
        alertEvent.setLatitude(event.getLatitude());
        alertEvent.setLongitude(event.getLongitude());
        alertEvent.setTriggeredAt(Instant.now());
        alertEvent.setAffectedUserIds(List.of(rule.getCreatedBy().toString()));

        // Publish alert event to Kafka
        kafkaTemplate.send(alertTopic, event.getTruckId(), alertEvent)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish alert event: {}", ex.getMessage());
                    } else {
                        log.debug("Alert event published for truck: {}", event.getTruckId());
                    }
                });
    }

    /**
     * Process an alert event and create notifications for affected users
     */
    public void processAlertEvent(AlertTriggeredEvent event) {
        log.info("Processing alert event: {} for truck {}",
                event.getAlertType(), event.getTruckIdReadable());

        List<String> affectedUserIds = event.getAffectedUserIds();
        if (affectedUserIds == null || affectedUserIds.isEmpty()) {
            log.warn("No affected users for alert event: {}", event.getEventId());
            return;
        }

        for (String userIdStr : affectedUserIds) {
            try {
                UUID userId = UUID.fromString(userIdStr);
                createNotification(userId, event);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid user ID in alert event: {}", userIdStr);
            }
        }
    }

    /**
     * Create a notification for a user from an alert event
     */
    private void createNotification(UUID userId, AlertTriggeredEvent event) {
        NotificationType notificationType = mapAlertTypeToNotificationType(event.getAlertType());
        NotificationSeverity severity = mapSeverity(event.getSeverity());

        Notification notification = Notification.builder()
                .userId(userId)
                .alertRuleId(UUID.fromString(event.getAlertRuleId()))
                .truckId(UUID.fromString(event.getTruckId()))
                .notificationType(notificationType)
                .title(generateTitle(event))
                .message(event.getMessage())
                .severity(severity)
                .latitude(event.getLatitude() != null ? BigDecimal.valueOf(event.getLatitude()) : null)
                .longitude(event.getLongitude() != null ? BigDecimal.valueOf(event.getLongitude()) : null)
                .triggeredAt(event.getTriggeredAt())
                .isRead(false)
                .build();

        notificationService.createNotification(notification);
        log.info("Created notification for user {} - type: {}", userId, notificationType);
    }

    private String generateTitle(AlertTriggeredEvent event) {
        return switch (event.getAlertType()) {
            case SPEED_LIMIT -> "Speed Limit Alert";
            case OFFLINE -> "Truck Offline Alert";
            case IDLE -> "Truck Idle Alert";
            case GEOFENCE_ENTER -> "Geofence Entry Alert";
            case GEOFENCE_EXIT -> "Geofence Exit Alert";
        };
    }

    private NotificationType mapAlertTypeToNotificationType(AlertTriggeredEvent.AlertType alertType) {
        return switch (alertType) {
            case SPEED_LIMIT -> NotificationType.SPEED_LIMIT;
            case OFFLINE -> NotificationType.OFFLINE;
            case IDLE -> NotificationType.IDLE;
            case GEOFENCE_ENTER -> NotificationType.GEOFENCE_ENTER;
            case GEOFENCE_EXIT -> NotificationType.GEOFENCE_EXIT;
        };
    }

    private NotificationSeverity mapSeverity(AlertTriggeredEvent.Severity severity) {
        return switch (severity) {
            case INFO -> NotificationSeverity.INFO;
            case WARNING -> NotificationSeverity.WARNING;
            case CRITICAL -> NotificationSeverity.CRITICAL;
        };
    }
}
