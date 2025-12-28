package com.trucktrack.location.repository;

import com.trucktrack.location.model.ProofPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for ProofPhoto entities.
 * Feature: 015-proof-of-delivery
 */
@Repository
public interface ProofPhotoRepository extends JpaRepository<ProofPhoto, UUID> {

    /**
     * Find all photos for a proof, ordered by display order.
     */
    List<ProofPhoto> findByProof_IdOrderByDisplayOrderAsc(UUID proofId);

    /**
     * Count photos for a proof.
     */
    long countByProof_Id(UUID proofId);

    /**
     * Delete all photos for a proof.
     */
    void deleteByProof_Id(UUID proofId);

    /**
     * Check if a display order is already used for a proof.
     */
    boolean existsByProof_IdAndDisplayOrder(UUID proofId, Integer displayOrder);

    /**
     * Find the next available display order for a proof.
     */
    @Query("SELECT COALESCE(MAX(p.displayOrder), 0) + 1 FROM ProofPhoto p WHERE p.proof.id = :proofId")
    Integer findNextDisplayOrder(@Param("proofId") UUID proofId);
}
