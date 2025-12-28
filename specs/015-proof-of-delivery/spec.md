# Feature Specification: Proof of Delivery (POD) - Signature Électronique

**Feature Branch**: `015-proof-of-delivery`
**Created**: 2025-12-28
**Status**: Draft
**Input**: Système de signature électronique pour les chauffeurs lors de l'arrivée à destination. Le client signe sur le téléphone du chauffeur pour confirmer la réception de la livraison.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture de Signature à la Livraison (Priority: P1)

En tant que chauffeur, lorsque j'arrive chez le client et que je livre le colis, je veux faire signer le client sur mon téléphone pour avoir une preuve de livraison.

**Why this priority**: C'est la fonctionnalité core du POD. Sans signature, il n'y a pas de preuve de livraison. C'est le MVP minimum viable.

**Independent Test**: Le chauffeur peut capturer une signature sur son écran, l'associer au trip en cours, et la sauvegarder. Le gestionnaire peut ensuite voir que la livraison a été confirmée.

**Acceptance Scenarios**:

1. **Given** un chauffeur avec un trip IN_PROGRESS, **When** il arrive à destination et appuie sur "Confirmer livraison", **Then** un écran de signature s'affiche permettant au client de signer avec son doigt
2. **Given** le client qui signe sur l'écran, **When** la signature est validée et soumise, **Then** le système enregistre la signature avec l'horodatage GPS et marque le trip comme COMPLETED
3. **Given** une signature en cours de capture, **When** l'utilisateur appuie sur "Effacer", **Then** le canvas de signature est réinitialisé pour recommencer
4. **Given** une zone sans connexion internet, **When** le chauffeur capture la signature, **Then** la preuve est stockée localement et synchronisée quand la connexion revient

---

### User Story 2 - Photo Optionnelle du Colis Livré (Priority: P2)

En tant que chauffeur, je veux pouvoir prendre une photo du colis livré (ou de l'emplacement de livraison) pour avoir une preuve visuelle supplémentaire en cas de litige.

**Why this priority**: La photo renforce la preuve mais n'est pas obligatoire. C'est un ajout de valeur après le core.

**Independent Test**: Le chauffeur peut prendre une photo avant ou après la signature, et cette photo est associée à la preuve de livraison.

**Acceptance Scenarios**:

1. **Given** l'écran de confirmation de livraison, **When** le chauffeur appuie sur "Ajouter photo", **Then** l'appareil photo s'ouvre pour capturer une image
2. **Given** une photo prise, **When** le chauffeur valide, **Then** la photo est attachée à la preuve de livraison avec les métadonnées GPS
3. **Given** plusieurs photos prises, **When** le chauffeur les visualise, **Then** il peut supprimer celles qui ne conviennent pas avant validation finale

---

### User Story 3 - Consultation Historique des Preuves (Priority: P3)

En tant que gestionnaire de flotte, je veux consulter l'historique des preuves de livraison pour vérifier les livraisons effectuées et gérer les litiges éventuels.

**Why this priority**: L'exploitation des données POD est essentielle pour le métier mais vient après la capture.

**Independent Test**: Le gestionnaire peut rechercher et afficher les preuves de livraison associées aux trips complétés.

**Acceptance Scenarios**:

1. **Given** un trip complété avec POD, **When** le gestionnaire ouvre les détails du trip, **Then** il voit la signature, les photos (si présentes), l'heure et la position GPS de la livraison
2. **Given** la liste des trips, **When** le gestionnaire filtre par "Avec POD", **Then** seuls les trips ayant une preuve de livraison sont affichés
3. **Given** une preuve de livraison, **When** le gestionnaire clique sur "Télécharger", **Then** il obtient un PDF récapitulatif avec signature, photos et métadonnées

---

### User Story 4 - Nom du Signataire (Priority: P4)

En tant que chauffeur, je veux pouvoir saisir le nom de la personne qui signe pour identifier clairement le réceptionnaire.

**Why this priority**: Information utile mais optionnelle - la signature seule est légalement suffisante dans la plupart des cas.

**Independent Test**: Le chauffeur peut saisir le nom du signataire, et ce nom apparaît dans la preuve de livraison.

**Acceptance Scenarios**:

1. **Given** l'écran de signature, **When** le chauffeur saisit le nom "Jean Dupont", **Then** ce nom est enregistré avec la signature
2. **Given** un champ nom vide, **When** le chauffeur valide sans nom, **Then** la livraison est quand même acceptée (champ optionnel)

---

### Edge Cases

- **Signature trop petite ou illisible**: Le système doit valider que la signature couvre une surface minimale du canvas avant d'accepter
- **Refus de signer par le client**: Le chauffeur peut marquer "Client refuse de signer" avec un motif, ce qui complète quand même le trip mais avec un statut spécial
- **Perte de connexion pendant la capture**: Les données sont stockées localement et synchronisées automatiquement au retour de la connexion
- **Batterie faible pendant la signature**: Le système doit sauvegarder en continu pour éviter la perte de données
- **Plusieurs tentatives de livraison**: Chaque tentative peut avoir sa propre preuve (échec avec motif ou succès avec signature)

## Clarifications

### Session 2025-12-28

- Q: Durée de conservation des preuves de livraison? → A: 7 ans (standard légal pour preuves commerciales)
- Q: Limites de taille pour signature et photos? → A: Signature max 100KB, Photos max 500KB après compression
- Q: Protection contre la falsification des preuves? → A: Hash SHA-256 de chaque preuve + timestamp serveur
- Q: Durée maximum de stockage hors-ligne? → A: 7 jours maximum avant synchronisation obligatoire
- Q: Surface minimum de signature pour validation? → A: 15% du canvas minimum (anti-fraude)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L'application mobile DOIT fournir un canvas de signature tactile permettant au client de signer avec son doigt
- **FR-002**: Le système DOIT capturer les coordonnées GPS au moment de la signature
- **FR-003**: Le système DOIT horodater chaque preuve de livraison avec l'heure du serveur (UTC)
- **FR-004**: Le système DOIT permettre d'annuler et recommencer la signature avant validation finale
- **FR-005**: Le système DOIT stocker les signatures de manière sécurisée et non-modifiable
- **FR-006**: Le système DOIT associer chaque preuve de livraison au trip correspondant
- **FR-007**: Le système DOIT fonctionner hors-ligne avec synchronisation différée (maximum 7 jours)
- **FR-008**: Le système DOIT permettre l'ajout optionnel de photos (1 à 3 maximum)
- **FR-009**: Le système DOIT compresser les images (signature max 100KB, photos max 500KB)
- **FR-010**: Le panel admin DOIT afficher les preuves de livraison dans les détails du trip
- **FR-011**: Le système DOIT permettre l'export PDF d'une preuve de livraison
- **FR-012**: Le système DOIT valider que la signature couvre au moins 15% du canvas
- **FR-013**: Le système DOIT permettre au chauffeur de marquer un refus de signature avec motif
- **FR-014**: Le système DOIT générer un hash SHA-256 pour chaque preuve afin de garantir l'intégrité
- **FR-015**: Le système DOIT conserver les preuves de livraison pendant 7 ans minimum

### Key Entities

- **DeliveryProof**: Preuve de livraison contenant:
  - Signature (image PNG, max 100KB)
  - Photos optionnelles (1-3, max 500KB chacune)
  - Coordonnées GPS (latitude, longitude, précision)
  - Horodatage serveur UTC
  - Nom du signataire (optionnel)
  - Statut: SIGNED, REFUSED
  - Hash SHA-256 (intégrité)
  - Référence au trip
  - Date de synchronisation (pour offline)
- **ProofPhoto**: Photo associée à une preuve, avec métadonnées GPS, horodatage, et ordre d'affichage
- **Trip**: Extension du trip existant pour inclure la référence à la preuve de livraison et indicateur POD (has_proof)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le chauffeur peut capturer une signature et compléter une livraison en moins de 30 secondes
- **SC-002**: 100% des trips complétés ont une preuve de livraison (signature ou refus documenté)
- **SC-003**: Les preuves hors-ligne sont synchronisées dans les 5 minutes suivant le retour de la connexion
- **SC-004**: Les gestionnaires peuvent accéder à n'importe quelle preuve de livraison en moins de 3 clics depuis la liste des trips
- **SC-005**: Le système supporte au moins 1000 nouvelles preuves de livraison par jour sans dégradation
- **SC-006**: 95% des utilisateurs réussissent à capturer une signature dès la première tentative

## Assumptions

- Les chauffeurs utilisent déjà l'application mobile TruckTrack (feature 010-trip-management)
- Le système de trips existant est opérationnel avec les statuts PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
- Les appareils mobiles disposent d'un écran tactile suffisamment grand pour la signature (minimum 4.5 pouces)
- Le stockage des images sera géré par le backend existant (location-service)
- La compression des images sera effectuée côté mobile avant upload

## Out of Scope

- Signature biométrique avancée (reconnaissance de signature)
- Notification automatique au destinataire final (peut être ajouté ultérieurement)
- Intégration avec des systèmes de signature légale certifiée (eIDAS, etc.)
- Génération automatique de facture après livraison
