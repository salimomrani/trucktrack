import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, LatLng } from 'react-native-maps';
import { useAuthStore } from '../store/authStore';
import { TripService, Trip } from '../services/api';

// Decode polyline from OSRM (uses Google's polyline encoding)
function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

// Fetch route from OSRM (Open Source Routing Machine - free routing API)
async function fetchRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<LatLng[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=polyline`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const geometry = data.routes[0].geometry;
      return decodePolyline(geometry);
    }
    return [];
  } catch (error) {
    console.log('Error fetching route:', error);
    return [];
  }
}

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { status } = useAuthStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Fetch active trip
  const fetchActiveTrip = useCallback(async () => {
    try {
      const trips = await TripService.getMyActiveTrips();
      console.log('Active trips:', JSON.stringify(trips, null, 2));
      // Get the IN_PROGRESS trip, or the first ASSIGNED one
      const inProgress = trips.find(t => t.status === 'IN_PROGRESS');
      const assigned = trips.find(t => t.status === 'ASSIGNED');
      const trip = inProgress || assigned || null;
      console.log('Selected trip:', trip?.id, 'coords:', trip?.originLat, trip?.originLng);
      setActiveTrip(trip);
    } catch (error) {
      console.log('Error fetching trips:', error);
      setActiveTrip(null);
    }
  }, []);

  // Request location permission and get initial location
  useEffect(() => {
    (async () => {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      await fetchActiveTrip();
      setLoading(false);
    })();
  }, [fetchActiveTrip]);

  // Update location every 5 seconds when GPS is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'AVAILABLE' || status === 'IN_DELIVERY') {
      interval = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Refresh trip data periodically
  useEffect(() => {
    const interval = setInterval(fetchActiveTrip, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchActiveTrip]);

  // Fetch route when active trip changes
  useEffect(() => {
    const loadRoute = async () => {
      if (activeTrip?.originLat && activeTrip?.originLng &&
          activeTrip?.destinationLat && activeTrip?.destinationLng) {
        console.log('Fetching route for trip:', activeTrip.id);
        const route = await fetchRoute(
          { lat: activeTrip.originLat, lng: activeTrip.originLng },
          { lat: activeTrip.destinationLat, lng: activeTrip.destinationLng }
        );
        console.log('Route fetched with', route.length, 'points');
        setRouteCoordinates(route);
      } else {
        setRouteCoordinates([]);
      }
    };
    loadRoute();
  }, [activeTrip?.id, activeTrip?.originLat, activeTrip?.originLng, activeTrip?.destinationLat, activeTrip?.destinationLng]);

  // Fit map to show all markers and route
  const fitMapToMarkers = useCallback(() => {
    if (!mapRef.current) return;

    // Use route coordinates if available, otherwise use origin/destination
    let coordinates: LatLng[] = [];

    if (routeCoordinates.length > 0) {
      coordinates = [...routeCoordinates];
    } else if (activeTrip) {
      if (activeTrip.originLat && activeTrip.originLng) {
        coordinates.push({
          latitude: activeTrip.originLat,
          longitude: activeTrip.originLng,
        });
      }
      if (activeTrip.destinationLat && activeTrip.destinationLng) {
        coordinates.push({
          latitude: activeTrip.destinationLat,
          longitude: activeTrip.destinationLng,
        });
      }
    }

    // Add current location
    if (location) {
      coordinates.push({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }

    if (coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    }
  }, [activeTrip, location, routeCoordinates]);

  const gpsActive = status === 'AVAILABLE' || status === 'IN_DELIVERY';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Map</Text>
        <View style={styles.headerRight}>
          {activeTrip && (
            <View style={[styles.tripBadge, { backgroundColor: activeTrip.status === 'IN_PROGRESS' ? '#1976D220' : '#FFC10720' }]}>
              <Ionicons
                name={activeTrip.status === 'IN_PROGRESS' ? 'car' : 'time-outline'}
                size={14}
                color={activeTrip.status === 'IN_PROGRESS' ? '#1976D2' : '#FFC107'}
              />
              <Text style={[styles.tripBadgeText, { color: activeTrip.status === 'IN_PROGRESS' ? '#1976D2' : '#FFC107' }]}>
                {activeTrip.status === 'IN_PROGRESS' ? 'En cours' : 'Assigné'}
              </Text>
            </View>
          )}
          <View style={[styles.gpsBadge, { backgroundColor: gpsActive ? '#28A74520' : '#6c757d20' }]}>
            <Ionicons name="locate" size={16} color={gpsActive ? '#28A745' : '#6c757d'} />
          </View>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            onMapReady={fitMapToMarkers}
          >
            {/* Current position marker (truck icon) */}
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Ma position"
              description={gpsActive ? 'GPS actif' : 'GPS inactif'}
            >
              <View style={[styles.truckMarker, { backgroundColor: gpsActive ? '#1976D2' : '#6c757d' }]}>
                <Ionicons name="car" size={14} color="#fff" />
              </View>
            </Marker>

            {/* Origin marker (green) */}
            {activeTrip?.originLat && activeTrip?.originLng && (
              <Marker
                coordinate={{
                  latitude: activeTrip.originLat,
                  longitude: activeTrip.originLng,
                }}
                title="Origine"
                description={activeTrip.origin}
              >
                <View style={styles.originMarker}>
                  <Ionicons name="flag" size={18} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Destination marker (red) */}
            {activeTrip?.destinationLat && activeTrip?.destinationLng && (
              <Marker
                coordinate={{
                  latitude: activeTrip.destinationLat,
                  longitude: activeTrip.destinationLng,
                }}
                title="Destination"
                description={activeTrip.destination}
              >
                <View style={styles.destinationMarker}>
                  <Ionicons name="location" size={18} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Route polyline - real road route from OSRM */}
            {routeCoordinates.length >= 2 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#1976D2"
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loadingContainer}>
            {errorMsg ? (
              <Text style={styles.error}>{errorMsg}</Text>
            ) : (
              <>
                <Ionicons name="locate" size={48} color="#1976D2" />
                <Text style={styles.loadingText}>Localisation en cours...</Text>
              </>
            )}
          </View>
        )}

        {/* Fit to route button */}
        {activeTrip && location && (
          <TouchableOpacity style={styles.fitButton} onPress={fitMapToMarkers}>
            <Ionicons name="expand" size={24} color="#1976D2" />
          </TouchableOpacity>
        )}

        {/* Center on me button */}
        {location && (
          <TouchableOpacity
            style={styles.centerButton}
            onPress={() => {
              mapRef.current?.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }, 500);
            }}
          >
            <Ionicons name="locate" size={24} color="#1976D2" />
          </TouchableOpacity>
        )}
      </View>

      {/* Trip Info Card */}
      {activeTrip ? (
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <View style={[styles.statusDot, { backgroundColor: activeTrip.status === 'IN_PROGRESS' ? '#1976D2' : '#FFC107' }]} />
            <Text style={styles.tripTitle}>
              {activeTrip.status === 'IN_PROGRESS' ? 'Trajet en cours' : 'Trajet assigné'}
            </Text>
          </View>

          <View style={styles.tripRoute}>
            <View style={styles.routePoint}>
              <View style={styles.originDot} />
              <Text style={styles.routeText} numberOfLines={1}>{activeTrip.origin}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={styles.destDot} />
              <Text style={styles.routeText} numberOfLines={1}>{activeTrip.destination}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noTripCard}>
          <Ionicons name="car-outline" size={32} color="#9E9E9E" />
          <Text style={styles.noTripText}>Aucun trajet actif</Text>
        </View>
      )}

      {/* Bottom Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="speedometer" size={20} color="#1976D2" />
            <Text style={styles.infoLabel}>Vitesse</Text>
            <Text style={styles.infoValue}>
              {location?.coords.speed ? `${(location.coords.speed * 3.6).toFixed(0)} km/h` : '0 km/h'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Ionicons name="compass" size={20} color="#1976D2" />
            <Text style={styles.infoLabel}>Cap</Text>
            <Text style={styles.infoValue}>
              {location?.coords.heading ? `${location.coords.heading.toFixed(0)}°` : 'N/A'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Ionicons name="cellular" size={20} color="#1976D2" />
            <Text style={styles.infoLabel}>Précision</Text>
            <Text style={styles.infoValue}>
              {location?.coords.accuracy ? `${location.coords.accuracy.toFixed(0)}m` : 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsBadge: {
    padding: 6,
    borderRadius: 12,
  },
  tripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tripBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  truckMarker: {
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  originMarker: {
    backgroundColor: '#28A745',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  destinationMarker: {
    backgroundColor: '#DC3545',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  error: {
    color: '#DC3545',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  fitButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  centerButton: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tripCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tripRoute: {
    paddingLeft: 4,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28A745',
    marginRight: 10,
  },
  destDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC3545',
    marginRight: 10,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 5,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  noTripCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noTripText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
});
