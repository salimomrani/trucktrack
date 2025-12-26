package com.trucktrack.location.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * T100: System configuration entity
 * Feature: 002-admin-panel (US4 - Config)
 */
@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@Table(name = "system_config")
public class SystemConfig {

    // Getters and setters
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "config_key", unique = true, nullable = false, length = 100)
    private String key;

    @Column(name = "config_value", nullable = false, length = 500)
    private String value;

    @Column(name = "description", length = 500)
    private String description;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", nullable = false)
    private UUID updatedBy;

    @PrePersist
    protected void onCreate() {
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

}
