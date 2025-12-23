package com.trucktrack.location.repository;

import com.trucktrack.location.model.ConfigHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * T103: Configuration history repository
 * Feature: 002-admin-panel (US4 - Config)
 */
@Repository
public interface ConfigHistoryRepository extends JpaRepository<ConfigHistory, Long> {

    List<ConfigHistory> findByConfigKeyOrderByChangedAtDesc(String configKey);

    Page<ConfigHistory> findByConfigKeyOrderByChangedAtDesc(String configKey, Pageable pageable);

    List<ConfigHistory> findTop10ByOrderByChangedAtDesc();
}
