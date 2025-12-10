package com.trucktrack.gps.controller;

import com.trucktrack.gps.dto.GPSPositionDTO;
import com.trucktrack.gps.service.GPSValidationService;
import com.trucktrack.gps.service.KafkaProducerService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for GPS position ingestion
 * T063: Implement GPSIngestionController POST /gps/v1/positions
 */
@RestController
@RequestMapping("/gps/v1")
@Validated
public class GPSIngestionController {

    private static final Logger logger = LoggerFactory.getLogger(GPSIngestionController.class);

    private final KafkaProducerService kafkaProducerService;
    private final GPSValidationService validationService;

    public GPSIngestionController(KafkaProducerService kafkaProducerService,
                                  GPSValidationService validationService) {
        this.kafkaProducerService = kafkaProducerService;
        this.validationService = validationService;
    }

    /**
     * Ingest a single GPS position
     * POST /gps/v1/positions
     */
    @PostMapping("/positions")
    public ResponseEntity<Map<String, Object>> ingestPosition(
            @Valid @RequestBody GPSPositionDTO positionDTO) {

        logger.info("Received GPS position for truck: {}", positionDTO.getTruckId());

        // Additional validation beyond annotations
        validationService.validate(positionDTO);

        // Generate event ID
        String eventId = "evt_" + UUID.randomUUID().toString().substring(0, 8);

        // Publish to Kafka
        kafkaProducerService.publishGPSPosition(positionDTO, eventId);

        // Return accepted response
        Map<String, Object> response = new HashMap<>();
        response.put("status", "accepted");
        response.put("eventId", eventId);
        response.put("timestamp", Instant.now());

        logger.debug("GPS position accepted with eventId: {}", eventId);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Bulk ingest GPS positions (for batch processing)
     * POST /gps/v1/positions/bulk
     */
    @PostMapping("/positions/bulk")
    public ResponseEntity<Map<String, Object>> ingestPositionsBulk(
            @Valid @RequestBody List<GPSPositionDTO> positions) {

        logger.info("Received bulk GPS positions: {} items", positions.size());

        int accepted = 0;
        int rejected = 0;

        for (GPSPositionDTO position : positions) {
            try {
                validationService.validate(position);
                String eventId = "evt_" + UUID.randomUUID().toString().substring(0, 8);
                kafkaProducerService.publishGPSPosition(position, eventId);
                accepted++;
            } catch (Exception e) {
                logger.warn("Failed to process GPS position for truck {}: {}",
                        position.getTruckId(), e.getMessage());
                rejected++;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accepted", accepted);
        response.put("rejected", rejected);
        response.put("timestamp", Instant.now());

        logger.info("Bulk ingestion complete: {} accepted, {} rejected", accepted, rejected);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Health check endpoint
     * GET /gps/v1/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "gps-ingestion-service");
        health.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(health);
    }
}
