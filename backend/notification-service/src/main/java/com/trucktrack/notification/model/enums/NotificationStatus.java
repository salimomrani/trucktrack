package com.trucktrack.notification.model.enums;

public enum NotificationStatus {
    PENDING,    // En attente d'envoi
    SENT,       // Envoyé au provider
    DELIVERED,  // Livré au destinataire
    READ,       // Lu (email open)
    FAILED,     // Échec d'envoi
    BOUNCED     // Email bounced
}
