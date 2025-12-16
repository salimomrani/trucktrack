package com.trucktrack.notification.kafka;

import com.trucktrack.common.event.AlertTriggeredEvent;
import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.notification.service.AlertRuleEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for GPS position events and alert processing
 * T147: Create AlertKafkaConsumer
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlertKafkaConsumer {

    private final AlertRuleEngine alertRuleEngine;

    /**
     * Consume GPS position events and evaluate alert rules
     */
    @KafkaListener(
            topics = "${kafka.topics.gps-position:truck-track.gps.position}",
            groupId = "notification-service-gps-consumer",
            containerFactory = "gpsKafkaListenerContainerFactory"
    )
    public void consumeGPSPositionEvent(GPSPositionEvent event, Acknowledgment ack) {
        try {
            log.debug("Received GPS event for truck: {}", event.getTruckId());

            // Evaluate alert rules against the GPS event
            alertRuleEngine.evaluateRules(event);

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing GPS event for truck {}: {}",
                    event.getTruckId(), e.getMessage(), e);
            // Don't acknowledge - message will be redelivered
        }
    }

    /**
     * Consume alert triggered events for notification delivery
     */
    @KafkaListener(
            topics = "${kafka.topics.alert:truck-track.notification.alert}",
            groupId = "notification-service-alert-consumer",
            containerFactory = "alertKafkaListenerContainerFactory"
    )
    public void consumeAlertTriggeredEvent(AlertTriggeredEvent event, Acknowledgment ack) {
        try {
            log.info("Received alert event: {} for truck {}",
                    event.getAlertType(), event.getTruckId());

            // Create notifications for affected users
            alertRuleEngine.processAlertEvent(event);

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Error processing alert event {}: {}",
                    event.getEventId(), e.getMessage(), e);
            // Don't acknowledge - message will be redelivered
        }
    }
}
