package com.trucktrack.notification.service;

import com.trucktrack.notification.model.NotificationTemplate;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.NotificationChannel;
import com.trucktrack.notification.repository.NotificationTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateService {

    private final NotificationTemplateRepository templateRepository;
    private final TemplateEngine templateEngine;

    public Optional<NotificationTemplate> getTemplate(NotificationType type, NotificationChannel channel, String locale) {
        String code = buildTemplateCode(type, channel);
        return templateRepository.findByCodeAndLocaleAndIsActiveTrue(code, locale)
                .or(() -> templateRepository.findByCodeAndLocaleAndIsActiveTrue(code, "fr"));
    }

    public String renderTemplate(NotificationTemplate template, Map<String, Object> variables) {
        Context context = new Context();
        if (variables != null) {
            variables.forEach(context::setVariable);
        }

        String body = template.getBodyTemplate();

        // Simple variable substitution for database-stored templates
        if (variables != null) {
            for (Map.Entry<String, Object> entry : variables.entrySet()) {
                body = body.replace("{{" + entry.getKey() + "}}",
                        entry.getValue() != null ? entry.getValue().toString() : "");
            }
        }

        return body;
    }

    public String renderSubject(NotificationTemplate template, Map<String, Object> variables) {
        if (template.getSubjectTemplate() == null) {
            return null;
        }

        String subject = template.getSubjectTemplate();

        if (variables != null) {
            for (Map.Entry<String, Object> entry : variables.entrySet()) {
                subject = subject.replace("{{" + entry.getKey() + "}}",
                        entry.getValue() != null ? entry.getValue().toString() : "");
            }
        }

        return subject;
    }

    public String renderHtmlTemplate(String templateName, Map<String, Object> variables) {
        Context context = new Context();
        if (variables != null) {
            variables.forEach(context::setVariable);
        }
        return templateEngine.process("email/" + templateName, context);
    }

    private String buildTemplateCode(NotificationType type, NotificationChannel channel) {
        return type.name() + "_" + channel.name();
    }
}
