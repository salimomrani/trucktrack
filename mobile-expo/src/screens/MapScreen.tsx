import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuthStore } from '../store/authStore';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { status } = useAuthStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

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

  const gpsActive = status === 'AVAILABLE' || status === 'IN_DELIVERY';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Map</Text>
        <View style={[styles.gpsBadge, { backgroundColor: gpsActive ? '#28A74520' : '#6c757d20' }]}>
          <Ionicons name="locate" size={16} color={gpsActive ? '#28A745' : '#6c757d'} />
          <Text style={[styles.gpsText, { color: gpsActive ? '#28A745' : '#6c757d' }]}>
            {gpsActive ? 'GPS Active' : 'GPS Off'}
          </Text>
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
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
            followsUserLocation={gpsActive}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Ma position"
              description={gpsActive ? 'GPS actif' : 'GPS inactif'}
            >
              <View style={[styles.markerContainer, { backgroundColor: gpsActive ? '#28A745' : '#6c757d' }]}>
                <Ionicons name="car" size={20} color="#fff" />
              </View>
            </Marker>
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
      </View>

      {/* Bottom Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="speedometer" size={20} color="#1976D2" />
            <Text style={styles.infoLabel}>Speed</Text>
            <Text style={styles.infoValue}>
              {location?.coords.speed ? `${(location.coords.speed * 3.6).toFixed(0)} km/h` : '0 km/h'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Ionicons name="compass" size={20} color="#1976D2" />
            <Text style={styles.infoLabel}>Heading</Text>
            <Text style={styles.infoValue}>
              {location?.coords.heading ? `${location.coords.heading.toFixed(0)}°` : 'N/A'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Ionicons name="cellular" size={20} color="#1976D2" />
            <Text style={styles.infoLabel}>Accuracy</Text>
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
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gpsText: {
    marginLeft: 4,
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
  markerContainer: {
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
