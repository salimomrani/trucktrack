package com.trucktrack.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time notifications
 * T166: Implement WebSocket subscription for real-time notifications
 *
 * Endpoints:
 * - /ws-notifications - WebSocket connection endpoint
 * - /topic/notifications - Subscribe to receive all notifications (broadcast)
 * - /user/queue/notifications - Subscribe to user-specific notifications
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory message broker
        // /topic for broadcast (one-to-many)
        // /queue for user-specific messages (one-to-one)
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for client messages
        config.setApplicationDestinationPrefixes("/app");

        // Enable user destinations for user-specific messaging
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint at /ws-notifications
        // Clients connect to: ws://localhost:8082/ws-notifications
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Also register without SockJS for native WebSocket clients
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns("*");
    }
}
