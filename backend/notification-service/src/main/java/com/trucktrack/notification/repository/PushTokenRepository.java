package com.trucktrack.notification.repository;

import com.trucktrack.notification.model.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushTokenRepository extends JpaRepository<PushToken, UUID> {

    List<PushToken> findByUserIdAndIsActiveTrue(UUID userId);

    Optional<PushToken> findByToken(String token);

    boolean existsByToken(String token);

    @Modifying
    @Query("UPDATE PushToken p SET p.isActive = false WHERE p.token = :token")
    void deactivateByToken(@Param("token") String token);

    @Modifying
    @Query("DELETE FROM PushToken p WHERE p.token = :token")
    void deleteByToken(@Param("token") String token);

    @Query("UPDATE PushToken p SET p.lastUsedAt = CURRENT_TIMESTAMP WHERE p.id = :id")
    @Modifying
    void updateLastUsedAt(@Param("id") UUID id);
}
