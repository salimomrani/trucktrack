/**
 * Map Screen
 * Display driver's current location on map
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabScreenProps } from '@navigation/types';
import { useStatusStore } from '@store/statusStore';
import { Card, StatusBadge } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';

type Props = MainTabScreenProps<'Map'>;

// Default location (will be replaced with actual GPS)
const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const MapScreen: React.FC<Props> = () => {
  const mapRef = useRef<MapView>(null);
  const { currentStatus, isGpsActive } = useStatusStore();
  const [currentPosition, setCurrentPosition] = useState(DEFAULT_REGION);

  const handleCenterOnLocation = () => {
    mapRef.current?.animateToRegion(currentPosition, 500);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
      >
        <Marker
          coordinate={{
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude,
          }}
          title="Your Location"
        >
          <View style={styles.markerContainer}>
            <Icon name="truck" size={24} color={Colors.white} />
          </View>
        </Marker>
      </MapView>

      {/* Top overlay with status */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <Card style={styles.statusCard} variant="elevated">
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Current Status</Text>
              {currentStatus && <StatusBadge status={currentStatus.status} size="medium" />}
            </View>
            <View style={styles.gpsIndicator}>
              <Icon
                name={isGpsActive ? 'satellite-variant' : 'satellite-off'}
                size={20}
                color={isGpsActive ? Colors.success : Colors.textSecondary}
              />
              <Text style={[styles.gpsText, { color: isGpsActive ? Colors.success : Colors.textSecondary }]}>
                {isGpsActive ? 'GPS Active' : 'GPS Off'}
              </Text>
            </View>
          </View>
        </Card>
      </SafeAreaView>

      {/* Center on location button */}
      <TouchableOpacity style={styles.centerButton} onPress={handleCenterOnLocation}>
        <Icon name="crosshairs-gps" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Bottom info panel */}
      <View style={styles.bottomOverlay}>
        <Card style={styles.infoCard} variant="elevated">
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="map-marker" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {currentPosition.latitude.toFixed(4)}, {currentPosition.longitude.toFixed(4)}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Icon name="speedometer" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Speed</Text>
              <Text style={styles.infoValue}>0 km/h</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  statusCard: {
    padding: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsText: {
    fontSize: Typography.fontSize.sm,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium as any,
  },
  centerButton: {
    position: 'absolute',
    right: Spacing.md,
    bottom: 120,
    backgroundColor: Colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  infoCard: {
    padding: Spacing.md,
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
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
});

export default MapScreen;
