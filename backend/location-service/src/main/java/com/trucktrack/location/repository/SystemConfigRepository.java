package com.trucktrack.location.repository;

import com.trucktrack.location.model.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * T102: System configuration repository
 * Feature: 002-admin-panel (US4 - Config)
 */
@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    Optional<SystemConfig> findByKey(String key);

    List<SystemConfig> findByCategory(String category);

    List<SystemConfig> findAllByOrderByCategoryAscKeyAsc();

    boolean existsByKey(String key);
}
