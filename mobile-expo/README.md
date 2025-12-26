# TruckTrack Mobile - Expo App

Application mobile pour les chauffeurs de la flotte TruckTrack.

## Fonctionnalités

- **Carte Live** : Position GPS en temps réel avec mise à jour automatique
- **Affichage des trajets** : Itinéraires routiers réels via OSRM
- **Gestion des trajets** : Liste des trajets assignés, démarrage/fin
- **Statut chauffeur** : AVAILABLE, IN_DELIVERY, ON_BREAK, OFF_DUTY
- **Notifications push** : Alertes pour nouvelles assignations

## Quick Start

```bash
# Installation
npm install

# Démarrer le serveur de développement
npx expo start

# Scanner le QR code avec Expo Go (Android/iOS)
```

## Configuration

Modifier l'URL du backend dans `src/services/api.ts` :

```typescript
const API_CONFIG = {
  BASE_URL: 'http://VOTRE_IP:8000',  // IP de votre machine
  // ...
};
```

Pour trouver votre IP :
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I
```

## Structure

```
src/
├── screens/
│   ├── MapScreen.tsx       # Carte avec GPS et routes OSRM
│   ├── TripsScreen.tsx     # Liste des trajets
│   ├── TripDetailScreen.tsx # Détail d'un trajet
│   ├── HomeScreen.tsx      # Dashboard chauffeur
│   └── LoginScreen.tsx     # Authentification
├── services/
│   ├── api.ts              # Client API (auth, trips, GPS)
│   └── notifications.ts    # Push notifications Expo
└── store/
    └── authStore.ts        # État global (Zustand)
```

## Fonctionnalités Carte

### Marqueurs
- **Bleu (voiture)** : Position actuelle du camion
- **Vert (drapeau)** : Origine du trajet
- **Rouge (pin)** : Destination du trajet

### Route
- Itinéraire routier réel via **OSRM** (Open Source Routing Machine)
- Polyline bleue suivant les vraies routes
- Mise à jour automatique quand le trajet change

### Boutons
- **Expand** : Ajuster la vue pour voir tout le trajet
- **Locate** : Centrer sur la position actuelle

## Comptes de test

| Email | Password | Rôle |
|-------|----------|------|
| driver@trucktrack.com | AdminPass123! | Chauffeur |
| admin@trucktrack.com | AdminPass123! | Admin |

## Dépendances principales

- **expo** : Framework mobile cross-platform
- **react-native-maps** : Composant carte
- **expo-location** : GPS en arrière-plan
- **expo-notifications** : Push notifications
- **zustand** : State management
- **expo-secure-store** : Stockage sécurisé des tokens

## Troubleshooting

| Problème | Solution |
|----------|----------|
| "Network request failed" | Vérifier IP dans api.ts et que le backend tourne |
| GPS ne marche pas | Vérifier les permissions dans les paramètres |
| Route ne s'affiche pas | Vérifier que le trajet a des coordonnées (originLat/Lng) |
| Cache Metro stale | `rm -rf .expo/cache && npx expo start --clear` |
