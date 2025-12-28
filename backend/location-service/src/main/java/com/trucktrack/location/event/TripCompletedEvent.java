package com.trucktrack.location.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripCompletedEvent {

    private UUID tripId;
    private UUID driverId;
    private UUID truckId;
    private String origin;
    private String destination;
    private LocalDateTime completedAt;

    // Client recipient info
    private String recipientEmail;
    private String recipientName;

    // POD info (if available)
    private UUID proofId;
    private String signerName;
    private String signatureUrl;
    private List<String> photoUrls;

    // Order reference
    private String orderNumber;
}
