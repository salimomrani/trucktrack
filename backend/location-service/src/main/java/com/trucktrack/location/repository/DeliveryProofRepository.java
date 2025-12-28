package com.trucktrack.location.repository;

import com.trucktrack.location.model.DeliveryProof;
import com.trucktrack.location.model.ProofStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for DeliveryProof entities.
 * Feature: 015-proof-of-delivery
 */
@Repository
public interface DeliveryProofRepository extends JpaRepository<DeliveryProof, UUID> {

    /**
     * Find proof by trip ID.
     */
    Optional<DeliveryProof> findByTripId(UUID tripId);

    /**
     * Check if a proof exists for a trip.
     */
    boolean existsByTripId(UUID tripId);

    /**
     * Find all proofs created by a specific user.
     */
    Page<DeliveryProof> findByCreatedBy(UUID createdBy, Pageable pageable);

    /**
     * Find all proofs with a specific status.
     */
    Page<DeliveryProof> findByStatus(ProofStatus status, Pageable pageable);

    /**
     * Find proofs created within a date range.
     */
    Page<DeliveryProof> findByCreatedAtBetween(Instant startDate, Instant endDate, Pageable pageable);

    /**
     * Find proofs by status within a date range.
     */
    Page<DeliveryProof> findByStatusAndCreatedAtBetween(
            ProofStatus status,
            Instant startDate,
            Instant endDate,
            Pageable pageable
    );

    /**
     * Find proofs with eager fetch of photos.
     */
    @Query("SELECT DISTINCT p FROM DeliveryProof p LEFT JOIN FETCH p.photos WHERE p.id = :id")
    Optional<DeliveryProof> findByIdWithPhotos(@Param("id") UUID id);

    /**
     * Find proof by trip ID with eager fetch of photos.
     */
    @Query("SELECT DISTINCT p FROM DeliveryProof p LEFT JOIN FETCH p.photos WHERE p.tripId = :tripId")
    Optional<DeliveryProof> findByTripIdWithPhotos(@Param("tripId") UUID tripId);

    /**
     * Count proofs by status.
     */
    long countByStatus(ProofStatus status);

    /**
     * Count proofs created within a date range.
     */
    long countByCreatedAtBetween(Instant startDate, Instant endDate);

    /**
     * Count proofs by status within a date range.
     */
    long countByStatusAndCreatedAtBetween(ProofStatus status, Instant startDate, Instant endDate);

    /**
     * Find proofs for multiple trips.
     */
    List<DeliveryProof> findByTripIdIn(List<UUID> tripIds);

    /**
     * Admin: Find all proofs with filters.
     */
    @Query("""
        SELECT p FROM DeliveryProof p
        WHERE (:status IS NULL OR p.status = :status)
        AND (:createdBy IS NULL OR p.createdBy = :createdBy)
        AND (:startDate IS NULL OR p.createdAt >= :startDate)
        AND (:endDate IS NULL OR p.createdAt <= :endDate)
        ORDER BY p.createdAt DESC
        """)
    Page<DeliveryProof> findAllWithFilters(
            @Param("status") ProofStatus status,
            @Param("createdBy") UUID createdBy,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            Pageable pageable
    );
}
