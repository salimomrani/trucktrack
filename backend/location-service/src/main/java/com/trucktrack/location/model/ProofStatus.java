package com.trucktrack.location.model;

/**
 * Status of a delivery proof.
 * Feature: 015-proof-of-delivery
 */
public enum ProofStatus {
    /**
     * Client signed the delivery confirmation.
     */
    SIGNED("Signé"),

    /**
     * Client refused to sign, reason is required.
     */
    REFUSED("Refusé");

    private final String displayName;

    ProofStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
