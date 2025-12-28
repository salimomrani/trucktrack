package com.trucktrack.location.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EtaAlertEvent {

    public enum AlertType {
        ETA_30MIN,
        ETA_10MIN
    }

    private UUID tripId;
    private AlertType alertType;
    private Integer etaMinutes;
    private LocalDateTime estimatedArrival;

    // Client info
    private String recipientEmail;
    private String recipientName;
    private UUID recipientUserId; // If client has an account

    private LocalDateTime eventTime;
}
