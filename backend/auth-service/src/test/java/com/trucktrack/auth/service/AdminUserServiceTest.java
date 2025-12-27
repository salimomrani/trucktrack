package com.trucktrack.auth.service;

import com.trucktrack.auth.dto.CreateUserRequest;
import com.trucktrack.auth.dto.UpdateUserRequest;
import com.trucktrack.auth.dto.UserAdminResponse;
import com.trucktrack.auth.model.User;
import com.trucktrack.auth.repository.UserGroupAssignmentRepository;
import com.trucktrack.auth.repository.UserRepository;
import com.trucktrack.common.exception.ResourceNotFoundException;
import com.trucktrack.common.exception.ValidationException;
import com.trucktrack.common.security.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminUserService - admin user management operations.
 * Tests CRUD operations, validation, and business rules.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserService")
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserGroupAssignmentRepository groupAssignmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminUserService adminUserService;

    private UUID adminUserId;
    private User existingUser;
    private UUID existingUserId;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        existingUserId = UUID.randomUUID();

        existingUser = new User("existing@test.com", "hashedPassword", "Existing", "User", UserRole.FLEET_MANAGER);
        existingUser.setId(existingUserId);
        existingUser.setIsActive(true);
    }

    @Nested
    @DisplayName("createUser")
    class CreateUser {

        @Test
        @DisplayName("should create user with valid request")
        void should_createUser_when_requestIsValid() {
            // Given
            CreateUserRequest request = new CreateUserRequest(
                "newuser@test.com",
                "SecureP@ssw0rd",
                "John",
                "Doe",
                UserRole.FLEET_MANAGER,
                null
            );

            when(userRepository.existsByEmail("newuser@test.com")).thenReturn(false);
            when(passwordEncoder.encode("SecureP@ssw0rd")).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                return saved;
            });

            // When
            UserAdminResponse response = adminUserService.createUser(request, adminUserId, "admin@test.com");

            // Then
            assertThat(response).isNotNull();
            assertThat(response.email()).isEqualTo("newuser@test.com");
            assertThat(response.firstName()).isEqualTo("John");
            assertThat(response.lastName()).isEqualTo("Doe");
            assertThat(response.role()).isEqualTo(UserRole.FLEET_MANAGER);

            verify(userRepository).save(any(User.class));
            verify(passwordEncoder).encode("SecureP@ssw0rd");
        }

        @Test
        @DisplayName("should throw exception when email already exists")
        void should_throwException_when_emailExists() {
            // Given
            CreateUserRequest request = new CreateUserRequest(
                "existing@test.com",
                "SecureP@ssw0rd",
                "John",
                "Doe",
                UserRole.DRIVER,
                null
            );

            when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> adminUserService.createUser(request, adminUserId, "admin@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Email already exists");

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should assign groups when provided")
        void should_assignGroups_when_groupsProvided() {
            // Given
            List<UUID> groupIds = List.of(UUID.randomUUID(), UUID.randomUUID());
            CreateUserRequest request = new CreateUserRequest(
                "newuser@test.com",
                "SecureP@ssw0rd",
                "John",
                "Doe",
                UserRole.FLEET_MANAGER,
                groupIds
            );

            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("encoded");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                return saved;
            });

            // When
            UserAdminResponse response = adminUserService.createUser(request, adminUserId, "admin@test.com");

            // Then
            assertThat(response).isNotNull();
            verify(groupAssignmentRepository).saveAll(any());
        }
    }

    @Nested
    @DisplayName("updateUser")
    class UpdateUser {

        @Test
        @DisplayName("should update user fields when provided")
        void should_updateUser_when_fieldsProvided() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest(
                null, // email
                null, // password
                "UpdatedFirst",
                "UpdatedLast",
                null, // role
                null  // groupIds
            );

            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenReturn(existingUser);
            when(groupAssignmentRepository.findGroupIdsByUserId(existingUserId)).thenReturn(List.of());

            // When
            UserAdminResponse response = adminUserService.updateUser(existingUserId, request, adminUserId, "admin@test.com");

            // Then
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());

            User savedUser = userCaptor.getValue();
            assertThat(savedUser.getFirstName()).isEqualTo("UpdatedFirst");
            assertThat(savedUser.getLastName()).isEqualTo("UpdatedLast");
        }

        @Test
        @DisplayName("should throw exception when updating to existing email")
        void should_throwException_when_updatingToExistingEmail() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest(
                "taken@test.com",
                null, null, null, null, null
            );

            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));
            when(userRepository.existsByEmail("taken@test.com")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> adminUserService.updateUser(existingUserId, request, adminUserId, "admin@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Email already exists");
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void should_throwException_when_userNotFound() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            UpdateUserRequest request = new UpdateUserRequest(null, null, "New", "Name", null, null);

            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminUserService.updateUser(unknownUserId, request, adminUserId, "admin@test.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("should encode password when updating password")
        void should_encodePassword_when_passwordUpdated() {
            // Given
            UpdateUserRequest request = new UpdateUserRequest(
                null, "NewP@ssw0rd", null, null, null, null
            );

            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));
            when(passwordEncoder.encode("NewP@ssw0rd")).thenReturn("newEncodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(existingUser);
            when(groupAssignmentRepository.findGroupIdsByUserId(existingUserId)).thenReturn(List.of());

            // When
            adminUserService.updateUser(existingUserId, request, adminUserId, "admin@test.com");

            // Then
            verify(passwordEncoder).encode("NewP@ssw0rd");
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getPasswordHash()).isEqualTo("newEncodedPassword");
        }
    }

    @Nested
    @DisplayName("deactivateUser")
    class DeactivateUser {

        @Test
        @DisplayName("should deactivate active user")
        void should_deactivateUser_when_userIsActive() {
            // Given
            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenReturn(existingUser);
            when(groupAssignmentRepository.findGroupIdsByUserId(existingUserId)).thenReturn(List.of());

            // When
            UserAdminResponse response = adminUserService.deactivateUser(existingUserId, adminUserId, "admin@test.com");

            // Then
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getIsActive()).isFalse();
        }

        @Test
        @DisplayName("should throw exception when deactivating self")
        void should_throwException_when_deactivatingSelf() {
            // Given
            existingUser.setId(adminUserId);
            when(userRepository.findById(adminUserId)).thenReturn(Optional.of(existingUser));

            // When & Then
            assertThatThrownBy(() -> adminUserService.deactivateUser(adminUserId, adminUserId, "admin@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Cannot deactivate your own account");
        }

        @Test
        @DisplayName("should throw exception when user already inactive")
        void should_throwException_when_userAlreadyInactive() {
            // Given
            existingUser.setIsActive(false);
            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));

            // When & Then
            assertThatThrownBy(() -> adminUserService.deactivateUser(existingUserId, adminUserId, "admin@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("already inactive");
        }

        @Test
        @DisplayName("should throw exception when deactivating last admin")
        void should_throwException_when_deactivatingLastAdmin() {
            // Given
            User lastAdmin = new User("admin@test.com", "hash", "Admin", "User", UserRole.ADMIN);
            lastAdmin.setId(existingUserId);
            lastAdmin.setIsActive(true);

            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(lastAdmin));
            when(userRepository.findAll()).thenReturn(List.of(lastAdmin)); // Only one admin

            // When & Then
            assertThatThrownBy(() -> adminUserService.deactivateUser(existingUserId, adminUserId, "admin@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("last active admin");
        }
    }

    @Nested
    @DisplayName("reactivateUser")
    class ReactivateUser {

        @Test
        @DisplayName("should reactivate inactive user")
        void should_reactivateUser_when_userIsInactive() {
            // Given
            existingUser.setIsActive(false);
            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenReturn(existingUser);
            when(groupAssignmentRepository.findGroupIdsByUserId(existingUserId)).thenReturn(List.of());

            // When
            UserAdminResponse response = adminUserService.reactivateUser(existingUserId, adminUserId, "admin@test.com");

            // Then
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());
            assertThat(userCaptor.getValue().getIsActive()).isTrue();
        }

        @Test
        @DisplayName("should throw exception when user already active")
        void should_throwException_when_userAlreadyActive() {
            // Given
            existingUser.setIsActive(true);
            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));

            // When & Then
            assertThatThrownBy(() -> adminUserService.reactivateUser(existingUserId, adminUserId, "admin@test.com"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("already active");
        }
    }

    @Nested
    @DisplayName("getUserById")
    class GetUserById {

        @Test
        @DisplayName("should return user with groups when found")
        void should_returnUserWithGroups_when_userFound() {
            // Given
            List<UUID> groupIds = List.of(UUID.randomUUID());
            when(userRepository.findById(existingUserId)).thenReturn(Optional.of(existingUser));
            when(groupAssignmentRepository.findGroupIdsByUserId(existingUserId)).thenReturn(groupIds);

            // When
            UserAdminResponse response = adminUserService.getUserById(existingUserId);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.email()).isEqualTo(existingUser.getEmail());
            assertThat(response.groupIds()).hasSize(1);
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void should_throwException_when_userNotFound() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.findById(unknownUserId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminUserService.getUserById(unknownUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("updateUserGroups")
    class UpdateUserGroups {

        @Test
        @DisplayName("should replace all group assignments")
        void should_replaceAllGroups_when_updating() {
            // Given
            List<UUID> newGroupIds = List.of(UUID.randomUUID(), UUID.randomUUID());
            when(userRepository.existsById(existingUserId)).thenReturn(true);

            // When
            List<UUID> result = adminUserService.updateUserGroups(existingUserId, newGroupIds);

            // Then
            verify(groupAssignmentRepository).deleteByUserId(existingUserId);
            verify(groupAssignmentRepository).saveAll(any());
            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("should throw exception when user not found")
        void should_throwException_when_userNotFoundForGroupUpdate() {
            // Given
            UUID unknownUserId = UUID.randomUUID();
            when(userRepository.existsById(unknownUserId)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> adminUserService.updateUserGroups(unknownUserId, List.of()))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("countActiveAdmins")
    class CountActiveAdmins {

        @Test
        @DisplayName("should return count of active admins")
        void should_returnCount_when_adminsExist() {
            // Given
            User admin1 = new User("admin1@test.com", "hash", "Admin", "One", UserRole.ADMIN);
            admin1.setIsActive(true);
            User admin2 = new User("admin2@test.com", "hash", "Admin", "Two", UserRole.ADMIN);
            admin2.setIsActive(true);
            User inactiveAdmin = new User("admin3@test.com", "hash", "Admin", "Three", UserRole.ADMIN);
            inactiveAdmin.setIsActive(false);
            User driver = new User("driver@test.com", "hash", "Driver", "User", UserRole.DRIVER);
            driver.setIsActive(true);

            when(userRepository.findAll()).thenReturn(List.of(admin1, admin2, inactiveAdmin, driver));

            // When
            long count = adminUserService.countActiveAdmins();

            // Then
            assertThat(count).isEqualTo(2);
        }
    }
}
