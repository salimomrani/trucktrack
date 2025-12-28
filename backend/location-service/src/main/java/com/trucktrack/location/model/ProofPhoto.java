package com.trucktrack.location.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Photo attached to a delivery proof.
 * Feature: 015-proof-of-delivery
 *
 * Optional photos (1-3) that can be added to proof of delivery
 * for additional evidence.
 */
@Entity
@Table(name = "proof_photos", indexes = {
    @Index(name = "idx_proof_photos_proof_id", columnList = "proof_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "unique_proof_order", columnNames = {"proof_id", "display_order"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ProofPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proof_id", nullable = false)
    @ToString.Exclude
    private DeliveryProof proof;

    @NotBlank(message = "Photo image is required")
    @Column(name = "photo_image", nullable = false, columnDefinition = "TEXT")
    @ToString.Exclude
    private String photoImage;

    @NotNull(message = "Display order is required")
    @Min(value = 1, message = "Display order must be >= 1")
    @Max(value = 3, message = "Display order must be <= 3")
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

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

    @NotNull(message = "Captured at timestamp is required")
    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Get the proof ID without loading the full proof entity.
     */
    public UUID getProofId() {
        return proof != null ? proof.getId() : null;
    }
}
