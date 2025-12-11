package com.trucktrack.location.service;

import com.trucktrack.location.dto.CreateTruckRequestDTO;
import com.trucktrack.location.dto.TruckResponseDTO;
import com.trucktrack.location.model.Truck;
import com.trucktrack.location.model.TruckStatus;
import com.trucktrack.location.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service exemple montrant les best practices :
 * - @Slf4j pour le logging automatique
 * - @RequiredArgsConstructor pour l'injection par constructeur
 * - final pour les dépendances injectées
 * - DTOs avec Records pour les API
 * - @Transactional pour la gestion des transactions
 */
@Slf4j  // ✅ Génère automatiquement le logger
@Service
@RequiredArgsConstructor  // ✅ Génère le constructeur avec les champs final
public class TruckServiceExample {

    // ✅ final + @RequiredArgsConstructor = injection par constructeur
    private final TruckRepository truckRepository;
    private final RedisCacheService redisCacheService;

    /**
     * Créer un nouveau truck
     * Utilise un DTO Record avec validation
     */
    @Transactional
    public TruckResponseDTO createTruck(CreateTruckRequestDTO request) {
        log.info("Creating truck: {}", request.truckId());

        // Vérifier si le truck existe déjà
        if (truckRepository.findByTruckId(request.truckId()).isPresent()) {
            log.warn("Truck already exists: {}", request.truckId());
            throw new IllegalArgumentException("Truck with ID " + request.truckId() + " already exists");
        }

        // Créer l'entité (on pourrait utiliser un mapper)
        Truck truck = Truck.builder()  // ✅ Builder pattern
            .truckId(request.truckId())
            .truckGroupId(request.truckGroupId())
            .licensePlate(request.licensePlate())
            .driverName(request.driverName())
            .driverPhone(request.driverPhone())
            .vehicleType(request.vehicleType())
            .status(TruckStatus.OFFLINE)
            .build();

        Truck saved = truckRepository.save(truck);
        log.info("Truck created successfully: {}", saved.getId());

        // Retourner un DTO au lieu de l'entité
        return TruckResponseDTO.fromEntity(saved);
    }

    /**
     * Récupérer un truck par ID
     * Retourne un DTO au lieu de l'entité
     */
    @Transactional(readOnly = true)
    public TruckResponseDTO getTruckById(UUID truckId) {
        log.debug("Getting truck by ID: {}", truckId);

        Truck truck = truckRepository.findById(truckId)
            .orElseThrow(() -> {
                log.warn("Truck not found: {}", truckId);
                return new IllegalArgumentException("Truck not found: " + truckId);
            });

        return TruckResponseDTO.fromEntity(truck);
    }

    /**
     * Lister les trucks actifs avec pagination
     */
    @Transactional(readOnly = true)
    public Page<TruckResponseDTO> getActiveTrucks(int page, int size) {
        log.debug("Getting active trucks - page: {}, size: {}", page, size);

        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Truck> trucks = truckRepository.findByStatus(TruckStatus.ACTIVE, pageRequest);

        // Convertir Page<Truck> en Page<TruckResponseDTO>
        return trucks.map(TruckResponseDTO::fromEntity);
    }

    /**
     * Mettre à jour le statut d'un truck
     */
    @Transactional
    public TruckResponseDTO updateTruckStatus(UUID truckId, TruckStatus newStatus) {
        log.info("Updating truck {} status to {}", truckId, newStatus);

        Truck truck = truckRepository.findById(truckId)
            .orElseThrow(() -> new IllegalArgumentException("Truck not found: " + truckId));

        TruckStatus oldStatus = truck.getStatus();
        truck.setStatus(newStatus);

        Truck updated = truckRepository.save(truck);

        log.info("Truck {} status changed: {} -> {}", truckId, oldStatus, newStatus);

        // Invalider le cache Redis
        redisCacheService.invalidatePosition(truckId);

        return TruckResponseDTO.fromEntity(updated);
    }

    /**
     * Supprimer un truck (soft delete pourrait être implémenté)
     */
    @Transactional
    public void deleteTruck(UUID truckId) {
        log.info("Deleting truck: {}", truckId);

        if (!truckRepository.existsById(truckId)) {
            log.warn("Truck not found: {}", truckId);
            throw new IllegalArgumentException("Truck not found: " + truckId);
        }

        truckRepository.deleteById(truckId);
        redisCacheService.invalidatePosition(truckId);

        log.info("Truck deleted successfully: {}", truckId);
    }

    /**
     * Compter le nombre de trucks par statut
     */
    @Transactional(readOnly = true)
    public long countByStatus(TruckStatus status) {
        log.debug("Counting trucks with status: {}", status);
        return truckRepository.countByStatus(status);
    }
}
