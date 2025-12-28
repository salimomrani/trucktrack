package com.trucktrack.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyReportDTO {
    private String reportDate;
    private int completedYesterday;
    private int inProgress;
    private int delayed;
    private int pending;
    private int cancelled;
    private double totalDistance;
}
