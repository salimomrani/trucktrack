package com.trucktrack.common.dto;

import java.io.Serializable;

/**
 * Common DTO for GPS coordinates
 * T039: Create common DTO classes in backend/shared
 */
public class GPSCoordinate implements Serializable {
    private static final long serialVersionUID = 1L;

    private Double latitude;
    private Double longitude;
    private Double altitude;
    private Double accuracy;

    public GPSCoordinate() {
    }

    public GPSCoordinate(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public GPSCoordinate(Double latitude, Double longitude, Double altitude, Double accuracy) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.altitude = altitude;
        this.accuracy = accuracy;
    }

    // Getters and Setters
    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getAltitude() {
        return altitude;
    }

    public void setAltitude(Double altitude) {
        this.altitude = altitude;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    @Override
    public String toString() {
        return "GPSCoordinate{" +
                "latitude=" + latitude +
                ", longitude=" + longitude +
                ", altitude=" + altitude +
                ", accuracy=" + accuracy +
                '}';
    }
}
