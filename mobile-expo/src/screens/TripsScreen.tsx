import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TripService, Trip, TripStatus, ProofStatus } from '../services/api';

// Navigation types
type RootStackParamList = {
  Trips: undefined;
  TripDetail: { tripId: string };
};

type TripsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Trips'>;

const statusConfig: Record<TripStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  PENDING: { color: '#9E9E9E', icon: 'hourglass-outline', label: 'Pending' },
  ASSIGNED: { color: '#FFC107', icon: 'time-outline', label: 'Assigned' },
  IN_PROGRESS: { color: '#1976D2', icon: 'car', label: 'In Progress' },
  COMPLETED: { color: '#28A745', icon: 'checkmark-circle', label: 'Completed' },
  CANCELLED: { color: '#dc3545', icon: 'close-circle', label: 'Cancelled' },
};

// Feature 015: Proof of Delivery status configuration
const proofStatusConfig: Record<ProofStatus, { color: string; bgColor: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  SIGNED: { color: '#28A745', bgColor: '#e8f5e9', icon: 'checkmark-circle', label: 'Signed' },
  REFUSED: { color: '#dc3545', bgColor: '#ffebee', icon: 'close-circle', label: 'Refused' },
};

export default function TripsScreen() {
  const navigation = useNavigation<TripsScreenNavigationProp>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const myTrips = await TripService.getMyTrips();
      setTrips(myTrips);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setError('Unable to load trips. Pull to retry.');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh trips every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [fetchTrips])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderTrip = ({ item }: { item: Trip }) => {
    const config = statusConfig[item.status] || statusConfig.PENDING;

    return (
      <TouchableOpacity style={styles.tripCard} onPress={() => handleTripPress(item)}>
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
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.detailText}>To: {item.destination}</Text>
          </View>

          {item.assignedTruckName && (
            <View style={styles.detailRow}>
              <Ionicons name="bus-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Truck: {item.assignedTruckName}</Text>
            </View>
          )}

          {item.scheduledAt && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Scheduled: {formatDate(item.scheduledAt)}</Text>
            </View>
          )}

          {item.startedAt && (
            <View style={styles.detailRow}>
              <Ionicons name="play-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Started: {formatDate(item.startedAt)}</Text>
            </View>
          )}

          {item.completedAt && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-done-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Completed: {formatDate(item.completedAt)}</Text>
            </View>
          )}
        </View>

        <View style={styles.tripFooter}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
          <View style={styles.tripFooterRight}>
            {/* Feature 015: Show proof status badge for completed trips */}
            {item.status === 'COMPLETED' && item.proofStatus && (
              <View style={[styles.proofBadge, { backgroundColor: proofStatusConfig[item.proofStatus].bgColor }]}>
                <Ionicons name={proofStatusConfig[item.proofStatus].icon} size={14} color={proofStatusConfig[item.proofStatus].color} />
                <Text style={[styles.proofBadgeText, { color: proofStatusConfig[item.proofStatus].color }]}>
                  {proofStatusConfig[item.proofStatus].label}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const activeCount = trips.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <Text style={styles.subtitle}>
          {trips.length > 0
            ? `${activeCount} active trip${activeCount !== 1 ? 's' : ''} • ${trips.length} total`
            : 'No trips assigned'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={20} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {trips.length === 0 && !error ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Trips Assigned</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any trips assigned yet.{'\n'}
            Check back later or contact dispatch.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  errorText: {
    color: '#dc3545',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
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
  tripFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  proofBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
