package com.trucktrack.location.service;

import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.location.dto.CreateGroupRequest;
import com.trucktrack.location.dto.GroupDetailResponse;
import com.trucktrack.location.dto.UpdateGroupRequest;
import com.trucktrack.location.model.TruckGroup;
import com.trucktrack.location.repository.TruckGroupAssignmentRepository;
import com.trucktrack.location.repository.TruckGroupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * T118-T121: Admin group management service
 * Feature: 002-admin-panel (US5 - Groups)
 */
@Service
public class AdminGroupService {

    private static final Logger log = LoggerFactory.getLogger(AdminGroupService.class);

    private final TruckGroupRepository groupRepository;
    private final TruckGroupAssignmentRepository truckAssignmentRepository;
    private final JdbcTemplate jdbcTemplate;
    private final AuditService auditService;

    public AdminGroupService(
            TruckGroupRepository groupRepository,
            TruckGroupAssignmentRepository truckAssignmentRepository,
            JdbcTemplate jdbcTemplate,
            AuditService auditService) {
        this.groupRepository = groupRepository;
        this.truckAssignmentRepository = truckAssignmentRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.auditService = auditService;
    }

    /**
     * T119: Get all groups with pagination and search
     */
    public PageResponse<GroupDetailResponse> getGroups(String search, Pageable pageable) {
        Page<TruckGroup> page = groupRepository.searchWithFilters(search, pageable);

        var responseList = page.getContent().stream()
            .map(group -> {
                long truckCount = truckAssignmentRepository.countByGroupId(group.getId());
                long userCount = countUsersInGroup(group.getId());
                return GroupDetailResponse.fromEntity(group, truckCount, userCount);
            })
            .toList();

        return new PageResponse<>(responseList, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    /**
     * Get single group by ID
     */
    public Optional<GroupDetailResponse> getGroupById(UUID id) {
        return groupRepository.findById(id)
            .map(group -> {
                long truckCount = truckAssignmentRepository.countByGroupId(group.getId());
                long userCount = countUsersInGroup(group.getId());
                return GroupDetailResponse.fromEntity(group, truckCount, userCount);
            });
    }

    /**
     * T120: Create new group
     */
    @Transactional
    public GroupDetailResponse createGroup(CreateGroupRequest request, String username) {
        // Check for duplicate name
        if (groupRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Group name already exists: " + request.name());
        }

        TruckGroup group = TruckGroup.builder()
            .name(request.name())
            .description(request.description())
            .build();

        group = groupRepository.save(group);

        auditService.logCreate("TruckGroup", group.getId(), null, username);

        log.info("Group {} created by {}", group.getName(), username);

        return GroupDetailResponse.fromEntity(group);
    }

    /**
     * T121: Update existing group
     */
    @Transactional
    public GroupDetailResponse updateGroup(UUID id, UpdateGroupRequest request, String username) {
        TruckGroup group = groupRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Group not found: " + id));

        // Check for duplicate name (excluding current group)
        if (!group.getName().equals(request.name())
                && groupRepository.existsByNameAndIdNot(request.name(), id)) {
            throw new IllegalArgumentException("Group name already exists: " + request.name());
        }

        String oldName = group.getName();
        group.setName(request.name());
        group.setDescription(request.description());

        group = groupRepository.save(group);

        long truckCount = truckAssignmentRepository.countByGroupId(group.getId());
        long userCount = countUsersInGroup(group.getId());

        auditService.logUpdate("TruckGroup", group.getId(), null, username,
            Map.of("oldName", oldName), Map.of("newName", group.getName()));

        log.info("Group {} updated by {}", group.getName(), username);

        return GroupDetailResponse.fromEntity(group, truckCount, userCount);
    }

    /**
     * Delete group
     */
    @Transactional
    public void deleteGroup(UUID id, String username) {
        TruckGroup group = groupRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Group not found: " + id));

        // First delete all truck assignments
        truckAssignmentRepository.deleteByGroupId(id);

        // Delete user assignments via JDBC (cross-service)
        jdbcTemplate.update(
            "DELETE FROM user_group_assignments WHERE truck_group_id = ?",
            id
        );

        String groupName = group.getName();
        groupRepository.delete(group);

        auditService.logDelete("TruckGroup", id, null, username);

        log.info("Group {} deleted by {}", groupName, username);
    }

    /**
     * Count users in a group (cross-service query)
     */
    private long countUsersInGroup(UUID groupId) {
        try {
            Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_group_assignments WHERE truck_group_id = ?",
                Long.class,
                groupId
            );
            return count != null ? count : 0;
        } catch (Exception e) {
            log.warn("Could not count users for group {}: {}", groupId, e.getMessage());
            return 0;
        }
    }
}
