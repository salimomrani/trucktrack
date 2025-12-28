package com.trucktrack.notification.service;

import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import com.trucktrack.notification.config.MailjetConfig;
import com.trucktrack.notification.model.EmailRecipient;
import com.trucktrack.notification.model.NotificationLog;
import com.trucktrack.notification.model.NotificationTemplate;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.model.enums.RecipientType;
import com.trucktrack.notification.repository.EmailRecipientRepository;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final MailjetClient mailjetClient;
    private final MailjetConfig mailjetConfig;
    private final TemplateService templateService;
    private final NotificationLogService notificationLogService;
    private final NotificationPreferenceService preferenceService;
    private final EmailRecipientRepository emailRecipientRepository;

    @Retry(name = "sendEmail", fallbackMethod = "sendEmailFallback")
    public void sendEmail(String toEmail, String toName, NotificationType type,
                          Map<String, Object> variables, UUID recipientId,
                          RecipientType recipientType, String locale) {

        // Check if email is valid
        if (!isEmailValid(toEmail)) {
            log.warn("Skipping email to invalid address: {}", toEmail);
            return;
        }

        // Check user preferences
        if (recipientId != null && !preferenceService.shouldSendNotification(recipientId, type, NotificationChannel.EMAIL)) {
            log.debug("User {} has disabled email notifications for {}", recipientId, type);
            return;
        }

        // Get template
        NotificationTemplate template = templateService.getTemplate(type, NotificationChannel.EMAIL, locale != null ? locale : "fr")
                .orElseThrow(() -> new IllegalArgumentException("No email template found for type: " + type));

        // Render content
        String subject = templateService.renderSubject(template, variables);
        String body = templateService.renderTemplate(template, variables);

        // Create log entry
        NotificationLog logEntry = notificationLogService.createLog(
                type, NotificationChannel.EMAIL, recipientId, toEmail,
                recipientType, subject, body.substring(0, Math.min(body.length(), 500)),
                variables);

        try {
            // Build Mailjet request
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", mailjetConfig.getFromEmail())
                                            .put("Name", mailjetConfig.getFromName()))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", toEmail)
                                                    .put("Name", toName != null ? toName : toEmail)))
                                    .put(Emailv31.Message.SUBJECT, subject)
                                    .put(Emailv31.Message.TEXTPART, body)
                                    .put(Emailv31.Message.HTMLPART, convertToHtml(body))));

            MailjetResponse response = mailjetClient.post(request);

            if (response.getStatus() == 200) {
                notificationLogService.markAsSent(logEntry.getId());
                log.info("Email sent successfully to {} for type {}", toEmail, type);
            } else {
                String error = "Mailjet returned status " + response.getStatus() + ": " + response.getData();
                notificationLogService.markAsFailed(logEntry.getId(), error);
                log.error("Failed to send email: {}", error);
            }

        } catch (Exception e) {
            notificationLogService.markAsFailed(logEntry.getId(), e.getMessage());
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }

    public void sendEmailFallback(String toEmail, String toName, NotificationType type,
                                   Map<String, Object> variables, UUID recipientId,
                                   RecipientType recipientType, String locale, Throwable t) {
        log.error("Email sending failed after retries for {} ({}): {}", toEmail, type, t.getMessage());
    }

    public void handleBounce(String email, String reason) {
        emailRecipientRepository.findByEmail(email).ifPresentOrElse(
                recipient -> {
                    recipient.incrementBounceCount();
                    emailRecipientRepository.save(recipient);
                    log.warn("Email bounce recorded for {}: {} (count: {})",
                            email, reason, recipient.getBounceCount());
                },
                () -> {
                    EmailRecipient newRecipient = EmailRecipient.builder()
                            .email(email)
                            .bounceCount(1)
                            .isValid(true)
                            .build();
                    newRecipient.incrementBounceCount();
                    emailRecipientRepository.save(newRecipient);
                    log.warn("Email bounce recorded for new recipient {}: {}", email, reason);
                }
        );
    }

    public void handleDelivery(String email) {
        log.debug("Email delivered to {}", email);
    }

    private boolean isEmailValid(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return emailRecipientRepository.findByEmail(email)
                .map(EmailRecipient::getIsValid)
                .orElse(true);
    }

    public EmailRecipient getOrCreateRecipient(String email, String name) {
        return emailRecipientRepository.findByEmail(email)
                .orElseGet(() -> {
                    EmailRecipient recipient = EmailRecipient.builder()
                            .email(email)
                            .name(name)
                            .isValid(true)
                            .build();
                    return emailRecipientRepository.save(recipient);
                });
    }

    private String convertToHtml(String text) {
        // Simple text to HTML conversion
        return "<html><body style=\"font-family: Arial, sans-serif; line-height: 1.6;\">" +
                text.replace("\n", "<br/>") +
                "</body></html>";
    }
}
