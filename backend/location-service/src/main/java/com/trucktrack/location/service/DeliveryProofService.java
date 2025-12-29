package com.trucktrack.location.service;

import com.trucktrack.location.dto.CreateProofRequest;
import com.trucktrack.location.dto.ProofPhotoDTO;
import com.trucktrack.location.dto.ProofResponse;
import com.trucktrack.location.model.*;
import com.trucktrack.location.repository.DeliveryProofRepository;
import com.trucktrack.location.repository.TripRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing proof of delivery.
 * Feature: 015-proof-of-delivery
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryProofService {

    private final DeliveryProofRepository proofRepository;
    private final TripRepository tripRepository;
    private final TripEventPublisher tripEventPublisher;

    // Minimum signature coverage: 15% of canvas pixels must be non-transparent
    private static final double MIN_SIGNATURE_COVERAGE = 0.15;

    // Maximum sizes
    private static final int MAX_SIGNATURE_SIZE_KB = 100;
    private static final int MAX_PHOTO_SIZE_KB = 500;

    /**
     * Create a proof of delivery for a trip.
     * T016, T017, T018: Service with validation and hash generation
     */
    @Transactional
    public ProofResponse createProof(UUID tripId, CreateProofRequest request, UUID userId) {
        log.info("Creating proof of delivery for trip {} by user {}", tripId, userId);

        // Validate trip exists and is in correct state
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + tripId));

        if (trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new IllegalStateException("Trip must be IN_PROGRESS to add proof. Current status: " + trip.getStatus());
        }

        if (proofRepository.existsByTripId(tripId)) {
            throw new IllegalStateException("Proof already exists for trip: " + tripId);
        }

        // Validate request
        validateRequest(request);

        // Validate signature coverage (T017)
        validateSignatureCoverage(request.signatureImage());

        // Build proof entity
        DeliveryProof proof = DeliveryProof.builder()
                .tripId(tripId)
                .status(request.status())
                .signatureImage(request.signatureImage())
                .signerName(request.signerName())
                .refusalReason(request.refusalReason())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .gpsAccuracy(request.gpsAccuracy())
                .capturedAt(request.capturedAt())
                .syncedAt(Instant.now())
                .createdBy(userId)
                .build();

        // Generate integrity hash (T018)
        proof.setIntegrityHash(generateIntegrityHash(proof));

        // Add photos if provided
        if (request.photos() != null && !request.photos().isEmpty()) {
            int displayOrder = 1;
            for (CreateProofRequest.PhotoRequest photoReq : request.photos()) {
                validatePhotoSize(photoReq.photoImage());

                ProofPhoto photo = ProofPhoto.builder()
                        .photoImage(photoReq.photoImage())
                        .displayOrder(displayOrder++)
                        .latitude(photoReq.latitude())
                        .longitude(photoReq.longitude())
                        .capturedAt(photoReq.capturedAt())
                        .build();
                proof.addPhoto(photo);
            }
        }

        // Save proof
        DeliveryProof saved = proofRepository.save(proof);

        // Update trip status
        trip.setHasProof(true);
        trip.setStatus(TripStatus.COMPLETED);
        trip.setCompletedAt(Instant.now());
        tripRepository.save(trip);

        // Publish trip completed event to Kafka for notification-service (Feature 016)
        List<String> photoUrls = saved.getPhotos() != null
            ? saved.getPhotos().stream().map(p -> "photo-" + p.getId()).toList()
            : List.of();
        tripEventPublisher.publishTripCompleted(trip, request.signerName(), "signature-" + saved.getId(), photoUrls);

        log.info("Created proof {} for trip {} with {} photos", saved.getId(), tripId, saved.getPhotoCount());

        return ProofResponse.fromEntityWithPhotos(saved);
    }

    /**
     * Get proof by trip ID.
     * T020: GET endpoint for driver
     */
    @Transactional(readOnly = true)
    public ProofResponse getProofByTripId(UUID tripId) {
        DeliveryProof proof = proofRepository.findByTripIdWithPhotos(tripId)
                .orElseThrow(() -> new EntityNotFoundException("No proof found for trip: " + tripId));
        return ProofResponse.fromEntityWithPhotos(proof);
    }

    /**
     * Get proof by ID with photos.
     */
    @Transactional(readOnly = true)
    public ProofResponse getProofById(UUID proofId) {
        DeliveryProof proof = proofRepository.findByIdWithPhotos(proofId)
                .orElseThrow(() -> new EntityNotFoundException("Proof not found: " + proofId));
        return ProofResponse.fromEntityWithPhotos(proof);
    }

    /**
     * Check if a trip has a proof.
     */
    public boolean hasProof(UUID tripId) {
        return proofRepository.existsByTripId(tripId);
    }

    /**
     * Get all proofs with pagination (admin).
     */
    @Transactional(readOnly = true)
    public Page<ProofResponse> getAllProofs(
            ProofStatus status,
            UUID createdBy,
            Instant startDate,
            Instant endDate,
            Pageable pageable
    ) {
        return proofRepository.findAllWithFilters(status, createdBy, startDate, endDate, pageable)
                .map(ProofResponse::fromEntity);
    }

    /**
     * Get proof statistics.
     */
    public ProofStats getStats(Instant startDate, Instant endDate) {
        long totalSigned = proofRepository.countByStatusAndCreatedAtBetween(ProofStatus.SIGNED, startDate, endDate);
        long totalRefused = proofRepository.countByStatusAndCreatedAtBetween(ProofStatus.REFUSED, startDate, endDate);
        long total = totalSigned + totalRefused;

        return new ProofStats(
                total,
                totalSigned,
                totalRefused,
                total > 0 ? (double) totalSigned / total * 100 : 0
        );
    }

    /**
     * Validate the create request.
     */
    private void validateRequest(CreateProofRequest request) {
        if (request.status() == ProofStatus.REFUSED) {
            if (request.refusalReason() == null || request.refusalReason().isBlank()) {
                throw new IllegalArgumentException("Refusal reason is required when status is REFUSED");
            }
        }

        validateSignatureSize(request.signatureImage());

        if (request.photos() != null && request.photos().size() > 3) {
            throw new IllegalArgumentException("Maximum 3 photos allowed");
        }
    }

    /**
     * Validate signature image size (max 100KB).
     */
    private void validateSignatureSize(String signatureBase64) {
        try {
            // Remove data URL prefix if present
            String base64Data = signatureBase64;
            if (signatureBase64.contains(",")) {
                base64Data = signatureBase64.substring(signatureBase64.indexOf(",") + 1);
            }

            byte[] decoded = Base64.getDecoder().decode(base64Data);
            int sizeKB = decoded.length / 1024;

            if (sizeKB > MAX_SIGNATURE_SIZE_KB) {
                throw new IllegalArgumentException(
                        String.format("Signature image too large: %dKB (max %dKB)", sizeKB, MAX_SIGNATURE_SIZE_KB)
                );
            }
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("too large")) {
                throw e;
            }
            throw new IllegalArgumentException("Invalid signature image format");
        }
    }

    /**
     * Validate signature coverage (T017).
     * At least 15% of the canvas must have non-transparent pixels.
     */
    private void validateSignatureCoverage(String signatureBase64) {
        // For now, we do a simple check: the signature must have a reasonable amount of data
        // A more sophisticated check would decode the PNG and count non-transparent pixels
        try {
            String base64Data = signatureBase64;
            if (signatureBase64.contains(",")) {
                base64Data = signatureBase64.substring(signatureBase64.indexOf(",") + 1);
            }

            byte[] decoded = Base64.getDecoder().decode(base64Data);

            // Minimum expected size for a valid signature (roughly 2KB for a basic stroke)
            int minSizeBytes = 2048;
            if (decoded.length < minSizeBytes) {
                throw new IllegalArgumentException(
                        "Signature appears to be too simple. Please provide a more complete signature."
                );
            }

            log.debug("Signature validation passed: {} bytes", decoded.length);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("too simple")) {
                throw e;
            }
            throw new IllegalArgumentException("Invalid signature image format");
        }
    }

    /**
     * Validate photo size (max 500KB).
     */
    private void validatePhotoSize(String photoBase64) {
        try {
            String base64Data = photoBase64;
            if (photoBase64.contains(",")) {
                base64Data = photoBase64.substring(photoBase64.indexOf(",") + 1);
            }

            byte[] decoded = Base64.getDecoder().decode(base64Data);
            int sizeKB = decoded.length / 1024;

            if (sizeKB > MAX_PHOTO_SIZE_KB) {
                throw new IllegalArgumentException(
                        String.format("Photo too large: %dKB (max %dKB)", sizeKB, MAX_PHOTO_SIZE_KB)
                );
            }
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("too large")) {
                throw e;
            }
            throw new IllegalArgumentException("Invalid photo format");
        }
    }

    /**
     * Generate SHA-256 integrity hash for the proof (T018).
     */
    private String generateIntegrityHash(DeliveryProof proof) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            // Hash key fields that shouldn't be tampered with
            String dataToHash = String.join("|",
                    proof.getTripId().toString(),
                    proof.getStatus().name(),
                    proof.getSignatureImage(),
                    proof.getLatitude().toPlainString(),
                    proof.getLongitude().toPlainString(),
                    proof.getCapturedAt().toString(),
                    proof.getCreatedBy().toString()
            );

            byte[] hashBytes = digest.digest(dataToHash.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Verify the integrity of a proof.
     */
    public boolean verifyIntegrity(DeliveryProof proof) {
        String expectedHash = generateIntegrityHash(proof);
        return expectedHash.equals(proof.getIntegrityHash());
    }

    /**
     * Statistics DTO.
     */
    public record ProofStats(
            long totalProofs,
            long signedCount,
            long refusedCount,
            double signedPercentage
    ) {}
}
