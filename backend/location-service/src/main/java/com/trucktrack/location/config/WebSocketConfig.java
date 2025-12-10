package com.trucktrack.location.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration using STOMP protocol over WebSocket
 * T072: Implement WebSocket configuration (STOMP over WebSocket)
 *
 * Endpoints:
 * - /ws - WebSocket connection endpoint
 * - /topic/positions - Subscribe to receive live GPS position updates
 * - /topic/truck/{truckId} - Subscribe to specific truck updates
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory message broker for broadcasting messages
        // Prefix /topic for pub/sub (one-to-many)
        // Prefix /queue for point-to-point (one-to-one)
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for client messages (e.g., client sends to /app/subscribe)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint at /ws
        // Clients connect to: ws://localhost:8081/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins for development
                .withSockJS(); // Fallback to SockJS if WebSocket not supported

        // Also register without SockJS for native WebSocket clients
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}
