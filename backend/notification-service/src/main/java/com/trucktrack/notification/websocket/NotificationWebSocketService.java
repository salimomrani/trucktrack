package com.trucktrack.notification.websocket;

import com.trucktrack.notification.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for broadcasting notifications via WebSocket
 * T166: Implement WebSocket subscription for real-time notifications
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast notification to all connected clients
     * Topic: /topic/notifications
     */
    public void broadcastNotification(Notification notification) {
        log.info("Broadcasting notification to /topic/notifications: {}", notification.getId());
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /**
     * Send notification to a specific user
     * Destination: /user/{userId}/queue/notifications
     */
    public void sendToUser(String userId, Notification notification) {
        log.info("Sending notification to user {}: {}", userId, notification.getId());
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/notifications",
                notification
        );
    }

    /**
     * Send notification to multiple users
     */
    public void sendToUsers(Iterable<String> userIds, Notification notification) {
        for (String userId : userIds) {
            sendToUser(userId, notification);
        }
    }

    /**
     * Broadcast alert event (for real-time alert display)
     * Topic: /topic/alerts
     */
    public void broadcastAlert(Object alertEvent) {
        log.info("Broadcasting alert to /topic/alerts");
        messagingTemplate.convertAndSend("/topic/alerts", alertEvent);
    }
}
