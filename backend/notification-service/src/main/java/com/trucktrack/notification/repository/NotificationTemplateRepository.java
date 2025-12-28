package com.trucktrack.notification.repository;

import com.trucktrack.notification.model.NotificationTemplate;
import com.trucktrack.notification.model.enums.NotificationChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {

    Optional<NotificationTemplate> findByCodeAndLocale(String code, String locale);

    Optional<NotificationTemplate> findByCodeAndLocaleAndIsActiveTrue(String code, String locale);

    List<NotificationTemplate> findByChannelAndIsActiveTrue(NotificationChannel channel);

    List<NotificationTemplate> findByLocaleAndIsActiveTrue(String locale);

    List<NotificationTemplate> findByChannelAndLocaleAndIsActiveTrue(NotificationChannel channel, String locale);

    boolean existsByCodeAndLocale(String code, String locale);
}
