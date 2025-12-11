package com.trucktrack.location.service;

import com.trucktrack.common.event.GPSPositionEvent;
import com.trucktrack.location.model.GPSPosition;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.GPSPositionRepository;
import com.trucktrack.location.repository.TruckRepository;
import com.trucktrack.location.websocket.LocationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service for processing GPS positions and managing truck locations
 * T067: Implement LocationService to save GPS position to PostgreSQL and update truck current position
 * Refactored with Lombok best practices
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LocationService {

    // SRID 4326 = WGS84 (standard GPS coordinate system)
    private static final int WGS84_SRID = 4326;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), WGS84_SRID);

    private final GPSPositionRepository gpsPositionRepository;
    private final TruckRepository truckRepository;
    private final RedisCacheService redisCacheService;
    private final TruckStatusService truckStatusService;
    private final LocationWebSocketHandler webSocketHandler;

    /**
     * Process GPS position event from Kafka
     * 1. Save GPS position to PostgreSQL (partitioned table)
     * 2. Update truck's current position
     * 3. Calculate and update truck status (ACTIVE/IDLE/OFFLINE)
     * 4. Update Redis cache with current position
     */
    @Transactional
    public void processGPSPosition(GPSPositionEvent event) {
        UUID truckId = UUID.fromString(event.getTruckId());

        log.debug("Processing GPS position for truck: {}", truckId);

        // 1. Convert event to GPS position entity
        GPSPosition gpsPosition = convertEventToEntity(event);

        // 2. Save GPS position to PostgreSQL (historical data)
        gpsPositionRepository.save(gpsPosition);
        log.debug("Saved GPS position to database: {}", gpsPosition.getId());

        // 3. Update truck's current position
        updateTruckCurrentPosition(truckId, event);

        // 4. Update Redis cache (for fast reads)
        redisCacheService.cacheCurrentPosition(truckId, event);
        log.debug("Updated Redis cache for truck: {}", truckId);

        // 5. Broadcast position update via WebSocket to connected clients
        webSocketHandler.sendPositionUpdate(event);
        log.debug("Broadcasted WebSocket update for truck: {}", truckId);
    }

    /**
     * Convert GPSPositionEvent to GPSPosition entity
     */
    private GPSPosition convertEventToEntity(GPSPositionEvent event) {
        GPSPosition position = new GPSPosition();
        position.setTruckId(UUID.fromString(event.getTruckId()));
        position.setLatitude(event.getLatitude() != null ? BigDecimal.valueOf(event.getLatitude()) : null);
        position.setLongitude(event.getLongitude() != null ? BigDecimal.valueOf(event.getLongitude()) : null);
        position.setAltitude(event.getAltitude() != null ? BigDecimal.valueOf(event.getAltitude()) : null);
        position.setSpeed(event.getSpeed() != null ? BigDecimal.valueOf(event.getSpeed()) : null);
        position.setHeading(event.getHeading());
        position.setAccuracy(event.getAccuracy() != null ? BigDecimal.valueOf(event.getAccuracy()) : null);
        position.setSatellites(event.getSatellites());
        position.setTimestamp(event.getTimestamp());
        position.setEventId(event.getEventId());

        // Create PostGIS Point geometry
        Point point = geometryFactory.createPoint(new Coordinate(event.getLongitude(), event.getLatitude()));
        position.setLocation(point);

        return position;
    }

    /**
     * Update truck's current position in database
     */
    private void updateTruckCurrentPosition(UUID truckId, GPSPositionEvent event) {
        Truck truck = truckRepository.findById(truckId)
                .orElseThrow(() -> new IllegalArgumentException("Truck not found: " + truckId));

        // Store old status for comparison
        TruckStatus oldStatus = truck.getStatus();

        // Update current position fields
        truck.setCurrentLatitude(event.getLatitude() != null ? BigDecimal.valueOf(event.getLatitude()) : null);
        truck.setCurrentLongitude(event.getLongitude() != null ? BigDecimal.valueOf(event.getLongitude()) : null);
        truck.setCurrentSpeed(event.getSpeed() != null ? BigDecimal.valueOf(event.getSpeed()) : null);
        truck.setCurrentHeading(event.getHeading());
        truck.setLastUpdate(event.getTimestamp());

        // Calculate and update status (ACTIVE/IDLE/OFFLINE)
        TruckStatus newStatus = truckStatusService.calculateStatus(event.getSpeed(), event.getTimestamp());
        truck.setStatus(newStatus);

        truckRepository.save(truck);
        log.debug("Updated truck current position: {} - Status: {}", truckId, truck.getStatus());

        // Notify clients if status changed
        if (oldStatus != newStatus) {
            webSocketHandler.notifyStatusChange(truckId, oldStatus.name(), newStatus.name());
            log.info("Truck {} status changed: {} -> {}", truckId, oldStatus, newStatus);
        }
    }
}
