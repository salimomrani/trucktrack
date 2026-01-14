package com.trucktrack.location.service;

import com.trucktrack.location.dto.*;
import com.trucktrack.location.model.Trip;
import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.TripRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DashboardService - dashboard data aggregation.
 * Tests KPIs, fleet status, recent activity, and performance metrics.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService")
class DashboardServiceTest {

    @Mock
    private TruckRepository truckRepository;

    @Mock
    private TripRepository tripRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private UUID groupId1;
    private UUID groupId2;
    private String userGroups;

    @BeforeEach
    void setUp() {
        groupId1 = UUID.randomUUID();
        groupId2 = UUID.randomUUID();
        userGroups = groupId1 + "," + groupId2;
    }

    @Nested
    @DisplayName("getKpis")
    class GetKpis {

        @Test
        @DisplayName("should return KPIs with all truck and trip counts when no groups specified")
        void should_returnKpis_when_noGroupsSpecified() {
            // Given
            when(truckRepository.count()).thenReturn(50L);
            when(truckRepository.countByStatus(TruckStatus.ACTIVE)).thenReturn(30L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(10L)  // trips today
                .thenReturn(8L);  // trips yesterday

            // When
            DashboardKpiDTO result = dashboardService.getKpis(null);

            // Then
            assertThat(result.totalTrucks()).isEqualTo(50);
            assertThat(result.activeTrucks()).isEqualTo(30);
            assertThat(result.tripsToday()).isEqualTo(10);
            assertThat(result.alertsUnread()).isEqualTo(0); // MVP placeholder
        }

        @Test
        @DisplayName("should return KPIs filtered by user groups")
        void should_returnKpis_filteredByGroups() {
            // Given
            Page<Truck> trucksPage = new PageImpl<>(List.of(new Truck(), new Truck()), Pageable.unpaged(), 25);
            Page<Truck> activeTrucksPage = new PageImpl<>(List.of(new Truck()), Pageable.unpaged(), 15);

            when(truckRepository.findByAllowedGroups(anyList(), any(Pageable.class)))
                .thenReturn(trucksPage);
            when(truckRepository.findByAllowedGroupsAndStatus(anyList(), eq(TruckStatus.ACTIVE.name()), any(Pageable.class)))
                .thenReturn(activeTrucksPage);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(5L)
                .thenReturn(3L);

            // When
            DashboardKpiDTO result = dashboardService.getKpis(userGroups);

            // Then
            assertThat(result.totalTrucks()).isEqualTo(25);
            assertThat(result.activeTrucks()).isEqualTo(15);
            assertThat(result.tripsToday()).isEqualTo(5);
        }

        @Test
        @DisplayName("should calculate positive trend when trips increased")
        void should_calculatePositiveTrend_when_tripsIncreased() {
            // Given
            when(truckRepository.count()).thenReturn(10L);
            when(truckRepository.countByStatus(TruckStatus.ACTIVE)).thenReturn(5L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(10L)  // trips today
                .thenReturn(5L);  // trips yesterday

            // When
            DashboardKpiDTO result = dashboardService.getKpis("");

            // Then
            assertThat(result.tripsTodayTrend()).isEqualTo(100.0); // 10 vs 5 = +100%
        }

        @Test
        @DisplayName("should return null trend when previous value is zero")
        void should_returnNullTrend_when_previousValueZero() {
            // Given
            when(truckRepository.count()).thenReturn(10L);
            when(truckRepository.countByStatus(TruckStatus.ACTIVE)).thenReturn(5L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(0L)   // trips today
                .thenReturn(0L);  // trips yesterday

            // When
            DashboardKpiDTO result = dashboardService.getKpis("");

            // Then
            assertThat(result.tripsTodayTrend()).isNull();
        }

        @Test
        @DisplayName("should return 100% trend when previous is zero but current has value")
        void should_return100Trend_when_previousZeroCurrentHasValue() {
            // Given
            when(truckRepository.count()).thenReturn(10L);
            when(truckRepository.countByStatus(TruckStatus.ACTIVE)).thenReturn(5L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(5L)   // trips today
                .thenReturn(0L);  // trips yesterday

            // When
            DashboardKpiDTO result = dashboardService.getKpis("");

            // Then
            assertThat(result.tripsTodayTrend()).isEqualTo(100.0);
        }
    }

    @Nested
    @DisplayName("getFleetStatus")
    class GetFleetStatus {

        @Test
        @DisplayName("should return fleet status with all trucks when no groups specified")
        void should_returnFleetStatus_when_noGroupsSpecified() {
            // Given
            when(truckRepository.countByStatus(TruckStatus.ACTIVE)).thenReturn(30L);
            when(truckRepository.countByStatus(TruckStatus.IDLE)).thenReturn(15L);
            when(truckRepository.countByStatus(TruckStatus.OFFLINE)).thenReturn(5L);
            when(truckRepository.count()).thenReturn(50L);

            // When
            FleetStatusDTO result = dashboardService.getFleetStatus(null);

            // Then
            assertThat(result.total()).isEqualTo(50);
            assertThat(result.active()).isEqualTo(30);
            assertThat(result.idle()).isEqualTo(15);
            assertThat(result.offline()).isEqualTo(5);
            assertThat(result.activePercent()).isEqualTo(60.0);
            assertThat(result.idlePercent()).isEqualTo(30.0);
            assertThat(result.offlinePercent()).isEqualTo(10.0);
        }

        @Test
        @DisplayName("should return fleet status filtered by user groups")
        void should_returnFleetStatus_filteredByGroups() {
            // Given
            Page<Truck> activePage = new PageImpl<>(Collections.emptyList(), Pageable.unpaged(), 20);
            Page<Truck> idlePage = new PageImpl<>(Collections.emptyList(), Pageable.unpaged(), 10);
            Page<Truck> offlinePage = new PageImpl<>(Collections.emptyList(), Pageable.unpaged(), 5);
            Page<Truck> totalPage = new PageImpl<>(Collections.emptyList(), Pageable.unpaged(), 35);

            when(truckRepository.findByAllowedGroupsAndStatus(anyList(), eq(TruckStatus.ACTIVE.name()), any(Pageable.class)))
                .thenReturn(activePage);
            when(truckRepository.findByAllowedGroupsAndStatus(anyList(), eq(TruckStatus.IDLE.name()), any(Pageable.class)))
                .thenReturn(idlePage);
            when(truckRepository.findByAllowedGroupsAndStatus(anyList(), eq(TruckStatus.OFFLINE.name()), any(Pageable.class)))
                .thenReturn(offlinePage);
            when(truckRepository.findByAllowedGroups(anyList(), any(Pageable.class)))
                .thenReturn(totalPage);

            // When
            FleetStatusDTO result = dashboardService.getFleetStatus(userGroups);

            // Then
            assertThat(result.total()).isEqualTo(35);
            assertThat(result.active()).isEqualTo(20);
            assertThat(result.idle()).isEqualTo(10);
            assertThat(result.offline()).isEqualTo(5);
        }

        @Test
        @DisplayName("should return zero percentages when total is zero")
        void should_returnZeroPercentages_when_totalIsZero() {
            // Given
            when(truckRepository.countByStatus(any(TruckStatus.class))).thenReturn(0L);
            when(truckRepository.count()).thenReturn(0L);

            // When
            FleetStatusDTO result = dashboardService.getFleetStatus("");

            // Then
            assertThat(result.total()).isEqualTo(0);
            assertThat(result.activePercent()).isEqualTo(0.0);
            assertThat(result.idlePercent()).isEqualTo(0.0);
            assertThat(result.offlinePercent()).isEqualTo(0.0);
        }
    }

    @Nested
    @DisplayName("getRecentActivity")
    class GetRecentActivity {

        @Test
        @DisplayName("should return recent activity events from trips")
        void should_returnRecentActivity_fromTrips() {
            // Given
            UUID tripId = UUID.randomUUID();
            UUID truckId = UUID.randomUUID();
            Truck truck = new Truck();
            truck.setId(truckId);
            truck.setLicensePlate("AB-123-CD");

            Trip startedTrip = Trip.builder()
                .id(tripId)
                .origin("Paris")
                .destination("Lyon")
                .assignedTruckId(truckId)
                .startedAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .status(TripStatus.IN_PROGRESS)
                .updatedAt(Instant.now())
                .build();

            when(tripRepository.findRecentlyStartedTrips(any(Pageable.class)))
                .thenReturn(List.of(startedTrip));
            when(tripRepository.findRecentlyCompletedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findTripsWithProof(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));

            // When
            List<ActivityEventDTO> result = dashboardService.getRecentActivity(null, 10);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).type()).isEqualTo(ActivityEventDTO.ActivityType.TRIP_STARTED);
            assertThat(result.get(0).title()).contains("Trip started");
            assertThat(result.get(0).truckId()).isEqualTo("AB-123-CD");
        }

        @Test
        @DisplayName("should merge and sort activities by timestamp descending")
        void should_mergeAndSortActivities_byTimestampDescending() {
            // Given
            Instant now = Instant.now();
            UUID truckId = UUID.randomUUID();
            Truck truck = new Truck();
            truck.setId(truckId);
            truck.setTruckId("TRK-001");

            Trip startedTrip = Trip.builder()
                .id(UUID.randomUUID())
                .origin("A")
                .destination("B")
                .assignedTruckId(truckId)
                .startedAt(now.minus(2, ChronoUnit.HOURS))
                .status(TripStatus.IN_PROGRESS)
                .updatedAt(now.minus(2, ChronoUnit.HOURS))
                .build();

            Trip completedTrip = Trip.builder()
                .id(UUID.randomUUID())
                .origin("C")
                .destination("D")
                .assignedTruckId(truckId)
                .completedAt(now.minus(1, ChronoUnit.HOURS))
                .status(TripStatus.COMPLETED)
                .updatedAt(now.minus(1, ChronoUnit.HOURS))
                .build();

            when(tripRepository.findRecentlyStartedTrips(any(Pageable.class)))
                .thenReturn(List.of(startedTrip));
            when(tripRepository.findRecentlyCompletedTrips(any(Pageable.class)))
                .thenReturn(List.of(completedTrip));
            when(tripRepository.findTripsWithProof(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));

            // When
            List<ActivityEventDTO> result = dashboardService.getRecentActivity(null, 10);

            // Then
            assertThat(result).hasSize(2);
            // Most recent first (completed at -1h, started at -2h)
            assertThat(result.get(0).type()).isEqualTo(ActivityEventDTO.ActivityType.TRIP_COMPLETED);
            assertThat(result.get(1).type()).isEqualTo(ActivityEventDTO.ActivityType.TRIP_STARTED);
        }

        @Test
        @DisplayName("should limit activities to requested count")
        void should_limitActivities_toRequestedCount() {
            // Given
            Instant now = Instant.now();
            UUID truckId = UUID.randomUUID();
            Truck truck = new Truck();
            truck.setId(truckId);
            truck.setTruckId("TRK-001");

            List<Trip> manyTrips = List.of(
                createTrip(now.minus(1, ChronoUnit.HOURS), truckId),
                createTrip(now.minus(2, ChronoUnit.HOURS), truckId),
                createTrip(now.minus(3, ChronoUnit.HOURS), truckId),
                createTrip(now.minus(4, ChronoUnit.HOURS), truckId),
                createTrip(now.minus(5, ChronoUnit.HOURS), truckId)
            );

            when(tripRepository.findRecentlyStartedTrips(any(Pageable.class)))
                .thenReturn(manyTrips);
            when(tripRepository.findRecentlyCompletedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findTripsWithProof(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));

            // When
            List<ActivityEventDTO> result = dashboardService.getRecentActivity(null, 3);

            // Then
            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("should return empty list when no activities found")
        void should_returnEmptyList_when_noActivitiesFound() {
            // Given
            when(tripRepository.findRecentlyStartedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findRecentlyCompletedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findTripsWithProof(any(Pageable.class)))
                .thenReturn(Collections.emptyList());

            // When
            List<ActivityEventDTO> result = dashboardService.getRecentActivity(null, 10);

            // Then
            assertThat(result).isEmpty();
        }

        private Trip createTrip(Instant startedAt, UUID truckId) {
            return Trip.builder()
                .id(UUID.randomUUID())
                .origin("Origin")
                .destination("Destination")
                .assignedTruckId(truckId)
                .startedAt(startedAt)
                .status(TripStatus.IN_PROGRESS)
                .updatedAt(startedAt)
                .build();
        }
    }

    @Nested
    @DisplayName("getPerformanceMetrics")
    class GetPerformanceMetrics {

        @Test
        @DisplayName("should calculate performance metrics for week period")
        void should_calculatePerformanceMetrics_forWeekPeriod() {
            // Given
            when(tripRepository.countCompletedBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(80L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(100L);
            when(truckRepository.count()).thenReturn(50L);
            when(tripRepository.findByScheduledAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(createTripsWithTrucks(30));

            // When
            PerformanceMetricsDTO result = dashboardService.getPerformanceMetrics(null, "week");

            // Then
            assertThat(result.tripCompletionRate()).isEqualTo(80.0); // 80/100 = 80%
            assertThat(result.onTimeDelivery()).isEqualTo(85.0); // MVP baseline
            assertThat(result.fleetUtilization()).isEqualTo(60.0); // 30/50 = 60%
            assertThat(result.periodLabel()).isEqualTo("This Week");
            assertThat(result.driverSatisfaction()).isNull(); // Coming Soon
        }

        @Test
        @DisplayName("should calculate performance metrics for month period")
        void should_calculatePerformanceMetrics_forMonthPeriod() {
            // Given
            when(tripRepository.countCompletedBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(200L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(250L);
            when(truckRepository.count()).thenReturn(100L);
            when(tripRepository.findByScheduledAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(createTripsWithTrucks(75));

            // When
            PerformanceMetricsDTO result = dashboardService.getPerformanceMetrics(null, "month");

            // Then
            assertThat(result.tripCompletionRate()).isEqualTo(80.0); // 200/250 = 80%
            assertThat(result.fleetUtilization()).isEqualTo(75.0); // 75/100 = 75%
            assertThat(result.periodLabel()).isEqualTo("This Month");
        }

        @Test
        @DisplayName("should return zero rates when no trips exist")
        void should_returnZeroRates_when_noTripsExist() {
            // Given
            when(tripRepository.countCompletedBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(0L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(0L);
            when(truckRepository.count()).thenReturn(10L);
            when(tripRepository.findByScheduledAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

            // When
            PerformanceMetricsDTO result = dashboardService.getPerformanceMetrics(null, "week");

            // Then
            assertThat(result.tripCompletionRate()).isEqualTo(0.0);
            assertThat(result.onTimeDelivery()).isEqualTo(0.0);
            assertThat(result.fleetUtilization()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("should handle zero trucks gracefully")
        void should_handleZeroTrucks_gracefully() {
            // Given
            when(tripRepository.countCompletedBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(5L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(10L);
            when(truckRepository.count()).thenReturn(0L);
            when(tripRepository.findByScheduledAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

            // When
            PerformanceMetricsDTO result = dashboardService.getPerformanceMetrics(null, "week");

            // Then
            assertThat(result.fleetUtilization()).isEqualTo(0.0);
        }

        private List<Trip> createTripsWithTrucks(int uniqueTrucks) {
            return java.util.stream.IntStream.range(0, uniqueTrucks)
                .mapToObj(i -> Trip.builder()
                    .id(UUID.randomUUID())
                    .assignedTruckId(UUID.randomUUID())
                    .build())
                .toList();
        }
    }

    @Nested
    @DisplayName("getDashboardData")
    class GetDashboardData {

        @Test
        @DisplayName("should aggregate all dashboard data in single call")
        void should_aggregateAllDashboardData_inSingleCall() {
            // Given - Mock all sub-method calls
            String userId = UUID.randomUUID().toString();

            // KPIs
            when(truckRepository.count()).thenReturn(50L);
            when(truckRepository.countByStatus(TruckStatus.ACTIVE)).thenReturn(30L);
            when(truckRepository.countByStatus(TruckStatus.IDLE)).thenReturn(15L);
            when(truckRepository.countByStatus(TruckStatus.OFFLINE)).thenReturn(5L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(10L);

            // Performance metrics
            when(tripRepository.countCompletedBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(8L);
            when(tripRepository.findByScheduledAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());

            // Activities
            when(tripRepository.findRecentlyStartedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findRecentlyCompletedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findTripsWithProof(any(Pageable.class)))
                .thenReturn(Collections.emptyList());

            // When
            DashboardDataDTO result = dashboardService.getDashboardData(null, userId, "week");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.kpis()).isNotNull();
            assertThat(result.fleetStatus()).isNotNull();
            assertThat(result.recentActivity()).isNotNull();
            assertThat(result.performance()).isNotNull();
            assertThat(result.generatedAt()).isNotNull();
            assertThat(result.userId()).isNotNull();
        }

        @Test
        @DisplayName("should use default period when null")
        void should_useDefaultPeriod_when_null() {
            // Given
            String userId = UUID.randomUUID().toString();
            setupBasicMocks();

            // When
            DashboardDataDTO result = dashboardService.getDashboardData(null, userId, null);

            // Then
            assertThat(result.performance().periodLabel()).isEqualTo("This Week");
        }

        private void setupBasicMocks() {
            when(truckRepository.count()).thenReturn(10L);
            when(truckRepository.countByStatus(any(TruckStatus.class))).thenReturn(3L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(5L);
            when(tripRepository.countCompletedBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(3L);
            when(tripRepository.findByScheduledAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findRecentlyStartedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findRecentlyCompletedTrips(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
            when(tripRepository.findTripsWithProof(any(Pageable.class)))
                .thenReturn(Collections.emptyList());
        }
    }

    @Nested
    @DisplayName("parseGroups")
    class ParseGroups {

        @Test
        @DisplayName("should handle empty groups string")
        void should_handleEmptyGroupsString() {
            // Given
            when(truckRepository.count()).thenReturn(10L);
            when(truckRepository.countByStatus(TruckStatus.ACTIVE)).thenReturn(5L);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(2L);

            // When
            DashboardKpiDTO result = dashboardService.getKpis("");

            // Then
            assertThat(result.totalTrucks()).isEqualTo(10);
            verify(truckRepository).count();
            verify(truckRepository, never()).findByAllowedGroups(anyList(), any(Pageable.class));
        }

        @Test
        @DisplayName("should handle whitespace in groups string")
        void should_handleWhitespaceInGroupsString() {
            // Given
            Page<Truck> trucksPage = new PageImpl<>(Collections.emptyList(), Pageable.unpaged(), 5);
            Page<Truck> activeTrucksPage = new PageImpl<>(Collections.emptyList(), Pageable.unpaged(), 3);

            when(truckRepository.findByAllowedGroups(anyList(), any(Pageable.class)))
                .thenReturn(trucksPage);
            when(truckRepository.findByAllowedGroupsAndStatus(anyList(), eq(TruckStatus.ACTIVE.name()), any(Pageable.class)))
                .thenReturn(activeTrucksPage);
            when(tripRepository.countByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(1L);

            // When - groups with extra spaces
            DashboardKpiDTO result = dashboardService.getKpis("  " + groupId1 + " , " + groupId2 + "  ");

            // Then
            assertThat(result.totalTrucks()).isEqualTo(5);
            verify(truckRepository).findByAllowedGroups(anyList(), any(Pageable.class));
        }
    }
}
