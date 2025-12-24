import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useGPSTracking } from '../hooks/useGPSTracking';

type DriverStatus = 'AVAILABLE' | 'IN_DELIVERY' | 'ON_BREAK' | 'OFF_DUTY';

const statusConfig: Record<DriverStatus, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  AVAILABLE: { label: 'Disponible', color: '#28A745', icon: 'checkmark-circle' },
  IN_DELIVERY: { label: 'En livraison', color: '#1976D2', icon: 'car' },
  ON_BREAK: { label: 'En pause', color: '#FFC107', icon: 'cafe' },
  OFF_DUTY: { label: 'Hors service', color: '#6c757d', icon: 'moon' },
};

export default function HomeScreen() {
  const { user, status, setStatus } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // GPS Tracking - sends position to backend when status is AVAILABLE or IN_DELIVERY
  const gpsTracking = useGPSTracking(user?.truckId);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data from backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleStatusChange = (newStatus: DriverStatus) => {
    setStatus(newStatus);
  };

  const config = statusConfig[status];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {user?.firstName || 'Conducteur'}</Text>
            <Text style={styles.truckInfo}>{user?.truckName || 'Aucun camion'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={16} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        {/* GPS Card */}
        <View style={styles.card}>
          <View style={styles.gpsRow}>
            <Ionicons
              name={gpsTracking.isTracking ? 'locate' : 'locate-outline'}
              size={28}
              color={gpsTracking.isTracking ? '#28A745' : '#6c757d'}
            />
            <View style={styles.gpsInfo}>
              <Text style={styles.gpsTitle}>GPS Tracking</Text>
              <Text style={styles.gpsStatus}>
                {gpsTracking.isTracking
                  ? `Actif - ${gpsTracking.positionsSent} envois`
                  : 'Inactif'}
              </Text>
            </View>
            <View style={[styles.gpsDot, { backgroundColor: gpsTracking.isTracking ? '#28A745' : '#6c757d' }]} />
          </View>
          {gpsTracking.lastPosition && gpsTracking.isTracking && (
            <Text style={styles.coordinates}>
              {gpsTracking.lastPosition.coords.latitude.toFixed(4)}, {gpsTracking.lastPosition.coords.longitude.toFixed(4)}
            </Text>
          )}
          {gpsTracking.error && (
            <Text style={styles.gpsError}>{gpsTracking.error}</Text>
          )}
          {gpsTracking.lastSentAt && (
            <Text style={styles.lastSent}>
              Dernier envoi: {gpsTracking.lastSentAt.toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Status Selector */}
        <Text style={styles.sectionTitle}>Votre Statut</Text>
        <View style={styles.statusGrid}>
          {(Object.keys(statusConfig) as DriverStatus[]).map((key) => {
            const cfg = statusConfig[key];
            const isActive = status === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.statusButton,
                  isActive && { backgroundColor: cfg.color, borderColor: cfg.color },
                ]}
                onPress={() => handleStatusChange(key)}
              >
                <Ionicons name={cfg.icon} size={20} color={isActive ? '#fff' : cfg.color} />
                <Text style={[styles.statusButtonText, isActive && { color: '#fff' }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Connection Status */}
        <View style={styles.connectionCard}>
          <Ionicons name="cloud-done" size={20} color="#28A745" />
          <Text style={styles.connectionText}>Connecte au serveur TruckTrack</Text>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Aujourd'hui</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="car" size={28} color="#1976D2" />
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Trajets en attente</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="navigate" size={28} color="#28A745" />
            <Text style={styles.statNumber}>{gpsTracking.positionsSent}</Text>
            <Text style={styles.statLabel}>Positions envoyees</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  truckInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsInfo: {
    flex: 1,
    marginLeft: 12,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gpsStatus: {
    fontSize: 13,
    color: '#666',
  },
  gpsDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  gpsError: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 8,
    textAlign: 'center',
  },
  lastSent: {
    fontSize: 11,
    color: '#28A745',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '48%',
  },
  statusButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#333',
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28A74510',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  connectionText: {
    marginLeft: 8,
    color: '#28A745',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
