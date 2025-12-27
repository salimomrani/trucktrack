package com.trucktrack.location.service;

import com.trucktrack.common.exception.ResourceNotFoundException;
import com.trucktrack.common.exception.ValidationException;
import com.trucktrack.location.dto.GeofenceDTO;
import com.trucktrack.location.model.Geofence;
import com.trucktrack.location.model.GeofenceZoneType;
import com.trucktrack.location.repository.GeofenceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GeofenceService - geofence CRUD and spatial queries.
 * Tests geofence creation, validation, and point-in-polygon checks.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GeofenceService")
class GeofenceServiceTest {

    @Mock
    private GeofenceRepository geofenceRepository;

    @InjectMocks
    private GeofenceService geofenceService;

    private UUID userId;
    private UUID geofenceId;
    private Geofence testGeofence;

    // Valid closed polygon coordinates (Paris area)
    private List<List<Double>> validCoordinates;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        geofenceId = UUID.randomUUID();

        // Create valid polygon (must be closed - first point = last point)
        validCoordinates = Arrays.asList(
            Arrays.asList(2.3, 48.8),   // Point 1
            Arrays.asList(2.4, 48.8),   // Point 2
            Arrays.asList(2.4, 48.9),   // Point 3
            Arrays.asList(2.3, 48.9),   // Point 4
            Arrays.asList(2.3, 48.8)    // Closing point (same as Point 1)
        );

        testGeofence = createTestGeofence();
    }

    private Geofence createTestGeofence() {
        Geofence geofence = new Geofence();
        geofence.setId(geofenceId);
        geofence.setName("Test Zone");
        geofence.setDescription("Test geofence description");
        geofence.setZoneType(GeofenceZoneType.DELIVERY_AREA);
        geofence.setIsActive(true);
        geofence.setCreatedBy(userId);

        // Create polygon geometry
        GeometryFactory factory = new GeometryFactory();
        Coordinate[] coords = new Coordinate[] {
            new Coordinate(2.3, 48.8),
            new Coordinate(2.4, 48.8),
            new Coordinate(2.4, 48.9),
            new Coordinate(2.3, 48.9),
            new Coordinate(2.3, 48.8)
        };
        LinearRing ring = factory.createLinearRing(coords);
        Polygon polygon = factory.createPolygon(ring);
        geofence.setBoundary(polygon);

        return geofence;
    }

    @Nested
    @DisplayName("createGeofence")
    class CreateGeofence {

        @Test
        @DisplayName("should create geofence with valid coordinates")
        void should_createGeofence_when_coordinatesValid() {
            // Given
            GeofenceDTO dto = new GeofenceDTO();
            dto.setName("New Zone");
            dto.setDescription("New geofence");
            dto.setZoneType(GeofenceZoneType.DELIVERY_AREA);
            dto.setCoordinates(validCoordinates);

            when(geofenceRepository.save(any(Geofence.class))).thenAnswer(inv -> {
                Geofence g = inv.getArgument(0);
                g.setId(UUID.randomUUID());
                return g;
            });

            // When
            GeofenceDTO result = geofenceService.createGeofence(dto, userId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("New Zone");

            verify(geofenceRepository).save(any(Geofence.class));
        }

        @Test
        @DisplayName("should throw exception when polygon has less than 4 points")
        void should_throwException_when_insufficientPoints() {
            // Given - only 3 points (not enough for a valid polygon)
            GeofenceDTO dto = new GeofenceDTO();
            dto.setName("Invalid Zone");
            dto.setCoordinates(Arrays.asList(
                Arrays.asList(2.3, 48.8),
                Arrays.asList(2.4, 48.8),
                Arrays.asList(2.3, 48.8)
            ));

            // When & Then
            assertThatThrownBy(() -> geofenceService.createGeofence(dto, userId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("at least 4 points");
        }

        @Test
        @DisplayName("should throw exception when polygon is not closed")
        void should_throwException_when_polygonNotClosed() {
            // Given - first point != last point
            GeofenceDTO dto = new GeofenceDTO();
            dto.setName("Unclosed Zone");
            dto.setCoordinates(Arrays.asList(
                Arrays.asList(2.3, 48.8),
                Arrays.asList(2.4, 48.8),
                Arrays.asList(2.4, 48.9),
                Arrays.asList(2.3, 48.9)  // Not closed!
            ));

            // When & Then
            assertThatThrownBy(() -> geofenceService.createGeofence(dto, userId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("closed");
        }

        @Test
        @DisplayName("should throw exception when latitude out of range")
        void should_throwException_when_latitudeOutOfRange() {
            // Given - latitude > 90
            GeofenceDTO dto = new GeofenceDTO();
            dto.setName("Invalid Zone");
            dto.setCoordinates(Arrays.asList(
                Arrays.asList(2.3, 91.0),  // Invalid latitude
                Arrays.asList(2.4, 48.8),
                Arrays.asList(2.4, 48.9),
                Arrays.asList(2.3, 91.0)
            ));

            // When & Then
            assertThatThrownBy(() -> geofenceService.createGeofence(dto, userId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Latitude");
        }

        @Test
        @DisplayName("should throw exception when longitude out of range")
        void should_throwException_when_longitudeOutOfRange() {
            // Given - longitude > 180
            GeofenceDTO dto = new GeofenceDTO();
            dto.setName("Invalid Zone");
            dto.setCoordinates(Arrays.asList(
                Arrays.asList(181.0, 48.8),  // Invalid longitude
                Arrays.asList(2.4, 48.8),
                Arrays.asList(2.4, 48.9),
                Arrays.asList(181.0, 48.8)
            ));

            // When & Then
            assertThatThrownBy(() -> geofenceService.createGeofence(dto, userId))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Longitude");
        }
    }

    @Nested
    @DisplayName("getGeofence")
    class GetGeofence {

        @Test
        @DisplayName("should return geofence when found")
        void should_returnGeofence_when_found() {
            // Given
            when(geofenceRepository.findById(geofenceId)).thenReturn(Optional.of(testGeofence));

            // When
            GeofenceDTO result = geofenceService.getGeofence(geofenceId);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(geofenceId);
            assertThat(result.getName()).isEqualTo("Test Zone");
        }

        @Test
        @DisplayName("should throw exception when geofence not found")
        void should_throwException_when_notFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(geofenceRepository.findById(unknownId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> geofenceService.getGeofence(unknownId))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("updateGeofence")
    class UpdateGeofence {

        @Test
        @DisplayName("should update geofence name")
        void should_updateName_when_provided() {
            // Given
            when(geofenceRepository.findById(geofenceId)).thenReturn(Optional.of(testGeofence));
            when(geofenceRepository.save(any(Geofence.class))).thenReturn(testGeofence);

            GeofenceDTO dto = new GeofenceDTO();
            dto.setName("Updated Zone");

            // When
            geofenceService.updateGeofence(geofenceId, dto, userId);

            // Then
            ArgumentCaptor<Geofence> captor = ArgumentCaptor.forClass(Geofence.class);
            verify(geofenceRepository).save(captor.capture());
            assertThat(captor.getValue().getName()).isEqualTo("Updated Zone");
        }

        @Test
        @DisplayName("should throw exception when updating non-existent geofence")
        void should_throwException_when_geofenceNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(geofenceRepository.findById(unknownId)).thenReturn(Optional.empty());

            GeofenceDTO dto = new GeofenceDTO();
            dto.setName("Updated");

            // When & Then
            assertThatThrownBy(() -> geofenceService.updateGeofence(unknownId, dto, userId))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteGeofence")
    class DeleteGeofence {

        @Test
        @DisplayName("should delete existing geofence")
        void should_deleteGeofence_when_exists() {
            // Given
            when(geofenceRepository.existsById(geofenceId)).thenReturn(true);

            // When
            geofenceService.deleteGeofence(geofenceId, userId);

            // Then
            verify(geofenceRepository).deleteById(geofenceId);
        }

        @Test
        @DisplayName("should throw exception when deleting non-existent geofence")
        void should_throwException_when_geofenceNotFound() {
            // Given
            UUID unknownId = UUID.randomUUID();
            when(geofenceRepository.existsById(unknownId)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> geofenceService.deleteGeofence(unknownId, userId))
                .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("isPointInsideGeofence")
    class IsPointInsideGeofence {

        @Test
        @DisplayName("should return true when point is inside geofence")
        void should_returnTrue_when_pointInside() {
            // Given - point inside the polygon
            double lat = 48.85;
            double lon = 2.35;
            when(geofenceRepository.isPointInsideGeofence(geofenceId, lat, lon)).thenReturn(true);

            // When
            boolean result = geofenceService.isPointInsideGeofence(geofenceId, lat, lon);

            // Then
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("should return false when point is outside geofence")
        void should_returnFalse_when_pointOutside() {
            // Given - point outside the polygon
            double lat = 49.0;
            double lon = 3.0;
            when(geofenceRepository.isPointInsideGeofence(geofenceId, lat, lon)).thenReturn(false);

            // When
            boolean result = geofenceService.isPointInsideGeofence(geofenceId, lat, lon);

            // Then
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("getAllActiveGeofences")
    class GetAllActiveGeofences {

        @Test
        @DisplayName("should return only active geofences")
        void should_returnActiveGeofences() {
            // Given
            when(geofenceRepository.findByIsActiveTrue()).thenReturn(List.of(testGeofence));

            // When
            List<GeofenceDTO> result = geofenceService.getAllActiveGeofences();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getIsActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("getGeofencesByType")
    class GetGeofencesByType {

        @Test
        @DisplayName("should filter geofences by zone type")
        void should_filterByZoneType() {
            // Given
            when(geofenceRepository.findByZoneTypeAndIsActiveTrue(GeofenceZoneType.DELIVERY_AREA))
                .thenReturn(List.of(testGeofence));

            // When
            List<GeofenceDTO> result = geofenceService.getGeofencesByType(GeofenceZoneType.DELIVERY_AREA);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getZoneType()).isEqualTo(GeofenceZoneType.DELIVERY_AREA);
        }
    }

    @Nested
    @DisplayName("findGeofencesContainingPoint")
    class FindGeofencesContainingPoint {

        @Test
        @DisplayName("should find all geofences containing a point")
        void should_findContainingGeofences() {
            // Given
            double lat = 48.85;
            double lon = 2.35;
            when(geofenceRepository.findGeofencesContainingPoint(lat, lon))
                .thenReturn(List.of(testGeofence));

            // When
            List<GeofenceDTO> result = geofenceService.findGeofencesContainingPoint(lat, lon);

            // Then
            assertThat(result).hasSize(1);
            verify(geofenceRepository).findGeofencesContainingPoint(lat, lon);
        }
    }

    @Nested
    @DisplayName("searchGeofences")
    class SearchGeofences {

        @Test
        @DisplayName("should search geofences by name")
        void should_searchByName() {
            // Given
            PageRequest pageable = PageRequest.of(0, 10);
            when(geofenceRepository.findByNameContainingIgnoreCase("Test", pageable))
                .thenReturn(new PageImpl<>(List.of(testGeofence)));

            // When
            Page<GeofenceDTO> result = geofenceService.searchGeofences("Test", pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).contains("Test");
        }
    }
}
