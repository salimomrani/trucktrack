package com.trucktrack.common.test;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.utility.DockerImageName;

/**
 * Shared TestContainers configuration for PostgreSQL.
 * Can be extended by service-specific test configurations.
 *
 * Usage:
 * - For @DataJpaTest: Use @Import(TestContainersConfig.class)
 * - For @SpringBootTest: Extend this class or use @Import
 *
 * The PostgreSQL container is shared across all tests in a JVM to improve test performance.
 */
@TestConfiguration
public class TestContainersConfig {

    private static final String POSTGRES_IMAGE = "postgres:15-alpine";
    private static final String DATABASE_NAME = "testdb";
    private static final String USERNAME = "test";
    private static final String PASSWORD = "test";

    @Container
    protected static final PostgreSQLContainer<?> postgres;

    static {
        postgres = new PostgreSQLContainer<>(DockerImageName.parse(POSTGRES_IMAGE))
                .withDatabaseName(DATABASE_NAME)
                .withUsername(USERNAME)
                .withPassword(PASSWORD)
                .withReuse(true);
        postgres.start();
    }

    /**
     * Register PostgreSQL container properties dynamically.
     * Use this method in test classes that need direct property registration.
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }

    /**
     * Get the JDBC URL of the running PostgreSQL container.
     */
    public static String getJdbcUrl() {
        return postgres.getJdbcUrl();
    }

    /**
     * Get the username for the PostgreSQL container.
     */
    public static String getUsername() {
        return postgres.getUsername();
    }

    /**
     * Get the password for the PostgreSQL container.
     */
    public static String getPassword() {
        return postgres.getPassword();
    }

    /**
     * Check if the PostgreSQL container is running.
     */
    public static boolean isRunning() {
        return postgres != null && postgres.isRunning();
    }
}
