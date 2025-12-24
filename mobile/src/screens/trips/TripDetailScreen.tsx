/**
 * Trip Detail Screen
 * Detailed view of a single trip
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackScreenProps } from '@navigation/types';
import { useTripsStore } from '@store/tripsStore';
import { Card, Button, LoadingOverlay } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';
import type { Trip, TripStatus } from '@types/entities';

type Props = RootStackScreenProps<'TripDetail'>;

export const TripDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { tripId } = route.params;
  const { trips, fetchTripById, updateTripStatus, isLoading } = useTripsStore();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Try to find in store first
    const storeTrip = trips.find((t) => t.id === tripId);
    if (storeTrip) {
      setTrip(storeTrip);
    } else {
      loadTrip();
    }
  }, [tripId, trips]);

  const loadTrip = async () => {
    const loaded = await fetchTripById(tripId);
    if (loaded) {
      setTrip(loaded);
    }
  };

  const handleStatusUpdate = (newStatus: TripStatus) => {
    const statusLabels: Record<TripStatus, string> = {
      ASSIGNED: 'Assigned',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };

    Alert.alert(
      'Update Status',
      `Change trip status to "${statusLabels[newStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsUpdating(true);
            await updateTripStatus(tripId, newStatus);
            setIsUpdating(false);
          },
        },
      ],
    );
  };

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingOverlay visible message="Loading trip..." />
      </SafeAreaView>
    );
  }

  const canStart = trip.status === 'ASSIGNED';
  const canComplete = trip.status === 'IN_PROGRESS';
  const canCancel = trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Header */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Icon
              name={trip.status === 'IN_PROGRESS' ? 'truck-delivery' : 'truck'}
              size={32}
              color={Colors.primary}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Trip Status</Text>
              <Text style={styles.statusValue}>{trip.status.replace('_', ' ')}</Text>
            </View>
          </View>
        </Card>

        {/* Route Info */}
        <Text style={styles.sectionTitle}>Route</Text>
        <Card style={styles.routeCard}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Origin</Text>
              <Text style={styles.routeAddress}>{trip.origin}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeAddress}>{trip.destination}</Text>
            </View>
          </View>
        </Card>

        {/* Schedule */}
        <Text style={styles.sectionTitle}>Schedule</Text>
        <Card style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <Icon name="calendar-clock" size={20} color={Colors.textSecondary} />
            <Text style={styles.scheduleLabel}>Scheduled</Text>
            <Text style={styles.scheduleValue}>
              {new Date(trip.scheduledAt).toLocaleString()}
            </Text>
          </View>

          {trip.startedAt && (
            <View style={styles.scheduleRow}>
              <Icon name="play-circle" size={20} color={Colors.success} />
              <Text style={styles.scheduleLabel}>Started</Text>
              <Text style={styles.scheduleValue}>
                {new Date(trip.startedAt).toLocaleString()}
              </Text>
            </View>
          )}

          {trip.completedAt && (
            <View style={styles.scheduleRow}>
              <Icon name="check-circle" size={20} color={Colors.primary} />
              <Text style={styles.scheduleLabel}>Completed</Text>
              <Text style={styles.scheduleValue}>
                {new Date(trip.completedAt).toLocaleString()}
              </Text>
            </View>
          )}

          {trip.estimatedArrival && trip.status === 'IN_PROGRESS' && (
            <View style={styles.scheduleRow}>
              <Icon name="clock-check-outline" size={20} color={Colors.warning} />
              <Text style={styles.scheduleLabel}>ETA</Text>
              <Text style={styles.scheduleValue}>
                {new Date(trip.estimatedArrival).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Notes */}
        {trip.notes && (
          <>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Card style={styles.notesCard}>
              <Text style={styles.notesText}>{trip.notes}</Text>
            </Card>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {canStart && (
            <Button
              title="Start Trip"
              onPress={() => handleStatusUpdate('IN_PROGRESS')}
              variant="primary"
              fullWidth
              loading={isUpdating}
              style={styles.actionButton}
            />
          )}

          {canComplete && (
            <Button
              title="Complete Trip"
              onPress={() => handleStatusUpdate('COMPLETED')}
              variant="primary"
              fullWidth
              loading={isUpdating}
              style={styles.actionButton}
            />
          )}

          {canCancel && (
            <Button
              title="Cancel Trip"
              onPress={() => handleStatusUpdate('CANCELLED')}
              variant="danger"
              fullWidth
              loading={isUpdating}
              style={styles.actionButton}
            />
          )}
        </View>
      </ScrollView>

      <LoadingOverlay visible={isUpdating} message="Updating status..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  statusCard: {
    marginBottom: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: Spacing.md,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  routeCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
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
  routeInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  routeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  routeAddress: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border,
    marginLeft: 5,
    marginVertical: Spacing.xs,
  },
  scheduleCard: {
    marginBottom: Spacing.lg,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scheduleLabel: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  scheduleValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium as any,
  },
  notesCard: {
    marginBottom: Spacing.lg,
  },
  notesText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  actions: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    marginBottom: Spacing.sm,
  },
});

export default TripDetailScreen;
