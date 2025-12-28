package com.trucktrack.notification.service;

import com.google.firebase.messaging.*;
import com.trucktrack.notification.model.NotificationLog;
import com.trucktrack.notification.model.NotificationTemplate;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.PushToken;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.RecipientType;
import com.trucktrack.notification.repository.PushTokenRepository;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class PushNotificationService {

    private final FirebaseMessaging firebaseMessaging;
    private final PushTokenRepository pushTokenRepository;
    private final TemplateService templateService;
    private final NotificationLogService notificationLogService;
    private final NotificationPreferenceService preferenceService;

    @Autowired
    public PushNotificationService(
            @Autowired(required = false) FirebaseMessaging firebaseMessaging,
            PushTokenRepository pushTokenRepository,
            TemplateService templateService,
            NotificationLogService notificationLogService,
            NotificationPreferenceService preferenceService) {
        this.firebaseMessaging = firebaseMessaging;
        this.pushTokenRepository = pushTokenRepository;
        this.templateService = templateService;
        this.notificationLogService = notificationLogService;
        this.preferenceService = preferenceService;
    }

    @Retry(name = "sendPush", fallbackMethod = "sendPushFallback")
    public void sendPushToUser(UUID userId, NotificationType type,
                                Map<String, Object> variables, String locale,
                                RecipientType recipientType) {

        if (firebaseMessaging == null) {
            log.warn("Firebase is not configured, skipping push notification");
            return;
        }

        // Check user preferences
        if (!preferenceService.shouldSendNotification(userId, type, NotificationChannel.PUSH)) {
            log.debug("User {} has disabled push notifications for {}", userId, type);
            return;
        }

        // Get user's active push tokens
        List<PushToken> tokens = pushTokenRepository.findByUserIdAndIsActiveTrue(userId);
        if (tokens.isEmpty()) {
            log.debug("No active push tokens found for user {}", userId);
            return;
        }

        // Get template
        NotificationTemplate template = templateService.getTemplate(type, NotificationChannel.PUSH, locale != null ? locale : "fr")
                .orElseThrow(() -> new IllegalArgumentException("No push template found for type: " + type));

        // Render content
        String body = templateService.renderTemplate(template, variables);
        String title = template.getName();

        // Create log entry
        NotificationLog logEntry = notificationLogService.createLog(
                type, NotificationChannel.PUSH, userId, null,
                recipientType, title, body.substring(0, Math.min(body.length(), 500)),
                variables);

        // Send to all user's devices
        for (PushToken pushToken : tokens) {
            sendToToken(pushToken, title, body, variables, logEntry.getId());
        }
    }

    private void sendToToken(PushToken pushToken, String title, String body,
                             Map<String, Object> data, UUID logId) {
        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(pushToken.getToken())
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            // Add custom data payload
            if (data != null) {
                data.forEach((key, value) -> {
                    if (value != null) {
                        messageBuilder.putData(key, value.toString());
                    }
                });
            }

            // Platform-specific config
            messageBuilder.setAndroidConfig(AndroidConfig.builder()
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .setNotification(AndroidNotification.builder()
                            .setClickAction("OPEN_TRIP_DETAIL")
                            .build())
                    .build());

            messageBuilder.setApnsConfig(ApnsConfig.builder()
                    .setAps(Aps.builder()
                            .setCategory("TRIP_NOTIFICATION")
                            .setSound("default")
                            .build())
                    .build());

            String response = firebaseMessaging.send(messageBuilder.build());
            log.debug("Push notification sent: {}", response);

            // Update last used timestamp
            pushTokenRepository.updateLastUsedAt(pushToken.getId());
            notificationLogService.markAsSent(logId);

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send push to token {}: {}", pushToken.getToken(), e.getMessage());

            // Handle invalid tokens
            if (e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT ||
                e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                deactivateToken(pushToken.getToken());
            }

            notificationLogService.markAsFailed(logId, e.getMessage());
        }
    }

    @Transactional
    public void deactivateToken(String token) {
        pushTokenRepository.deactivateByToken(token);
        log.info("Deactivated invalid push token: {}", token.substring(0, Math.min(token.length(), 20)) + "...");
    }

    public void sendPushFallback(UUID userId, NotificationType type,
                                  Map<String, Object> variables, String locale,
                                  RecipientType recipientType, Throwable t) {
        log.error("Push notification failed after retries for user {} ({}): {}",
                userId, type, t.getMessage());
    }
}
