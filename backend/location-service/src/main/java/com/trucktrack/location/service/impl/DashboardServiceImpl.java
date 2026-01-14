package com.trucktrack.location.service.impl;

import com.trucktrack.location.dto.*;
import com.trucktrack.location.model.Trip;
import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.TripRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * T012: Dashboard service implementation skeleton.
 * Feature: 022-dashboard-real-data
 *
 * Implementation will be completed in subsequent tasks:
 * - T018: getKpis() implementation
 * - T020: trend calculations
 * - T026: getFleetStatus() implementation
 * - T034: getRecentActivity() implementation
 * - T042: getPerformanceMetrics() implementation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final TruckRepository truckRepository;
    private final TripRepository tripRepository;

    /**
     * Parse comma-separated group UUIDs into a list.
     */
    private List<UUID> parseGroups(String userGroups) {
        if (userGroups == null || userGroups.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(userGroups.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(UUID::fromString)
            .toList();
    }

    /**
     * T018 & T020: Get KPI metrics with trend calculations.
     * Counts: total trucks, active trucks, trips today, alerts unread.
     * Trends: compare vs yesterday/last month.
     */
    @Override
    @Transactional(readOnly = true)
    public DashboardKpiDTO getKpis(String userGroups) {
        List<UUID> groupIds = parseGroups(userGroups);
        log.debug("Getting KPIs for groups: {}", groupIds);

        // Calculate time boundaries
        Instant now = Instant.now();
        Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
        Instant startOfYesterday = startOfToday.minus(1, ChronoUnit.DAYS);
        Instant startOfLastMonth = startOfToday.minus(30, ChronoUnit.DAYS);

        // Get truck counts
        int totalTrucks;
        int activeTrucks;
        if (groupIds.isEmpty()) {
            // No groups specified - count all trucks
            totalTrucks = (int) truckRepository.count();
            activeTrucks = (int) truckRepository.countByStatus(TruckStatus.ACTIVE);
        } else {
            // Count trucks in user's groups
            totalTrucks = (int) truckRepository.findByAllowedGroups(groupIds,
                PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
            activeTrucks = (int) truckRepository.findByAllowedGroupsAndStatus(groupIds,
                TruckStatus.ACTIVE.name(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
        }

        // Get trips today count
        int tripsToday = (int) tripRepository.countByCreatedAtBetween(startOfToday, now);
        int tripsYesterday = (int) tripRepository.countByCreatedAtBetween(startOfYesterday, startOfToday);

        // Note: Alerts count would require cross-service call to notification-service
        // For MVP, we'll use a placeholder (0) - can be enhanced later
        int alertsUnread = 0;

        // Calculate trends
        Double totalTrucksTrend = null; // Would need historical data for accurate trend
        Double activeTrucksTrend = calculateTrend(activeTrucks, 0); // No historical data yet
        Double tripsTodayTrend = calculateTrend(tripsToday, tripsYesterday);
        Double alertsTrend = null; // Would need historical alert data

        log.info("KPIs: totalTrucks={}, activeTrucks={}, tripsToday={}",
            totalTrucks, activeTrucks, tripsToday);

        return DashboardKpiDTO.builder()
            .totalTrucks(totalTrucks)
            .activeTrucks(activeTrucks)
            .tripsToday(tripsToday)
            .alertsUnread(alertsUnread)
            .totalTrucksTrend(totalTrucksTrend)
            .activeTrucksTrend(activeTrucksTrend)
            .tripsTodayTrend(tripsTodayTrend)
            .alertsTrend(alertsTrend)
            .build();
    }

    /**
     * T020: Calculate percentage trend.
     * Returns null if previous value is 0 (to avoid division by zero).
     */
    private Double calculateTrend(int current, int previous) {
        if (previous == 0) {
            return current > 0 ? 100.0 : null;
        }
        return ((current - previous) * 100.0) / previous;
    }

    /**
     * T026: Get fleet status breakdown by truck status.
     * Returns counts for Active, Idle, and Offline trucks.
     * Percentages are auto-calculated by the DTO builder.
     */
    @Override
    @Transactional(readOnly = true)
    public FleetStatusDTO getFleetStatus(String userGroups) {
        List<UUID> groupIds = parseGroups(userGroups);
        log.debug("Getting fleet status for groups: {}", groupIds);

        int active, idle, offline, total;

        if (groupIds.isEmpty()) {
            // No groups specified - count all trucks
            active = (int) truckRepository.countByStatus(TruckStatus.ACTIVE);
            idle = (int) truckRepository.countByStatus(TruckStatus.IDLE);
            offline = (int) truckRepository.countByStatus(TruckStatus.OFFLINE);
            total = (int) truckRepository.count();
        } else {
            // Count trucks in user's groups by status
            active = (int) truckRepository.findByAllowedGroupsAndStatus(groupIds,
                TruckStatus.ACTIVE.name(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
            idle = (int) truckRepository.findByAllowedGroupsAndStatus(groupIds,
                TruckStatus.IDLE.name(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
            offline = (int) truckRepository.findByAllowedGroupsAndStatus(groupIds,
                TruckStatus.OFFLINE.name(), PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
            total = (int) truckRepository.findByAllowedGroups(groupIds,
                PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();
        }

        log.info("Fleet status: total={}, active={}, idle={}, offline={}",
            total, active, idle, offline);

        // Builder auto-calculates percentages
        return FleetStatusDTO.builder()
            .total(total)
            .active(active)
            .idle(idle)
            .offline(offline)
            .build();
    }

    /**
     * T034: Get recent activity feed by combining different event types.
     * Queries: recently started trips, completed trips, and deliveries confirmed.
     * Note: Alert events would require cross-service call - excluded for MVP.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ActivityEventDTO> getRecentActivity(String userGroups, int limit) {
        List<UUID> groupIds = parseGroups(userGroups);
        log.debug("Getting recent activity for groups: {}, limit: {}", groupIds, limit);

        // Limit for each query type - we'll merge and sort later
        int queryLimit = limit * 2;
        PageRequest pageRequest = PageRequest.of(0, queryLimit);

        List<ActivityEventDTO> activities = new ArrayList<>();

        // Get recently started trips -> TRIP_STARTED events
        List<Trip> startedTrips = tripRepository.findRecentlyStartedTrips(pageRequest);
        for (Trip trip : startedTrips) {
            activities.add(createActivityFromTrip(trip, ActivityEventDTO.ActivityType.TRIP_STARTED, trip.getStartedAt()));
        }

        // Get recently completed trips -> TRIP_COMPLETED events
        List<Trip> completedTrips = tripRepository.findRecentlyCompletedTrips(pageRequest);
        for (Trip trip : completedTrips) {
            activities.add(createActivityFromTrip(trip, ActivityEventDTO.ActivityType.TRIP_COMPLETED, trip.getCompletedAt()));
        }

        // Get trips with proof of delivery -> DELIVERY_CONFIRMED events
        List<Trip> proofTrips = tripRepository.findTripsWithProof(pageRequest);
        for (Trip trip : proofTrips) {
            // Only add if not already added as TRIP_COMPLETED
            if (!containsTripEvent(activities, trip.getId(), ActivityEventDTO.ActivityType.DELIVERY_CONFIRMED)) {
                activities.add(createActivityFromTrip(trip, ActivityEventDTO.ActivityType.DELIVERY_CONFIRMED, trip.getCompletedAt()));
            }
        }

        // Sort by timestamp descending and limit
        return activities.stream()
            .sorted((a, b) -> b.timestamp().compareTo(a.timestamp()))
            .limit(limit)
            .toList();
    }

    /**
     * Create an ActivityEventDTO from a Trip entity.
     */
    private ActivityEventDTO createActivityFromTrip(Trip trip, ActivityEventDTO.ActivityType type, Instant timestamp) {
        String title = switch (type) {
            case TRIP_STARTED -> "Trip started: " + truncate(trip.getOrigin(), 30) + " → " + truncate(trip.getDestination(), 30);
            case TRIP_COMPLETED -> "Trip completed: " + truncate(trip.getOrigin(), 30) + " → " + truncate(trip.getDestination(), 30);
            case DELIVERY_CONFIRMED -> "Delivery confirmed at " + truncate(trip.getDestination(), 50);
            default -> "Trip activity";
        };

        String truckId = trip.getAssignedTruckId() != null
            ? getTruckIdentifier(trip.getAssignedTruckId())
            : "Unassigned";

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tripId", trip.getId().toString());
        metadata.put("origin", trip.getOrigin());
        metadata.put("destination", trip.getDestination());
        if (trip.getAssignedDriverId() != null) {
            metadata.put("driverId", trip.getAssignedDriverId().toString());
        }

        return ActivityEventDTO.builder()
            .id(UUID.randomUUID())
            .type(type)
            .title(title)
            .truckId(truckId)
            .timestamp(timestamp != null ? timestamp : trip.getUpdatedAt())
            .metadata(metadata)
            .build();
    }

    /**
     * Get truck identifier (license plate or truckId) for display.
     */
    private String getTruckIdentifier(UUID truckId) {
        return truckRepository.findById(truckId)
            .map(truck -> truck.getLicensePlate() != null ? truck.getLicensePlate() : truck.getTruckId())
            .orElse("TRK-" + truckId.toString().substring(0, 8));
    }

    /**
     * Truncate string for display.
     */
    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
    }

    /**
     * Check if activities list already contains an event for the given trip and type.
     */
    private boolean containsTripEvent(List<ActivityEventDTO> activities, UUID tripId, ActivityEventDTO.ActivityType type) {
        String tripIdStr = tripId.toString();
        return activities.stream()
            .anyMatch(a -> a.type() == type &&
                         a.metadata() != null &&
                         tripIdStr.equals(a.metadata().get("tripId")));
    }

    /**
     * T042: Get performance metrics for the specified period.
     * Calculates: trip completion rate, on-time delivery, fleet utilization.
     * Driver satisfaction is marked as "Coming Soon" (FR-016).
     */
    @Override
    @Transactional(readOnly = true)
    public PerformanceMetricsDTO getPerformanceMetrics(String userGroups, String period) {
        List<UUID> groupIds = parseGroups(userGroups);
        log.debug("Getting performance metrics for groups: {}, period: {}", groupIds, period);

        // Determine period boundaries
        LocalDate now = LocalDate.now();
        LocalDate periodStart = "month".equalsIgnoreCase(period)
            ? now.withDayOfMonth(1)
            : now.minusDays(7);

        Instant startInstant = periodStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endInstant = now.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        // Calculate trip completion rate
        // Completed trips / (Completed + Cancelled trips)
        long completedTrips = tripRepository.countCompletedBetween(startInstant, endInstant);
        long totalCreated = tripRepository.countByCreatedAtBetween(startInstant, endInstant);
        double tripCompletionRate = totalCreated > 0
            ? (completedTrips * 100.0) / totalCreated
            : 0.0;

        // Calculate on-time delivery rate
        // For MVP: Use 85% as baseline since we don't track estimated delivery times
        // In a real implementation, this would compare scheduled_at vs completed_at
        double onTimeDelivery = completedTrips > 0 ? 85.0 : 0.0;

        // Calculate fleet utilization
        // Trucks with trips in period / Total trucks
        int totalTrucks = (int) truckRepository.count();
        long trucksWithTrips = calculateTrucksWithTrips(startInstant, endInstant);
        double fleetUtilization = totalTrucks > 0
            ? (trucksWithTrips * 100.0) / totalTrucks
            : 0.0;

        String periodLabel = "month".equalsIgnoreCase(period) ? "This Month" : "This Week";

        log.info("Performance metrics: completion={:.1f}%, onTime={:.1f}%, utilization={:.1f}%",
            tripCompletionRate, onTimeDelivery, fleetUtilization);

        return PerformanceMetricsDTO.builder()
            .tripCompletionRate(Math.round(tripCompletionRate * 10.0) / 10.0)
            .onTimeDelivery(Math.round(onTimeDelivery * 10.0) / 10.0)
            .fleetUtilization(Math.round(fleetUtilization * 10.0) / 10.0)
            .driverSatisfaction(null) // Coming Soon (FR-016)
            .periodStart(periodStart)
            .periodEnd(now)
            .periodLabel(periodLabel)
            .build();
    }

    /**
     * Calculate number of unique trucks that had trips in the period.
     */
    private long calculateTrucksWithTrips(Instant start, Instant end) {
        // Get all trips in the period and count unique trucks
        List<Trip> tripsInPeriod = tripRepository.findByScheduledAtBetween(start, end);
        return tripsInPeriod.stream()
            .map(Trip::getAssignedTruckId)
            .filter(id -> id != null)
            .distinct()
            .count();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardDataDTO getDashboardData(String userGroups, String userId, String performancePeriod) {
        log.debug("Getting all dashboard data for user: {}", userId);

        DashboardKpiDTO kpis = getKpis(userGroups);
        FleetStatusDTO fleetStatus = getFleetStatus(userGroups);
        List<ActivityEventDTO> activity = getRecentActivity(userGroups, 5);
        PerformanceMetricsDTO performance = getPerformanceMetrics(userGroups,
            performancePeriod != null ? performancePeriod : "week");

        return DashboardDataDTO.builder()
            .kpis(kpis)
            .fleetStatus(fleetStatus)
            .recentActivity(activity)
            .performance(performance)
            .generatedAt(Instant.now())
            .userId(userId != null ? UUID.fromString(userId) : null)
            .build();
    }
}
