package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Proof of delivery entity for electronic signature capture.
 * Feature: 015-proof-of-delivery
 *
 * Stores signature image, GPS coordinates, timestamp, and optional photos
 * to prove delivery completion.
 */
@Entity
@Table(name = "delivery_proofs", indexes = {
    @Index(name = "idx_delivery_proofs_trip_id", columnList = "trip_id", unique = true),
    @Index(name = "idx_delivery_proofs_created_at", columnList = "created_at"),
    @Index(name = "idx_delivery_proofs_created_by", columnList = "created_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"signatureImage", "photos"})
public class DeliveryProof {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "Trip ID is required")
    @Column(name = "trip_id", nullable = false, unique = true)
    private UUID tripId;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "status", nullable = false, columnDefinition = "proof_status")
    private ProofStatus status;

    @NotBlank(message = "Signature image is required")
    @Column(name = "signature_image", nullable = false, columnDefinition = "TEXT")
    private String signatureImage;

    @Size(max = 200, message = "Signer name must not exceed 200 characters")
    @Column(name = "signer_name", length = 200)
    private String signerName;

    @Size(max = 500, message = "Refusal reason must not exceed 500 characters")
    @Column(name = "refusal_reason", length = 500)
    private String refusalReason;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    @Column(name = "latitude", nullable = false, precision = 10, scale = 8)
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    @Column(name = "longitude", nullable = false, precision = 11, scale = 8)
    private BigDecimal longitude;

    @NotNull(message = "GPS accuracy is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "GPS accuracy must be > 0")
    @Column(name = "gps_accuracy", nullable = false, precision = 6, scale = 2)
    private BigDecimal gpsAccuracy;

    @NotBlank(message = "Integrity hash is required")
    @Size(min = 64, max = 64, message = "Integrity hash must be exactly 64 characters")
    @Column(name = "integrity_hash", nullable = false, length = 64)
    private String integrityHash;

    @NotNull(message = "Captured at timestamp is required")
    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    @Column(name = "synced_at", nullable = false)
    @Builder.Default
    private Instant syncedAt = Instant.now();

    @NotNull(message = "Created by is required")
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "proof", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<ProofPhoto> photos = new ArrayList<>();

    // Transient fields for response enrichment
    @Transient
    private String createdByName;

    /**
     * Add a photo to this proof.
     */
    public void addPhoto(ProofPhoto photo) {
        photos.add(photo);
        photo.setProof(this);
    }

    /**
     * Check if this proof has photos attached.
     */
    public boolean hasPhotos() {
        return photos != null && !photos.isEmpty();
    }

    /**
     * Get the count of attached photos.
     */
    public int getPhotoCount() {
        return photos != null ? photos.size() : 0;
    }

    /**
     * Check if this is a signed proof (vs refused).
     */
    public boolean isSigned() {
        return status == ProofStatus.SIGNED;
    }

    /**
     * Check if this is a refused proof.
     */
    public boolean isRefused() {
        return status == ProofStatus.REFUSED;
    }
}
