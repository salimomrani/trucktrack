package com.trucktrack.location.service;

import com.trucktrack.location.dto.AssignTripRequest;
import com.trucktrack.location.dto.CreateTripRequest;
import com.trucktrack.location.dto.TripResponse;
import com.trucktrack.location.dto.UpdateTripStatusRequest;
import com.trucktrack.location.model.Trip;
import com.trucktrack.location.model.TripStatus;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.repository.TripRepository;
import com.trucktrack.location.repository.TripStatusHistoryRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.repository.UserPushTokenRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TripService - trip management operations.
 * Tests CRUD, status transitions, and assignment logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TripService")
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripStatusHistoryRepository historyRepository;

    @Mock
    private TruckRepository truckRepository;

    @Mock
    private UserPushTokenRepository userPushTokenRepository;

    @Mock
    private PushNotificationService pushNotificationService;

    @Mock
    private TripEventPublisher tripEventPublisher;

    @InjectMocks
    private TripService tripService;

    private UUID tripId;
    private UUID truckId;
    private UUID driverId;
    private UUID createdBy;
    private Trip testTrip;
    private Truck testTruck;

    @BeforeEach
    void setUp() {
        tripId = UUID.randomUUID();
        truckId = UUID.randomUUID();
        driverId = UUID.randomUUID();
        createdBy = UUID.randomUUID();

        testTruck = new Truck();
        testTruck.setId(truckId);
        testTruck.setTruckId("TRK-001");

        testTrip = Trip.builder()
            .id(tripId)
            .origin("Paris")
            .originLat(BigDecimal.valueOf(48.8566))
            .originLng(BigDecimal.valueOf(2.3522))
            .destination("Lyon")
            .destinationLat(BigDecimal.valueOf(45.7640))
            .destinationLng(BigDecimal.valueOf(4.8357))
            .status(TripStatus.PENDING)
            .createdBy(createdBy)
            .build();
    }

    @Nested
    @DisplayName("createTrip")
    class CreateTrip {

        @Test
        @DisplayName("should create trip with PENDING status")
        void should_createTrip_withPendingStatus() {
            // Given
            CreateTripRequest request = new CreateTripRequest();
            request.setOrigin("Paris");
            request.setOriginLat(48.8566);
            request.setOriginLng(2.3522);
            request.setDestination("Lyon");
            request.setDestinationLat(45.7640);
            request.setDestinationLng(4.8357);

            when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> {
                Trip t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                return t;
            });

            // When
            TripResponse response = tripService.createTrip(request, createdBy);

            // Then
            assertThat(response).isNotNull();

            ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
            verify(tripRepository).save(tripCaptor.capture());
            assertThat(tripCaptor.getValue().getStatus()).isEqualTo(TripStatus.PENDING);
        }

        @Test
        @DisplayName("should create trip with ASSIGNED status when truck and driver provided")
        void should_createAssignedTrip_when_assignmentProvided() {
            // Given
            CreateTripRequest request = new CreateTripRequest();
            request.setOrigin("Paris");
            request.setDestination("Lyon");
            request.setAssignedTruckId(truckId);
            request.setAssignedDriverId(driverId);

            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(tripRepository.hasTruckActiveTrips(truckId)).thenReturn(false);
            when(tripRepository.hasDriverActiveTrips(driverId)).thenReturn(false);
            when(tripRepository.save(any(Trip.class))).thenAnswer(inv -> {
                Trip t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                return t;
            });

            // When
            TripResponse response = tripService.createTrip(request, createdBy);

            // Then
            ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
            verify(tripRepository).save(tripCaptor.capture());
            assertThat(tripCaptor.getValue().getStatus()).isEqualTo(TripStatus.ASSIGNED);
        }
    }

    @Nested
    @DisplayName("assignTrip")
    class AssignTrip {

        @Test
        @DisplayName("should assign truck and driver to pending trip")
        void should_assignTrip_when_tripIsPending() {
            // Given
            testTrip.setStatus(TripStatus.PENDING);
            AssignTripRequest request = new AssignTripRequest(truckId, driverId);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(tripRepository.hasTruckActiveTrips(truckId)).thenReturn(false);
            when(tripRepository.hasDriverActiveTrips(driverId)).thenReturn(false);
            when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

            // When
            TripResponse response = tripService.assignTrip(tripId, request, createdBy);

            // Then
            ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
            verify(tripRepository).save(tripCaptor.capture());

            Trip savedTrip = tripCaptor.getValue();
            assertThat(savedTrip.getAssignedTruckId()).isEqualTo(truckId);
            assertThat(savedTrip.getAssignedDriverId()).isEqualTo(driverId);
            assertThat(savedTrip.getStatus()).isEqualTo(TripStatus.ASSIGNED);
        }

        @Test
        @DisplayName("should throw exception when assigning non-pending trip")
        void should_throwException_when_tripNotPending() {
            // Given
            testTrip.setStatus(TripStatus.IN_PROGRESS);
            AssignTripRequest request = new AssignTripRequest(truckId, driverId);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            // When & Then
            assertThatThrownBy(() -> tripService.assignTrip(tripId, request, createdBy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PENDING");
        }

        @Test
        @DisplayName("should throw exception when truck has active trip")
        void should_throwException_when_truckBusy() {
            // Given
            testTrip.setStatus(TripStatus.PENDING);
            AssignTripRequest request = new AssignTripRequest(truckId, driverId);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(tripRepository.hasTruckActiveTrips(truckId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> tripService.assignTrip(tripId, request, createdBy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Truck already has an active trip");
        }

        @Test
        @DisplayName("should throw exception when driver has active trip")
        void should_throwException_when_driverBusy() {
            // Given
            testTrip.setStatus(TripStatus.PENDING);
            AssignTripRequest request = new AssignTripRequest(truckId, driverId);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));
            when(tripRepository.hasTruckActiveTrips(truckId)).thenReturn(false);
            when(tripRepository.hasDriverActiveTrips(driverId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> tripService.assignTrip(tripId, request, createdBy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Driver already has an active trip");
        }
    }

    @Nested
    @DisplayName("updateTripStatus - startTrip")
    class StartTrip {

        @Test
        @DisplayName("should transition ASSIGNED to IN_PROGRESS")
        void should_startTrip_when_tripIsAssigned() {
            // Given
            testTrip.setStatus(TripStatus.ASSIGNED);
            testTrip.setAssignedTruckId(truckId);
            testTrip.setAssignedDriverId(driverId);

            UpdateTripStatusRequest request = new UpdateTripStatusRequest();
            request.setStatus(TripStatus.IN_PROGRESS);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));

            // When
            TripResponse response = tripService.updateTripStatus(tripId, request, driverId);

            // Then
            ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
            verify(tripRepository).save(tripCaptor.capture());

            Trip savedTrip = tripCaptor.getValue();
            assertThat(savedTrip.getStatus()).isEqualTo(TripStatus.IN_PROGRESS);
            assertThat(savedTrip.getStartedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("updateTripStatus - completeTrip")
    class CompleteTrip {

        @Test
        @DisplayName("should transition IN_PROGRESS to COMPLETED")
        void should_completeTrip_when_tripInProgress() {
            // Given
            testTrip.setStatus(TripStatus.IN_PROGRESS);
            testTrip.setAssignedTruckId(truckId);
            testTrip.setStartedAt(Instant.now().minusSeconds(3600)); // 1 hour ago

            UpdateTripStatusRequest request = new UpdateTripStatusRequest();
            request.setStatus(TripStatus.COMPLETED);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);
            when(truckRepository.findById(truckId)).thenReturn(Optional.of(testTruck));

            // When
            TripResponse response = tripService.updateTripStatus(tripId, request, driverId);

            // Then
            ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
            verify(tripRepository).save(tripCaptor.capture());

            Trip savedTrip = tripCaptor.getValue();
            assertThat(savedTrip.getStatus()).isEqualTo(TripStatus.COMPLETED);
            assertThat(savedTrip.getCompletedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("cancelTrip")
    class CancelTrip {

        @Test
        @DisplayName("should cancel PENDING trip")
        void should_cancelTrip_when_tripPending() {
            // Given
            testTrip.setStatus(TripStatus.PENDING);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

            // When
            TripResponse response = tripService.cancelTrip(tripId, "Test cancellation", createdBy);

            // Then
            ArgumentCaptor<Trip> tripCaptor = ArgumentCaptor.forClass(Trip.class);
            verify(tripRepository).save(tripCaptor.capture());
            assertThat(tripCaptor.getValue().getStatus()).isEqualTo(TripStatus.CANCELLED);
        }

        @Test
        @DisplayName("should cancel ASSIGNED trip")
        void should_cancelTrip_when_tripAssigned() {
            // Given
            testTrip.setStatus(TripStatus.ASSIGNED);
            testTrip.setAssignedDriverId(driverId);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));
            when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

            // When
            TripResponse response = tripService.cancelTrip(tripId, "Cancelled by dispatcher", createdBy);

            // Then
            verify(tripRepository).save(any(Trip.class));
        }

        @Test
        @DisplayName("should throw exception when cancelling COMPLETED trip")
        void should_throwException_when_cancellingCompletedTrip() {
            // Given
            testTrip.setStatus(TripStatus.COMPLETED);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            // When & Then
            assertThatThrownBy(() -> tripService.cancelTrip(tripId, "Too late", createdBy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel");
        }
    }

    @Nested
    @DisplayName("getTripById")
    class GetTripById {

        @Test
        @DisplayName("should return trip when found")
        void should_returnTrip_when_found() {
            // Given
            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            // When
            TripResponse response = tripService.getTripById(tripId);

            // Then
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("should throw exception when trip not found")
        void should_throwException_when_tripNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(tripRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> tripService.getTripById(unknownId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Trip not found");
        }
    }

    @Nested
    @DisplayName("Status Transition Validation")
    class StatusTransitions {

        @Test
        @DisplayName("should not allow PENDING to COMPLETED directly")
        void should_notAllow_pendingToCompleted() {
            // Given
            testTrip.setStatus(TripStatus.PENDING);
            UpdateTripStatusRequest request = new UpdateTripStatusRequest();
            request.setStatus(TripStatus.COMPLETED);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            // When & Then
            assertThatThrownBy(() -> tripService.updateTripStatus(tripId, request, createdBy))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot transition");
        }

        @Test
        @DisplayName("should not allow IN_PROGRESS to ASSIGNED")
        void should_notAllow_inProgressToAssigned() {
            // Given
            testTrip.setStatus(TripStatus.IN_PROGRESS);
            UpdateTripStatusRequest request = new UpdateTripStatusRequest();
            request.setStatus(TripStatus.ASSIGNED);

            when(tripRepository.findById(tripId)).thenReturn(Optional.of(testTrip));

            // When & Then
            assertThatThrownBy(() -> tripService.updateTripStatus(tripId, request, createdBy))
                .isInstanceOf(IllegalStateException.class);
        }
    }
}
