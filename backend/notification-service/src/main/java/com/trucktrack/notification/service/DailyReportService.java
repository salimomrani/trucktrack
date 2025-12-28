package com.trucktrack.notification.service;

import com.trucktrack.notification.dto.DailyReportDTO;
import com.trucktrack.notification.model.NotificationType;
import com.trucktrack.notification.model.enums.RecipientType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyReportService {

    private final EmailService emailService;
    private final WebClient.Builder webClientBuilder;

    @Value("${gateway.url:http://localhost:8000}")
    private String gatewayUrl;

    @Value("${gateway.service-token:}")
    private String serviceToken;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public void generateAndSendDailyReports() {
        log.info("Starting daily report generation");

        try {
            // Get fleet managers from auth service
            List<FleetManagerInfo> fleetManagers = getFleetManagers();

            if (fleetManagers.isEmpty()) {
                log.warn("No fleet managers found for daily report");
                return;
            }

            // Get trip statistics
            DailyReportDTO stats = getTripStatistics();

            // Send report to each fleet manager
            for (FleetManagerInfo manager : fleetManagers) {
                sendReportToManager(manager, stats);
            }

            log.info("Daily reports sent to {} fleet managers", fleetManagers.size());

        } catch (Exception e) {
            log.error("Error generating daily reports: {}", e.getMessage(), e);
        }
    }

    private List<FleetManagerInfo> getFleetManagers() {
        try {
            WebClient webClient = webClientBuilder.baseUrl(gatewayUrl).build();

            FleetManagerInfo[] managers = webClient.get()
                    .uri("/auth/admin/users?role=FLEET_MANAGER")
                    .header("Authorization", "Bearer " + serviceToken)
                    .retrieve()
                    .bodyToMono(FleetManagerInfo[].class)
                    .block();

            return managers != null ? Arrays.asList(managers) : Collections.emptyList();

        } catch (Exception e) {
            log.error("Error fetching fleet managers: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private DailyReportDTO getTripStatistics() {
        try {
            WebClient webClient = webClientBuilder.baseUrl(gatewayUrl).build();

            LocalDate yesterday = LocalDate.now().minusDays(1);

            TripStatsResponse stats = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/location/admin/trips/stats")
                            .queryParam("date", yesterday.toString())
                            .build())
                    .header("Authorization", "Bearer " + serviceToken)
                    .retrieve()
                    .bodyToMono(TripStatsResponse.class)
                    .block();

            if (stats != null) {
                return DailyReportDTO.builder()
                        .reportDate(yesterday.format(DATE_FORMATTER))
                        .completedYesterday(stats.completed != null ? stats.completed : 0)
                        .inProgress(stats.inProgress != null ? stats.inProgress : 0)
                        .delayed(stats.delayed != null ? stats.delayed : 0)
                        .pending(stats.pending != null ? stats.pending : 0)
                        .cancelled(stats.cancelled != null ? stats.cancelled : 0)
                        .totalDistance(stats.totalDistanceKm != null ? stats.totalDistanceKm : 0.0)
                        .build();
            }

        } catch (Exception e) {
            log.error("Error fetching trip statistics: {}", e.getMessage());
        }

        // Return empty stats on error
        return DailyReportDTO.builder()
                .reportDate(LocalDate.now().minusDays(1).format(DATE_FORMATTER))
                .completedYesterday(0)
                .inProgress(0)
                .delayed(0)
                .pending(0)
                .cancelled(0)
                .totalDistance(0.0)
                .build();
    }

    private void sendReportToManager(FleetManagerInfo manager, DailyReportDTO stats) {
        try {
            Map<String, Object> variables = new HashMap<>();
            variables.put("recipientName", manager.name != null ? manager.name : manager.username);
            variables.put("reportDate", stats.getReportDate());
            variables.put("completedYesterday", stats.getCompletedYesterday());
            variables.put("inProgress", stats.getInProgress());
            variables.put("delayed", stats.getDelayed());
            variables.put("pending", stats.getPending());
            variables.put("cancelled", stats.getCancelled());
            variables.put("totalDistance", String.format("%.1f km", stats.getTotalDistance()));

            emailService.sendEmail(
                    manager.email,
                    manager.name,
                    NotificationType.DAILY_REPORT,
                    variables,
                    manager.id,
                    RecipientType.FLEET_MANAGER,
                    "fr"
            );

            log.debug("Daily report sent to {}", manager.email);

        } catch (Exception e) {
            log.error("Error sending daily report to {}: {}", manager.email, e.getMessage());
        }
    }

    // DTOs for API responses
    @lombok.Data
    static class FleetManagerInfo {
        UUID id;
        String username;
        String email;
        String name;
        String role;
    }

    @lombok.Data
    static class TripStatsResponse {
        Integer completed;
        Integer inProgress;
        Integer delayed;
        Integer pending;
        Integer cancelled;
        Double totalDistanceKm;
    }
}
