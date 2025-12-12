#!/usr/bin/env python3
"""
GPS Truck Movement Simulator
Simulates GPS position updates for multiple trucks to test the tracking system
"""

import requests
import time
import json
from datetime import datetime, timezone
import random
import math

# Configuration
GPS_INGESTION_URL = "http://localhost:8080/gps/v1/positions"
LOCATION_SERVICE_URL = "http://localhost:8081/location/v1/trucks"

# Truck IDs (must exist in database) - Real UUIDs from database
TRUCK_IDS = [
    "00000000-0000-0000-0000-000000000010",  # TRK-001 - Michael Johnson
    "00000000-0000-0000-0000-000000000011",  # TRK-002 - Sarah Williams
    "00000000-0000-0000-0000-000000000013"   # TRK-004 - Jennifer Davis
]

# Starting positions (Paris area)
START_POSITIONS = [
    {"lat": 48.8566, "lon": 2.3522, "name": "Paris Center"},
    {"lat": 48.8738, "lon": 2.2950, "name": "La Défense"},
    {"lat": 48.8456, "lon": 2.3708, "name": "Bercy"}
]

class TruckSimulator:
    def __init__(self, truck_id, start_pos):
        self.truck_id = truck_id
        self.latitude = start_pos["lat"]
        self.longitude = start_pos["lon"]
        self.heading = random.randint(0, 359)
        self.speed = 0
        self.name = start_pos["name"]

    def update_position(self):
        """Simulate truck movement"""
        # Random speed variation (0-80 km/h)
        self.speed = max(0, min(80, self.speed + random.uniform(-10, 15)))

        # Update heading occasionally
        if random.random() < 0.3:
            self.heading = (self.heading + random.randint(-30, 30)) % 360

        # Move based on speed and heading
        # Convert speed from km/h to degrees per second (rough approximation)
        speed_deg_per_sec = self.speed / 111000  # 111km ≈ 1 degree latitude

        # Calculate movement
        rad_heading = math.radians(self.heading)
        self.latitude += speed_deg_per_sec * math.cos(rad_heading) * 1
        self.longitude += speed_deg_per_sec * math.sin(rad_heading) * 1

    def get_gps_position(self):
        """Generate GPS position payload"""
        return {
            "truckId": self.truck_id,
            "latitude": round(self.latitude, 6),
            "longitude": round(self.longitude, 6),
            "altitude": round(random.uniform(50, 150), 1),
            "speed": round(self.speed, 1),
            "heading": self.heading,
            "accuracy": round(random.uniform(3, 15), 1),
            "satellites": random.randint(8, 12),
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        }

def send_gps_position(gps_data):
    """Send GPS position to ingestion service"""
    try:
        response = requests.post(
            GPS_INGESTION_URL,
            json=gps_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )

        if response.status_code == 202:
            result = response.json()
            return True, result.get("eventId")
        else:
            return False, f"HTTP {response.status_code}: {response.text}"

    except requests.exceptions.RequestException as e:
        return False, str(e)

def check_truck_status(truck_id):
    """Check truck status from location service"""
    try:
        response = requests.get(
            f"{LOCATION_SERVICE_URL}/{truck_id}/current-position",
            timeout=5
        )

        if response.status_code == 200:
            return response.json()
        else:
            return None

    except requests.exceptions.RequestException:
        return None

def print_separator():
    print("=" * 80)

def main():
    print_separator()
    print("🚛 GPS TRUCK MOVEMENT SIMULATOR")
    print_separator()
    print(f"📍 GPS Ingestion Service: {GPS_INGESTION_URL}")
    print(f"📊 Location Service: {LOCATION_SERVICE_URL}")
    print(f"🚚 Simulating {len(TRUCK_IDS)} trucks")
    print_separator()

    # Initialize simulators
    simulators = []
    for truck_id, start_pos in zip(TRUCK_IDS, START_POSITIONS):
        sim = TruckSimulator(truck_id, start_pos)
        simulators.append(sim)
        print(f"✓ Initialized truck {truck_id[:8]}... at {start_pos['name']}")

    print_separator()
    print("Starting simulation... (Press Ctrl+C to stop)")
    print_separator()

    iteration = 0
    successful_sends = 0
    failed_sends = 0

    try:
        while True:
            iteration += 1
            print(f"\n📡 Iteration {iteration} - {datetime.now().strftime('%H:%M:%S')}")
            print("-" * 80)

            for sim in simulators:
                # Update position
                sim.update_position()

                # Generate GPS data
                gps_data = sim.get_gps_position()

                # Send to service
                success, result = send_gps_position(gps_data)

                if success:
                    successful_sends += 1
                    status_icon = "🟢" if sim.speed > 5 else "🟡" if sim.speed > 0 else "⚫"
                    print(f"{status_icon} Truck {sim.truck_id[:8]}... | "
                          f"Pos: ({gps_data['latitude']:.4f}, {gps_data['longitude']:.4f}) | "
                          f"Speed: {gps_data['speed']:.1f} km/h | "
                          f"Heading: {gps_data['heading']}° | "
                          f"EventID: {result}")
                else:
                    failed_sends += 1
                    print(f"❌ Truck {sim.truck_id[:8]}... | Error: {result}")

            # Summary
            print("-" * 80)
            print(f"📊 Stats: ✓ {successful_sends} successful | ❌ {failed_sends} failed")

            # Wait before next iteration
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n")
        print_separator()
        print("🛑 Simulation stopped by user")
        print_separator()
        print(f"📊 Final Stats:")
        print(f"   Total iterations: {iteration}")
        print(f"   Successful sends: {successful_sends}")
        print(f"   Failed sends: {failed_sends}")
        print(f"   Success rate: {(successful_sends/(successful_sends+failed_sends)*100):.1f}%")
        print_separator()

        # Check final truck statuses
        print("\n🔍 Checking truck statuses...")
        print("-" * 80)
        for truck_id in TRUCK_IDS:
            status = check_truck_status(truck_id)
            if status:
                print(f"Truck {truck_id[:8]}... | Status: {status.get('status', 'UNKNOWN')}")
            else:
                print(f"Truck {truck_id[:8]}... | Could not fetch status")
        print_separator()

if __name__ == "__main__":
    main()
