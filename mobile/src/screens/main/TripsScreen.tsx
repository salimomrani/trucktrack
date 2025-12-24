/**
 * Trips Screen
 * List of assigned trips
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabScreenProps } from '@navigation/types';
import { useTripsStore } from '@store/tripsStore';
import { Card, EmptyState, StatusBadge } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';
import type { Trip, TripStatus } from '@types/entities';

type Props = MainTabScreenProps<'Trips'>;

const getTripStatusColor = (status: TripStatus): string => {
  const colors: Record<TripStatus, string> = {
    ASSIGNED: Colors.warning,
    IN_PROGRESS: Colors.primary,
    COMPLETED: Colors.success,
    CANCELLED: Colors.textSecondary,
  };
  return colors[status];
};

const getTripStatusIcon = (status: TripStatus): string => {
  const icons: Record<TripStatus, string> = {
    ASSIGNED: 'clock-outline',
    IN_PROGRESS: 'truck-delivery',
    COMPLETED: 'check-circle',
    CANCELLED: 'close-circle',
  };
  return icons[status];
};

export const TripsScreen: React.FC<Props> = ({ navigation }) => {
  const { trips, isLoading, fetchTrips, refreshTrips } = useTripsStore();

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleTripPress = (trip: Trip) => {
    navigation.getParent()?.navigate('TripDetail', { tripId: trip.id });
  };

  const renderTripItem = useCallback(
    ({ item: trip }: { item: Trip }) => (
      <Card style={styles.tripCard} onPress={() => handleTripPress(trip)}>
        <View style={styles.tripHeader}>
          <View style={styles.tripTitleRow}>
            <Icon
              name={getTripStatusIcon(trip.status)}
              size={20}
              color={getTripStatusColor(trip.status)}
            />
            <Text style={styles.tripDestination} numberOfLines={1}>
              {trip.destination}
            </Text>
          </View>
          <View
            style={[styles.statusDot, { backgroundColor: getTripStatusColor(trip.status) }]}
          />
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Icon name="map-marker-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              From: {trip.origin}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="calendar-clock" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              Scheduled: {new Date(trip.scheduledAt).toLocaleString()}
            </Text>
          </View>

          {trip.estimatedArrival && (
            <View style={styles.detailRow}>
              <Icon name="clock-check-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>
                ETA: {new Date(trip.estimatedArrival).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tripFooter}>
          <Text style={[styles.statusText, { color: getTripStatusColor(trip.status) }]}>
            {trip.status.replace('_', ' ')}
          </Text>
          <Icon name="chevron-right" size={24} color={Colors.textTertiary} />
        </View>
      </Card>
    ),
    [navigation],
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="truck-outline"
      title="No Trips Assigned"
      message="You don't have any trips assigned yet. Check back later!"
      actionLabel="Refresh"
      onAction={refreshTrips}
    />
  );

  const activeTripCount = trips.filter(
    (t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS',
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <Text style={styles.subtitle}>
          {activeTripCount} active trip{activeTripCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshTrips} />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  tripCard: {
    padding: Spacing.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripDestination: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tripDetails: {
    marginLeft: 28,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
  },
  separator: {
    height: Spacing.md,
  },
});

export default TripsScreen;
