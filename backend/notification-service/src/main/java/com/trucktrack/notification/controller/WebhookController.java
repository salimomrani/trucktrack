package com.trucktrack.notification.controller;

import com.trucktrack.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final EmailService emailService;

    /**
     * Handle Mailjet event webhooks
     * Configure in Mailjet dashboard: https://app.mailjet.com/account/triggers
     */
    @PostMapping("/mailjet")
    public ResponseEntity<Void> handleMailjetWebhook(@RequestBody List<Map<String, Object>> events) {
        log.debug("Received Mailjet webhook with {} events", events.size());

        for (Map<String, Object> event : events) {
            String eventType = (String) event.get("event");
            String email = (String) event.get("email");
            String errorMessage = (String) event.get("error");

            if (email == null) {
                continue;
            }

            switch (eventType != null ? eventType : "") {
                case "bounce":
                case "blocked":
                    String reason = errorMessage != null ? errorMessage : "Unknown reason";
                    emailService.handleBounce(email, reason);
                    break;
                case "sent":
                    emailService.handleDelivery(email);
                    break;
                case "open":
                    log.debug("Email opened by: {}", email);
                    break;
                case "click":
                    log.debug("Email link clicked by: {}", email);
                    break;
                case "spam":
                    log.warn("Spam complaint from: {}", email);
                    emailService.handleBounce(email, "Marked as spam");
                    break;
                case "unsub":
                    log.info("Unsubscribe request from: {}", email);
                    break;
                default:
                    log.debug("Unhandled Mailjet event type: {}", eventType);
            }
        }

        return ResponseEntity.ok().build();
    }
}
