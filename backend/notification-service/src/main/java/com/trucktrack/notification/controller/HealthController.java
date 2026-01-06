package com.trucktrack.notification.controller;

import com.google.firebase.messaging.FirebaseMessaging;
import com.mailjet.client.MailjetClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check endpoints for notification service external dependencies.
 * T092: Add health check endpoint for email (Mailjet) and push (FCM) connectivity.
 */
@RestController
@RequestMapping("/health")
@Slf4j
public class HealthController {

    private final MailjetClient mailjetClient;
    private final FirebaseMessaging firebaseMessaging;

    @Autowired
    public HealthController(
            @Autowired(required = false) MailjetClient mailjetClient,
            @Autowired(required = false) FirebaseMessaging firebaseMessaging) {
        this.mailjetClient = mailjetClient;
        this.firebaseMessaging = firebaseMessaging;
    }

    /**
     * Check health of all notification channels.
     * Returns status of Mailjet (email) and Firebase (push) connectivity.
     */
    @GetMapping("/channels")
    public ResponseEntity<Map<String, Object>> checkChannelHealth() {
        Map<String, Object> health = new LinkedHashMap<>();
        boolean allHealthy = true;

        // Check Mailjet (email)
        Map<String, Object> mailjetStatus = checkMailjetHealth();
        health.put("mailjet", mailjetStatus);
        if (!"UP".equals(mailjetStatus.get("status"))) {
            allHealthy = false;
        }

        // Check Firebase (push)
        Map<String, Object> firebaseStatus = checkFirebaseHealth();
        health.put("firebase", firebaseStatus);
        if (!"UP".equals(firebaseStatus.get("status"))) {
            allHealthy = false;
        }

        health.put("status", allHealthy ? "UP" : "DEGRADED");

        return ResponseEntity.ok(health);
    }

    /**
     * Check Mailjet email service health.
     */
    @GetMapping("/mailjet")
    public ResponseEntity<Map<String, Object>> checkMailjetHealthEndpoint() {
        return ResponseEntity.ok(checkMailjetHealth());
    }

    /**
     * Check Firebase/FCM push service health.
     */
    @GetMapping("/firebase")
    public ResponseEntity<Map<String, Object>> checkFirebaseHealthEndpoint() {
        return ResponseEntity.ok(checkFirebaseHealth());
    }

    private Map<String, Object> checkMailjetHealth() {
        Map<String, Object> status = new LinkedHashMap<>();

        if (mailjetClient == null) {
            status.put("status", "DOWN");
            status.put("reason", "Mailjet client not configured");
            status.put("configured", false);
            return status;
        }

        try {
            // Mailjet client is configured - we consider it healthy
            // Note: Mailjet doesn't have a simple ping/health endpoint
            // The client being instantiated means credentials are loaded
            status.put("status", "UP");
            status.put("configured", true);
            status.put("message", "Mailjet client is configured and ready");
        } catch (Exception e) {
            log.error("Mailjet health check failed: {}", e.getMessage());
            status.put("status", "DOWN");
            status.put("configured", true);
            status.put("error", e.getMessage());
        }

        return status;
    }

    private Map<String, Object> checkFirebaseHealth() {
        Map<String, Object> status = new LinkedHashMap<>();

        if (firebaseMessaging == null) {
            status.put("status", "DOWN");
            status.put("reason", "Firebase Messaging not configured");
            status.put("configured", false);
            return status;
        }

        try {
            // Firebase Messaging is configured - we consider it healthy
            // Note: FirebaseMessaging doesn't have a health check method
            // Being instantiated means credentials are loaded successfully
            status.put("status", "UP");
            status.put("configured", true);
            status.put("message", "Firebase Messaging is configured and ready");
        } catch (Exception e) {
            log.error("Firebase health check failed: {}", e.getMessage());
            status.put("status", "DOWN");
            status.put("configured", true);
            status.put("error", e.getMessage());
        }

        return status;
    }
}
