import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { TripService, Trip, TripStatus, TripStatusHistory } from '../services/api';

// Route params type
type TripDetailRouteParams = {
  TripDetail: { tripId: string };
};

const statusConfig: Record<TripStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  PENDING: { color: '#9E9E9E', icon: 'hourglass-outline', label: 'Pending' },
  ASSIGNED: { color: '#FFC107', icon: 'time-outline', label: 'Assigned' },
  IN_PROGRESS: { color: '#1976D2', icon: 'car', label: 'In Progress' },
  COMPLETED: { color: '#28A745', icon: 'checkmark-circle', label: 'Completed' },
  CANCELLED: { color: '#dc3545', icon: 'close-circle', label: 'Cancelled' },
};

export default function TripDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TripDetailRouteParams, 'TripDetail'>>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [history, setHistory] = useState<TripStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTripDetails = useCallback(async () => {
    try {
      setError(null);
      const [tripData, historyData] = await Promise.all([
        TripService.getTripById(tripId),
        TripService.getTripHistory(tripId),
      ]);
      setTrip(tripData);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to fetch trip details:', err);
      setError('Unable to load trip details. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTripDetails();
    setRefreshing(false);
  };

  const handleStartTrip = async () => {
    Alert.alert(
      'Start Trip',
      'Are you ready to start this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setActionLoading(true);
            try {
              const updatedTrip = await TripService.startTrip(tripId);
              setTrip(updatedTrip);
              Alert.alert('Success', 'Trip started successfully!');
              await fetchTripDetails(); // Refresh history
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to start trip');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteTrip = async () => {
    Alert.alert(
      'Complete Trip',
      'Have you completed the delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setActionLoading(true);
            try {
              const updatedTrip = await TripService.completeTrip(tripId, 'Delivery completed successfully');
              setTrip(updatedTrip);
              Alert.alert('Success', 'Trip completed successfully!');
              await fetchTripDetails(); // Refresh history
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to complete trip');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorSubtitle}>{error || 'Unable to load trip details.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTripDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const config = statusConfig[trip.status] || statusConfig.PENDING;
  const canStart = trip.status === 'ASSIGNED';
  const canComplete = trip.status === 'IN_PROGRESS';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: config.color }]}>
          <Ionicons name={config.icon} size={32} color={config.color} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
            <Text style={styles.statusSubtext}>Current Status</Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Route Information</Text>

          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#28A745' }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Origin</Text>
                <Text style={styles.routeValue}>{trip.origin}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#dc3545' }]} />
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>Destination</Text>
                <Text style={styles.routeValue}>{trip.destination}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>

          {trip.assignedTruckName && (
            <View style={styles.detailRow}>
              <Ionicons name="bus-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Truck:</Text>
              <Text style={styles.detailValue}>{trip.assignedTruckName}</Text>
            </View>
          )}

          {trip.scheduledAt && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Scheduled:</Text>
              <Text style={styles.detailValue}>{formatDate(trip.scheduledAt)}</Text>
            </View>
          )}

          {trip.startedAt && (
            <View style={styles.detailRow}>
              <Ionicons name="play-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Started:</Text>
              <Text style={styles.detailValue}>{formatDate(trip.startedAt)}</Text>
            </View>
          )}

          {trip.completedAt && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-done-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Completed:</Text>
              <Text style={styles.detailValue}>{formatDate(trip.completedAt)}</Text>
            </View>
          )}

          {trip.notes && (
            <View style={styles.notesContainer}>
              <Ionicons name="document-text-outline" size={20} color="#666" />
              <Text style={styles.notesText}>{trip.notes}</Text>
            </View>
          )}
        </View>

        {/* Status History */}
        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status History</Text>

            {history.map((item, index) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyDot}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: statusConfig[item.newStatus]?.color || '#666' },
                    ]}
                  />
                  {index < history.length - 1 && <View style={styles.historyLine} />}
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>
                    {item.previousStatusDisplay ? `${item.previousStatusDisplay} → ` : ''}
                    {item.newStatusDisplay}
                  </Text>
                  <Text style={styles.historyTime}>{formatDate(item.changedAt)}</Text>
                  {item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        {(canStart || canComplete) && (
          <View style={styles.actionContainer}>
            {canStart && (
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={handleStartTrip}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="play" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Start Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canComplete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={handleCompleteTrip}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Complete Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1976D2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusInfo: {
    marginLeft: 16,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  routeContainer: {
    paddingLeft: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  routeTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
  },
  routeValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginLeft: 5,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyDot: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 8,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  historyTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#1976D2',
  },
  completeButton: {
    backgroundColor: '#28A745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
