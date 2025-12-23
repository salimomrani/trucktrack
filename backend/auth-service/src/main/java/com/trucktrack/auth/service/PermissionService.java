package com.trucktrack.auth.service;

import com.trucktrack.auth.model.User;
import com.trucktrack.common.security.UserRole;
import com.trucktrack.auth.repository.UserGroupAssignmentRepository;
import com.trucktrack.auth.repository.UserRepository;
import com.trucktrack.common.dto.UserPermissions;
import com.trucktrack.common.security.Page;
import com.trucktrack.common.security.RolePermissions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for checking user permissions and access rights.
 * Feature: 008-rbac-permissions
 * T005: Create PermissionService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UserRepository userRepository;
    private final UserGroupAssignmentRepository userGroupAssignmentRepository;

    /**
     * Get full permissions for a user.
     *
     * @param userId The user's ID
     * @return UserPermissions DTO with role, accessible pages, and group IDs
     */
    public Optional<UserPermissions> getUserPermissions(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    List<UUID> groupIds = userGroupAssignmentRepository.findGroupIdsByUserId(userId);
                    Set<Page> pages = RolePermissions.getAccessiblePages(user.getRole());

                    return UserPermissions.builder()
                            .userId(userId)
                            .role(user.getRole().name())
                            .accessiblePages(pages.stream()
                                    .map(Enum::name)
                                    .collect(Collectors.toList()))
                            .groupIds(groupIds)
                            .build();
                });
    }

    /**
     * Get list of accessible pages for a user.
     *
     * @param userId The user's ID
     * @return List of page names the user can access
     */
    public List<String> getAccessiblePages(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> RolePermissions.getAccessiblePages(user.getRole())
                        .stream()
                        .map(Enum::name)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    /**
     * Check if a user can access a specific page.
     *
     * @param userId The user's ID
     * @param pageName The page to check access for
     * @return true if the user can access the page
     */
    public boolean canAccessPage(UUID userId, String pageName) {
        try {
            Page page = Page.valueOf(pageName.toUpperCase());
            return userRepository.findById(userId)
                    .map(user -> RolePermissions.canAccess(user.getRole(), page))
                    .orElse(false);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown page requested: {}", pageName);
            return false;
        }
    }

    /**
     * Check if a role can access a specific page.
     *
     * @param role The user's role
     * @param pageName The page to check access for
     * @return true if the role can access the page
     */
    public boolean canRoleAccessPage(UserRole role, String pageName) {
        try {
            Page page = Page.valueOf(pageName.toUpperCase());
            return RolePermissions.canAccess(role, page);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown page requested: {}", pageName);
            return false;
        }
    }

    /**
     * Get the group IDs for a user.
     *
     * @param userId The user's ID
     * @return List of group UUIDs
     */
    public List<UUID> getUserGroupIds(UUID userId) {
        return userGroupAssignmentRepository.findGroupIdsByUserId(userId);
    }

    /**
     * Check if user is admin (has full access).
     *
     * @param userId The user's ID
     * @return true if user is admin
     */
    public boolean isAdmin(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == UserRole.ADMIN)
                .orElse(false);
    }

    /**
     * Log an access denial for auditing.
     *
     * @param userId The user who was denied
     * @param resource The resource that was denied
     * @param action The action that was attempted
     */
    public void logAccessDenial(UUID userId, String resource, String action) {
        userRepository.findById(userId).ifPresent(user ->
                log.warn("Access denied: user={}, role={}, resource={}, action={}",
                        user.getEmail(), user.getRole(), resource, action)
        );
    }
}
