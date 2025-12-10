package com.trucktrack.location.dto;

import lombok.Builder;

import java.time.Instant;

/**
 * DTO pour les positions GPS
 * Exemple de best practice : Record Java + @Builder
 */
@Builder
public record GPSPositionDTO(
    String eventId,
    String truckId,
    String truckIdReadable,
    Double latitude,
    Double longitude,
    Double altitude,
    Double speed,
    Integer heading,
    Double accuracy,
    Integer satellites,
    Instant timestamp,
    Instant ingestedAt
) {
    /**
     * Vérifie si la position GPS est valide
     */
    public boolean isValid() {
        return latitude != null && longitude != null &&
               latitude >= -90 && latitude <= 90 &&
               longitude >= -180 && longitude <= 180;
    }

    /**
     * Calcule la distance approximative (en mètres) depuis une autre position
     * Utilise la formule de Haversine
     */
    public double distanceFrom(GPSPositionDTO other) {
        if (!this.isValid() || !other.isValid()) {
            throw new IllegalArgumentException("Both positions must be valid");
        }

        final double EARTH_RADIUS_M = 6371000; // Rayon de la Terre en mètres

        double lat1Rad = Math.toRadians(this.latitude);
        double lat2Rad = Math.toRadians(other.latitude);
        double deltaLat = Math.toRadians(other.latitude - this.latitude);
        double deltaLon = Math.toRadians(other.longitude - this.longitude);

        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_M * c;
    }
}
