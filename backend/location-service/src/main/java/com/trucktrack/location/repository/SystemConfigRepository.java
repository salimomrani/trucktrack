package com.trucktrack.location.repository;

import com.trucktrack.location.model.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * T102: System configuration repository
 * Feature: 002-admin-panel (US4 - Config)
 */
@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, UUID> {

    Optional<SystemConfig> findByKey(String key);

    List<SystemConfig> findAllByOrderByKeyAsc();

    boolean existsByKey(String key);
}
