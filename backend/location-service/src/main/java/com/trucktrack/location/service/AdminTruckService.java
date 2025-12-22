package com.trucktrack.location.service;

import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.location.dto.CreateTruckRequest;
import com.trucktrack.location.dto.TruckAdminResponse;
import com.trucktrack.location.dto.UpdateTruckRequest;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckGroup;
import com.trucktrack.location.model.TruckGroupAssignment;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.TruckGroupAssignmentRepository;
import com.trucktrack.location.repository.TruckGroupRepository;
import com.trucktrack.location.repository.TruckRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for admin truck management operations.
 * T056-T060: AdminTruckService implementation
 * Feature: 002-admin-panel
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminTruckService {

    private final TruckRepository truckRepository;
    private final TruckGroupRepository truckGroupRepository;
    private final TruckGroupAssignmentRepository assignmentRepository;
    private final AuditService auditService;

    /**
     * Get paginated list of trucks with search and filters.
     */
    @Transactional(readOnly = true)
    public PageResponse<TruckAdminResponse> getTrucks(
            int page,
            int size,
            String search,
            TruckStatus status,
            UUID groupId,
            String sortBy,
            String sortDir
    ) {
        Sort sort = Sort.by(sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Truck> trucks = truckRepository.searchWithFilters(search, status, groupId, pageable);

        List<TruckAdminResponse> content = trucks.getContent().stream()
            .map(this::enrichWithGroups)
            .collect(Collectors.toList());

        return new PageResponse<>(
            content,
            trucks.getNumber(),
            trucks.getSize(),
            trucks.getTotalElements()
        );
    }

    /**
     * Get a single truck by ID.
     */
    @Transactional(readOnly = true)
    public TruckAdminResponse getTruckById(UUID id) {
        Truck truck = truckRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Truck not found: " + id));
        return enrichWithGroups(truck);
    }

    /**
     * Create a new truck.
     * T057: createTruck with license plate uniqueness check
     */
    @Transactional
    public TruckAdminResponse createTruck(CreateTruckRequest request, UUID actorId) {
        // Check truck ID uniqueness
        if (truckRepository.existsByTruckId(request.getTruckId())) {
            throw new IllegalArgumentException("Truck ID already exists: " + request.getTruckId());
        }

        // Check license plate uniqueness (if provided)
        if (request.getLicensePlate() != null && !request.getLicensePlate().isBlank()) {
            if (truckRepository.existsByLicensePlate(request.getLicensePlate())) {
                throw new IllegalArgumentException("License plate already exists: " + request.getLicensePlate());
            }
        }

        // Verify primary group exists
        if (!truckGroupRepository.existsById(request.getPrimaryGroupId())) {
            throw new EntityNotFoundException("Primary group not found: " + request.getPrimaryGroupId());
        }

        // Create the truck
        Truck truck = Truck.builder()
            .truckId(request.getTruckId())
            .licensePlate(request.getLicensePlate())
            .vehicleType(request.getVehicleType())
            .driverName(request.getDriverName())
            .driverPhone(request.getDriverPhone())
            .truckGroupId(request.getPrimaryGroupId())
            .status(TruckStatus.OFFLINE)
            .build();

        truck = truckRepository.save(truck);

        // Create group assignments
        Set<UUID> allGroupIds = new HashSet<>();
        allGroupIds.add(request.getPrimaryGroupId());
        if (request.getAdditionalGroupIds() != null) {
            allGroupIds.addAll(request.getAdditionalGroupIds());
        }

        for (UUID groupId : allGroupIds) {
            if (truckGroupRepository.existsById(groupId)) {
                TruckGroupAssignment assignment = TruckGroupAssignment.create(truck.getId(), groupId, actorId);
                assignmentRepository.save(assignment);
            }
        }

        // Audit log
        auditService.logTruckCreation(truck, actorId);

        log.info("Created truck {} by user {}", truck.getTruckId(), actorId);
        return enrichWithGroups(truck);
    }

    /**
     * Update an existing truck.
     * T058: updateTruck with audit logging
     */
    @Transactional
    public TruckAdminResponse updateTruck(UUID id, UpdateTruckRequest request, UUID actorId) {
        Truck truck = truckRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Truck not found: " + id));

        Map<String, Object> changes = new HashMap<>();

        // Update license plate with uniqueness check
        if (request.getLicensePlate() != null) {
            if (!request.getLicensePlate().equals(truck.getLicensePlate())) {
                if (!request.getLicensePlate().isBlank() &&
                    truckRepository.existsByLicensePlateAndIdNot(request.getLicensePlate(), id)) {
                    throw new IllegalArgumentException("License plate already exists: " + request.getLicensePlate());
                }
                changes.put("licensePlate", Map.of("from", truck.getLicensePlate(), "to", request.getLicensePlate()));
                truck.setLicensePlate(request.getLicensePlate().isBlank() ? null : request.getLicensePlate());
            }
        }

        // Update vehicle type
        if (request.getVehicleType() != null && !request.getVehicleType().equals(truck.getVehicleType())) {
            changes.put("vehicleType", Map.of("from", truck.getVehicleType(), "to", request.getVehicleType()));
            truck.setVehicleType(request.getVehicleType());
        }

        // Update driver name
        if (request.getDriverName() != null && !request.getDriverName().equals(truck.getDriverName())) {
            changes.put("driverName", Map.of("from", truck.getDriverName(), "to", request.getDriverName()));
            truck.setDriverName(request.getDriverName().isBlank() ? null : request.getDriverName());
        }

        // Update driver phone
        if (request.getDriverPhone() != null && !request.getDriverPhone().equals(truck.getDriverPhone())) {
            changes.put("driverPhone", Map.of("from", truck.getDriverPhone(), "to", request.getDriverPhone()));
            truck.setDriverPhone(request.getDriverPhone().isBlank() ? null : request.getDriverPhone());
        }

        truck = truckRepository.save(truck);

        // Audit log
        if (!changes.isEmpty()) {
            auditService.logTruckUpdate(truck, actorId, changes);
        }

        log.info("Updated truck {} by user {}: {}", truck.getTruckId(), actorId, changes.keySet());
        return enrichWithGroups(truck);
    }

    /**
     * Mark truck as out of service.
     * T059: markOutOfService
     */
    @Transactional
    public TruckAdminResponse markOutOfService(UUID id, UUID actorId) {
        Truck truck = truckRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Truck not found: " + id));

        TruckStatus previousStatus = truck.getStatus();
        truck.setStatus(TruckStatus.OUT_OF_SERVICE);
        truck = truckRepository.save(truck);

        // Audit log
        auditService.logTruckStatusChange(truck, actorId, previousStatus, TruckStatus.OUT_OF_SERVICE);

        log.info("Marked truck {} as out of service by user {}", truck.getTruckId(), actorId);
        return enrichWithGroups(truck);
    }

    /**
     * Activate a truck (set status to OFFLINE).
     * T059: activateTruck
     */
    @Transactional
    public TruckAdminResponse activateTruck(UUID id, UUID actorId) {
        Truck truck = truckRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Truck not found: " + id));

        TruckStatus previousStatus = truck.getStatus();
        truck.setStatus(TruckStatus.OFFLINE);
        truck = truckRepository.save(truck);

        // Audit log
        auditService.logTruckStatusChange(truck, actorId, previousStatus, TruckStatus.OFFLINE);

        log.info("Activated truck {} by user {}", truck.getTruckId(), actorId);
        return enrichWithGroups(truck);
    }

    /**
     * Get groups assigned to a truck.
     */
    @Transactional(readOnly = true)
    public List<UUID> getTruckGroups(UUID truckId) {
        if (!truckRepository.existsById(truckId)) {
            throw new EntityNotFoundException("Truck not found: " + truckId);
        }
        return assignmentRepository.findGroupIdsByTruckId(truckId);
    }

    /**
     * Update groups assigned to a truck.
     * T060: updateTruckGroups
     */
    @Transactional
    public List<UUID> updateTruckGroups(UUID truckId, List<UUID> groupIds, UUID actorId) {
        Truck truck = truckRepository.findById(truckId)
            .orElseThrow(() -> new EntityNotFoundException("Truck not found: " + truckId));

        // Ensure primary group is always included
        Set<UUID> newGroupIds = new HashSet<>(groupIds);
        newGroupIds.add(truck.getTruckGroupId());

        // Verify all groups exist
        for (UUID groupId : newGroupIds) {
            if (!truckGroupRepository.existsById(groupId)) {
                throw new EntityNotFoundException("Group not found: " + groupId);
            }
        }

        // Get current assignments
        List<UUID> currentGroupIds = assignmentRepository.findGroupIdsByTruckId(truckId);

        // Delete removed assignments
        for (UUID currentGroupId : currentGroupIds) {
            if (!newGroupIds.contains(currentGroupId)) {
                assignmentRepository.deleteByTruckIdAndGroupId(truckId, currentGroupId);
            }
        }

        // Add new assignments
        for (UUID newGroupId : newGroupIds) {
            if (!currentGroupIds.contains(newGroupId)) {
                TruckGroupAssignment assignment = TruckGroupAssignment.create(truckId, newGroupId, actorId);
                assignmentRepository.save(assignment);
            }
        }

        // Audit log
        auditService.logTruckGroupsUpdate(truck, actorId, currentGroupIds, new ArrayList<>(newGroupIds));

        log.info("Updated groups for truck {} by user {}", truck.getTruckId(), actorId);
        return new ArrayList<>(newGroupIds);
    }

    /**
     * Enrich truck response with group information.
     */
    private TruckAdminResponse enrichWithGroups(Truck truck) {
        // Get primary group name
        String primaryGroupName = truckGroupRepository.findById(truck.getTruckGroupId())
            .map(TruckGroup::getName)
            .orElse("Unknown");

        // Get all assigned groups
        List<UUID> groupIds = assignmentRepository.findGroupIdsByTruckId(truck.getId());
        List<TruckAdminResponse.GroupInfo> groups = groupIds.stream()
            .map(groupId -> truckGroupRepository.findById(groupId)
                .map(g -> TruckAdminResponse.GroupInfo.builder()
                    .id(g.getId())
                    .name(g.getName())
                    .build())
                .orElse(null))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return TruckAdminResponse.fromEntity(truck, primaryGroupName, groups);
    }
}
