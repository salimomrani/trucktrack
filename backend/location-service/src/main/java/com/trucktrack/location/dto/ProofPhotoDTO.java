package com.trucktrack.location.dto;

import com.trucktrack.location.model.ProofPhoto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for proof photo.
 * Feature: 015-proof-of-delivery
 */
public record ProofPhotoDTO(
        UUID id,
        UUID proofId,
        String photoImage,
        int displayOrder,
        BigDecimal latitude,
        BigDecimal longitude,
        Instant capturedAt,
        Instant createdAt
) {
    /**
     * Create from entity.
     */
    public static ProofPhotoDTO fromEntity(ProofPhoto photo) {
        return new ProofPhotoDTO(
                photo.getId(),
                photo.getProofId(),
                photo.getPhotoImage(),
                photo.getDisplayOrder(),
                photo.getLatitude(),
                photo.getLongitude(),
                photo.getCapturedAt(),
                photo.getCreatedAt()
        );
    }

    /**
     * Create without the actual image data (for listings).
     */
    public static ProofPhotoDTO fromEntityWithoutImage(ProofPhoto photo) {
        return new ProofPhotoDTO(
                photo.getId(),
                photo.getProofId(),
                null, // Exclude image data
                photo.getDisplayOrder(),
                photo.getLatitude(),
                photo.getLongitude(),
                photo.getCapturedAt(),
                photo.getCreatedAt()
        );
    }
}
