import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import { TripService, Trip, TripStatus, TripStatusHistory, ProofOfDeliveryService, ProofResponse } from '../services/api';

// Helper to decode base64 SVG data URI to XML string
const decodeSvgDataUri = (dataUri: string): string | null => {
  try {
    if (!dataUri.startsWith('data:image/svg+xml;base64,')) {
      return null;
    }
    const base64 = dataUri.replace('data:image/svg+xml;base64,', '');
    // Decode base64 to string
    const decoded = atob(base64);
    return decoded;
  } catch (error) {
    console.error('Error decoding SVG data URI:', error);
    return null;
  }
};

// Navigation types
type RootStackParamList = {
  TripDetail: { tripId: string };
  Signature: { tripId: string; tripOrigin: string; tripDestination: string };
};

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<TripDetailRouteParams, 'TripDetail'>>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [history, setHistory] = useState<TripStatusHistory[]>([]);
  const [proof, setProof] = useState<ProofResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTripDetails = useCallback(async () => {
    try {
      setError(null);
      const [tripData, historyData, proofData] = await Promise.all([
        TripService.getTripById(tripId),
        TripService.getTripHistory(tripId),
        ProofOfDeliveryService.getProofByTripId(tripId),
      ]);
      setTrip(tripData);
      setHistory(historyData);
      setProof(proofData);
    } catch (err) {
      console.error('Failed to fetch trip details:', err);
      setError('Unable to load trip details. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Refresh trip details every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTripDetails();
    }, [fetchTripDetails])
  );

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

  // T025: Navigate to SignatureScreen for POD capture
  const handleConfirmDelivery = () => {
    if (!trip) return;

    navigation.navigate('Signature', {
      tripId: trip.id,
      tripOrigin: trip.origin,
      tripDestination: trip.destination,
    });
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

        {/* Proof of Delivery */}
        {proof && (
          <View style={styles.card}>
            <View style={styles.proofHeader}>
              <Ionicons
                name={proof.status === 'SIGNED' ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={proof.status === 'SIGNED' ? '#28A745' : '#dc3545'}
              />
              <Text style={styles.cardTitle}>Preuve de livraison</Text>
            </View>

            {/* Status Badge */}
            <View style={[
              styles.proofStatusBadge,
              { backgroundColor: proof.status === 'SIGNED' ? '#e8f5e9' : '#ffebee' }
            ]}>
              <Text style={[
                styles.proofStatusText,
                { color: proof.status === 'SIGNED' ? '#28A745' : '#dc3545' }
              ]}>
                {proof.statusDisplayName}
              </Text>
            </View>

            {/* Signer Name */}
            {proof.signerName && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <Text style={styles.detailLabel}>Signataire:</Text>
                <Text style={styles.detailValue}>{proof.signerName}</Text>
              </View>
            )}

            {/* Refusal Reason */}
            {proof.refusalReason && (
              <View style={styles.refusalContainer}>
                <Ionicons name="warning-outline" size={20} color="#dc3545" />
                <Text style={styles.refusalText}>{proof.refusalReason}</Text>
              </View>
            )}

            {/* Captured At */}
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(proof.capturedAt)}</Text>
            </View>

            {/* GPS Location */}
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.detailLabel}>GPS:</Text>
              <Text style={styles.detailValue}>
                {proof.latitude.toFixed(6)}, {proof.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Signature Image */}
            <View style={styles.signatureContainer}>
              <Text style={styles.signatureLabel}>Signature</Text>
              <View style={styles.signatureImageContainer}>
                {proof.signatureImage && decodeSvgDataUri(proof.signatureImage) ? (
                  <SvgXml
                    xml={decodeSvgDataUri(proof.signatureImage)!}
                    width="100%"
                    height={150}
                  />
                ) : proof.signatureImage ? (
                  <Image
                    source={{ uri: proof.signatureImage }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.noSignatureText}>Signature non disponible</Text>
                )}
              </View>
            </View>

            {/* Photos */}
            {proof.photos && proof.photos.length > 0 && (
              <View style={styles.photosContainer}>
                <Text style={styles.photosLabel}>Photos ({proof.photos.length})</Text>
                <View style={styles.photosGrid}>
                  {proof.photos.map((photo, index) => (
                    <View key={photo.id} style={styles.photoThumbnailContainer}>
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${photo.photoImage}` }}
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Driver Info */}
            {proof.createdByName && (
              <View style={styles.detailRow}>
                <Ionicons name="car-outline" size={20} color="#666" />
                <Text style={styles.detailLabel}>Chauffeur:</Text>
                <Text style={styles.detailValue}>{proof.createdByName}</Text>
              </View>
            )}
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
                onPress={handleConfirmDelivery}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="create-outline" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirmer livraison</Text>
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
  // Proof of Delivery styles
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  proofStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  proofStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  refusalContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  refusalText: {
    fontSize: 14,
    color: '#dc3545',
    marginLeft: 8,
    flex: 1,
  },
  signatureContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  signatureImageContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  signatureImage: {
    width: '100%',
    height: 150,
  },
  noSignatureText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  photosContainer: {
    marginTop: 16,
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumbnailContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});
