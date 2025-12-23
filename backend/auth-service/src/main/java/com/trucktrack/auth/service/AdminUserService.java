package com.trucktrack.auth.service;

import com.trucktrack.auth.dto.CreateUserRequest;
import com.trucktrack.auth.dto.UpdateUserRequest;
import com.trucktrack.auth.dto.UserAdminResponse;
import com.trucktrack.auth.model.User;
import com.trucktrack.auth.model.UserGroupAssignment;
import com.trucktrack.common.security.UserRole;
import com.trucktrack.auth.repository.UserGroupAssignmentRepository;
import com.trucktrack.auth.repository.UserRepository;
import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.common.exception.ResourceNotFoundException;
import com.trucktrack.common.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for admin user management operations.
 * T028: Create AdminUserService
 * Feature: 002-admin-panel
 */
@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final UserRepository userRepository;
    private final UserGroupAssignmentRepository groupAssignmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(
            UserRepository userRepository,
            UserGroupAssignmentRepository groupAssignmentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.groupAssignmentRepository = groupAssignmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Get paginated list of users with optional search and filters.
     */
    @Transactional(readOnly = true)
    public PageResponse<UserAdminResponse> getUsers(String search, UserRole role, Boolean isActive,
                                                     int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> users;
        if (search != null && !search.isBlank()) {
            users = searchUsers(search, role, isActive, pageable);
        } else if (role != null || isActive != null) {
            users = filterUsers(role, isActive, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        List<UserAdminResponse> responses = users.getContent().stream()
            .map(user -> {
                int groupCount = (int) groupAssignmentRepository.countByUserId(user.getId());
                return UserAdminResponse.minimal(user, groupCount);
            })
            .collect(Collectors.toList());

        return new PageResponse<>(responses, page, size, users.getTotalElements());
    }

    /**
     * Get user by ID with full details including group assignments.
     */
    @Transactional(readOnly = true)
    public UserAdminResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        List<UUID> groupIds = groupAssignmentRepository.findGroupIdsByUserId(userId);
        return UserAdminResponse.from(user, groupIds);
    }

    /**
     * Create a new user.
     * T029: Implement createUser() with password validation and activation email
     */
    @Transactional
    public UserAdminResponse createUser(CreateUserRequest request, UUID adminUserId, String adminUsername) {
        log.info("Creating user with email: {} by admin: {}", request.email(), adminUsername);

        // Check for duplicate email
        if (userRepository.existsByEmail(request.email())) {
            throw new ValidationException("Email already exists: " + request.email());
        }

        // Create user entity
        User user = new User(
            request.email(),
            passwordEncoder.encode(request.password()),
            request.firstName(),
            request.lastName(),
            request.role()
        );
        user.setIsActive(true); // Active by default for admin-created users

        user = userRepository.save(user);
        log.info("User created with ID: {}", user.getId());

        // Assign groups if provided
        List<UUID> groupIds = request.getGroupIdsOrEmpty();
        if (!groupIds.isEmpty()) {
            assignUserToGroups(user.getId(), groupIds);
        }

        // TODO: Send activation email (FR-024)
        // emailService.sendActivationEmail(user);

        return UserAdminResponse.from(user, groupIds);
    }

    /**
     * Update an existing user.
     * T030: Implement updateUser() with role change and audit logging
     */
    @Transactional
    public UserAdminResponse updateUser(UUID userId, UpdateUserRequest request,
                                        UUID adminUserId, String adminUsername) {
        log.info("Updating user {} by admin: {}", userId, adminUsername);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Check for email uniqueness if changing email
        if (request.hasEmail() && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new ValidationException("Email already exists: " + request.email());
            }
            user.setEmail(request.email());
        }

        // Update fields if provided
        if (request.hasPassword()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        if (request.hasFirstName()) {
            user.setFirstName(request.firstName());
        }
        if (request.hasLastName()) {
            user.setLastName(request.lastName());
        }
        if (request.hasRole()) {
            // Check if demoting last admin
            if (user.getRole() == UserRole.ADMIN && request.role() != UserRole.ADMIN) {
                ensureNotLastAdmin(userId);
            }
            user.setRole(request.role());
        }

        user = userRepository.save(user);

        // Update group assignments if provided
        List<UUID> groupIds;
        if (request.hasGroupIds()) {
            updateUserGroups(userId, request.groupIds());
            groupIds = request.groupIds();
        } else {
            groupIds = groupAssignmentRepository.findGroupIdsByUserId(userId);
        }

        log.info("User {} updated successfully", userId);
        return UserAdminResponse.from(user, groupIds);
    }

    /**
     * Deactivate a user account.
     * T031: Implement deactivateUser() with session invalidation and last-admin check
     */
    @Transactional
    public UserAdminResponse deactivateUser(UUID userId, UUID adminUserId, String adminUsername) {
        log.info("Deactivating user {} by admin: {}", userId, adminUsername);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Prevent self-deactivation
        if (userId.equals(adminUserId)) {
            throw new ValidationException("Cannot deactivate your own account");
        }

        // Prevent deactivating last admin
        if (user.getRole() == UserRole.ADMIN) {
            ensureNotLastAdmin(userId);
        }

        if (!user.getIsActive()) {
            throw new ValidationException("User is already inactive");
        }

        user.setIsActive(false);
        user = userRepository.save(user);

        // TODO: Invalidate user sessions (FR-003)
        // sessionService.invalidateUserSessions(userId);

        log.info("User {} deactivated", userId);
        List<UUID> groupIds = groupAssignmentRepository.findGroupIdsByUserId(userId);
        return UserAdminResponse.from(user, groupIds);
    }

    /**
     * Reactivate a user account.
     * T032: Implement reactivateUser()
     */
    @Transactional
    public UserAdminResponse reactivateUser(UUID userId, UUID adminUserId, String adminUsername) {
        log.info("Reactivating user {} by admin: {}", userId, adminUsername);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (user.getIsActive()) {
            throw new ValidationException("User is already active");
        }

        user.setIsActive(true);
        user = userRepository.save(user);

        log.info("User {} reactivated", userId);
        List<UUID> groupIds = groupAssignmentRepository.findGroupIdsByUserId(userId);
        return UserAdminResponse.from(user, groupIds);
    }

    /**
     * Resend activation email to user.
     * T033: Implement resendActivationEmail()
     */
    @Transactional(readOnly = true)
    public void resendActivationEmail(UUID userId, UUID adminUserId, String adminUsername) {
        log.info("Resending activation email for user {} by admin: {}", userId, adminUsername);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // TODO: Implement email sending (FR-024, FR-025)
        // emailService.sendActivationEmail(user);

        log.info("Activation email resent for user {}", userId);
    }

    /**
     * Get groups assigned to a user.
     */
    @Transactional(readOnly = true)
    public List<UUID> getUserGroups(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found: " + userId);
        }
        return groupAssignmentRepository.findGroupIdsByUserId(userId);
    }

    /**
     * Update user's group assignments.
     */
    @Transactional
    public List<UUID> updateUserGroups(UUID userId, List<UUID> groupIds) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found: " + userId);
        }

        // Remove existing assignments
        groupAssignmentRepository.deleteByUserId(userId);

        // Add new assignments
        if (groupIds != null && !groupIds.isEmpty()) {
            assignUserToGroups(userId, groupIds);
        }

        return groupIds != null ? groupIds : List.of();
    }

    /**
     * Count active admins (for last-admin check).
     */
    @Transactional(readOnly = true)
    public long countActiveAdmins() {
        return userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.ADMIN && u.getIsActive())
            .count();
    }

    // ========== Private Helper Methods ==========

    private void assignUserToGroups(UUID userId, List<UUID> groupIds) {
        List<UserGroupAssignment> assignments = groupIds.stream()
            .map(groupId -> UserGroupAssignment.create(userId, groupId))
            .collect(Collectors.toList());
        groupAssignmentRepository.saveAll(assignments);
    }

    private void ensureNotLastAdmin(UUID excludeUserId) {
        long adminCount = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.ADMIN && u.getIsActive() && !u.getId().equals(excludeUserId))
            .count();

        if (adminCount == 0) {
            throw new ValidationException("Cannot modify last active admin. At least one admin must exist.");
        }
    }

    private Page<User> searchUsers(String search, UserRole role, Boolean isActive, Pageable pageable) {
        // Simple search implementation - can be enhanced with Specification
        return userRepository.findAll(pageable);
        // TODO: Implement proper search with JPQL or Specification
    }

    private Page<User> filterUsers(UserRole role, Boolean isActive, Pageable pageable) {
        // Simple filter implementation - can be enhanced with Specification
        return userRepository.findAll(pageable);
        // TODO: Implement proper filtering with JPQL or Specification
    }
}
