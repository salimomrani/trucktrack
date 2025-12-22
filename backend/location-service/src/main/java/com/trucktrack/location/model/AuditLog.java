package com.trucktrack.location.model;

import com.trucktrack.common.audit.AuditAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * AuditLog entity for tracking administrative actions.
 * T012: Create AuditLog entity in location-service
 * Feature: 002-admin-panel
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_audit_logs_user", columnList = "user_id"),
    @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_logs_action", columnList = "action")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private AuditAction action;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "changes", columnDefinition = "jsonb")
    private String changes;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "timestamp", nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();

    /**
     * Creates an audit log for entity creation.
     */
    public static AuditLog forCreate(String entityType, UUID entityId, UUID userId, String username) {
        return AuditLog.builder()
            .action(AuditAction.CREATE)
            .entityType(entityType)
            .entityId(entityId)
            .userId(userId)
            .username(username)
            .timestamp(Instant.now())
            .build();
    }

    /**
     * Creates an audit log for entity update.
     */
    public static AuditLog forUpdate(String entityType, UUID entityId, UUID userId, String username, String changes) {
        return AuditLog.builder()
            .action(AuditAction.UPDATE)
            .entityType(entityType)
            .entityId(entityId)
            .userId(userId)
            .username(username)
            .changes(changes)
            .timestamp(Instant.now())
            .build();
    }

    /**
     * Creates an audit log for entity deletion.
     */
    public static AuditLog forDelete(String entityType, UUID entityId, UUID userId, String username) {
        return AuditLog.builder()
            .action(AuditAction.DELETE)
            .entityType(entityType)
            .entityId(entityId)
            .userId(userId)
            .username(username)
            .timestamp(Instant.now())
            .build();
    }

    /**
     * Creates an audit log for entity deactivation.
     */
    public static AuditLog forDeactivate(String entityType, UUID entityId, UUID userId, String username) {
        return AuditLog.builder()
            .action(AuditAction.DEACTIVATE)
            .entityType(entityType)
            .entityId(entityId)
            .userId(userId)
            .username(username)
            .timestamp(Instant.now())
            .build();
    }

    /**
     * Creates an audit log for entity reactivation.
     */
    public static AuditLog forReactivate(String entityType, UUID entityId, UUID userId, String username) {
        return AuditLog.builder()
            .action(AuditAction.REACTIVATE)
            .entityType(entityType)
            .entityId(entityId)
            .userId(userId)
            .username(username)
            .timestamp(Instant.now())
            .build();
    }
}
