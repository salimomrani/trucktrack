#!/usr/bin/env python3
"""
GPS Truck Movement Simulator
Simulates realistic truck movement by sending GPS position events to Kafka
"""

import json
import random
import time
import uuid
from datetime import datetime, timezone
from kafka import KafkaProducer
import requests
import math

# Configuration
KAFKA_BOOTSTRAP_SERVERS = ['localhost:9092']
KAFKA_TOPIC = 'truck-track.gps.position'
API_URL = 'http://localhost:8000/public/location/v1/trucks'
UPDATE_INTERVAL = 2  # seconds between updates

# Movement parameters
SPEED_RANGE = (20.0, 60.0)  # km/h (city traffic speed)
MOVEMENT_DISTANCE_PER_UPDATE = 0.0003  # ~30 meters per update (realistic for 2-second intervals)


class TruckSimulator:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8')
        )
        self.trucks = []

    def load_trucks(self):
        """Load existing trucks from API"""
        try:
            response = requests.get(f"{API_URL}?size=100")
            response.raise_for_status()
            data = response.json()
            self.trucks = data.get('content', [])
            print(f"✓ Loaded {len(self.trucks)} trucks from API")
            return True
        except Exception as e:
            print(f"✗ Failed to load trucks: {e}")
            return False

    def calculate_new_position(self, lat, lng, heading, distance):
        """
        Calculate new position given current position, heading, and distance
        Using Haversine formula for accurate GPS calculations
        """
        # Earth radius in km
        R = 6371.0

        # Convert to radians
        lat_rad = math.radians(lat)
        lng_rad = math.radians(lng)
        heading_rad = math.radians(heading)

        # Calculate new position
        new_lat_rad = math.asin(
            math.sin(lat_rad) * math.cos(distance / R) +
            math.cos(lat_rad) * math.sin(distance / R) * math.cos(heading_rad)
        )

        new_lng_rad = lng_rad + math.atan2(
            math.sin(heading_rad) * math.sin(distance / R) * math.cos(lat_rad),
            math.cos(distance / R) - math.sin(lat_rad) * math.sin(new_lat_rad)
        )

        # Convert back to degrees
        new_lat = math.degrees(new_lat_rad)
        new_lng = math.degrees(new_lng_rad)

        return new_lat, new_lng

    def simulate_movement(self, truck):
        """Simulate realistic truck movement"""
        # Get current position or initialize
        lat = truck.get('currentLatitude')
        lng = truck.get('currentLongitude')
        speed = truck.get('currentSpeed', random.uniform(*SPEED_RANGE))
        heading = truck.get('currentHeading', random.randint(0, 359))

        if lat is None or lng is None:
            # Default to San Francisco if no position
            lat = 37.7749 + random.uniform(-0.05, 0.05)
            lng = -122.4194 + random.uniform(-0.05, 0.05)

        # Randomly adjust heading slightly (simulate turns)
        if random.random() < 0.1:  # 10% chance to turn
            heading = (heading + random.randint(-30, 30)) % 360

        # Randomly adjust speed slightly
        speed = max(5.0, min(80.0, speed + random.uniform(-5, 5)))

        # Calculate new position based on heading and speed
        # Distance = speed * time, adjusted for realistic city driving
        distance_km = (speed / 3600) * UPDATE_INTERVAL * random.uniform(0.7, 1.0)
        new_lat, new_lng = self.calculate_new_position(lat, lng, heading, distance_km)

        # Keep trucks roughly in San Francisco area (37.7-37.85, -122.5--122.35)
        if new_lat < 37.7 or new_lat > 37.85:
            heading = (heading + 180) % 360  # Turn around
            new_lat = lat
        if new_lng < -122.5 or new_lng > -122.35:
            heading = (heading + 180) % 360  # Turn around
            new_lng = lng

        return {
            'latitude': round(new_lat, 6),
            'longitude': round(new_lng, 6),
            'speed': round(speed, 1),
            'heading': int(heading) % 360,
            'altitude': round(random.uniform(10, 50), 1),  # meters
            'accuracy': round(random.uniform(5, 15), 1),  # meters
            'satellites': random.randint(8, 15)
        }

    def create_gps_event(self, truck, position_data):
        """Create GPS position event in the format expected by Kafka"""
        now = datetime.now(timezone.utc)
        event_id = str(uuid.uuid4())

        event = {
            'eventId': event_id,
            'truckId': truck['id'],
            'truckIdReadable': truck.get('truckId', truck['id']),
            'latitude': position_data['latitude'],
            'longitude': position_data['longitude'],
            'altitude': position_data['altitude'],
            'speed': position_data['speed'],
            'heading': position_data['heading'],
            'accuracy': position_data['accuracy'],
            'satellites': position_data['satellites'],
            'timestamp': now.isoformat().replace('+00:00', 'Z'),
            'ingestedAt': now.isoformat().replace('+00:00', 'Z')
        }

        return event

    def send_event(self, truck, event):
        """Send GPS event to Kafka"""
        try:
            # Use truck ID as partition key (same as production)
            key = truck['id']

            future = self.producer.send(KAFKA_TOPIC, key=key, value=event)
            future.get(timeout=5)  # Wait for confirmation

            return True
        except Exception as e:
            print(f"✗ Failed to send event for truck {truck.get('truckId', truck['id'])}: {e}")
            return False

    def run_simulation(self):
        """Main simulation loop"""
        if not self.load_trucks():
            print("Cannot start simulation without trucks")
            return

        if len(self.trucks) == 0:
            print("No trucks found to simulate")
            return

        print(f"\n{'='*60}")
        print(f"🚛 Starting GPS simulation for {len(self.trucks)} trucks")
        print(f"📡 Kafka topic: {KAFKA_TOPIC}")
        print(f"⏱️  Update interval: {UPDATE_INTERVAL} seconds")
        print(f"{'='*60}\n")

        iteration = 0
        try:
            while True:
                iteration += 1
                print(f"\n[Iteration {iteration}] {datetime.now().strftime('%H:%M:%S')}")

                for truck in self.trucks:
                    # Simulate movement
                    position_data = self.simulate_movement(truck)

                    # Update truck's current position for next iteration
                    truck['currentLatitude'] = position_data['latitude']
                    truck['currentLongitude'] = position_data['longitude']
                    truck['currentSpeed'] = position_data['speed']
                    truck['currentHeading'] = position_data['heading']

                    # Create and send event
                    event = self.create_gps_event(truck, position_data)

                    if self.send_event(truck, event):
                        print(f"  ✓ {truck.get('truckId', truck['id'][:8])}: "
                              f"({position_data['latitude']:.6f}, {position_data['longitude']:.6f}) "
                              f"@ {position_data['speed']:.1f} km/h heading {position_data['heading']}°")

                    # Small delay between trucks to avoid overwhelming Kafka
                    time.sleep(0.1)

                # Wait before next update cycle
                time.sleep(UPDATE_INTERVAL)

        except KeyboardInterrupt:
            print(f"\n\n{'='*60}")
            print("🛑 Simulation stopped by user")
            print(f"{'='*60}\n")
        finally:
            self.producer.close()


def main():
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║         GPS Truck Movement Simulator                      ║
    ║         Press Ctrl+C to stop                              ║
    ╚═══════════════════════════════════════════════════════════╝
    """)

    simulator = TruckSimulator()
    simulator.run_simulation()


if __name__ == '__main__':
    main()
