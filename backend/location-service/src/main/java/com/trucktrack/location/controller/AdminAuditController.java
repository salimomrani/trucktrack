package com.trucktrack.location.controller;

import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.model.AuditLog;
import com.trucktrack.location.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for audit log queries.
 * Provides read-only access to audit logs for admin panel.
 */
@Slf4j
@RestController
@RequestMapping("/admin/audit")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
public class AdminAuditController {

    private final AuditLogRepository auditLogRepository;

    /**
     * Get audit logs for a specific entity.
     * GET /admin/audit/{entityType}/{entityId}?page=0&size=10
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<PageResponse<AuditLogResponse>> getAuditLogs(
            @AuthenticationPrincipal GatewayUserPrincipal principal,
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.debug("User [{}] fetching audit logs for {} {}",
                principal != null ? principal.username() : "anonymous", entityType, entityId);

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
                entityType, entityId, pageRequest);

        var responseList = auditLogs.getContent().stream()
                .map(AuditLogResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(new PageResponse<>(
                responseList,
                auditLogs.getNumber(),
                auditLogs.getSize(),
                auditLogs.getTotalElements()
        ));
    }

    /**
     * Response DTO for audit log entries.
     */
    public record AuditLogResponse(
            String id,
            String action,
            String entityType,
            String entityId,
            String userId,
            String username,
            String changes,
            String ipAddress,
            String timestamp
    ) {
        public static AuditLogResponse fromEntity(AuditLog log) {
            return new AuditLogResponse(
                    log.getId().toString(),
                    log.getAction().name(),
                    log.getEntityType(),
                    log.getEntityId().toString(),
                    log.getUserId().toString(),
                    log.getUsername(),
                    log.getChanges(),
                    log.getIpAddress(),
                    log.getTimestamp().toString()
            );
        }
    }
}
