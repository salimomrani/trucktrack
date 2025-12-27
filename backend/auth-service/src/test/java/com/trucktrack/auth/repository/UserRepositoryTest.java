package com.trucktrack.auth.repository;

import com.trucktrack.auth.model.User;
import com.trucktrack.common.security.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests with TestContainers for UserRepository.
 * Tests JPA queries and database interactions.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("UserRepository")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser = new User(
            "test@example.com",
            "hashedPassword123",
            "Test",
            "User",
            UserRole.FLEET_MANAGER
        );
        testUser.setIsActive(true);
        testUser = userRepository.save(testUser);
    }

    @Nested
    @DisplayName("findByEmail")
    class FindByEmail {

        @Test
        @DisplayName("should find user by email")
        void should_findUser_when_emailExists() {
            // When
            Optional<User> result = userRepository.findByEmail("test@example.com");

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getEmail()).isEqualTo("test@example.com");
            assertThat(result.get().getFirstName()).isEqualTo("Test");
            assertThat(result.get().getRole()).isEqualTo(UserRole.FLEET_MANAGER);
        }

        @Test
        @DisplayName("should return empty when email not found")
        void should_returnEmpty_when_emailNotFound() {
            // When
            Optional<User> result = userRepository.findByEmail("nonexistent@example.com");

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should be case-sensitive for email lookup")
        void should_beCaseSensitive_when_searchingByEmail() {
            // When - search with different case
            Optional<User> result = userRepository.findByEmail("TEST@example.com");

            // Then - PostgreSQL is case-sensitive by default
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("existsByEmail")
    class ExistsByEmail {

        @Test
        @DisplayName("should return true when email exists")
        void should_returnTrue_when_emailExists() {
            // When & Then
            assertThat(userRepository.existsByEmail("test@example.com")).isTrue();
        }

        @Test
        @DisplayName("should return false when email does not exist")
        void should_returnFalse_when_emailNotExists() {
            // When & Then
            assertThat(userRepository.existsByEmail("unknown@example.com")).isFalse();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("should persist user to database")
        void should_persistUser_when_saving() {
            // Given
            User newUser = new User(
                "new@example.com",
                "password",
                "New",
                "User",
                UserRole.DRIVER
            );
            newUser.setIsActive(true);

            // When
            User saved = userRepository.save(newUser);

            // Then
            assertThat(saved.getId()).isNotNull();
            assertThat(userRepository.findById(saved.getId())).isPresent();
        }

        @Test
        @DisplayName("should generate UUID on save")
        void should_generateUUID_when_newUserSaved() {
            // Given
            User newUser = new User(
                "uuid-test@example.com",
                "password",
                "UUID",
                "Test",
                UserRole.VIEWER
            );

            // When
            User saved = userRepository.save(newUser);

            // Then
            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getId().toString()).hasSize(36); // UUID format
        }

        @Test
        @DisplayName("should update existing user")
        void should_updateUser_when_existingUserSaved() {
            // Given
            testUser.setFirstName("Updated");
            testUser.setRole(UserRole.ADMIN);

            // When
            User updated = userRepository.save(testUser);

            // Then
            assertThat(updated.getFirstName()).isEqualTo("Updated");
            assertThat(updated.getRole()).isEqualTo(UserRole.ADMIN);

            // Verify in database
            Optional<User> fromDb = userRepository.findById(testUser.getId());
            assertThat(fromDb).isPresent();
            assertThat(fromDb.get().getFirstName()).isEqualTo("Updated");
        }
    }

    @Nested
    @DisplayName("searchUsers")
    class SearchUsers {

        @BeforeEach
        void setUpSearchData() {
            userRepository.save(new User("john.doe@example.com", "hash", "John", "Doe", UserRole.FLEET_MANAGER));
            userRepository.save(new User("jane.smith@example.com", "hash", "Jane", "Smith", UserRole.DRIVER));
            userRepository.save(new User("admin@company.com", "hash", "Admin", "User", UserRole.ADMIN));
        }

        @Test
        @DisplayName("should search by email pattern")
        void should_findUsers_when_searchingByEmail() {
            // When
            Page<User> result = userRepository.searchUsers("john", PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).hasSizeGreaterThanOrEqualTo(1);
            assertThat(result.getContent())
                .anyMatch(user -> user.getEmail().contains("john"));
        }

        @Test
        @DisplayName("should search by first name")
        void should_findUsers_when_searchingByFirstName() {
            // When
            Page<User> result = userRepository.searchUsers("Jane", PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent())
                .anyMatch(user -> user.getFirstName().equals("Jane"));
        }

        @Test
        @DisplayName("should search by last name")
        void should_findUsers_when_searchingByLastName() {
            // When
            Page<User> result = userRepository.searchUsers("Smith", PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent())
                .anyMatch(user -> user.getLastName().equals("Smith"));
        }

        @Test
        @DisplayName("should return empty when no match")
        void should_returnEmpty_when_noMatch() {
            // When
            Page<User> result = userRepository.searchUsers("nonexistent", PageRequest.of(0, 10));

            // Then
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByRole")
    class FindByRole {

        @BeforeEach
        void setUpRoleData() {
            userRepository.save(new User("admin1@test.com", "hash", "Admin", "One", UserRole.ADMIN));
            userRepository.save(new User("admin2@test.com", "hash", "Admin", "Two", UserRole.ADMIN));
            userRepository.save(new User("driver@test.com", "hash", "Driver", "User", UserRole.DRIVER));
        }

        @Test
        @DisplayName("should find all users with specific role")
        void should_findUsers_when_filteringByRole() {
            // When
            Page<User> admins = userRepository.findByRole(UserRole.ADMIN, PageRequest.of(0, 10));

            // Then
            assertThat(admins.getContent()).hasSizeGreaterThanOrEqualTo(2);
            assertThat(admins.getContent()).allMatch(user -> user.getRole() == UserRole.ADMIN);
        }

        @Test
        @DisplayName("should return empty when no users with role")
        void should_returnEmpty_when_noUsersWithRole() {
            // When
            Page<User> dispatchers = userRepository.findByRole(UserRole.DISPATCHER, PageRequest.of(0, 10));

            // Then
            assertThat(dispatchers.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByIsActive")
    class FindByIsActive {

        @BeforeEach
        void setUpActiveData() {
            User inactive = new User("inactive@test.com", "hash", "Inactive", "User", UserRole.VIEWER);
            inactive.setIsActive(false);
            userRepository.save(inactive);
        }

        @Test
        @DisplayName("should find active users")
        void should_findActiveUsers() {
            // When
            Page<User> activeUsers = userRepository.findByIsActive(true, PageRequest.of(0, 10));

            // Then
            assertThat(activeUsers.getContent()).allMatch(User::getIsActive);
        }

        @Test
        @DisplayName("should find inactive users")
        void should_findInactiveUsers() {
            // When
            Page<User> inactiveUsers = userRepository.findByIsActive(false, PageRequest.of(0, 10));

            // Then
            assertThat(inactiveUsers.getContent()).allMatch(user -> !user.getIsActive());
        }
    }

    @Nested
    @DisplayName("countByRole")
    class CountByRole {

        @Test
        @DisplayName("should count users by role")
        void should_countUsers_byRole() {
            // Given
            userRepository.save(new User("admin@test.com", "hash", "Admin", "User", UserRole.ADMIN));
            userRepository.save(new User("admin2@test.com", "hash", "Admin2", "User", UserRole.ADMIN));

            // When
            long adminCount = userRepository.countByRole(UserRole.ADMIN);
            long fleetManagerCount = userRepository.countByRole(UserRole.FLEET_MANAGER);

            // Then
            assertThat(adminCount).isGreaterThanOrEqualTo(2);
            assertThat(fleetManagerCount).isGreaterThanOrEqualTo(1); // testUser from setUp
        }
    }
}
