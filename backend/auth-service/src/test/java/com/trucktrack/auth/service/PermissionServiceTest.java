package com.trucktrack.auth.service;

import com.trucktrack.auth.model.User;
import com.trucktrack.auth.repository.UserGroupAssignmentRepository;
import com.trucktrack.auth.repository.UserRepository;
import com.trucktrack.common.dto.UserPermissions;
import com.trucktrack.common.security.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PermissionService - role-based access control logic.
 * Tests permission checking, page access validation, and group management.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PermissionService")
class PermissionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserGroupAssignmentRepository userGroupAssignmentRepository;

    @InjectMocks
    private PermissionService permissionService;

    private User adminUser;
    private User driverUser;
    private User fleetManagerUser;
    private UUID adminUserId;
    private UUID driverUserId;
    private UUID fleetManagerUserId;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        driverUserId = UUID.randomUUID();
        fleetManagerUserId = UUID.randomUUID();

        adminUser = new User("admin@test.com", "hash", "Admin", "User", UserRole.ADMIN);
        adminUser.setId(adminUserId);

        driverUser = new User("driver@test.com", "hash", "Driver", "User", UserRole.DRIVER);
        driverUser.setId(driverUserId);

        fleetManagerUser = new User("manager@test.com", "hash", "Fleet", "Manager", UserRole.FLEET_MANAGER);
        fleetManagerUser.setId(fleetManagerUserId);
    }

    @Nested
    @DisplayName("getUserPermissions")
    class GetUserPermissions {

        @Test
        @DisplayName("should return all permissions for admin user")
        void should_returnAllPermissions_when_userIsAdmin() {
            // Given
            when(userRepository.findById(adminUserId)).thenReturn(Optional.of(adminUser));
            when(userGroupAssignmentRepository.findGroupIdsByUserId(adminUserId)).thenReturn(List.of());

            // When
            Optional<UserPermissions> result = permissionService.getUserPermissions(adminUserId);

            // Then
            assertThat(result).isPresent();
            UserPermissions permissions = result.get();
            assertThat(permissions.getRole()).isEqualTo("ADMIN");
            assertThat(permissions.getAccessiblePages()).contains("DASHBOARD", "MAP", "ANALYTICS", "ADMIN", "ALERTS", "PROFILE");
        }

        @Test
        @DisplayName("should return limited permissions for driver")
        void should_returnLimitedPermissions_when_userIsDriver() {
            // Given
            when(userRepository.findById(driverUserId)).thenReturn(Optional.of(driverUser));
            when(userGroupAssignmentRepository.findGroupIdsByUserId(driverUserId)).thenReturn(List.of());

            // When
            Optional<UserPermissions> result = permissionService.getUserPermissions(driverUserId);

            // Then
            assertThat(result).isPresent();
            UserPermissions permissions = result.get();
            assertThat(permissions.getRole()).isEqualTo("DRIVER");
            assertThat(permissions.getAccessiblePages())
                .contains("DASHBOARD", "ALERTS", "PROFILE")
                .doesNotContain("ADMIN", "ANALYTICS");
        }

        @Test
        @DisplayName("should return empty optional for non-existent user")
        void should_returnEmpty_when_userNotFound() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When
            Optional<UserPermissions> result = permissionService.getUserPermissions(unknownUserId);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should include group IDs in permissions")
        void should_includeGroupIds_when_userHasGroups() {
            // Given
            List<UUID> groupIds = List.of(UUID.randomUUID(), UUID.randomUUID());
            when(userRepository.findById(fleetManagerUserId)).thenReturn(Optional.of(fleetManagerUser));
            when(userGroupAssignmentRepository.findGroupIdsByUserId(fleetManagerUserId)).thenReturn(groupIds);

            // When
            Optional<UserPermissions> result = permissionService.getUserPermissions(fleetManagerUserId);

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getGroupIds()).hasSize(2);
        }
    }

    @Nested
    @DisplayName("canAccessPage")
    class CanAccessPage {

        @Test
        @DisplayName("should allow admin to access all pages")
        void should_returnTrue_when_adminAccessesAnyPage() {
            // Given
            when(userRepository.findById(adminUserId)).thenReturn(Optional.of(adminUser));

            // When & Then
            assertThat(permissionService.canAccessPage(adminUserId, "ADMIN")).isTrue();
            assertThat(permissionService.canAccessPage(adminUserId, "DASHBOARD")).isTrue();
            assertThat(permissionService.canAccessPage(adminUserId, "ANALYTICS")).isTrue();
            assertThat(permissionService.canAccessPage(adminUserId, "MAP")).isTrue();
        }

        @Test
        @DisplayName("should deny driver access to admin pages")
        void should_returnFalse_when_driverAccessesAdminPage() {
            // Given
            when(userRepository.findById(driverUserId)).thenReturn(Optional.of(driverUser));

            // When & Then
            assertThat(permissionService.canAccessPage(driverUserId, "ADMIN")).isFalse();
            assertThat(permissionService.canAccessPage(driverUserId, "ANALYTICS")).isFalse();
        }

        @Test
        @DisplayName("should allow driver to access allowed pages")
        void should_returnTrue_when_driverAccessesAllowedPage() {
            // Given
            when(userRepository.findById(driverUserId)).thenReturn(Optional.of(driverUser));

            // When & Then
            assertThat(permissionService.canAccessPage(driverUserId, "DASHBOARD")).isTrue();
            assertThat(permissionService.canAccessPage(driverUserId, "ALERTS")).isTrue();
            assertThat(permissionService.canAccessPage(driverUserId, "PROFILE")).isTrue();
        }

        @Test
        @DisplayName("should return false for unknown page")
        void should_returnFalse_when_pageIsUnknown() {
            // When & Then - unknown page returns false without repository call
            assertThat(permissionService.canAccessPage(adminUserId, "UNKNOWN_PAGE")).isFalse();
        }

        @Test
        @DisplayName("should return false for non-existent user")
        void should_returnFalse_when_userDoesNotExist() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When & Then
            assertThat(permissionService.canAccessPage(unknownUserId, "DASHBOARD")).isFalse();
        }
    }

    @Nested
    @DisplayName("canRoleAccessPage")
    class CanRoleAccessPage {

        @Test
        @DisplayName("should check permissions by role without user lookup")
        void should_checkByRole_without_userLookup() {
            // When & Then
            assertThat(permissionService.canRoleAccessPage(UserRole.ADMIN, "ADMIN")).isTrue();
            assertThat(permissionService.canRoleAccessPage(UserRole.DRIVER, "ADMIN")).isFalse();
            assertThat(permissionService.canRoleAccessPage(UserRole.FLEET_MANAGER, "ANALYTICS")).isTrue();

            // Verify no user repository calls
            verifyNoInteractions(userRepository);
        }

        @Test
        @DisplayName("should return false for unknown page name")
        void should_returnFalse_when_pageNameInvalid() {
            assertThat(permissionService.canRoleAccessPage(UserRole.ADMIN, "INVALID")).isFalse();
        }
    }

    @Nested
    @DisplayName("isAdmin")
    class IsAdmin {

        @Test
        @DisplayName("should return true for admin user")
        void should_returnTrue_when_userIsAdmin() {
            // Given
            when(userRepository.findById(adminUserId)).thenReturn(Optional.of(adminUser));

            // When & Then
            assertThat(permissionService.isAdmin(adminUserId)).isTrue();
        }

        @Test
        @DisplayName("should return false for non-admin user")
        void should_returnFalse_when_userIsNotAdmin() {
            // Given
            when(userRepository.findById(driverUserId)).thenReturn(Optional.of(driverUser));

            // When & Then
            assertThat(permissionService.isAdmin(driverUserId)).isFalse();
        }

        @Test
        @DisplayName("should return false for non-existent user")
        void should_returnFalse_when_userNotFound() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When & Then
            assertThat(permissionService.isAdmin(unknownUserId)).isFalse();
        }
    }

    @Nested
    @DisplayName("getAccessiblePages")
    class GetAccessiblePages {

        @Test
        @DisplayName("should return all pages for admin")
        void should_returnAllPages_when_userIsAdmin() {
            // Given
            when(userRepository.findById(adminUserId)).thenReturn(Optional.of(adminUser));

            // When
            List<String> pages = permissionService.getAccessiblePages(adminUserId);

            // Then
            assertThat(pages).isNotEmpty();
            assertThat(pages).contains("ADMIN", "DASHBOARD", "MAP", "ANALYTICS");
        }

        @Test
        @DisplayName("should return empty list for non-existent user")
        void should_returnEmptyList_when_userNotFound() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When
            List<String> pages = permissionService.getAccessiblePages(unknownUserId);

            // Then
            assertThat(pages).isEmpty();
        }
    }

    @Nested
    @DisplayName("getUserGroupIds")
    class GetUserGroupIds {

        @Test
        @DisplayName("should return group IDs for user")
        void should_returnGroupIds_when_userHasGroups() {
            // Given
            List<UUID> expectedGroups = List.of(UUID.randomUUID(), UUID.randomUUID());
            when(userGroupAssignmentRepository.findGroupIdsByUserId(fleetManagerUserId)).thenReturn(expectedGroups);

            // When
            List<UUID> groupIds = permissionService.getUserGroupIds(fleetManagerUserId);

            // Then
            assertThat(groupIds).hasSize(2);
            assertThat(groupIds).containsExactlyElementsOf(expectedGroups);
        }

        @Test
        @DisplayName("should return empty list when user has no groups")
        void should_returnEmptyList_when_userHasNoGroups() {
            // Given
            when(userGroupAssignmentRepository.findGroupIdsByUserId(driverUserId)).thenReturn(List.of());

            // When
            List<UUID> groupIds = permissionService.getUserGroupIds(driverUserId);

            // Then
            assertThat(groupIds).isEmpty();
        }
    }

    @Nested
    @DisplayName("logAccessDenial")
    class LogAccessDenial {

        @Test
        @DisplayName("should log access denial for existing user")
        void should_logDenial_when_userExists() {
            // Given
            when(userRepository.findById(driverUserId)).thenReturn(Optional.of(driverUser));

            // When - should not throw
            permissionService.logAccessDenial(driverUserId, "ADMIN_PAGE", "READ");

            // Then - verify user was looked up (logging happens internally)
            verify(userRepository).findById(driverUserId);
        }

        @Test
        @DisplayName("should handle gracefully when user not found")
        void should_notThrow_when_userNotFound() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When & Then - should not throw
            permissionService.logAccessDenial(unknownUserId, "ADMIN_PAGE", "READ");
            verify(userRepository).findById(unknownUserId);
        }
    }
}
