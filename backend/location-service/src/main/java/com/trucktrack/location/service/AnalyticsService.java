package com.trucktrack.location.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.trucktrack.location.dto.*;
import com.trucktrack.location.dto.AlertBreakdownResponse.AlertTypeCount;
import com.trucktrack.location.dto.DailyMetricsResponse.DailyDataPoint;
import com.trucktrack.location.dto.TruckRankingResponse.RankingMetric;
import com.trucktrack.location.dto.TruckRankingResponse.TruckRankEntry;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckGroup;
import com.trucktrack.location.repository.AnalyticsRepository;
import com.trucktrack.location.repository.TruckGroupRepository;
import com.trucktrack.location.repository.TruckRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Service for fleet analytics KPI aggregation.
 * Feature: 006-fleet-analytics
 * T014: Create AnalyticsService with core aggregation logic
 */
@Slf4j
@Service
public class AnalyticsService {

    private static final String CACHE_PREFIX = "analytics:";
    private static final Duration TODAY_TTL = Duration.ofMinutes(5);
    private static final Duration HISTORICAL_TTL = Duration.ofHours(1);

    private final AnalyticsRepository analyticsRepository;
    private final TruckRepository truckRepository;
    private final TruckGroupRepository truckGroupRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public AnalyticsService(
            AnalyticsRepository analyticsRepository,
            TruckRepository truckRepository,
            TruckGroupRepository truckGroupRepository,
            RedisTemplate<String, String> redisTemplate) {
        this.analyticsRepository = analyticsRepository;
        this.truckRepository = truckRepository;
        this.truckGroupRepository = truckGroupRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    /**
     * Get fleet KPIs for the specified period and entity.
     */
    public FleetKPIResponse getFleetKPIs(
            PeriodInfo.PeriodType periodType,
            LocalDate startDate,
            LocalDate endDate,
            EntityInfo.EntityType entityType,
            UUID entityId,
            List<UUID> userGroupIds) {

        PeriodInfo period = buildPeriodInfo(periodType, startDate, endDate);

        // Check cache
        String cacheKey = buildCacheKey("kpi", period, entityType, entityId, userGroupIds);
        FleetKPIResponse cached = getCached(cacheKey, FleetKPIResponse.class);
        if (cached != null) {
            log.debug("Cache hit for KPIs: {}", cacheKey);
            return cached;
        }

        // Get accessible truck IDs based on entity type and user permissions
        List<UUID> truckIds = getAccessibleTruckIds(entityType, entityId, userGroupIds);
        EntityInfo entity = buildEntityInfo(entityType, entityId, truckIds.size());

        // Get aggregated KPIs from repository
        Map<String, Object> kpiData = analyticsRepository.getAggregatedKPIs(truckIds, period.startDate(), period.endDate());
        int alertCount = analyticsRepository.getAlertCount(truckIds, period.startDate(), period.endDate());
        Map<String, Integer> geofenceEvents = analyticsRepository.getGeofenceEventCounts(truckIds, period.startDate(), period.endDate());

        FleetKPIResponse response = FleetKPIResponse.builder()
                .period(period)
                .entity(entity)
                .totalDistanceKm(toDouble(kpiData.get("total_distance_km")))
                .drivingTimeMinutes(toLong(kpiData.get("driving_minutes")))
                .idleTimeMinutes(toLong(kpiData.get("idle_minutes")))
                .avgSpeedKmh(toDouble(kpiData.get("avg_speed")))
                .maxSpeedKmh(toDouble(kpiData.get("max_speed")))
                .alertCount(alertCount)
                .geofenceEntries(geofenceEvents.get("entries"))
                .geofenceExits(geofenceEvents.get("exits"))
                .build();

        // Cache the result
        cache(cacheKey, response, getTTL(periodType));

        return response;
    }

    /**
     * Get daily metrics for charts.
     */
    public DailyMetricsResponse getDailyMetrics(
            PeriodInfo.PeriodType periodType,
            LocalDate startDate,
            LocalDate endDate,
            EntityInfo.EntityType entityType,
            UUID entityId,
            List<UUID> userGroupIds) {

        PeriodInfo period = buildPeriodInfo(periodType, startDate, endDate);

        // Check cache
        String cacheKey = buildCacheKey("daily", period, entityType, entityId, userGroupIds);
        DailyMetricsResponse cached = getCached(cacheKey, DailyMetricsResponse.class);
        if (cached != null) {
            return cached;
        }

        List<UUID> truckIds = getAccessibleTruckIds(entityType, entityId, userGroupIds);
        EntityInfo entity = buildEntityInfo(entityType, entityId, truckIds.size());

        List<Map<String, Object>> rawData = analyticsRepository.getDailyMetrics(truckIds, period.startDate(), period.endDate());

        List<DailyDataPoint> dailyData = rawData.stream()
                .map(row -> new DailyDataPoint(
                        ((java.sql.Date) row.get("date")).toLocalDate(),
                        toDouble(row.get("distance_km")),
                        toLong(row.get("driving_minutes")),
                        toInt(row.get("alert_count"))
                ))
                .collect(Collectors.toList());

        DailyMetricsResponse response = DailyMetricsResponse.of(period, entity, dailyData);
        cache(cacheKey, response, getTTL(periodType));

        return response;
    }

    /**
     * Get alert breakdown by type.
     */
    public AlertBreakdownResponse getAlertBreakdown(
            PeriodInfo.PeriodType periodType,
            LocalDate startDate,
            LocalDate endDate,
            EntityInfo.EntityType entityType,
            UUID entityId,
            List<UUID> userGroupIds) {

        PeriodInfo period = buildPeriodInfo(periodType, startDate, endDate);

        // Check cache
        String cacheKey = buildCacheKey("alerts", period, entityType, entityId, userGroupIds);
        AlertBreakdownResponse cached = getCached(cacheKey, AlertBreakdownResponse.class);
        if (cached != null) {
            return cached;
        }

        List<UUID> truckIds = getAccessibleTruckIds(entityType, entityId, userGroupIds);
        EntityInfo entity = buildEntityInfo(entityType, entityId, truckIds.size());

        List<Map<String, Object>> rawData = analyticsRepository.getAlertBreakdown(truckIds, period.startDate(), period.endDate());

        int total = rawData.stream().mapToInt(row -> toInt(row.get("count"))).sum();

        List<AlertTypeCount> breakdown = rawData.stream()
                .map(row -> AlertTypeCount.of(
                        (String) row.get("alert_type"),
                        toInt(row.get("count")),
                        total
                ))
                .collect(Collectors.toList());

        AlertBreakdownResponse response = AlertBreakdownResponse.of(period, entity, breakdown);
        cache(cacheKey, response, getTTL(periodType));

        return response;
    }

    /**
     * Get truck ranking by metric.
     */
    public TruckRankingResponse getTruckRanking(
            PeriodInfo.PeriodType periodType,
            LocalDate startDate,
            LocalDate endDate,
            RankingMetric metric,
            int limit,
            List<UUID> userGroupIds) {

        PeriodInfo period = buildPeriodInfo(periodType, startDate, endDate);

        // Check cache
        String cacheKey = buildCacheKey("ranking:" + metric, period, EntityInfo.EntityType.FLEET, null, userGroupIds) + ":" + limit;
        TruckRankingResponse cached = getCached(cacheKey, TruckRankingResponse.class);
        if (cached != null) {
            return cached;
        }

        List<UUID> truckIds = analyticsRepository.getAccessibleTruckIds(userGroupIds);

        List<Map<String, Object>> rawData = switch (metric) {
            case DISTANCE -> analyticsRepository.getTruckRankingByDistance(truckIds, period.startDate(), period.endDate(), limit);
            case DRIVING_TIME -> analyticsRepository.getTruckRankingByDrivingTime(truckIds, period.startDate(), period.endDate(), limit);
            case ALERTS -> analyticsRepository.getTruckRankingByAlerts(truckIds, period.startDate(), period.endDate(), limit);
        };

        String unit = switch (metric) {
            case DISTANCE -> "km";
            case DRIVING_TIME -> "heures";
            case ALERTS -> "";
        };

        AtomicInteger rank = new AtomicInteger(1);
        List<TruckRankEntry> ranking = rawData.stream()
                .map(row -> {
                    double value = toDouble(row.get("value"));
                    if (metric == RankingMetric.DRIVING_TIME) {
                        value = value / 60.0; // Convert minutes to hours
                    }
                    return TruckRankEntry.of(
                            rank.getAndIncrement(),
                            (UUID) row.get("truck_id"),
                            (String) row.get("truck_name"),
                            (String) row.get("license_plate"),
                            Math.round(value * 10) / 10.0,
                            unit
                    );
                })
                .collect(Collectors.toList());

        TruckRankingResponse response = TruckRankingResponse.of(period, metric, ranking, limit);
        cache(cacheKey, response, getTTL(periodType));

        return response;
    }

    /**
     * Get list of accessible trucks for the user.
     */
    public List<Truck> getAccessibleTrucks(List<UUID> userGroupIds) {
        List<UUID> truckIds = analyticsRepository.getAccessibleTruckIds(userGroupIds);
        return truckRepository.findAllById(truckIds);
    }

    /**
     * Get list of accessible groups for the user.
     */
    public List<TruckGroup> getAccessibleGroups(List<UUID> userGroupIds) {
        return truckGroupRepository.findAllById(userGroupIds);
    }

    // === Private helper methods ===

    private PeriodInfo buildPeriodInfo(PeriodInfo.PeriodType periodType, LocalDate startDate, LocalDate endDate) {
        return switch (periodType) {
            case TODAY -> PeriodInfo.today();
            case WEEK -> PeriodInfo.week();
            case MONTH -> PeriodInfo.month();
            case CUSTOM -> PeriodInfo.custom(startDate, endDate);
        };
    }

    private List<UUID> getAccessibleTruckIds(EntityInfo.EntityType entityType, UUID entityId, List<UUID> userGroupIds) {
        return switch (entityType) {
            case FLEET -> analyticsRepository.getAccessibleTruckIds(userGroupIds);
            case GROUP -> {
                // Verify user has access to this group
                if (!userGroupIds.contains(entityId)) {
                    yield List.of();
                }
                yield analyticsRepository.getTruckIdsByGroupId(entityId);
            }
            case TRUCK -> {
                // Verify user has access to this truck
                List<UUID> accessibleIds = analyticsRepository.getAccessibleTruckIds(userGroupIds);
                yield accessibleIds.contains(entityId) ? List.of(entityId) : List.of();
            }
        };
    }

    private EntityInfo buildEntityInfo(EntityInfo.EntityType entityType, UUID entityId, int truckCount) {
        return switch (entityType) {
            case FLEET -> EntityInfo.fleet(truckCount);
            case GROUP -> {
                String groupName = truckGroupRepository.findById(entityId)
                        .map(TruckGroup::getName)
                        .orElse("Unknown Group");
                yield EntityInfo.group(entityId, groupName, truckCount);
            }
            case TRUCK -> {
                String truckName = truckRepository.findById(entityId)
                        .map(Truck::getTruckId)
                        .orElse("Unknown Truck");
                yield EntityInfo.truck(entityId, truckName);
            }
        };
    }

    private String buildCacheKey(String prefix, PeriodInfo period, EntityInfo.EntityType entityType, UUID entityId, List<UUID> userGroupIds) {
        String userHash = userGroupIds.stream()
                .sorted()
                .map(UUID::toString)
                .collect(Collectors.joining(","));

        return CACHE_PREFIX + prefix + ":" +
                period.startDate() + ":" + period.endDate() + ":" +
                entityType + ":" + (entityId != null ? entityId : "all") + ":" +
                userHash.hashCode();
    }

    private Duration getTTL(PeriodInfo.PeriodType periodType) {
        return periodType == PeriodInfo.PeriodType.TODAY ? TODAY_TTL : HISTORICAL_TTL;
    }

    private <T> T getCached(String key, Class<T> clazz) {
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return objectMapper.readValue(value, clazz);
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize cached value: {}", e.getMessage());
        }
        return null;
    }

    private void cache(String key, Object value, Duration ttl) {
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, json, ttl);
            log.debug("Cached {} with TTL {}", key, ttl);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize value for caching: {}", e.getMessage());
        }
    }

    private double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof BigDecimal) return ((BigDecimal) value).doubleValue();
        if (value instanceof Number) return ((Number) value).doubleValue();
        return 0.0;
    }

    private long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number) return ((Number) value).longValue();
        return 0L;
    }

    private int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        return 0;
    }
}
