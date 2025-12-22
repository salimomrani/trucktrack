package com.trucktrack.location.repository;

import com.trucktrack.location.model.TruckGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TruckGroup entity.
 * Feature: 002-admin-panel
 */
@Repository
public interface TruckGroupRepository extends JpaRepository<TruckGroup, UUID> {

    /**
     * Find group by name.
     */
    Optional<TruckGroup> findByName(String name);

    /**
     * Check if group name exists.
     */
    boolean existsByName(String name);

    /**
     * Check if group name exists (excluding specific group).
     */
    @Query("SELECT COUNT(g) > 0 FROM TruckGroup g WHERE g.name = :name AND g.id != :excludeId")
    boolean existsByNameAndIdNot(@Param("name") String name, @Param("excludeId") UUID excludeId);

    /**
     * Search groups by name or description.
     */
    @Query("SELECT g FROM TruckGroup g WHERE " +
           "LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<TruckGroup> searchByNameOrDescription(@Param("query") String query);

    /**
     * Search with pagination.
     */
    @Query("SELECT g FROM TruckGroup g WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(g.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<TruckGroup> searchWithFilters(@Param("search") String search, Pageable pageable);

    /**
     * Find all groups ordered by name.
     */
    List<TruckGroup> findAllByOrderByNameAsc();
}
