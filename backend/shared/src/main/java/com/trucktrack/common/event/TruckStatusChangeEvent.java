package com.trucktrack.common.event;

import com.trucktrack.common.dto.TruckStatus;

import java.io.Serializable;
import java.time.Instant;

/**
 * Kafka event for truck status changes
 * T040: Create common event POJOs in backend/shared
 * Published to: truck-track.location.status-change
 */
public class TruckStatusChangeEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String eventId;
    private String truckId;
    private String truckIdReadable;
    private TruckStatus previousStatus;
    private TruckStatus newStatus;
    private Double latitude;
    private Double longitude;
    private Instant timestamp;

    public TruckStatusChangeEvent() {
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

    public TruckStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(TruckStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public TruckStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(TruckStatus newStatus) {
        this.newStatus = newStatus;
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

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "TruckStatusChangeEvent{" +
                "eventId='" + eventId + '\'' +
                ", truckId='" + truckId + '\'' +
                ", truckIdReadable='" + truckIdReadable + '\'' +
                ", previousStatus=" + previousStatus +
                ", newStatus=" + newStatus +
                ", timestamp=" + timestamp +
                '}';
    }
}
