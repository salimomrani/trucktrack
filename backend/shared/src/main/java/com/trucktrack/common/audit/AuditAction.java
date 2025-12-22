package com.trucktrack.common.audit;

/**
 * Enum representing administrative actions for audit logging.
 * Maps to PostgreSQL audit_action ENUM type.
 */
public enum AuditAction {

    /** Entity created */
    CREATE,

    /** Entity updated */
    UPDATE,

    /** Entity deleted */
    DELETE,

    /** Account or entity deactivated */
    DEACTIVATE,

    /** Account or entity reactivated */
    REACTIVATE,

    /** Entity assigned to a group */
    ASSIGN,

    /** Entity removed from a group */
    UNASSIGN;

    /**
     * Returns the action for a create operation.
     */
    public static AuditAction forCreate() {
        return CREATE;
    }

    /**
     * Returns the action for an update operation.
     */
    public static AuditAction forUpdate() {
        return UPDATE;
    }

    /**
     * Returns the action for a delete operation.
     */
    public static AuditAction forDelete() {
        return DELETE;
    }
}
