package com.trucktrack.location.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trucktrack.common.audit.AuditAction;
import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.location.model.AuditLog;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing audit logs.
 * T014: Create AuditService in location-service
 * Feature: 002-admin-panel
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private static final int RETENTION_DAYS = 90;

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Logs a CREATE action asynchronously.
     */
    @Async
    @Transactional
    public void logCreate(String entityType, UUID entityId, UUID userId, String username) {
        log.debug("Logging CREATE action for {} with ID {}", entityType, entityId);
        AuditLog auditLog = AuditLog.forCreate(entityType, entityId, userId, username);
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Logs an UPDATE action with changes.
     */
    @Async
    @Transactional
    public void logUpdate(String entityType, UUID entityId, UUID userId, String username,
                          Object oldValue, Object newValue) {
        log.debug("Logging UPDATE action for {} with ID {}", entityType, entityId);
        String changes = buildChangesJson(oldValue, newValue);
        AuditLog auditLog = AuditLog.forUpdate(entityType, entityId, userId, username, changes);
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Logs a DELETE action.
     */
    @Async
    @Transactional
    public void logDelete(String entityType, UUID entityId, UUID userId, String username) {
        log.debug("Logging DELETE action for {} with ID {}", entityType, entityId);
        AuditLog auditLog = AuditLog.forDelete(entityType, entityId, userId, username);
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Logs a DEACTIVATE action.
     */
    @Async
    @Transactional
    public void logDeactivate(String entityType, UUID entityId, UUID userId, String username) {
        log.debug("Logging DEACTIVATE action for {} with ID {}", entityType, entityId);
        AuditLog auditLog = AuditLog.forDeactivate(entityType, entityId, userId, username);
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Logs a REACTIVATE action.
     */
    @Async
    @Transactional
    public void logReactivate(String entityType, UUID entityId, UUID userId, String username) {
        log.debug("Logging REACTIVATE action for {} with ID {}", entityType, entityId);
        AuditLog auditLog = AuditLog.forReactivate(entityType, entityId, userId, username);
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Logs an ASSIGN action (user/truck to group).
     */
    @Async
    @Transactional
    public void logAssign(String entityType, UUID entityId, UUID targetId,
                          UUID userId, String username) {
        log.debug("Logging ASSIGN action for {} with ID {} to {}", entityType, entityId, targetId);
        String changes = String.format("{\"assignedTo\":\"%s\"}", targetId);
        AuditLog auditLog = AuditLog.builder()
            .action(AuditAction.ASSIGN)
            .entityType(entityType)
            .entityId(entityId)
            .userId(userId)
            .username(username)
            .changes(changes)
            .timestamp(Instant.now())
            .build();
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Logs an UNASSIGN action.
     */
    @Async
    @Transactional
    public void logUnassign(String entityType, UUID entityId, UUID targetId,
                            UUID userId, String username) {
        log.debug("Logging UNASSIGN action for {} with ID {} from {}", entityType, entityId, targetId);
        String changes = String.format("{\"unassignedFrom\":\"%s\"}", targetId);
        AuditLog auditLog = AuditLog.builder()
            .action(AuditAction.UNASSIGN)
            .entityType(entityType)
            .entityId(entityId)
            .userId(userId)
            .username(username)
            .changes(changes)
            .timestamp(Instant.now())
            .build();
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Gets audit logs for a specific entity.
     */
    @Transactional(readOnly = true)
    public PageResponse<AuditLog> getLogsForEntity(String entityType, UUID entityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
            entityType, entityId, pageable);
        return toPageResponse(logs);
    }

    /**
     * Gets audit logs with filters.
     */
    @Transactional(readOnly = true)
    public PageResponse<AuditLog> getLogsWithFilters(String entityType, AuditAction action,
                                                      UUID userId, Instant startTime,
                                                      Instant endTime, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logs = auditLogRepository.findWithFilters(
            entityType, action, userId, startTime, endTime, pageable);
        return toPageResponse(logs);
    }

    /**
     * Converts Spring Page to PageResponse.
     */
    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }

    /**
     * Scheduled job to clean up old audit logs (runs daily at 2 AM).
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldLogs() {
        Instant cutoff = Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS);
        log.info("Cleaning up audit logs older than {}", cutoff);
        auditLogRepository.deleteByTimestampBefore(cutoff);
    }

    /**
     * Enriches audit log with HTTP request information.
     */
    private void enrichWithRequestInfo(AuditLog auditLog) {
        try {
            ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                auditLog.setIpAddress(getClientIpAddress(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
            }
        } catch (Exception e) {
            log.debug("Could not enrich audit log with request info: {}", e.getMessage());
        }
    }

    /**
     * Gets client IP address, handling proxies.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Builds a JSON string representing changes between old and new values.
     */
    private String buildChangesJson(Object oldValue, Object newValue) {
        try {
            Map<String, Object> changes = Map.of(
                "before", oldValue != null ? oldValue : "null",
                "after", newValue != null ? newValue : "null"
            );
            return objectMapper.writeValueAsString(changes);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize changes to JSON: {}", e.getMessage());
            return "{}";
        }
    }

    // ========== Truck-specific audit logging methods ==========

    /**
     * Logs a truck creation.
     */
    @Async
    @Transactional
    public void logTruckCreation(Truck truck, UUID actorId) {
        log.debug("Logging TRUCK creation for {}", truck.getTruckId());
        logCreate("TRUCK", truck.getId(), actorId, "system");
    }

    /**
     * Logs a truck update with changes.
     */
    @Async
    @Transactional
    public void logTruckUpdate(Truck truck, UUID actorId, Map<String, Object> changes) {
        log.debug("Logging TRUCK update for {}", truck.getTruckId());
        try {
            String changesJson = objectMapper.writeValueAsString(changes);
            AuditLog auditLog = AuditLog.builder()
                .action(AuditAction.UPDATE)
                .entityType("TRUCK")
                .entityId(truck.getId())
                .userId(actorId)
                .username("system")
                .changes(changesJson)
                .timestamp(Instant.now())
                .build();
            enrichWithRequestInfo(auditLog);
            auditLogRepository.save(auditLog);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize truck changes: {}", e.getMessage());
        }
    }

    /**
     * Logs a truck status change.
     */
    @Async
    @Transactional
    public void logTruckStatusChange(Truck truck, UUID actorId, TruckStatus oldStatus, TruckStatus newStatus) {
        log.debug("Logging TRUCK status change for {} from {} to {}", truck.getTruckId(), oldStatus, newStatus);
        String changes = String.format("{\"status\":{\"from\":\"%s\",\"to\":\"%s\"}}", oldStatus, newStatus);
        AuditLog auditLog = AuditLog.builder()
            .action(AuditAction.UPDATE)
            .entityType("TRUCK")
            .entityId(truck.getId())
            .userId(actorId)
            .username("system")
            .changes(changes)
            .timestamp(Instant.now())
            .build();
        enrichWithRequestInfo(auditLog);
        auditLogRepository.save(auditLog);
    }

    /**
     * Logs a truck groups update.
     */
    @Async
    @Transactional
    public void logTruckGroupsUpdate(Truck truck, UUID actorId, List<UUID> oldGroups, List<UUID> newGroups) {
        log.debug("Logging TRUCK groups update for {}", truck.getTruckId());
        try {
            Map<String, Object> changes = Map.of(
                "groups", Map.of("from", oldGroups, "to", newGroups)
            );
            String changesJson = objectMapper.writeValueAsString(changes);
            AuditLog auditLog = AuditLog.builder()
                .action(AuditAction.UPDATE)
                .entityType("TRUCK")
                .entityId(truck.getId())
                .userId(actorId)
                .username("system")
                .changes(changesJson)
                .timestamp(Instant.now())
                .build();
            enrichWithRequestInfo(auditLog);
            auditLogRepository.save(auditLog);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize truck groups changes: {}", e.getMessage());
        }
    }
}
