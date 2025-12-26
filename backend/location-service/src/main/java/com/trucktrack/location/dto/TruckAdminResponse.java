package com.trucktrack.location.dto;

import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO for admin truck response with full details.
 * T055: Create TruckAdminResponse DTO
 * Feature: 002-admin-panel
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TruckAdminResponse {

    private UUID id;
    private String truckId;
    private String licensePlate;
    private String vehicleType;
    private String driverName;
    private String driverPhone;
    private UUID driverId;
    private TruckStatus status;
    private String statusDisplay;

    // Location data
    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private BigDecimal currentSpeed;
    private Integer currentHeading;
    private Instant lastUpdate;

    // Group info
    private UUID primaryGroupId;
    private String primaryGroupName;
    private int groupCount;
    private List<GroupInfo> groups;

    // Audit info
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Nested DTO for group information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupInfo {
        private UUID id;
        private String name;
    }

    /**
     * Factory method to create response from entity.
     */
    public static TruckAdminResponse fromEntity(Truck truck) {
        return TruckAdminResponse.builder()
            .id(truck.getId())
            .truckId(truck.getTruckId())
            .licensePlate(truck.getLicensePlate())
            .vehicleType(truck.getVehicleType())
            .driverName(truck.getDriverName())
            .driverPhone(truck.getDriverPhone())
            .driverId(truck.getDriverId())
            .status(truck.getStatus())
            .statusDisplay(getStatusDisplay(truck.getStatus()))
            .currentLatitude(truck.getCurrentLatitude())
            .currentLongitude(truck.getCurrentLongitude())
            .currentSpeed(truck.getCurrentSpeed())
            .currentHeading(truck.getCurrentHeading())
            .lastUpdate(truck.getLastUpdate())
            .primaryGroupId(truck.getTruckGroupId())
            .createdAt(truck.getCreatedAt())
            .updatedAt(truck.getUpdatedAt())
            .build();
    }

    /**
     * Factory method with group information.
     */
    public static TruckAdminResponse fromEntity(Truck truck, String primaryGroupName, List<GroupInfo> groups) {
        TruckAdminResponse response = fromEntity(truck);
        response.setPrimaryGroupName(primaryGroupName);
        response.setGroups(groups);
        response.setGroupCount(groups != null ? groups.size() : 0);
        return response;
    }

    private static String getStatusDisplay(TruckStatus status) {
        if (status == null) return "Unknown";
        switch (status) {
            case ACTIVE: return "Active";
            case IDLE: return "Idle";
            case OFFLINE: return "Offline";
            case MAINTENANCE: return "Maintenance";
            case OUT_OF_SERVICE: return "Out of Service";
            default: return "Unknown";
        }
    }
}
