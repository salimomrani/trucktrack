package com.trucktrack.location.dto;

import com.trucktrack.location.model.ProofStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Request DTO for creating a proof of delivery.
 * Feature: 015-proof-of-delivery
 */
public record CreateProofRequest(
        @NotNull(message = "Status is required")
        ProofStatus status,

        @NotBlank(message = "Signature image is required")
        String signatureImage,

        @Size(max = 200, message = "Signer name must not exceed 200 characters")
        String signerName,

        @Size(max = 500, message = "Refusal reason must not exceed 500 characters")
        String refusalReason,

        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
        @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
        BigDecimal latitude,

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
        @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
        BigDecimal longitude,

        @NotNull(message = "GPS accuracy is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "GPS accuracy must be > 0")
        BigDecimal gpsAccuracy,

        @NotNull(message = "Captured at timestamp is required")
        Instant capturedAt,

        @Size(max = 3, message = "Maximum 3 photos allowed")
        @Valid
        List<PhotoRequest> photos
) {
    /**
     * Nested DTO for photo data.
     */
    public record PhotoRequest(
            @NotBlank(message = "Photo image is required")
            String photoImage,

            @NotNull(message = "Photo latitude is required")
            @DecimalMin(value = "-90.0", message = "Photo latitude must be >= -90")
            @DecimalMax(value = "90.0", message = "Photo latitude must be <= 90")
            BigDecimal latitude,

            @NotNull(message = "Photo longitude is required")
            @DecimalMin(value = "-180.0", message = "Photo longitude must be >= -180")
            @DecimalMax(value = "180.0", message = "Photo longitude must be <= 180")
            BigDecimal longitude,

            @NotNull(message = "Photo captured at timestamp is required")
            Instant capturedAt
    ) {}

    /**
     * Validate that refusal reason is provided when status is REFUSED.
     */
    public boolean isValid() {
        if (status == ProofStatus.REFUSED) {
            return refusalReason != null && !refusalReason.isBlank();
        }
        return true;
    }
}
