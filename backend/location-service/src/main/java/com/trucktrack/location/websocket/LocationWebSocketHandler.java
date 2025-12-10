package com.trucktrack.location.websocket;

import com.trucktrack.common.event.GPSPositionEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * WebSocket handler for pushing live GPS position updates to connected clients
 * T073: Implement LocationWebSocketHandler to push truck position updates to connected clients
 *
 * Broadcasts GPS position updates to:
 * - /topic/positions - All position updates (for general map view)
 * - /topic/truck/{truckId} - Specific truck updates (for truck detail view)
 */
@Component
public class LocationWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(LocationWebSocketHandler.class);

    private final SimpMessagingTemplate messagingTemplate;

    public LocationWebSocketHandler(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Broadcast GPS position update to all connected clients
     * Sends to /topic/positions
     */
    public void broadcastPositionUpdate(GPSPositionEvent position) {
        try {
            logger.debug("Broadcasting position update for truck: {}", position.getTruckId());
            messagingTemplate.convertAndSend("/topic/positions", position);
        } catch (Exception e) {
            logger.error("Failed to broadcast position update: {}", e.getMessage(), e);
            // Don't throw - WebSocket broadcast failure shouldn't break processing
        }
    }

    /**
     * Send GPS position update to subscribers of a specific truck
     * Sends to /topic/truck/{truckId}
     */
    public void sendTruckPositionUpdate(UUID truckId, GPSPositionEvent position) {
        try {
            String destination = "/topic/truck/" + truckId;
            logger.debug("Sending position update to {}", destination);
            messagingTemplate.convertAndSend(destination, position);
        } catch (Exception e) {
            logger.error("Failed to send truck-specific position update: {}", e.getMessage(), e);
        }
    }

    /**
     * Send position update to both broadcast and truck-specific channels
     */
    public void sendPositionUpdate(GPSPositionEvent position) {
        UUID truckId = UUID.fromString(position.getTruckId());

        // Broadcast to all subscribers
        broadcastPositionUpdate(position);

        // Send to truck-specific subscribers
        sendTruckPositionUpdate(truckId, position);
    }

    /**
     * Notify clients about truck status change
     */
    public void notifyStatusChange(UUID truckId, String oldStatus, String newStatus) {
        try {
            String destination = "/topic/truck/" + truckId + "/status";
            StatusChangeEvent event = new StatusChangeEvent(truckId, oldStatus, newStatus);
            messagingTemplate.convertAndSend(destination, event);
            logger.debug("Notified status change for truck {}: {} -> {}", truckId, oldStatus, newStatus);
        } catch (Exception e) {
            logger.error("Failed to notify status change: {}", e.getMessage(), e);
        }
    }

    /**
     * Event class for status changes
     */
    public static class StatusChangeEvent {
        private UUID truckId;
        private String oldStatus;
        private String newStatus;
        private long timestamp;

        public StatusChangeEvent(UUID truckId, String oldStatus, String newStatus) {
            this.truckId = truckId;
            this.oldStatus = oldStatus;
            this.newStatus = newStatus;
            this.timestamp = System.currentTimeMillis();
        }

        // Getters
        public UUID getTruckId() {
            return truckId;
        }

        public String getOldStatus() {
            return oldStatus;
        }

        public String getNewStatus() {
            return newStatus;
        }

        public long getTimestamp() {
            return timestamp;
        }
    }
}
