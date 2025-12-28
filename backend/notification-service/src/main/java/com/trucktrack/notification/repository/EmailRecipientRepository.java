package com.trucktrack.notification.repository;

import com.trucktrack.notification.model.EmailRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailRecipientRepository extends JpaRepository<EmailRecipient, UUID> {

    Optional<EmailRecipient> findByEmail(String email);

    Optional<EmailRecipient> findByEmailAndIsValidTrue(String email);

    boolean existsByEmail(String email);
}
