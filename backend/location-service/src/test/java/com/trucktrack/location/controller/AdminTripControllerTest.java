package com.trucktrack.location.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trucktrack.common.dto.PageResponse;
import com.trucktrack.common.security.GatewayAuthenticationFilter;
import com.trucktrack.location.dto.*;
import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.service.TripService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for AdminTripController.
 * Tests REST endpoints with security and validation.
 * Feature: 010-trip-management
 */
@WebMvcTest(AdminTripController.class)
@Import({TestSecurityConfig.class, TestSecurityConfig.TestExceptionHandler.class})
@DisplayName("AdminTripController Integration Tests")
class AdminTripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TripService tripService;

    private UUID adminUserId;
    private UUID tripId;
    private UUID truckId;
    private UUID driverId;
    private TripResponse testTripResponse;

    @BeforeEach
    void setUp() {
        adminUserId = UUID.randomUUID();
        tripId = UUID.randomUUID();
        truckId = UUID.randomUUID();
        driverId = UUID.randomUUID();

        testTripResponse = TripResponse.builder()
            .id(tripId)
            .origin("Paris")
            .destination("Lyon")
            .originLat(48.8566)
            .originLng(2.3522)
            .destinationLat(45.7640)
            .destinationLng(4.8357)
            .status(TripStatus.PENDING)
            .statusDisplay("Pending")
            .createdBy(adminUserId)
            .createdAt(Instant.now())
            .build();
    }

    @Nested
    @DisplayName("GET /admin/trips")
    class GetTrips {

        @Test
        @DisplayName("should return paginated trips for admin user")
        void should_returnPaginatedTrips_forAdminUser() throws Exception {
            // Given
            PageResponse<TripResponse> pageResponse = new PageResponse<>(
                List.of(testTripResponse), 0, 25, 1);

            when(tripService.getTrips(anyInt(), anyInt(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(pageResponse);

            // When/Then
            mockMvc.perform(get("/admin/trips")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].origin").value("Paris"))
                .andExpect(jsonPath("$.totalElements").value(1));
        }

        @Test
        @DisplayName("should return trips filtered by status")
        void should_returnTripsFilteredByStatus() throws Exception {
            // Given
            PageResponse<TripResponse> pageResponse = new PageResponse<>(
                List.of(testTripResponse), 0, 25, 1);

            when(tripService.getTrips(eq(0), eq(25), any(), eq(TripStatus.PENDING), any(), any(), any(), any(), any(), any()))
                .thenReturn(pageResponse);

            // When/Then
            mockMvc.perform(get("/admin/trips")
                    .param("status", "PENDING")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
        }

        @Test
        @DisplayName("should allow DISPATCHER role to access")
        void should_allowDispatcherRole() throws Exception {
            // Given
            PageResponse<TripResponse> pageResponse = new PageResponse<>(
                Collections.emptyList(), 0, 25, 0);

            when(tripService.getTrips(anyInt(), anyInt(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(pageResponse);

            // When/Then
            mockMvc.perform(get("/admin/trips")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "dispatcher@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DISPATCHER"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should deny DRIVER role access")
        void should_denyDriverRole() throws Exception {
            // When/Then
            mockMvc.perform(get("/admin/trips")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /admin/trips/{id}")
    class GetTripById {

        @Test
        @DisplayName("should return trip by ID")
        void should_returnTripById() throws Exception {
            // Given
            when(tripService.getTripById(tripId)).thenReturn(testTripResponse);

            // When/Then
            mockMvc.perform(get("/admin/trips/{id}", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(tripId.toString()))
                .andExpect(jsonPath("$.origin").value("Paris"))
                .andExpect(jsonPath("$.destination").value("Lyon"));
        }
    }

    @Nested
    @DisplayName("POST /admin/trips")
    class CreateTrip {

        @Test
        @DisplayName("should create trip with valid request")
        void should_createTrip_withValidRequest() throws Exception {
            // Given
            CreateTripRequest request = CreateTripRequest.builder()
                .origin("Paris")
                .destination("Lyon")
                .originLat(48.8566)
                .originLng(2.3522)
                .destinationLat(45.7640)
                .destinationLng(4.8357)
                .build();

            when(tripService.createTrip(any(CreateTripRequest.class), any(UUID.class)))
                .thenReturn(testTripResponse);

            // When/Then
            mockMvc.perform(post("/admin/trips")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.origin").value("Paris"))
                .andExpect(jsonPath("$.destination").value("Lyon"));

            verify(tripService).createTrip(any(CreateTripRequest.class), eq(adminUserId));
        }

        @Test
        @DisplayName("should reject request with missing origin")
        void should_rejectRequest_withMissingOrigin() throws Exception {
            // Given
            CreateTripRequest request = CreateTripRequest.builder()
                .destination("Lyon")
                .build();

            // When/Then
            mockMvc.perform(post("/admin/trips")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should reject request with missing destination")
        void should_rejectRequest_withMissingDestination() throws Exception {
            // Given
            CreateTripRequest request = CreateTripRequest.builder()
                .origin("Paris")
                .build();

            // When/Then
            mockMvc.perform(post("/admin/trips")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PUT /admin/trips/{id}")
    class UpdateTrip {

        @Test
        @DisplayName("should update trip with valid request")
        void should_updateTrip_withValidRequest() throws Exception {
            // Given
            UpdateTripRequest request = UpdateTripRequest.builder()
                .origin("Paris Updated")
                .destination("Marseille")
                .build();

            TripResponse updatedTrip = TripResponse.builder()
                .id(tripId)
                .origin("Paris Updated")
                .destination("Marseille")
                .status(TripStatus.PENDING)
                .build();

            when(tripService.updateTrip(eq(tripId), any(UpdateTripRequest.class), any(UUID.class)))
                .thenReturn(updatedTrip);

            // When/Then
            mockMvc.perform(put("/admin/trips/{id}", tripId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.origin").value("Paris Updated"))
                .andExpect(jsonPath("$.destination").value("Marseille"));
        }
    }

    @Nested
    @DisplayName("POST /admin/trips/{id}/assign")
    class AssignTrip {

        @Test
        @DisplayName("should assign trip to truck and driver")
        void should_assignTrip() throws Exception {
            // Given
            AssignTripRequest request = AssignTripRequest.builder()
                .truckId(truckId)
                .driverId(driverId)
                .build();

            TripResponse assignedTrip = TripResponse.builder()
                .id(tripId)
                .origin("Paris")
                .destination("Lyon")
                .status(TripStatus.ASSIGNED)
                .assignedTruckId(truckId)
                .assignedDriverId(driverId)
                .build();

            when(tripService.assignTrip(eq(tripId), any(AssignTripRequest.class), any(UUID.class)))
                .thenReturn(assignedTrip);

            // When/Then
            mockMvc.perform(post("/admin/trips/{id}/assign", tripId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.assignedTruckId").value(truckId.toString()))
                .andExpect(jsonPath("$.assignedDriverId").value(driverId.toString()));
        }
    }

    @Nested
    @DisplayName("POST /admin/trips/{id}/cancel")
    class CancelTrip {

        @Test
        @DisplayName("should cancel trip with reason")
        void should_cancelTrip_withReason() throws Exception {
            // Given
            TripResponse cancelledTrip = TripResponse.builder()
                .id(tripId)
                .origin("Paris")
                .destination("Lyon")
                .status(TripStatus.CANCELLED)
                .build();

            when(tripService.cancelTrip(eq(tripId), eq("Customer cancelled"), any(UUID.class)))
                .thenReturn(cancelledTrip);

            // When/Then
            mockMvc.perform(post("/admin/trips/{id}/cancel", tripId)
                    .param("reason", "Customer cancelled")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        }

        @Test
        @DisplayName("should cancel trip without reason")
        void should_cancelTrip_withoutReason() throws Exception {
            // Given
            TripResponse cancelledTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.CANCELLED)
                .build();

            when(tripService.cancelTrip(eq(tripId), isNull(), any(UUID.class)))
                .thenReturn(cancelledTrip);

            // When/Then
            mockMvc.perform(post("/admin/trips/{id}/cancel", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        }
    }

    @Nested
    @DisplayName("POST /admin/trips/{id}/reassign")
    class ReassignTrip {

        @Test
        @DisplayName("should reassign trip to new truck and driver")
        void should_reassignTrip() throws Exception {
            // Given
            UUID newTruckId = UUID.randomUUID();
            UUID newDriverId = UUID.randomUUID();

            AssignTripRequest request = AssignTripRequest.builder()
                .truckId(newTruckId)
                .driverId(newDriverId)
                .build();

            TripResponse reassignedTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.ASSIGNED)
                .assignedTruckId(newTruckId)
                .assignedDriverId(newDriverId)
                .build();

            when(tripService.reassignTrip(eq(tripId), any(AssignTripRequest.class), any(UUID.class)))
                .thenReturn(reassignedTrip);

            // When/Then
            mockMvc.perform(post("/admin/trips/{id}/reassign", tripId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedTruckId").value(newTruckId.toString()))
                .andExpect(jsonPath("$.assignedDriverId").value(newDriverId.toString()));
        }
    }

    @Nested
    @DisplayName("GET /admin/trips/{id}/history")
    class GetTripHistory {

        @Test
        @DisplayName("should return trip status history")
        void should_returnTripStatusHistory() throws Exception {
            // Given
            TripStatusHistoryResponse historyEntry = TripStatusHistoryResponse.builder()
                .id(UUID.randomUUID())
                .tripId(tripId)
                .previousStatus(TripStatus.PENDING)
                .newStatus(TripStatus.ASSIGNED)
                .changedAt(Instant.now())
                .build();

            when(tripService.getTripHistory(tripId)).thenReturn(List.of(historyEntry));

            // When/Then
            mockMvc.perform(get("/admin/trips/{id}/history", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].previousStatus").value("PENDING"))
                .andExpect(jsonPath("$[0].newStatus").value("ASSIGNED"));
        }
    }

    @Nested
    @DisplayName("GET /admin/trips/pending")
    class GetPendingTrips {

        @Test
        @DisplayName("should return unassigned trips")
        void should_returnUnassignedTrips() throws Exception {
            // Given
            when(tripService.getPendingTrips()).thenReturn(List.of(testTripResponse));

            // When/Then
            mockMvc.perform(get("/admin/trips/pending")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("GET /admin/trips/active")
    class GetActiveTrips {

        @Test
        @DisplayName("should return active trips paginated")
        void should_returnActiveTrips() throws Exception {
            // Given
            TripResponse activeTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.IN_PROGRESS)
                .build();

            PageResponse<TripResponse> pageResponse = new PageResponse<>(
                List.of(activeTrip), 0, 25, 1);

            when(tripService.getActiveTrips(0, 25)).thenReturn(pageResponse);

            // When/Then
            mockMvc.perform(get("/admin/trips/active")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("IN_PROGRESS"));
        }
    }

    @Nested
    @DisplayName("GET /admin/trips/stats")
    class GetTripStats {

        @Test
        @DisplayName("should return trip statistics by status")
        void should_returnTripStats() throws Exception {
            // Given
            Map<String, Long> stats = Map.of(
                "PENDING", 5L,
                "ASSIGNED", 3L,
                "IN_PROGRESS", 2L,
                "COMPLETED", 10L,
                "CANCELLED", 1L
            );

            when(tripService.getTripStats()).thenReturn(stats);

            // When/Then
            mockMvc.perform(get("/admin/trips/stats")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.PENDING").value(5))
                .andExpect(jsonPath("$.COMPLETED").value(10));
        }
    }

    @Nested
    @DisplayName("GET /admin/trips/analytics")
    class GetAnalytics {

        @Test
        @DisplayName("should return trip analytics with KPIs")
        void should_returnTripAnalytics() throws Exception {
            // Given
            TripAnalyticsDTO analytics = TripAnalyticsDTO.builder()
                .totalTrips(100L)
                .completedTrips(80L)
                .completionRate(80.0)
                .averageDurationMinutes(120.0)
                .build();

            when(tripService.getAnalytics()).thenReturn(analytics);

            // When/Then
            mockMvc.perform(get("/admin/trips/analytics")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTrips").value(100))
                .andExpect(jsonPath("$.completedTrips").value(80))
                .andExpect(jsonPath("$.completionRate").value(80.0));
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("should reject unauthenticated requests")
        void should_rejectUnauthenticatedRequests() throws Exception {
            // When/Then - No auth headers
            mockMvc.perform(get("/admin/trips"))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should allow FLEET_MANAGER role")
        void should_allowFleetManagerRole() throws Exception {
            // Given
            PageResponse<TripResponse> pageResponse = new PageResponse<>(
                Collections.emptyList(), 0, 25, 0);

            when(tripService.getTrips(anyInt(), anyInt(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(pageResponse);

            // When/Then
            mockMvc.perform(get("/admin/trips")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, adminUserId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "manager@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "FLEET_MANAGER"))
                .andExpect(status().isOk());
        }
    }
}
