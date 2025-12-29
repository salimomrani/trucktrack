-- Feature 016: Add Trip Started notification template
-- Migration V2: Add TRIP_STARTED_EMAIL template for client notification when driver starts delivery

INSERT INTO notification_templates (code, name, channel, subject_template, body_template, locale, variables) VALUES
-- Trip Started - Email FR (for client)
('TRIP_STARTED_EMAIL', 'Livraison en cours', 'EMAIL',
 'Votre livreur est en route - {{orderNumber}}',
 'Bonjour {{recipientName}},

Votre livreur vient de démarrer la livraison et est actuellement en route vers votre destination.

Numéro de commande: {{orderNumber}}
Point de départ: {{origin}}
Destination: {{destination}}
Véhicule: {{vehiclePlate}}
Heure de départ: {{startedAt}}

Vous recevrez une notification lorsque le livreur sera proche de votre adresse.

Cordialement,
TruckTrack',
 'fr',
 '["recipientName", "orderNumber", "origin", "destination", "vehiclePlate", "startedAt"]'),

-- Trip Started - Push FR (for client)
('TRIP_STARTED_PUSH', 'Livraison en cours', 'PUSH',
 NULL,
 'Votre livreur est en route vers {{destination}}',
 'fr',
 '["destination"]')

ON CONFLICT (code, locale) DO NOTHING;
