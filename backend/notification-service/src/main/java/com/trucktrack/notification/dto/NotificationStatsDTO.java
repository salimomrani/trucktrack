package com.trucktrack.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class NotificationStatsDTO {

    private PeriodDTO period;
    private Long totalSent;
    private Map<String, Long> byChannel;
    private Map<String, Long> byStatus;
    private Map<String, Long> byType;
    private Double deliveryRate;
    private Double bounceRate;
    private Double openRate;

    @Data
    @Builder
    public static class PeriodDTO {
        private LocalDateTime from;
        private LocalDateTime to;
    }
}
