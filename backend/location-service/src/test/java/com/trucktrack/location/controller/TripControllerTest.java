package com.trucktrack.location.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for TripController (Driver endpoints).
 * Tests REST endpoints with security and driver authorization.
 * Feature: 010-trip-management (US2: Driver Views and Manages Trips)
 */
@WebMvcTest(TripController.class)
@Import({TestSecurityConfig.class, TestSecurityConfig.TestExceptionHandler.class})
@DisplayName("TripController (Driver) Integration Tests")
class TripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TripService tripService;

    private UUID driverId;
    private UUID otherDriverId;
    private UUID tripId;
    private UUID truckId;
    private TripResponse testTripResponse;

    @BeforeEach
    void setUp() {
        driverId = UUID.randomUUID();
        otherDriverId = UUID.randomUUID();
        tripId = UUID.randomUUID();
        truckId = UUID.randomUUID();

        testTripResponse = TripResponse.builder()
            .id(tripId)
            .origin("Paris")
            .destination("Lyon")
            .status(TripStatus.ASSIGNED)
            .statusDisplay("Assigned")
            .assignedTruckId(truckId)
            .assignedDriverId(driverId)
            .createdAt(Instant.now())
            .build();
    }

    @Nested
    @DisplayName("GET /location/v1/trips/my")
    class GetMyTrips {

        @Test
        @DisplayName("should return trips for authenticated driver")
        void should_returnTrips_forAuthenticatedDriver() throws Exception {
            // Given
            when(tripService.getTripsForDriver(driverId))
                .thenReturn(List.of(testTripResponse));

            // When/Then
            mockMvc.perform(get("/location/v1/trips/my")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].origin").value("Paris"))
                .andExpect(jsonPath("$[0].assignedDriverId").value(driverId.toString()));

            verify(tripService).getTripsForDriver(driverId);
        }

        @Test
        @DisplayName("should return 401 for unauthenticated request")
        void should_return401_forUnauthenticatedRequest() throws Exception {
            // When/Then - No auth headers
            mockMvc.perform(get("/location/v1/trips/my"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("should return empty list when driver has no trips")
        void should_returnEmptyList_whenNoTrips() throws Exception {
            // Given
            when(tripService.getTripsForDriver(driverId))
                .thenReturn(Collections.emptyList());

            // When/Then
            mockMvc.perform(get("/location/v1/trips/my")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    @Nested
    @DisplayName("GET /location/v1/trips/my/active")
    class GetMyActiveTrips {

        @Test
        @DisplayName("should return active trips for driver")
        void should_returnActiveTrips_forDriver() throws Exception {
            // Given
            TripResponse activeTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.IN_PROGRESS)
                .assignedDriverId(driverId)
                .build();

            when(tripService.getActiveTripsForDriver(driverId))
                .thenReturn(List.of(activeTrip));

            // When/Then
            mockMvc.perform(get("/location/v1/trips/my/active")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("IN_PROGRESS"));
        }
    }

    @Nested
    @DisplayName("GET /location/v1/trips/{id}")
    class GetTripById {

        @Test
        @DisplayName("should return trip when driver is assigned")
        void should_returnTrip_whenDriverIsAssigned() throws Exception {
            // Given
            when(tripService.getTripById(tripId)).thenReturn(testTripResponse);

            // When/Then
            mockMvc.perform(get("/location/v1/trips/{id}", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(tripId.toString()))
                .andExpect(jsonPath("$.origin").value("Paris"));
        }

        @Test
        @DisplayName("should return 403 when driver is not assigned to trip")
        void should_return403_whenDriverNotAssigned() throws Exception {
            // Given - Trip is assigned to different driver
            TripResponse otherDriverTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(otherDriverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(otherDriverTrip);

            // When/Then
            mockMvc.perform(get("/location/v1/trips/{id}", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should allow admin to view any trip")
        void should_allowAdmin_toViewAnyTrip() throws Exception {
            // Given - Trip is assigned to a different driver
            TripResponse otherDriverTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(otherDriverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(otherDriverTrip);

            // When/Then - Admin can access any trip
            mockMvc.perform(get("/location/v1/trips/{id}", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, UUID.randomUUID().toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "admin@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "ADMIN"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /location/v1/trips/{id}/start")
    class StartTrip {

        @Test
        @DisplayName("should start trip when driver is assigned")
        void should_startTrip_whenDriverIsAssigned() throws Exception {
            // Given
            TripResponse startedTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.IN_PROGRESS)
                .assignedDriverId(driverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(testTripResponse);
            when(tripService.updateTripStatus(eq(tripId), any(UpdateTripStatusRequest.class), eq(driverId)))
                .thenReturn(startedTrip);

            // When/Then
            mockMvc.perform(post("/location/v1/trips/{id}/start", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

            verify(tripService).updateTripStatus(eq(tripId), any(UpdateTripStatusRequest.class), eq(driverId));
        }

        @Test
        @DisplayName("should return 403 when driver is not assigned")
        void should_return403_whenDriverNotAssigned() throws Exception {
            // Given - Trip is assigned to different driver
            TripResponse otherDriverTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(otherDriverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(otherDriverTrip);

            // When/Then
            mockMvc.perform(post("/location/v1/trips/{id}/start", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isForbidden());

            verify(tripService, never()).updateTripStatus(any(), any(), any());
        }

        @Test
        @DisplayName("should return 401 for unauthenticated request")
        void should_return401_forUnauthenticatedRequest() throws Exception {
            // When/Then
            mockMvc.perform(post("/location/v1/trips/{id}/start", tripId))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /location/v1/trips/{id}/complete")
    class CompleteTrip {

        @Test
        @DisplayName("should complete trip when driver is assigned")
        void should_completeTrip_whenDriverIsAssigned() throws Exception {
            // Given
            TripResponse inProgressTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.IN_PROGRESS)
                .assignedDriverId(driverId)
                .build();

            TripResponse completedTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.COMPLETED)
                .assignedDriverId(driverId)
                .completedAt(Instant.now())
                .build();

            when(tripService.getTripById(tripId)).thenReturn(inProgressTrip);
            when(tripService.updateTripStatus(eq(tripId), any(UpdateTripStatusRequest.class), eq(driverId)))
                .thenReturn(completedTrip);

            // When/Then
            mockMvc.perform(post("/location/v1/trips/{id}/complete", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        }

        @Test
        @DisplayName("should complete trip with notes")
        void should_completeTrip_withNotes() throws Exception {
            // Given
            TripResponse inProgressTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.IN_PROGRESS)
                .assignedDriverId(driverId)
                .build();

            TripResponse completedTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.COMPLETED)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(inProgressTrip);
            when(tripService.updateTripStatus(eq(tripId), any(UpdateTripStatusRequest.class), eq(driverId)))
                .thenReturn(completedTrip);

            // When/Then
            mockMvc.perform(post("/location/v1/trips/{id}/complete", tripId)
                    .param("notes", "Delivery completed successfully")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should return 403 when driver is not assigned")
        void should_return403_whenDriverNotAssigned() throws Exception {
            // Given
            TripResponse otherDriverTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(otherDriverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(otherDriverTrip);

            // When/Then
            mockMvc.perform(post("/location/v1/trips/{id}/complete", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /location/v1/trips/{id}/status")
    class UpdateTripStatus {

        @Test
        @DisplayName("should update trip status when driver is assigned")
        void should_updateStatus_whenDriverIsAssigned() throws Exception {
            // Given
            UpdateTripStatusRequest request = UpdateTripStatusRequest.builder()
                .status(TripStatus.IN_PROGRESS)
                .notes("Starting delivery")
                .build();

            TripResponse updatedTrip = TripResponse.builder()
                .id(tripId)
                .status(TripStatus.IN_PROGRESS)
                .assignedDriverId(driverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(testTripResponse);
            when(tripService.updateTripStatus(eq(tripId), any(UpdateTripStatusRequest.class), eq(driverId)))
                .thenReturn(updatedTrip);

            // When/Then
            mockMvc.perform(post("/location/v1/trips/{id}/status", tripId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request))
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        }
    }

    @Nested
    @DisplayName("GET /location/v1/trips/{id}/history")
    class GetTripHistory {

        @Test
        @DisplayName("should return history when driver is assigned")
        void should_returnHistory_whenDriverIsAssigned() throws Exception {
            // Given
            TripStatusHistoryResponse historyEntry = TripStatusHistoryResponse.builder()
                .id(UUID.randomUUID())
                .tripId(tripId)
                .previousStatus(TripStatus.ASSIGNED)
                .newStatus(TripStatus.IN_PROGRESS)
                .changedAt(Instant.now())
                .build();

            when(tripService.getTripById(tripId)).thenReturn(testTripResponse);
            when(tripService.getTripHistory(tripId)).thenReturn(List.of(historyEntry));

            // When/Then
            mockMvc.perform(get("/location/v1/trips/{id}/history", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].newStatus").value("IN_PROGRESS"));
        }

        @Test
        @DisplayName("should return 403 when driver is not assigned")
        void should_return403_whenDriverNotAssigned() throws Exception {
            // Given
            TripResponse otherDriverTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(otherDriverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(otherDriverTrip);

            // When/Then
            mockMvc.perform(get("/location/v1/trips/{id}/history", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should allow dispatcher to view any trip history")
        void should_allowDispatcher_toViewAnyTripHistory() throws Exception {
            // Given
            TripResponse otherDriverTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(otherDriverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(otherDriverTrip);
            when(tripService.getTripHistory(tripId)).thenReturn(Collections.emptyList());

            // When/Then
            mockMvc.perform(get("/location/v1/trips/{id}/history", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, UUID.randomUUID().toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "dispatcher@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DISPATCHER"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Authorization Tests")
    class AuthorizationTests {

        @Test
        @DisplayName("should return 403 for trip without assigned driver")
        void should_return403_forTripWithoutAssignedDriver() throws Exception {
            // Given - Trip has no assigned driver
            TripResponse unassignedTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(null)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(unassignedTrip);

            // When/Then
            mockMvc.perform(get("/location/v1/trips/{id}", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, driverId.toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "driver@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "DRIVER"))
                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("should allow fleet manager to view any trip")
        void should_allowFleetManager_toViewAnyTrip() throws Exception {
            // Given
            TripResponse otherDriverTrip = TripResponse.builder()
                .id(tripId)
                .assignedDriverId(otherDriverId)
                .build();

            when(tripService.getTripById(tripId)).thenReturn(otherDriverTrip);

            // When/Then
            mockMvc.perform(get("/location/v1/trips/{id}", tripId)
                    .header(GatewayAuthenticationFilter.HEADER_USER_ID, UUID.randomUUID().toString())
                    .header(GatewayAuthenticationFilter.HEADER_USERNAME, "manager@test.com")
                    .header(GatewayAuthenticationFilter.HEADER_USER_ROLE, "FLEET_MANAGER"))
                .andExpect(status().isOk());
        }
    }
}
