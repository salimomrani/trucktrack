# GPS Truck Movement Simulator

Simule des mouvements réalistes de trucks en envoyant des événements GPS à Kafka toutes les 2 secondes.

## Prérequis

- Python 3.x
- kafka-python (`pip install kafka-python`)
- requests (`pip install requests`)
- Services en cours d'exécution:
  - Kafka (localhost:9092)
  - API Gateway (localhost:8000)
  - Location Service (localhost:8081)

## Utilisation

### Option 1: Exécution directe
```bash
./simulate-truck-movement.py
```

### Option 2: Via Python
```bash
python3 simulate-truck-movement.py
```

## Fonctionnalités

- Charge automatiquement les trucks depuis l'API
- Simule un mouvement réaliste avec:
  - Vitesse variable (20-60 km/h)
  - Changements de direction aléatoires
  - Maintien des trucks dans la zone de San Francisco
  - Calcul GPS précis avec la formule Haversine
- Envoie les positions GPS à Kafka toutes les 2 secondes
- Affiche les positions en temps réel dans la console

## Configuration

Vous pouvez modifier les paramètres dans le script:

```python
KAFKA_TOPIC = 'truck-track.gps.position'  # Topic Kafka
UPDATE_INTERVAL = 2  # Intervalle entre les mises à jour (secondes)
SPEED_RANGE = (20.0, 60.0)  # Plage de vitesse (km/h)
```

## Arrêter la simulation

Appuyez sur `Ctrl+C` pour arrêter proprement la simulation.

## Exemple de sortie

```
[Iteration 1] 14:30:45
  ✓ TRK001: (37.774520, -122.419180) @ 45.3 km/h heading 125°
  ✓ TRK002: (37.780234, -122.415678) @ 32.1 km/h heading 270°
  ✓ TRK003: (37.772891, -122.421456) @ 58.7 km/h heading 45°
```

## Intégration avec le système

Les événements envoyés à Kafka sont:
1. Consommés par le location-service
2. Stockés dans PostgreSQL
3. Diffusés via WebSocket aux clients
4. Affichés en temps réel sur la map frontend

## Troubleshooting

### "Failed to load trucks"
- Vérifiez que l'API Gateway est accessible sur localhost:8000
- Vérifiez que le location-service fonctionne

### "Failed to send event"
- Vérifiez que Kafka est accessible sur localhost:9092
- Vérifiez que le topic existe (il sera créé automatiquement)

### Les trucks ne bougent pas sur la map
- Vérifiez que le WebSocket fonctionne dans la console du navigateur
- Rafraîchissez la page frontend
