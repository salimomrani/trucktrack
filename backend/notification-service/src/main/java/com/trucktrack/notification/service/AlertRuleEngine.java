package com.trucktrack.notification.service;

import com.trucktrack.common.event.AlertTriggeredEvent;
import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.notification.client.LocationServiceClient;
import com.trucktrack.notification.model.*;
import com.trucktrack.notification.websocket.NotificationWebSocketService;
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
 * T150: Implement rule evaluation logic (with geofence support)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertRuleEngine {

    private final AlertRuleService alertRuleService;
    private final NotificationService notificationService;
    private final LocationServiceClient locationServiceClient;
    private final GeofenceStateCache geofenceStateCache;
    private final KafkaTemplate<String, AlertTriggeredEvent> kafkaTemplate;
    private final NotificationWebSocketService webSocketService;
    private final TruckLookupService truckLookupService;
    private final AlertCooldownCache alertCooldownCache;

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

        // Check geofence rules
        evaluateGeofenceRules(event);
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
                // Check cooldown before triggering alert
                if (!alertCooldownCache.checkAndRecord(event.getTruckId(), rule.getId())) {
                    log.debug("Speed alert suppressed for truck {} - in cooldown period", event.getTruckId());
                    continue;
                }

                String truckName = getTruckName(event);
                log.info("Speed limit exceeded for truck {}: {} km/h (limit: {})",
                        truckName, event.getSpeed(), threshold);

                triggerAlert(rule, event, AlertTriggeredEvent.AlertType.SPEED_LIMIT,
                        AlertTriggeredEvent.Severity.WARNING,
                        String.format("Truck %s exceeded speed limit: %.1f km/h (limit: %d km/h)",
                                truckName, event.getSpeed(), threshold));
            }
        }
    }

    /**
     * Evaluate geofence rules (enter/exit detection)
     * T150: Implement geofence evaluation in AlertRuleEngine
     */
    private void evaluateGeofenceRules(GPSPositionEvent event) {
        if (event.getLatitude() == null || event.getLongitude() == null) {
            return;
        }

        List<AlertRule> geofenceRules = alertRuleService.getEnabledGeofenceRules();
        if (geofenceRules.isEmpty()) {
            return;
        }

        UUID truckId = UUID.fromString(event.getTruckId());

        for (AlertRule rule : geofenceRules) {
            if (rule.getGeofenceId() == null) {
                continue;
            }

            try {
                // Check if truck is currently inside the geofence
                boolean isInside = locationServiceClient.isPointInsideGeofence(
                        rule.getGeofenceId(),
                        event.getLatitude(),
                        event.getLongitude());

                // Check for state change
                GeofenceStateCache.StateChange stateChange = geofenceStateCache.checkStateChange(
                        truckId, rule.getGeofenceId(), isInside);

                if (stateChange != null) {
                    // State changed - check if it matches the rule type
                    boolean shouldTrigger = switch (rule.getRuleType()) {
                        case GEOFENCE_ENTER ->
                                stateChange.changeType() == GeofenceStateCache.StateChangeType.ENTERED;
                        case GEOFENCE_EXIT ->
                                stateChange.changeType() == GeofenceStateCache.StateChangeType.EXITED;
                        default -> false;
                    };

                    if (shouldTrigger) {
                        // Check cooldown before triggering geofence alert
                        if (!alertCooldownCache.checkAndRecord(event.getTruckId(), rule.getId())) {
                            log.debug("Geofence alert suppressed for truck {} - in cooldown period", event.getTruckId());
                            continue;
                        }

                        AlertTriggeredEvent.AlertType alertType =
                                rule.getRuleType() == AlertRuleType.GEOFENCE_ENTER
                                        ? AlertTriggeredEvent.AlertType.GEOFENCE_ENTER
                                        : AlertTriggeredEvent.AlertType.GEOFENCE_EXIT;

                        String action = alertType == AlertTriggeredEvent.AlertType.GEOFENCE_ENTER
                                ? "entered" : "exited";

                        String truckName = getTruckName(event);

                        triggerAlert(rule, event, alertType,
                                AlertTriggeredEvent.Severity.INFO,
                                String.format("Truck %s %s geofence '%s'",
                                        truckName, action, rule.getName()));
                    }
                }
            } catch (Exception e) {
                log.error("Error evaluating geofence rule {} for truck {}: {}",
                        rule.getId(), event.getTruckId(), e.getMessage());
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

        String truckIdReadable = event.getTruckIdReadable() != null
                ? event.getTruckIdReadable()
                : event.getTruckId().substring(0, 8);

        AlertTriggeredEvent alertEvent = new AlertTriggeredEvent();
        alertEvent.setEventId(UUID.randomUUID().toString());
        alertEvent.setAlertRuleId(rule.getId().toString());
        alertEvent.setTruckId(event.getTruckId());
        alertEvent.setTruckIdReadable(truckIdReadable);
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

        Notification savedNotification = notificationService.createNotification(notification);
        log.info("Created notification for user {} - type: {}", userId, notificationType);

        // T166: Broadcast notification via WebSocket for real-time updates
        webSocketService.sendToUser(userId.toString(), savedNotification);
        webSocketService.broadcastNotification(savedNotification);
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

    /**
     * Get truck readable name from event or lookup from database
     */
    private String getTruckName(GPSPositionEvent event) {
        // First try to use the readable ID from the event
        if (event.getTruckIdReadable() != null && !event.getTruckIdReadable().isBlank()) {
            return event.getTruckIdReadable();
        }
        // Fall back to database lookup
        return truckLookupService.getTruckReadableId(event.getTruckId());
    }
}
