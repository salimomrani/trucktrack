package com.trucktrack.location.websocket;

import com.trucktrack.common.event.GPSPositionEvent;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
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
 * Refactored with Lombok best practices
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LocationWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast GPS position update to all connected clients
     * Sends to /topic/positions
     */
    public void broadcastPositionUpdate(GPSPositionEvent position) {
        try {
            log.debug("Broadcasting position update for truck: {}", position.getTruckId());
            messagingTemplate.convertAndSend("/topic/positions", position);
        } catch (Exception e) {
            log.error("Failed to broadcast position update: {}", e.getMessage(), e);
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
            log.debug("Sending position update to {}", destination);
            messagingTemplate.convertAndSend(destination, position);
        } catch (Exception e) {
            log.error("Failed to send truck-specific position update: {}", e.getMessage(), e);
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
            log.debug("Notified status change for truck {}: {} -> {}", truckId, oldStatus, newStatus);
        } catch (Exception e) {
            log.error("Failed to notify status change: {}", e.getMessage(), e);
        }
    }

    /**
     * Event class for status changes
     * Refactored with Lombok
     */
    @Getter
    public static class StatusChangeEvent {
        private final UUID truckId;
        private final String oldStatus;
        private final String newStatus;
        private final long timestamp;

        public StatusChangeEvent(UUID truckId, String oldStatus, String newStatus) {
            this.truckId = truckId;
            this.oldStatus = oldStatus;
            this.newStatus = newStatus;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
