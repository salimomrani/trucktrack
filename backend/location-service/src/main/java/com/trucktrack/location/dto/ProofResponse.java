package com.trucktrack.location.dto;

import com.trucktrack.location.model.DeliveryProof;
import com.trucktrack.location.model.ProofStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for proof of delivery.
 * Feature: 015-proof-of-delivery
 */
public record ProofResponse(
        UUID id,
        UUID tripId,
        ProofStatus status,
        String statusDisplayName,
        String signatureImage,
        String signerName,
        String refusalReason,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal gpsAccuracy,
        String integrityHash,
        Instant capturedAt,
        Instant syncedAt,
        UUID createdBy,
        String createdByName,
        Instant createdAt,
        int photoCount,
        List<ProofPhotoDTO> photos
) {
    /**
     * Create from entity without photos.
     */
    public static ProofResponse fromEntity(DeliveryProof proof) {
        return fromEntity(proof, null);
    }

    /**
     * Create from entity with optional photos.
     */
    public static ProofResponse fromEntity(DeliveryProof proof, List<ProofPhotoDTO> photos) {
        return new ProofResponse(
                proof.getId(),
                proof.getTripId(),
                proof.getStatus(),
                proof.getStatus().getDisplayName(),
                proof.getSignatureImage(),
                proof.getSignerName(),
                proof.getRefusalReason(),
                proof.getLatitude(),
                proof.getLongitude(),
                proof.getGpsAccuracy(),
                proof.getIntegrityHash(),
                proof.getCapturedAt(),
                proof.getSyncedAt(),
                proof.getCreatedBy(),
                proof.getCreatedByName(),
                proof.getCreatedAt(),
                photos != null ? photos.size() : proof.getPhotoCount(),
                photos
        );
    }

    /**
     * Create from entity with photos converted from entity.
     */
    public static ProofResponse fromEntityWithPhotos(DeliveryProof proof) {
        List<ProofPhotoDTO> photoDTOs = proof.getPhotos() != null
                ? proof.getPhotos().stream().map(ProofPhotoDTO::fromEntity).toList()
                : List.of();
        return fromEntity(proof, photoDTOs);
    }

    /**
     * Check if this proof was signed (vs refused).
     */
    public boolean isSigned() {
        return status == ProofStatus.SIGNED;
    }

    /**
     * Check if this proof was refused.
     */
    public boolean isRefused() {
        return status == ProofStatus.REFUSED;
    }

    /**
     * Check if this proof has photos.
     */
    public boolean hasPhotos() {
        return photoCount > 0;
    }
}
