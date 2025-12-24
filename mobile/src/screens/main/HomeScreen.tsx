/**
 * Home Screen
 * Driver dashboard with status and quick actions
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabScreenProps } from '@navigation/types';
import { useAuthStore } from '@store/authStore';
import { useStatusStore } from '@store/statusStore';
import { useTripsStore } from '@store/tripsStore';
import { useMessagesStore } from '@store/messagesStore';
import { Card, StatusBadge, Button } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';
import type { DriverStatusType } from '@types/entities';

type Props = MainTabScreenProps<'Home'>;

const statusOptions: DriverStatusType[] = ['AVAILABLE', 'IN_DELIVERY', 'ON_BREAK', 'OFF_DUTY'];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { session } = useAuthStore();
  const { currentStatus, isLoading, fetchStatus, updateStatus, isGpsActive } = useStatusStore();
  const { trips, activeTrip, fetchTrips } = useTripsStore();
  const { unreadCount, fetchMessages } = useMessagesStore();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchStatus();
    fetchTrips();
    fetchMessages();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatus(), fetchTrips(), fetchMessages()]);
    setRefreshing(false);
  };

  const handleStatusChange = async (status: DriverStatusType) => {
    if (currentStatus?.status === status) return;
    await updateStatus(status);
  };

  const handleViewTrips = () => {
    navigation.navigate('Trips');
  };

  const handleViewMessages = () => {
    navigation.navigate('Messages');
  };

  const pendingTripsCount = trips.filter((t) => t.status === 'ASSIGNED').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {session?.firstName || 'Driver'}
            </Text>
            <Text style={styles.truckInfo}>
              {session?.truckName || 'No truck assigned'}
            </Text>
          </View>
          {currentStatus && <StatusBadge status={currentStatus.status} size="large" />}
        </View>

        {/* GPS Status */}
        <Card style={styles.gpsCard} variant="outlined">
          <View style={styles.gpsRow}>
            <Icon
              name={isGpsActive ? 'crosshairs-gps' : 'crosshairs-off'}
              size={24}
              color={isGpsActive ? Colors.success : Colors.textSecondary}
            />
            <View style={styles.gpsInfo}>
              <Text style={styles.gpsTitle}>GPS Tracking</Text>
              <Text style={styles.gpsStatus}>
                {isGpsActive ? 'Active - Sending location' : 'Inactive'}
              </Text>
            </View>
            <View
              style={[styles.gpsDot, { backgroundColor: isGpsActive ? Colors.success : Colors.textTertiary }]}
            />
          </View>
        </Card>

        {/* Status Selector */}
        <Text style={styles.sectionTitle}>Your Status</Text>
        <View style={styles.statusGrid}>
          {statusOptions.map((status) => (
            <Button
              key={status}
              title={status.replace('_', ' ')}
              onPress={() => handleStatusChange(status)}
              variant={currentStatus?.status === status ? 'primary' : 'outline'}
              size="medium"
              style={styles.statusButton}
              loading={isLoading && currentStatus?.status !== status}
            />
          ))}
        </View>

        {/* Active Trip */}
        {activeTrip && (
          <>
            <Text style={styles.sectionTitle}>Active Trip</Text>
            <Card
              style={styles.tripCard}
              onPress={() =>
                navigation.getParent()?.navigate('TripDetail', { tripId: activeTrip.id })
              }
            >
              <View style={styles.tripHeader}>
                <Icon name="truck-delivery" size={24} color={Colors.primary} />
                <Text style={styles.tripTitle}>{activeTrip.destination}</Text>
              </View>
              <Text style={styles.tripSubtitle}>
                Started: {new Date(activeTrip.startedAt!).toLocaleTimeString()}
              </Text>
            </Card>
          </>
        )}

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard} onPress={handleViewTrips}>
            <Icon name="truck" size={28} color={Colors.primary} />
            <Text style={styles.statNumber}>{pendingTripsCount}</Text>
            <Text style={styles.statLabel}>Pending Trips</Text>
          </Card>

          <Card style={styles.statCard} onPress={handleViewMessages}>
            <Icon name="message-text" size={28} color={Colors.secondary} />
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>New Messages</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  truckInfo: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  gpsCard: {
    marginBottom: Spacing.lg,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  gpsTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
  },
  gpsStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  gpsDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusButton: {
    flex: 1,
    minWidth: '45%',
  },
  tripCard: {
    marginBottom: Spacing.lg,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tripTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  tripSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    marginVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
