package com.trucktrack.common.event;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

/**
 * Kafka event for triggered alerts
 * T040: Create common event POJOs in backend/shared
 * Published to: truck-track.notification.alert
 */
public class AlertTriggeredEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String eventId;
    private String alertRuleId;
    private String truckId;
    private String truckIdReadable;
    private AlertType alertType;
    private Severity severity;
    private String message;
    private Double latitude;
    private Double longitude;
    private Instant triggeredAt;
    private List<String> affectedUserIds;

    public enum AlertType {
        OFFLINE,
        IDLE,
        GEOFENCE_ENTER,
        GEOFENCE_EXIT,
        SPEED_LIMIT
    }

    public enum Severity {
        INFO,
        WARNING,
        CRITICAL
    }

    public AlertTriggeredEvent() {
    }

    // Getters and Setters
    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getAlertRuleId() {
        return alertRuleId;
    }

    public void setAlertRuleId(String alertRuleId) {
        this.alertRuleId = alertRuleId;
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

    public AlertType getAlertType() {
        return alertType;
    }

    public void setAlertType(AlertType alertType) {
        this.alertType = alertType;
    }

    public Severity getSeverity() {
        return severity;
    }

    public void setSeverity(Severity severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public Instant getTriggeredAt() {
        return triggeredAt;
    }

    public void setTriggeredAt(Instant triggeredAt) {
        this.triggeredAt = triggeredAt;
    }

    public List<String> getAffectedUserIds() {
        return affectedUserIds;
    }

    public void setAffectedUserIds(List<String> affectedUserIds) {
        this.affectedUserIds = affectedUserIds;
    }

    @Override
    public String toString() {
        return "AlertTriggeredEvent{" +
                "eventId='" + eventId + '\'' +
                ", alertRuleId='" + alertRuleId + '\'' +
                ", truckId='" + truckId + '\'' +
                ", alertType=" + alertType +
                ", severity=" + severity +
                ", message='" + message + '\'' +
                ", triggeredAt=" + triggeredAt +
                '}';
    }
}
