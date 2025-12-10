package com.trucktrack.location.dto;

import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO pour les réponses API contenant les informations d'un truck
 * Exemple de best practice : Record Java + @Builder de Lombok
 */
@Builder
public record TruckResponseDTO(
    UUID id,
    String truckId,
    String licensePlate,
    String driverName,
    String driverPhone,
    String vehicleType,
    TruckStatus status,
    Double currentLatitude,
    Double currentLongitude,
    Double currentSpeed,
    Integer currentHeading,
    Instant lastUpdate,
    Instant createdAt,
    Instant updatedAt
) {
    /**
     * Convertit une entité Truck en DTO
     */
    public static TruckResponseDTO fromEntity(Truck truck) {
        return TruckResponseDTO.builder()
            .id(truck.getId())
            .truckId(truck.getTruckId())
            .licensePlate(truck.getLicensePlate())
            .driverName(truck.getDriverName())
            .driverPhone(truck.getDriverPhone())
            .vehicleType(truck.getVehicleType())
            .status(truck.getStatus())
            .currentLatitude(truck.getCurrentLatitude() != null ?
                truck.getCurrentLatitude().doubleValue() : null)
            .currentLongitude(truck.getCurrentLongitude() != null ?
                truck.getCurrentLongitude().doubleValue() : null)
            .currentSpeed(truck.getCurrentSpeed() != null ?
                truck.getCurrentSpeed().doubleValue() : null)
            .currentHeading(truck.getCurrentHeading())
            .lastUpdate(truck.getLastUpdate())
            .createdAt(truck.getCreatedAt())
            .updatedAt(truck.getUpdatedAt())
            .build();
    }

    /**
     * Méthode utilitaire pour vérifier si le truck est actif
     */
    public boolean isActive() {
        return status == TruckStatus.ACTIVE;
    }

    /**
     * Méthode utilitaire pour vérifier si le truck a une position
     */
    public boolean hasPosition() {
        return currentLatitude != null && currentLongitude != null;
    }
}
