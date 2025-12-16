package com.trucktrack.notification.repository;

import com.trucktrack.notification.model.AlertRule;
import com.trucktrack.notification.model.AlertRuleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for AlertRule entity
 * T142: Create AlertRuleRepository
 */
@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, UUID> {

    /**
     * Find all enabled alert rules
     */
    List<AlertRule> findByIsEnabledTrue();

    /**
     * Find alert rules by type
     */
    List<AlertRule> findByRuleType(AlertRuleType ruleType);

    /**
     * Find enabled alert rules by type
     */
    List<AlertRule> findByRuleTypeAndIsEnabledTrue(AlertRuleType ruleType);

    /**
     * Find alert rules created by a user
     */
    List<AlertRule> findByCreatedByOrderByCreatedAtDesc(UUID userId);

    /**
     * Find alert rules for a truck group
     */
    List<AlertRule> findByTruckGroupIdAndIsEnabledTrue(UUID truckGroupId);

    /**
     * Find alert rules for a geofence
     */
    List<AlertRule> findByGeofenceIdAndIsEnabledTrue(UUID geofenceId);

    /**
     * Find enabled offline alert rules
     */
    @Query("SELECT a FROM AlertRule a WHERE a.ruleType = 'OFFLINE' AND a.isEnabled = true")
    List<AlertRule> findEnabledOfflineRules();

    /**
     * Find enabled speed limit rules with threshold
     */
    @Query("SELECT a FROM AlertRule a WHERE a.ruleType = 'SPEED_LIMIT' AND a.isEnabled = true AND a.thresholdValue IS NOT NULL")
    List<AlertRule> findEnabledSpeedLimitRules();

    /**
     * Check if user has any alert rules
     */
    boolean existsByCreatedBy(UUID userId);

    /**
     * Find enabled geofence enter rules
     */
    @Query("SELECT a FROM AlertRule a WHERE a.ruleType = 'GEOFENCE_ENTER' AND a.isEnabled = true AND a.geofenceId IS NOT NULL")
    List<AlertRule> findEnabledGeofenceEnterRules();

    /**
     * Find enabled geofence exit rules
     */
    @Query("SELECT a FROM AlertRule a WHERE a.ruleType = 'GEOFENCE_EXIT' AND a.isEnabled = true AND a.geofenceId IS NOT NULL")
    List<AlertRule> findEnabledGeofenceExitRules();

    /**
     * Find enabled geofence rules (both enter and exit)
     */
    @Query("SELECT a FROM AlertRule a WHERE (a.ruleType = 'GEOFENCE_ENTER' OR a.ruleType = 'GEOFENCE_EXIT') AND a.isEnabled = true AND a.geofenceId IS NOT NULL")
    List<AlertRule> findEnabledGeofenceRules();
}
