# Feature Specification: Internationalisation Frontend (i18n) FR/EN

**Feature Branch**: `021-frontend-i18n`
**Created**: 2026-01-06
**Status**: Draft
**Input**: Internationalisation (i18n) FR/EN - Ajouter le support multilingue à l'application TruckTrack. Permettre aux utilisateurs de basculer entre français et anglais. Traduire l'interface admin (sidebar, pages, formulaires, messages) et persister la préférence de langue.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Changer la Langue de l'Interface (Priority: P1)

En tant qu'utilisateur de TruckTrack, je veux pouvoir changer la langue de l'interface entre français et anglais afin de travailler dans ma langue préférée.

**Why this priority**: C'est la fonctionnalité principale - sans la possibilité de changer de langue, l'internationalisation n'a pas de valeur.

**Independent Test**: L'utilisateur peut cliquer sur un sélecteur de langue dans le header et voir immédiatement toute l'interface basculer dans la nouvelle langue.

**Acceptance Scenarios**:

1. **Given** l'interface est en français, **When** l'utilisateur sélectionne "English" dans le sélecteur de langue, **Then** tous les textes de l'interface s'affichent en anglais sans rechargement de page
2. **Given** l'interface est en anglais, **When** l'utilisateur sélectionne "Français" dans le sélecteur de langue, **Then** tous les textes de l'interface s'affichent en français sans rechargement de page
3. **Given** l'utilisateur change de langue, **When** il navigue vers une autre page, **Then** la nouvelle langue reste active

---

### User Story 2 - Persistance de la Préférence de Langue (Priority: P2)

En tant qu'utilisateur, je veux que ma préférence de langue soit mémorisée afin de ne pas avoir à la re-sélectionner à chaque connexion.

**Why this priority**: Améliore significativement l'expérience utilisateur en évitant une action répétitive.

**Independent Test**: L'utilisateur change la langue, ferme le navigateur, revient sur l'application et retrouve la langue qu'il avait choisie.

**Acceptance Scenarios**:

1. **Given** l'utilisateur a sélectionné l'anglais comme langue, **When** il ferme et rouvre l'application, **Then** l'interface s'affiche en anglais
2. **Given** l'utilisateur n'a jamais choisi de langue, **When** il accède à l'application pour la première fois, **Then** la langue par défaut est le français
3. **Given** l'utilisateur change sa langue sur un appareil, **When** il se connecte sur un autre navigateur, **Then** la langue par défaut (français) s'affiche jusqu'à ce qu'il change

---

### User Story 3 - Traduction des Pages Administration (Priority: P3)

En tant qu'administrateur, je veux que toutes les pages d'administration (utilisateurs, camions, trajets, configuration) soient traduites afin de gérer ma flotte dans ma langue.

**Why this priority**: Étend la couverture de la traduction à l'ensemble de l'interface admin après la mise en place du mécanisme de base.

**Independent Test**: Naviguer dans toutes les sections admin et vérifier que tous les textes (titres, boutons, labels, messages) sont traduits.

**Acceptance Scenarios**:

1. **Given** l'interface est en anglais, **When** l'utilisateur accède à la page "Trip Management", **Then** tous les éléments (titre, filtres, colonnes, boutons) sont en anglais
2. **Given** l'interface est en français, **When** l'utilisateur remplit un formulaire, **Then** tous les labels, placeholders et messages de validation sont en français
3. **Given** une erreur se produit, **When** le message d'erreur s'affiche, **Then** il est dans la langue sélectionnée par l'utilisateur

---

### User Story 4 - Traduction des Messages et Notifications (Priority: P4)

En tant qu'utilisateur, je veux que les messages de succès, d'erreur et les notifications soient traduits afin de comprendre les retours du système.

**Why this priority**: Complète l'expérience utilisateur en traduisant les éléments dynamiques.

**Independent Test**: Effectuer des actions (créer un trajet, supprimer un utilisateur) et vérifier que les messages de confirmation/erreur sont dans la bonne langue.

**Acceptance Scenarios**:

1. **Given** l'interface est en anglais, **When** l'utilisateur crée un trajet avec succès, **Then** le message de confirmation "Trip created successfully" s'affiche
2. **Given** l'interface est en français, **When** une erreur de validation se produit, **Then** le message d'erreur s'affiche en français

---

### Edge Cases

- Que se passe-t-il si une clé de traduction est manquante ? → Afficher la clé technique comme fallback
- Que se passe-t-il si le navigateur est en langue non supportée ? → Utiliser le français par défaut
- Comment gérer les dates et nombres ? → Utiliser le format de la langue sélectionnée (ex: 01/06/2026 en FR vs 06/01/2026 en EN)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre de basculer entre français et anglais sans rechargement de page
- **FR-002**: Le système DOIT afficher un sélecteur de langue visible dans le header de l'application
- **FR-003**: Le système DOIT persister la préférence de langue dans le stockage local du navigateur
- **FR-004**: Le système DOIT appliquer la langue sélectionnée à tous les textes statiques de l'interface
- **FR-005**: Le système DOIT traduire les messages d'erreur et de succès
- **FR-006**: Le système DOIT utiliser le français comme langue par défaut
- **FR-007**: Le système DOIT formater les dates selon la locale sélectionnée
- **FR-008**: Le système DOIT afficher la clé de traduction si une traduction est manquante (mode développement) ou un texte de fallback (production)

### Scope

**Inclus dans cette feature**:
- Interface web (frontend Angular)
- Toutes les pages admin (sidebar, dashboard, users, trucks, trips, config, alerts)
- Messages système (toasts, notifications, erreurs de validation)
- Sélecteur de langue dans le header

**Exclus de cette feature**:
- Application mobile (sera une feature séparée)
- Traduction du contenu dynamique stocké en base de données
- Backend API (les messages d'erreur API restent en anglais)
- Emails de notification (gérés par le notification-service)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des textes statiques de l'interface admin sont traduits en FR et EN
- **SC-002**: Le changement de langue s'effectue en moins de 500ms sans rechargement de page
- **SC-003**: La préférence de langue est conservée après fermeture/réouverture du navigateur dans 100% des cas
- **SC-004**: Aucune clé de traduction manquante visible en production (fallback approprié)
- **SC-005**: Les dates et nombres suivent le format de la locale sélectionnée

## Assumptions

- La langue par défaut est le français (marché principal)
- Seules 2 langues sont supportées initialement (FR, EN)
- La préférence de langue est stockée localement (pas synchronisée avec le compte utilisateur)
- Les contenus dynamiques (noms de camions, descriptions de trajets) ne sont pas traduits
- Le format de date français est JJ/MM/AAAA et anglais est MM/DD/YYYY

## Dependencies

- Dépend du header existant pour placer le sélecteur de langue
- Nécessite l'extraction de tous les textes hardcodés actuels

## Out of Scope

- Support de langues supplémentaires (DE, ES, etc.)
- Traduction automatique par IA
- Détection automatique de la langue du navigateur (prévu pour une future itération)
