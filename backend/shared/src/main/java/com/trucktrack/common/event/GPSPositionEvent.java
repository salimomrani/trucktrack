package com.trucktrack.common.event;

import java.io.Serializable;
import java.time.Instant;

/**
 * Kafka event for GPS position updates
 * T040: Create common event POJOs in backend/shared
 * Published to: truck-track.gps.position
 */
public class GPSPositionEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String eventId;
    private String truckId;
    private String truckIdReadable;
    private Double latitude;
    private Double longitude;
    private Double altitude;
    private Double speed;
    private Integer heading;
    private Double accuracy;
    private Integer satellites;
    private Instant timestamp;
    private Instant ingestedAt;

    public GPSPositionEvent() {
    }

    // Getters and Setters
    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getTruckId() {
        return truckId;
    }

    public void setTruckId(String truckId) {
        this.truckId = truckId;
    }

    public String getTruckIdReadable() {
        return truckIdReadable;
    }

    public void setTruckIdReadable(String truckIdReadable) {
        this.truckIdReadable = truckIdReadable;
    }

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

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Integer getHeading() {
        return heading;
    }

    public void setHeading(Integer heading) {
        this.heading = heading;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public Integer getSatellites() {
        return satellites;
    }

    public void setSatellites(Integer satellites) {
        this.satellites = satellites;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Instant getIngestedAt() {
        return ingestedAt;
    }

    public void setIngestedAt(Instant ingestedAt) {
        this.ingestedAt = ingestedAt;
    }

    @Override
    public String toString() {
        return "GPSPositionEvent{" +
                "eventId='" + eventId + '\'' +
                ", truckId='" + truckId + '\'' +
                ", truckIdReadable='" + truckIdReadable + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", speed=" + speed +
                ", timestamp=" + timestamp +
                '}';
    }
}
