-- Feature 016: Email & Push Notifications
-- Migration V3: Add tables for notification logs, preferences, push tokens, templates, and email recipients

-- Notification Logs (history of all sent notifications)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL,
    recipient_id UUID,
    recipient_email VARCHAR(255),
    recipient_type VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    content_preview VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_id ON notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type_date ON notification_logs(notification_type, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_email ON notification_logs(recipient_email);

-- User Notification Preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Push Tokens (FCM/APNs tokens per device)
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    device_type VARCHAR(10) NOT NULL,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    channel VARCHAR(10) NOT NULL,
    subject_template VARCHAR(255),
    body_template TEXT NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'fr',
    is_active BOOLEAN DEFAULT TRUE,
    variables JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(code, locale)
);

-- Email Recipients (clients without user accounts)
CREATE TABLE IF NOT EXISTS email_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    is_valid BOOLEAN DEFAULT TRUE,
    bounce_count INT DEFAULT 0,
    last_bounce_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_recipients_email ON email_recipients(email);

-- Seed default templates
INSERT INTO notification_templates (code, name, channel, subject_template, body_template, locale, variables) VALUES
-- Delivery Confirmed - Email FR
('DELIVERY_CONFIRMED_EMAIL', 'Confirmation de livraison', 'EMAIL',
 'Votre livraison a été effectuée - {{orderNumber}}',
 'Bonjour {{recipientName}},\n\nVotre livraison {{orderNumber}} a été effectuée le {{deliveryDate}}.\n\nSignataire: {{signerName}}\n\nCordialement,\nTruckTrack',
 'fr',
 '["recipientName", "orderNumber", "deliveryDate", "signerName", "signatureUrl", "photoUrls"]'),

-- Delivery Confirmed - Push FR
('DELIVERY_CONFIRMED_PUSH', 'Confirmation de livraison', 'PUSH',
 NULL,
 'Votre livraison {{orderNumber}} a été effectuée. Signature reçue.',
 'fr',
 '["orderNumber"]'),

-- Trip Assigned - Push FR (for driver)
('TRIP_ASSIGNED_PUSH', 'Nouveau trip assigné', 'PUSH',
 NULL,
 'Nouveau trip assigné: {{destination}}. Départ prévu: {{departureTime}}',
 'fr',
 '["destination", "departureTime"]'),

-- Trip Assigned - Email FR (for client)
('TRIP_ASSIGNED_EMAIL', 'Chauffeur assigné', 'EMAIL',
 'Un chauffeur a été assigné à votre livraison',
 'Bonjour {{recipientName}},\n\nUn chauffeur a été assigné à votre livraison.\n\nVéhicule: {{vehiclePlate}}\nDate prévue: {{estimatedDate}}\nDestination: {{destination}}\n\nCordialement,\nTruckTrack',
 'fr',
 '["recipientName", "vehiclePlate", "estimatedDate", "destination"]'),

-- Trip Cancelled - Push FR
('TRIP_CANCELLED_PUSH', 'Trip annulé', 'PUSH',
 NULL,
 'Trip annulé: {{destination}}. Raison: {{reason}}',
 'fr',
 '["destination", "reason"]'),

-- Trip Reassigned - Push FR
('TRIP_REASSIGNED_PUSH', 'Trip réassigné', 'PUSH',
 NULL,
 'Le trip {{destination}} a été réassigné à un autre chauffeur.',
 'fr',
 '["destination"]'),

-- ETA 30min - Push FR
('ETA_30MIN_PUSH', 'ETA 30 minutes', 'PUSH',
 NULL,
 'Votre livraison arrive dans environ 30 minutes',
 'fr',
 '[]'),

-- ETA 10min - Push FR
('ETA_10MIN_PUSH', 'ETA 10 minutes', 'PUSH',
 NULL,
 'Votre livreur arrive dans quelques minutes',
 'fr',
 '[]'),

-- Daily Report - Email FR
('DAILY_REPORT_EMAIL', 'Rapport quotidien', 'EMAIL',
 'Rapport quotidien TruckTrack - {{reportDate}}',
 'Bonjour {{recipientName}},\n\nVoici votre rapport quotidien:\n\nTrips complétés hier: {{completedYesterday}}\nTrips en cours: {{inProgress}}\nTrips en retard: {{delayed}}\n\nConsultez le dashboard pour plus de détails.\n\nCordialement,\nTruckTrack',
 'fr',
 '["recipientName", "reportDate", "completedYesterday", "inProgress", "delayed"]')

ON CONFLICT (code, locale) DO NOTHING;
