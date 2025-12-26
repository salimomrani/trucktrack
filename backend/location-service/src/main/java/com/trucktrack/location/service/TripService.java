package com.trucktrack.location.service;

import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.location.dto.*;
import com.trucktrack.location.model.Trip;
import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.model.TripStatusHistory;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.repository.TripRepository;
import com.trucktrack.location.repository.TripStatusHistoryRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.repository.UserPushTokenRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for trip management operations.
 * T008: Create TripService with CRUD operations
 * Feature: 010-trip-management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripStatusHistoryRepository historyRepository;
    private final TruckRepository truckRepository;
    private final UserPushTokenRepository userPushTokenRepository;
    private final PushNotificationService pushNotificationService;

    // Map entity field names to database column names for native query sorting
    private static final Map<String, String> SORT_FIELD_MAPPING = Map.of(
        "origin", "origin",
        "destination", "destination",
        "status", "status",
        "scheduledAt", "scheduled_at",
        "startedAt", "started_at",
        "completedAt", "completed_at",
        "createdAt", "created_at",
        "updatedAt", "updated_at"
    );

    /**
     * Create a new trip.
     */
    @Transactional
    public TripResponse createTrip(CreateTripRequest request, UUID createdBy) {
        // Build the trip entity
        Trip trip = Trip.builder()
            .origin(request.getOrigin())
            .destination(request.getDestination())
            .scheduledAt(request.getScheduledAt())
            .notes(request.getNotes())
            .createdBy(createdBy)
            .status(TripStatus.PENDING)
            .build();

        // If assignment info provided, validate and set
        if (request.getAssignedTruckId() != null && request.getAssignedDriverId() != null) {
            validateAssignment(request.getAssignedTruckId(), request.getAssignedDriverId());
            trip.setAssignedTruckId(request.getAssignedTruckId());
            trip.setAssignedDriverId(request.getAssignedDriverId());
            trip.setStatus(TripStatus.ASSIGNED);
        }

        trip = tripRepository.save(trip);

        // Record initial status in history
        TripStatusHistory history = TripStatusHistory.of(
            trip.getId(),
            null,
            trip.getStatus(),
            createdBy,
            "Trip created"
        );
        historyRepository.save(history);

        log.info("Created trip {} by user {}", trip.getId(), createdBy);
        return enrichTripResponse(trip);
    }

    /**
     * Get a trip by ID.
     */
    @Transactional(readOnly = true)
    public TripResponse getTripById(UUID id) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));
        return enrichTripResponse(trip);
    }

    /**
     * Get paginated list of trips with filters.
     */
    @Transactional(readOnly = true)
    public PageResponse<TripResponse> getTrips(
            int page,
            int size,
            String search,
            TripStatus status,
            UUID driverId,
            UUID truckId,
            String sortBy,
            String sortDir
    ) {
        return getTrips(page, size, search, status, driverId, truckId, null, null, sortBy, sortDir);
    }

    /**
     * Get paginated list of trips with filters including date range.
     * T053: Added date range filter parameters
     */
    @Transactional(readOnly = true)
    public PageResponse<TripResponse> getTrips(
            int page,
            int size,
            String search,
            TripStatus status,
            UUID driverId,
            UUID truckId,
            Instant startDate,
            Instant endDate,
            String sortBy,
            String sortDir
    ) {
        String dbSortColumn = SORT_FIELD_MAPPING.getOrDefault(sortBy, "created_at");
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, dbSortColumn);
        Pageable pageable = PageRequest.of(page, size, sort);

        String statusValue = status != null ? status.name() : null;
        Page<Trip> trips;

        if (startDate != null || endDate != null) {
            trips = tripRepository.searchWithFiltersAndDateRange(
                search, statusValue, driverId, truckId, startDate, endDate, pageable);
        } else {
            trips = tripRepository.searchWithFilters(search, statusValue, driverId, truckId, pageable);
        }

        List<TripResponse> content = trips.getContent().stream()
            .map(this::enrichTripResponse)
            .collect(Collectors.toList());

        return new PageResponse<>(
            content,
            trips.getNumber(),
            trips.getSize(),
            trips.getTotalElements()
        );
    }

    /**
     * Update a trip (only origin, destination, scheduledAt, notes).
     */
    @Transactional
    public TripResponse updateTrip(UUID id, UpdateTripRequest request, UUID actorId) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));

        // Can only update trips that are not completed or cancelled
        if (trip.isTerminal()) {
            throw new IllegalStateException("Cannot update a trip in terminal state: " + trip.getStatus());
        }

        Map<String, Object> changes = new HashMap<>();

        if (request.getOrigin() != null && !request.getOrigin().equals(trip.getOrigin())) {
            changes.put("origin", Map.of("from", trip.getOrigin(), "to", request.getOrigin()));
            trip.setOrigin(request.getOrigin());
        }

        if (request.getDestination() != null && !request.getDestination().equals(trip.getDestination())) {
            changes.put("destination", Map.of("from", trip.getDestination(), "to", request.getDestination()));
            trip.setDestination(request.getDestination());
        }

        if (request.getScheduledAt() != null) {
            changes.put("scheduledAt", Map.of("from", trip.getScheduledAt(), "to", request.getScheduledAt()));
            trip.setScheduledAt(request.getScheduledAt());
        }

        if (request.getNotes() != null && !request.getNotes().equals(trip.getNotes())) {
            changes.put("notes", Map.of("from", trip.getNotes(), "to", request.getNotes()));
            trip.setNotes(request.getNotes());
        }

        trip = tripRepository.save(trip);

        if (!changes.isEmpty()) {
            log.info("Updated trip {} by user {}: {}", trip.getId(), actorId, changes.keySet());
        }

        return enrichTripResponse(trip);
    }

    /**
     * Assign a trip to a truck and driver.
     */
    @Transactional
    public TripResponse assignTrip(UUID id, AssignTripRequest request, UUID actorId) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));

        // Can only assign PENDING trips
        if (trip.getStatus() != TripStatus.PENDING) {
            throw new IllegalStateException("Can only assign trips in PENDING status. Current: " + trip.getStatus());
        }

        // Validate assignment
        validateAssignment(request.getTruckId(), request.getDriverId());

        TripStatus previousStatus = trip.getStatus();
        trip.setAssignedTruckId(request.getTruckId());
        trip.setAssignedDriverId(request.getDriverId());
        trip.setStatus(TripStatus.ASSIGNED);

        trip = tripRepository.save(trip);

        // Record status change
        TripStatusHistory history = TripStatusHistory.of(
            trip.getId(),
            previousStatus,
            TripStatus.ASSIGNED,
            actorId,
            "Trip assigned to truck and driver"
        );
        historyRepository.save(history);

        log.info("Assigned trip {} to truck {} and driver {} by user {}",
            trip.getId(), request.getTruckId(), request.getDriverId(), actorId);

        // T037: Send push notification to the assigned driver
        sendTripAssignmentNotification(trip);

        return enrichTripResponse(trip);
    }

    /**
     * Send push notification for trip assignment.
     * T037: Publish notification on trip assignment
     */
    private void sendTripAssignmentNotification(Trip trip) {
        if (trip.getAssignedDriverId() == null) {
            return;
        }

        try {
            userPushTokenRepository.findPushTokenByUserId(trip.getAssignedDriverId())
                .ifPresent(pushToken -> {
                    pushNotificationService.sendTripAssignedNotification(
                        pushToken,
                        trip.getId(),
                        trip.getOrigin(),
                        trip.getDestination()
                    );
                });
        } catch (Exception e) {
            // Log but don't fail the assignment if notification fails
            log.warn("Failed to send trip assignment notification for trip {}: {}",
                trip.getId(), e.getMessage());
        }
    }

    /**
     * Update trip status (for driver actions).
     */
    @Transactional
    public TripResponse updateTripStatus(UUID id, UpdateTripStatusRequest request, UUID actorId) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));

        TripStatus newStatus = request.getStatus();

        // Validate state transition
        if (!trip.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                String.format("Cannot transition from %s to %s", trip.getStatus(), newStatus)
            );
        }

        TripStatus previousStatus = trip.getStatus();
        trip.setStatus(newStatus);

        // Set timestamps based on status
        if (newStatus == TripStatus.IN_PROGRESS && trip.getStartedAt() == null) {
            trip.setStartedAt(Instant.now());
        } else if (newStatus == TripStatus.COMPLETED) {
            trip.setCompletedAt(Instant.now());
        }

        trip = tripRepository.save(trip);

        // Record status change
        TripStatusHistory history = TripStatusHistory.of(
            trip.getId(),
            previousStatus,
            newStatus,
            actorId,
            request.getNotes()
        );
        historyRepository.save(history);

        log.info("Updated trip {} status from {} to {} by user {}",
            trip.getId(), previousStatus, newStatus, actorId);

        return enrichTripResponse(trip);
    }

    /**
     * Cancel a trip.
     * T060: Implement cancelTrip() with validation
     */
    @Transactional
    public TripResponse cancelTrip(UUID id, String reason, UUID actorId) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));

        if (!trip.canTransitionTo(TripStatus.CANCELLED)) {
            throw new IllegalStateException("Cannot cancel trip in status: " + trip.getStatus());
        }

        UUID previousDriverId = trip.getAssignedDriverId();
        TripStatus previousStatus = trip.getStatus();
        trip.setStatus(TripStatus.CANCELLED);
        trip = tripRepository.save(trip);

        // Record status change
        TripStatusHistory history = TripStatusHistory.of(
            trip.getId(),
            previousStatus,
            TripStatus.CANCELLED,
            actorId,
            reason != null ? reason : "Trip cancelled"
        );
        historyRepository.save(history);

        log.info("Cancelled trip {} by user {}: {}", trip.getId(), actorId, reason);

        // T064: Send notification to driver if trip was assigned
        if (previousDriverId != null) {
            sendTripCancelledNotification(trip, previousDriverId);
        }

        return enrichTripResponse(trip);
    }

    /**
     * Reassign a trip to a different truck and driver.
     * T062: Implement reassignTrip() with notification to both drivers
     */
    @Transactional
    public TripResponse reassignTrip(UUID id, AssignTripRequest request, UUID actorId) {
        Trip trip = tripRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Trip not found: " + id));

        // Can only reassign trips that are ASSIGNED or IN_PROGRESS (not PENDING, COMPLETED, CANCELLED)
        if (trip.getStatus() != TripStatus.ASSIGNED && trip.getStatus() != TripStatus.IN_PROGRESS) {
            throw new IllegalStateException("Can only reassign trips in ASSIGNED or IN_PROGRESS status. Current: " + trip.getStatus());
        }

        // Validate new assignment
        validateReassignment(request.getTruckId(), request.getDriverId(), trip.getAssignedTruckId(), trip.getAssignedDriverId());

        UUID previousDriverId = trip.getAssignedDriverId();
        UUID previousTruckId = trip.getAssignedTruckId();

        // Update assignment
        trip.setAssignedTruckId(request.getTruckId());
        trip.setAssignedDriverId(request.getDriverId());

        trip = tripRepository.save(trip);

        // Record the reassignment
        String notes = String.format("Trip reassigned from truck %s to %s, driver changed",
            previousTruckId, request.getTruckId());
        TripStatusHistory history = TripStatusHistory.of(
            trip.getId(),
            trip.getStatus(), // Status doesn't change
            trip.getStatus(),
            actorId,
            notes
        );
        historyRepository.save(history);

        log.info("Reassigned trip {} from driver {} to driver {} by user {}",
            trip.getId(), previousDriverId, request.getDriverId(), actorId);

        // T065: Send notifications to both drivers
        if (previousDriverId != null) {
            sendTripReassignedNotification(trip, previousDriverId, false);
        }
        sendTripReassignedNotification(trip, request.getDriverId(), true);

        return enrichTripResponse(trip);
    }

    /**
     * Get trips for a specific driver.
     */
    @Transactional(readOnly = true)
    public List<TripResponse> getTripsForDriver(UUID driverId) {
        return tripRepository.findByAssignedDriverId(driverId).stream()
            .map(this::enrichTripResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get active trips for a driver (ASSIGNED or IN_PROGRESS).
     */
    @Transactional(readOnly = true)
    public List<TripResponse> getActiveTripsForDriver(UUID driverId) {
        return tripRepository.findActiveTripsForDriver(driverId).stream()
            .map(this::enrichTripResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get trip status history.
     */
    @Transactional(readOnly = true)
    public List<TripStatusHistoryResponse> getTripHistory(UUID tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new EntityNotFoundException("Trip not found: " + tripId);
        }
        return historyRepository.findByTripIdOrderByChangedAtDesc(tripId).stream()
            .map(TripStatusHistoryResponse::fromEntity)
            .collect(Collectors.toList());
    }

    /**
     * Get pending trips (for dispatcher dashboard).
     */
    @Transactional(readOnly = true)
    public List<TripResponse> getPendingTrips() {
        return tripRepository.findByStatusOrderByCreatedAtDesc(TripStatus.PENDING).stream()
            .map(this::enrichTripResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get active trips (for monitoring dashboard).
     */
    @Transactional(readOnly = true)
    public PageResponse<TripResponse> getActiveTrips(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Trip> trips = tripRepository.findActiveTrips(pageable);

        List<TripResponse> content = trips.getContent().stream()
            .map(this::enrichTripResponse)
            .collect(Collectors.toList());

        return new PageResponse<>(
            content,
            trips.getNumber(),
            trips.getSize(),
            trips.getTotalElements()
        );
    }

    /**
     * Get trip statistics.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getTripStats() {
        Map<String, Long> stats = new HashMap<>();
        for (TripStatus status : TripStatus.values()) {
            stats.put(status.name(), tripRepository.countByStatus(status));
        }
        stats.put("TOTAL", tripRepository.count());
        return stats;
    }

    /**
     * Get detailed trip analytics.
     * T054: Create TripAnalyticsDTO with summary stats
     */
    @Transactional(readOnly = true)
    public TripAnalyticsDTO getAnalytics() {
        Instant now = Instant.now();
        Instant startOfDay = now.truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        Instant startOfWeek = startOfDay.minus(java.time.Duration.ofDays(
            startOfDay.atZone(java.time.ZoneOffset.UTC).getDayOfWeek().getValue() - 1));
        Instant startOfMonth = startOfDay.atZone(java.time.ZoneOffset.UTC)
            .withDayOfMonth(1).toInstant();

        // Count by status
        long pending = tripRepository.countByStatus(TripStatus.PENDING);
        long assigned = tripRepository.countByStatus(TripStatus.ASSIGNED);
        long inProgress = tripRepository.countByStatus(TripStatus.IN_PROGRESS);
        long completed = tripRepository.countByStatus(TripStatus.COMPLETED);
        long cancelled = tripRepository.countByStatus(TripStatus.CANCELLED);
        long total = tripRepository.count();

        // Time-based counts
        long tripsToday = tripRepository.countByCreatedAtBetween(startOfDay, now);
        long tripsThisWeek = tripRepository.countByCreatedAtBetween(startOfWeek, now);
        long tripsThisMonth = tripRepository.countByCreatedAtBetween(startOfMonth, now);

        // Performance metrics
        Double avgDuration = tripRepository.getAverageTripDurationMinutes();
        double completionRate = TripAnalyticsDTO.calculateCompletionRate(completed, total);
        double cancellationRate = TripAnalyticsDTO.calculateCancellationRate(cancelled, total);

        // Calculate trend (compare this week to last week)
        Instant lastWeekStart = startOfWeek.minus(java.time.Duration.ofDays(7));
        long tripsLastWeek = tripRepository.countByCreatedAtBetween(lastWeekStart, startOfWeek);
        Double tripsTrend = tripsLastWeek > 0
            ? ((tripsThisWeek - tripsLastWeek) * 100.0 / tripsLastWeek)
            : (tripsThisWeek > 0 ? 100.0 : 0.0);

        return TripAnalyticsDTO.builder()
            .totalTrips(total)
            .pendingTrips(pending)
            .assignedTrips(assigned)
            .inProgressTrips(inProgress)
            .completedTrips(completed)
            .cancelledTrips(cancelled)
            .averageDurationMinutes(avgDuration)
            .completionRate(completionRate)
            .cancellationRate(cancellationRate)
            .tripsToday(tripsToday)
            .tripsThisWeek(tripsThisWeek)
            .tripsThisMonth(tripsThisMonth)
            .tripsTrendPercent(tripsTrend)
            .periodStart(startOfMonth)
            .periodEnd(now)
            .build();
    }

    /**
     * Validate truck and driver for assignment.
     */
    private void validateAssignment(UUID truckId, UUID driverId) {
        // Validate truck exists
        Truck truck = truckRepository.findById(truckId)
            .orElseThrow(() -> new EntityNotFoundException("Truck not found: " + truckId));

        // Check if truck already has an active trip
        if (tripRepository.hasTruckActiveTrips(truckId)) {
            throw new IllegalStateException("Truck already has an active trip");
        }

        // Check if driver already has an active trip
        if (tripRepository.hasDriverActiveTrips(driverId)) {
            throw new IllegalStateException("Driver already has an active trip");
        }
    }

    /**
     * Validate truck and driver for reassignment.
     * T062: Reassignment validation (exclude current trip from checks)
     */
    private void validateReassignment(UUID newTruckId, UUID newDriverId, UUID currentTruckId, UUID currentDriverId) {
        // Validate truck exists
        truckRepository.findById(newTruckId)
            .orElseThrow(() -> new EntityNotFoundException("Truck not found: " + newTruckId));

        // If changing truck, check if new truck has active trips
        if (!newTruckId.equals(currentTruckId) && tripRepository.hasTruckActiveTrips(newTruckId)) {
            throw new IllegalStateException("Truck already has an active trip");
        }

        // If changing driver, check if new driver has active trips
        if (!newDriverId.equals(currentDriverId) && tripRepository.hasDriverActiveTrips(newDriverId)) {
            throw new IllegalStateException("Driver already has an active trip");
        }
    }

    /**
     * Send push notification for trip cancellation.
     * T064: Add sendTripCancelledNotification()
     */
    private void sendTripCancelledNotification(Trip trip, UUID driverId) {
        try {
            userPushTokenRepository.findPushTokenByUserId(driverId)
                .ifPresent(pushToken -> {
                    pushNotificationService.sendTripCancelledNotification(
                        pushToken,
                        trip.getId(),
                        trip.getOrigin(),
                        trip.getDestination()
                    );
                });
        } catch (Exception e) {
            log.warn("Failed to send trip cancellation notification for trip {}: {}",
                trip.getId(), e.getMessage());
        }
    }

    /**
     * Send push notification for trip reassignment.
     * T065: Add sendTripReassignedNotification()
     */
    private void sendTripReassignedNotification(Trip trip, UUID driverId, boolean isNewDriver) {
        try {
            userPushTokenRepository.findPushTokenByUserId(driverId)
                .ifPresent(pushToken -> {
                    pushNotificationService.sendTripReassignedNotification(
                        pushToken,
                        trip.getId(),
                        trip.getOrigin(),
                        trip.getDestination(),
                        isNewDriver
                    );
                });
        } catch (Exception e) {
            log.warn("Failed to send trip reassignment notification for trip {}: {}",
                trip.getId(), e.getMessage());
        }
    }

    /**
     * Enrich trip response with truck name.
     */
    private TripResponse enrichTripResponse(Trip trip) {
        TripResponse response = TripResponse.fromEntity(trip);

        // Get truck name if assigned
        if (trip.getAssignedTruckId() != null) {
            truckRepository.findById(trip.getAssignedTruckId())
                .ifPresent(truck -> response.setAssignedTruckName(truck.getTruckId()));
        }

        return response;
    }
}
