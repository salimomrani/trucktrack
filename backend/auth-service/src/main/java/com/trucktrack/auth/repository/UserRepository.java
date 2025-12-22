package com.trucktrack.auth.repository;

import com.trucktrack.auth.model.User;
import com.trucktrack.auth.model.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity.
 * Enhanced for admin panel features.
 * Feature: 002-admin-panel
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /**
     * Search users by email, first name, or last name.
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    /**
     * Search users with role filter.
     */
    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> searchUsersWithFilters(
        @Param("search") String search,
        @Param("role") UserRole role,
        @Param("isActive") Boolean isActive,
        Pageable pageable);

    /**
     * Filter users by role and/or active status.
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> findByFilters(
        @Param("role") UserRole role,
        @Param("isActive") Boolean isActive,
        Pageable pageable);

    /**
     * Find users by role.
     */
    Page<User> findByRole(UserRole role, Pageable pageable);

    /**
     * Find users by active status.
     */
    Page<User> findByIsActive(Boolean isActive, Pageable pageable);

    /**
     * Count active admins.
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'ADMIN' AND u.isActive = true")
    long countActiveAdmins();

    /**
     * Count users by role.
     */
    long countByRole(UserRole role);

    /**
     * Count active users.
     */
    long countByIsActive(Boolean isActive);
}
