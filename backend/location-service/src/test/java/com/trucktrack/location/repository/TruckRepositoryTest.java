package com.trucktrack.location.repository;

import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Repository tests with TestContainers for TruckRepository.
 * Tests JPA queries and database interactions including spatial queries.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@DisplayName("TruckRepository")
class TruckRepositoryTest {

    @Autowired
    private TruckRepository truckRepository;

    private Truck activeTruck;
    private Truck idleTruck;
    private Truck offlineTruck;
    private UUID defaultGroupId;

    @BeforeEach
    void setUp() {
        truckRepository.deleteAll();
        defaultGroupId = UUID.randomUUID();

        activeTruck = createTruck("TRUCK-001", "ABC-123", "Driver One", TruckStatus.ACTIVE,
                48.8566, 2.3522, defaultGroupId);
        activeTruck = truckRepository.save(activeTruck);

        idleTruck = createTruck("TRUCK-002", "DEF-456", "Driver Two", TruckStatus.IDLE,
                48.8600, 2.3400, defaultGroupId);
        idleTruck = truckRepository.save(idleTruck);

        offlineTruck = createTruck("TRUCK-003", "GHI-789", "Driver Three", TruckStatus.OFFLINE,
                48.8700, 2.3600, defaultGroupId);
        offlineTruck = truckRepository.save(offlineTruck);
    }

    @Nested
    @DisplayName("findByStatus")
    class FindByStatus {

        @Test
        @DisplayName("should return trucks with ACTIVE status")
        void should_returnActiveTrucks_when_statusIsActive() {
            // When
            List<Truck> result = truckRepository.findByStatus(TruckStatus.ACTIVE);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTruckId()).isEqualTo("TRUCK-001");
            assertThat(result.get(0).getStatus()).isEqualTo(TruckStatus.ACTIVE);
        }

        @Test
        @DisplayName("should return trucks with IDLE status")
        void should_returnIdleTrucks_when_statusIsIdle() {
            // When
            List<Truck> result = truckRepository.findByStatus(TruckStatus.IDLE);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTruckId()).isEqualTo("TRUCK-002");
        }

        @Test
        @DisplayName("should return trucks with OFFLINE status")
        void should_returnOfflineTrucks_when_statusIsOffline() {
            // When
            List<Truck> result = truckRepository.findByStatus(TruckStatus.OFFLINE);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTruckId()).isEqualTo("TRUCK-003");
        }

        @Test
        @DisplayName("should return empty list when no trucks with status")
        void should_returnEmptyList_when_noTrucksWithStatus() {
            // When
            List<Truck> result = truckRepository.findByStatus(TruckStatus.MAINTENANCE);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return paginated results")
        void should_returnPaginatedResults_when_usingPageable() {
            // Given - add more active trucks
            truckRepository.save(createTruck("TRUCK-004", "JKL-111", "Driver Four", TruckStatus.ACTIVE,
                    48.8550, 2.3500, defaultGroupId));
            truckRepository.save(createTruck("TRUCK-005", "MNO-222", "Driver Five", TruckStatus.ACTIVE,
                    48.8560, 2.3510, defaultGroupId));

            // When
            Page<Truck> firstPage = truckRepository.findByStatus(TruckStatus.ACTIVE, PageRequest.of(0, 2));
            Page<Truck> secondPage = truckRepository.findByStatus(TruckStatus.ACTIVE, PageRequest.of(1, 2));

            // Then
            assertThat(firstPage.getContent()).hasSize(2);
            assertThat(firstPage.getTotalElements()).isEqualTo(3);
            assertThat(secondPage.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("findTrucksInBoundingBox")
    class FindTrucksInBoundingBox {

        @Test
        @DisplayName("should find trucks within bounding box")
        void should_findTrucks_when_insideBoundingBox() {
            // Given - Paris area bounding box
            double minLat = 48.85;
            double maxLat = 48.87;
            double minLng = 2.33;
            double maxLng = 2.37;

            // When
            List<Truck> result = truckRepository.findTrucksInBoundingBox(minLat, maxLat, minLng, maxLng);

            // Then
            assertThat(result).hasSize(3);
            assertThat(result).extracting(Truck::getTruckId)
                    .containsExactlyInAnyOrder("TRUCK-001", "TRUCK-002", "TRUCK-003");
        }

        @Test
        @DisplayName("should find only trucks within narrow bounding box")
        void should_findOnlyMatchingTrucks_when_narrowBoundingBox() {
            // Given - narrow bounding box around TRUCK-001 only
            double minLat = 48.8560;
            double maxLat = 48.8570;
            double minLng = 2.3520;
            double maxLng = 2.3530;

            // When
            List<Truck> result = truckRepository.findTrucksInBoundingBox(minLat, maxLat, minLng, maxLng);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTruckId()).isEqualTo("TRUCK-001");
        }

        @Test
        @DisplayName("should return empty when no trucks in bounding box")
        void should_returnEmpty_when_noTrucksInBoundingBox() {
            // Given - bounding box far from any trucks (London area)
            double minLat = 51.50;
            double maxLat = 51.52;
            double minLng = -0.13;
            double maxLng = -0.11;

            // When
            List<Truck> result = truckRepository.findTrucksInBoundingBox(minLat, maxLat, minLng, maxLng);

            // Then
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should handle edge case with truck on boundary")
        void should_includeTruck_when_onBoundary() {
            // Given - bounding box where TRUCK-001 is exactly on edge
            double minLat = 48.8566; // exact latitude of TRUCK-001
            double maxLat = 48.8600;
            double minLng = 2.3522;  // exact longitude of TRUCK-001
            double maxLng = 2.3600;

            // When
            List<Truck> result = truckRepository.findTrucksInBoundingBox(minLat, maxLat, minLng, maxLng);

            // Then
            assertThat(result).isNotEmpty();
            assertThat(result).anyMatch(t -> t.getTruckId().equals("TRUCK-001"));
        }
    }

    @Nested
    @DisplayName("findByTruckId")
    class FindByTruckId {

        @Test
        @DisplayName("should find truck by truck ID")
        void should_findTruck_when_truckIdExists() {
            // When
            Optional<Truck> result = truckRepository.findByTruckId("TRUCK-001");

            // Then
            assertThat(result).isPresent();
            assertThat(result.get().getLicensePlate()).isEqualTo("ABC-123");
            assertThat(result.get().getDriverName()).isEqualTo("Driver One");
        }

        @Test
        @DisplayName("should return empty when truck ID not found")
        void should_returnEmpty_when_truckIdNotFound() {
            // When
            Optional<Truck> result = truckRepository.findByTruckId("NONEXISTENT");

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("countByStatus")
    class CountByStatus {

        @Test
        @DisplayName("should count trucks by status")
        void should_countTrucks_byStatus() {
            // When
            long activeCount = truckRepository.countByStatus(TruckStatus.ACTIVE);
            long idleCount = truckRepository.countByStatus(TruckStatus.IDLE);
            long offlineCount = truckRepository.countByStatus(TruckStatus.OFFLINE);
            long maintenanceCount = truckRepository.countByStatus(TruckStatus.MAINTENANCE);

            // Then
            assertThat(activeCount).isEqualTo(1);
            assertThat(idleCount).isEqualTo(1);
            assertThat(offlineCount).isEqualTo(1);
            assertThat(maintenanceCount).isEqualTo(0);
        }

        @Test
        @DisplayName("should update count when trucks change status")
        void should_updateCount_when_statusChanges() {
            // Given
            activeTruck.setStatus(TruckStatus.IDLE);
            truckRepository.save(activeTruck);

            // When
            long activeCount = truckRepository.countByStatus(TruckStatus.ACTIVE);
            long idleCount = truckRepository.countByStatus(TruckStatus.IDLE);

            // Then
            assertThat(activeCount).isEqualTo(0);
            assertThat(idleCount).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("searchByTruckIdOrDriverName")
    class SearchByTruckIdOrDriverName {

        @Test
        @DisplayName("should find trucks by truck ID pattern")
        void should_findTrucks_when_searchingByTruckIdPattern() {
            // When
            List<Truck> result = truckRepository.searchByTruckIdOrDriverName("TRUCK-00");

            // Then
            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("should find trucks by driver name pattern")
        void should_findTrucks_when_searchingByDriverName() {
            // When
            List<Truck> result = truckRepository.searchByTruckIdOrDriverName("Driver One");

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTruckId()).isEqualTo("TRUCK-001");
        }

        @Test
        @DisplayName("should be case-insensitive")
        void should_beCaseInsensitive_when_searching() {
            // When
            List<Truck> resultLower = truckRepository.searchByTruckIdOrDriverName("truck");
            List<Truck> resultUpper = truckRepository.searchByTruckIdOrDriverName("TRUCK");
            List<Truck> resultMixed = truckRepository.searchByTruckIdOrDriverName("TrUcK");

            // Then
            assertThat(resultLower).hasSize(3);
            assertThat(resultUpper).hasSize(3);
            assertThat(resultMixed).hasSize(3);
        }

        @Test
        @DisplayName("should return empty when no match")
        void should_returnEmpty_when_noMatch() {
            // When
            List<Truck> result = truckRepository.searchByTruckIdOrDriverName("nonexistent");

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findStalePositions")
    class FindStalePositions {

        @Test
        @DisplayName("should find trucks with stale positions")
        void should_findTrucks_when_positionsAreStale() {
            // Given - update lastUpdate to be old for one truck
            Instant threshold = Instant.now().minus(5, ChronoUnit.MINUTES);
            activeTruck.setLastUpdate(Instant.now().minus(10, ChronoUnit.MINUTES));
            truckRepository.save(activeTruck);

            idleTruck.setLastUpdate(Instant.now().minus(1, ChronoUnit.MINUTES));
            truckRepository.save(idleTruck);

            // When
            List<Truck> result = truckRepository.findStalePositions(threshold);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTruckId()).isEqualTo("TRUCK-001");
        }

        @Test
        @DisplayName("should return empty when all positions are recent")
        void should_returnEmpty_when_allPositionsRecent() {
            // Given - update all trucks to have recent lastUpdate
            Instant recentTime = Instant.now().minus(1, ChronoUnit.MINUTES);
            activeTruck.setLastUpdate(recentTime);
            idleTruck.setLastUpdate(recentTime);
            offlineTruck.setLastUpdate(recentTime);
            truckRepository.saveAll(List.of(activeTruck, idleTruck, offlineTruck));

            Instant threshold = Instant.now().minus(5, ChronoUnit.MINUTES);

            // When
            List<Truck> result = truckRepository.findStalePositions(threshold);

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("existsByLicensePlate")
    class ExistsByLicensePlate {

        @Test
        @DisplayName("should return true when license plate exists")
        void should_returnTrue_when_licensePlateExists() {
            // When & Then
            assertThat(truckRepository.existsByLicensePlate("ABC-123")).isTrue();
        }

        @Test
        @DisplayName("should return false when license plate does not exist")
        void should_returnFalse_when_licensePlateNotExists() {
            // When & Then
            assertThat(truckRepository.existsByLicensePlate("UNKNOWN")).isFalse();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("should persist new truck to database")
        void should_persistTruck_when_saving() {
            // Given
            Truck newTruck = createTruck("TRUCK-NEW", "NEW-999", "New Driver", TruckStatus.OFFLINE,
                    48.8800, 2.3700, defaultGroupId);

            // When
            Truck saved = truckRepository.save(newTruck);

            // Then
            assertThat(saved.getId()).isNotNull();
            assertThat(truckRepository.findById(saved.getId())).isPresent();
        }

        @Test
        @DisplayName("should generate UUID on save")
        void should_generateUUID_when_newTruckSaved() {
            // Given
            Truck newTruck = createTruck("TRUCK-UUID", "UUID-123", "UUID Driver", TruckStatus.IDLE,
                    48.8900, 2.3800, defaultGroupId);

            // When
            Truck saved = truckRepository.save(newTruck);

            // Then
            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getId().toString()).hasSize(36); // UUID format
        }

        @Test
        @DisplayName("should update existing truck")
        void should_updateTruck_when_existingTruckSaved() {
            // Given
            activeTruck.setDriverName("Updated Driver");
            activeTruck.setStatus(TruckStatus.MAINTENANCE);

            // When
            Truck updated = truckRepository.save(activeTruck);

            // Then
            assertThat(updated.getDriverName()).isEqualTo("Updated Driver");
            assertThat(updated.getStatus()).isEqualTo(TruckStatus.MAINTENANCE);

            // Verify in database
            Optional<Truck> fromDb = truckRepository.findById(activeTruck.getId());
            assertThat(fromDb).isPresent();
            assertThat(fromDb.get().getDriverName()).isEqualTo("Updated Driver");
        }
    }

    @Nested
    @DisplayName("findByTruckGroupId")
    class FindByTruckGroupId {

        @Test
        @DisplayName("should find trucks by group ID")
        void should_findTrucks_when_groupIdMatches() {
            // When
            List<Truck> result = truckRepository.findByTruckGroupId(defaultGroupId);

            // Then
            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("should return empty when group has no trucks")
        void should_returnEmpty_when_groupHasNoTrucks() {
            // When
            List<Truck> result = truckRepository.findByTruckGroupId(UUID.randomUUID());

            // Then
            assertThat(result).isEmpty();
        }
    }

    private Truck createTruck(String truckId, String licensePlate, String driverName,
                               TruckStatus status, double lat, double lng, UUID groupId) {
        return Truck.builder()
                .truckId(truckId)
                .licensePlate(licensePlate)
                .driverName(driverName)
                .vehicleType("Semi-Truck")
                .status(status)
                .currentLatitude(BigDecimal.valueOf(lat))
                .currentLongitude(BigDecimal.valueOf(lng))
                .currentSpeed(BigDecimal.valueOf(50.0))
                .currentHeading(90)
                .lastUpdate(Instant.now())
                .truckGroupId(groupId)
                .build();
    }
}
