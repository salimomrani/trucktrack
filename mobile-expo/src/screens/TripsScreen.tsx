import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type TripStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

interface Trip {
  id: string;
  destination: string;
  origin: string;
  status: TripStatus;
  scheduledAt: string;
  estimatedArrival?: string;
}

const mockTrips: Trip[] = [
  {
    id: '1',
    destination: 'Paris - Entrepôt Nord',
    origin: 'Lyon - Centre Logistique',
    status: 'IN_PROGRESS',
    scheduledAt: '2024-12-24T08:00:00',
    estimatedArrival: '2024-12-24T12:30:00',
  },
  {
    id: '2',
    destination: 'Marseille - Port',
    origin: 'Paris - Entrepôt Nord',
    status: 'ASSIGNED',
    scheduledAt: '2024-12-24T14:00:00',
  },
  {
    id: '3',
    destination: 'Bordeaux - Zone Industrielle',
    origin: 'Marseille - Port',
    status: 'ASSIGNED',
    scheduledAt: '2024-12-25T09:00:00',
  },
];

const statusConfig: Record<TripStatus, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  ASSIGNED: { color: '#FFC107', icon: 'time-outline' },
  IN_PROGRESS: { color: '#1976D2', icon: 'car' },
  COMPLETED: { color: '#28A745', icon: 'checkmark-circle' },
};

export default function TripsScreen() {
  const [trips] = useState<Trip[]>(mockTrips);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const renderTrip = ({ item }: { item: Trip }) => {
    const config = statusConfig[item.status];

    return (
      <TouchableOpacity style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Ionicons name={config.icon} size={20} color={config.color} />
          <Text style={styles.tripDestination} numberOfLines={1}>
            {item.destination}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>From: {item.origin}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {new Date(item.scheduledAt).toLocaleString()}
            </Text>
          </View>

          {item.estimatedArrival && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                ETA: {new Date(item.estimatedArrival).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tripFooter}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {item.status.replace('_', ' ')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const activeCount = trips.filter((t) => t.status !== 'COMPLETED').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <Text style={styles.subtitle}>{activeCount} active trips</Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripDestination: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tripDetails: {
    marginLeft: 28,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
