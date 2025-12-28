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
public class TripAssignedEvent {

    public enum AssignmentType {
        NEW_ASSIGNMENT,
        REASSIGNMENT,
        CANCELLATION
    }

    private UUID tripId;
    private AssignmentType type;

    // New assignment info
    private UUID newDriverId;
    private UUID newTruckId;
    private String vehiclePlate;

    // Previous assignment (for reassignment)
    private UUID previousDriverId;

    // Trip details
    private String origin;
    private String destination;
    private LocalDateTime scheduledDeparture;
    private LocalDateTime estimatedArrival;

    // Client info
    private String recipientEmail;
    private String recipientName;

    // Cancellation reason (if applicable)
    private String cancellationReason;

    private LocalDateTime eventTime;
}
