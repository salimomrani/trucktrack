package com.trucktrack.notification.repository;

import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.UserNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, UUID> {

    List<UserNotificationPreference> findByUserId(UUID userId);

    Optional<UserNotificationPreference> findByUserIdAndEventType(UUID userId, NotificationType eventType);

    boolean existsByUserIdAndEventType(UUID userId, NotificationType eventType);
}
