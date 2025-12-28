package com.trucktrack.location.controller;

import com.trucktrack.common.security.GatewayUserPrincipal;
import com.trucktrack.location.dto.CreateProofRequest;
import com.trucktrack.location.dto.ProofResponse;
import com.trucktrack.location.model.ProofStatus;
import com.trucktrack.location.service.DeliveryProofService;
import com.trucktrack.location.service.PdfExportService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for Proof of Delivery endpoints.
 * Feature: 015-proof-of-delivery
 *
 * Driver endpoints: /location/v1/trips/{tripId}/proof
 * Admin endpoints: /location/v1/admin/proofs
 */
@RestController
@RequestMapping("/location/v1")
@RequiredArgsConstructor
@Slf4j
public class DeliveryProofController {

    private final DeliveryProofService proofService;
    private final PdfExportService pdfExportService;

    // ==================== Driver Endpoints ====================

    /**
     * T019: Create proof of delivery for a trip.
     * Driver endpoint to submit signature and photos.
     */
    @PostMapping("/trips/{tripId}/proof")
    public ResponseEntity<ProofResponse> createProof(
            @PathVariable UUID tripId,
            @Valid @RequestBody CreateProofRequest request,
            @AuthenticationPrincipal GatewayUserPrincipal principal
    ) {
        log.info("Driver {} creating proof for trip {}", principal.username(), tripId);

        UUID userId = UUID.fromString(principal.userId());
        ProofResponse proof = proofService.createProof(tripId, request, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(proof);
    }

    /**
     * T020: Get proof of delivery for a trip.
     * Driver endpoint to retrieve existing proof.
     */
    @GetMapping("/trips/{tripId}/proof")
    public ResponseEntity<ProofResponse> getProofByTripId(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal GatewayUserPrincipal principal
    ) {
        log.debug("User {} fetching proof for trip {}", principal.username(), tripId);

        ProofResponse proof = proofService.getProofByTripId(tripId);
        return ResponseEntity.ok(proof);
    }

    /**
     * Check if a trip has a proof.
     */
    @GetMapping("/trips/{tripId}/proof/exists")
    public ResponseEntity<Map<String, Boolean>> hasProof(
            @PathVariable UUID tripId,
            @AuthenticationPrincipal GatewayUserPrincipal principal
    ) {
        boolean hasProof = proofService.hasProof(tripId);
        return ResponseEntity.ok(Map.of("hasProof", hasProof));
    }

    // ==================== Admin Endpoints ====================

    /**
     * T037: Get all proofs with filters (admin).
     */
    @GetMapping("/admin/proofs")
    public ResponseEntity<Page<ProofResponse>> getAllProofs(
            @RequestParam(required = false) ProofStatus status,
            @RequestParam(required = false) UUID createdBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal GatewayUserPrincipal principal
    ) {
        log.debug("Admin {} fetching proofs with filters", principal.username());

        Page<ProofResponse> proofs = proofService.getAllProofs(status, createdBy, startDate, endDate, pageable);
        return ResponseEntity.ok(proofs);
    }

    /**
     * T038: Get proof by ID (admin).
     */
    @GetMapping("/admin/proofs/{proofId}")
    public ResponseEntity<ProofResponse> getProofById(
            @PathVariable UUID proofId,
            @AuthenticationPrincipal GatewayUserPrincipal principal
    ) {
        log.debug("Admin {} fetching proof {}", principal.username(), proofId);

        ProofResponse proof = proofService.getProofById(proofId);
        return ResponseEntity.ok(proof);
    }

    /**
     * T039: Get proof statistics (admin).
     */
    @GetMapping("/admin/proofs/stats")
    public ResponseEntity<DeliveryProofService.ProofStats> getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @AuthenticationPrincipal GatewayUserPrincipal principal
    ) {
        log.debug("Admin {} fetching proof stats", principal.username());

        // Default to last 30 days if not specified
        if (startDate == null) {
            startDate = Instant.now().minusSeconds(30 * 24 * 60 * 60);
        }
        if (endDate == null) {
            endDate = Instant.now();
        }

        DeliveryProofService.ProofStats stats = proofService.getStats(startDate, endDate);
        return ResponseEntity.ok(stats);
    }

    /**
     * T041: Download PDF for a proof (admin).
     */
    @GetMapping("/admin/proofs/{proofId}/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable UUID proofId,
            @AuthenticationPrincipal GatewayUserPrincipal principal
    ) {
        log.info("Admin {} downloading PDF for proof {}", principal.username(), proofId);

        byte[] pdfBytes = pdfExportService.generatePdf(proofId.toString());

        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=pod-" + proofId + ".pdf")
                .body(pdfBytes);
    }

    // ==================== Exception Handlers ====================

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
    }
}
