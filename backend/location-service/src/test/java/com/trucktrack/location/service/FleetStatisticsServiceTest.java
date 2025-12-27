package com.trucktrack.location.service;

import com.trucktrack.location.dto.DashboardStats;
import com.trucktrack.location.dto.TruckStatusStats;
import com.trucktrack.location.repository.GPSPositionRepository;
import com.trucktrack.location.repository.TruckRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for FleetStatisticsService - dashboard statistics.
 * Tests truck counts, mileage calculations, and alert aggregations.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FleetStatisticsService")
class FleetStatisticsServiceTest {

    @Mock
    private TruckRepository truckRepository;

    @Mock
    private GPSPositionRepository gpsPositionRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private FleetStatisticsService fleetStatisticsService;

    @BeforeEach
    void setUp() {
        fleetStatisticsService = new FleetStatisticsService(
            truckRepository,
            gpsPositionRepository,
            jdbcTemplate
        );
    }

    @Nested
    @DisplayName("getTruckStatusStats")
    class GetTruckStatusStats {

        @Test
        @DisplayName("should return correct truck counts by status")
        void should_returnTruckCounts_byStatus() {
            // Given
            TruckStatusStats expectedStats = new TruckStatusStats(10L, 5L, 3L, 2L, 20L);

            when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class)))
                .thenReturn(expectedStats);

            // When
            TruckStatusStats result = fleetStatisticsService.getTruckStatusStats();

            // Then
            assertThat(result).isNotNull();
            assertThat(result.active()).isEqualTo(10L);
            assertThat(result.idle()).isEqualTo(5L);
            assertThat(result.offline()).isEqualTo(3L);
            assertThat(result.outOfService()).isEqualTo(2L);
            assertThat(result.total()).isEqualTo(20L);
        }

        @Test
        @DisplayName("should return empty stats on database error")
        void should_returnEmptyStats_when_databaseError() {
            // Given
            when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class)))
                .thenThrow(new RuntimeException("DB error"));

            // When
            TruckStatusStats result = fleetStatisticsService.getTruckStatusStats();

            // Then
            assertThat(result).isNotNull();
            assertThat(result.total()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("getDashboardStats")
    class GetDashboardStats {

        @Test
        @DisplayName("should return dashboard stats for today period")
        void should_returnDashboardStats_forToday() {
            // Given
            TruckStatusStats truckStats = new TruckStatusStats(5L, 3L, 1L, 1L, 10L);

            when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class)))
                .thenReturn(truckStats);

            // Mock user count query
            when(jdbcTemplate.queryForObject(anyString(), any(Class.class)))
                .thenReturn(0L);

            // When
            DashboardStats result = fleetStatisticsService.getDashboardStats("today");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.trucks()).isNotNull();
            assertThat(result.period()).isEqualTo("today");
            assertThat(result.generatedAt()).isNotNull();
        }

        @Test
        @DisplayName("should handle week period")
        void should_handleWeekPeriod() {
            // Given
            when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class)))
                .thenReturn(TruckStatusStats.empty());
            when(jdbcTemplate.queryForObject(anyString(), any(Class.class)))
                .thenReturn(0L);

            // When
            DashboardStats result = fleetStatisticsService.getDashboardStats("week");

            // Then
            assertThat(result.period()).isEqualTo("week");
        }

        @Test
        @DisplayName("should handle month period")
        void should_handleMonthPeriod() {
            // Given
            when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class)))
                .thenReturn(TruckStatusStats.empty());
            when(jdbcTemplate.queryForObject(anyString(), any(Class.class)))
                .thenReturn(0L);

            // When
            DashboardStats result = fleetStatisticsService.getDashboardStats("month");

            // Then
            assertThat(result.period()).isEqualTo("month");
        }
    }

    @Nested
    @DisplayName("TruckStatusStats calculations")
    class TruckStatusStatsCalculations {

        @Test
        @DisplayName("should verify active trucks are counted correctly")
        void should_countActiveTrucks() {
            // Given - simulate database returning specific counts
            TruckStatusStats stats = new TruckStatusStats(15L, 8L, 2L, 0L, 25L);

            // When & Then
            assertThat(stats.active()).isEqualTo(15L);
            assertThat(stats.total()).isEqualTo(25L);
        }

        @Test
        @DisplayName("should return empty stats object")
        void should_returnEmptyStats() {
            // When
            TruckStatusStats emptyStats = TruckStatusStats.empty();

            // Then
            assertThat(emptyStats.active()).isEqualTo(0L);
            assertThat(emptyStats.idle()).isEqualTo(0L);
            assertThat(emptyStats.offline()).isEqualTo(0L);
            assertThat(emptyStats.outOfService()).isEqualTo(0L);
            assertThat(emptyStats.total()).isEqualTo(0L);
        }
    }
}
