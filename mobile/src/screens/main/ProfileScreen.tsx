/**
 * Profile Screen
 * Driver profile and settings
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabScreenProps } from '@navigation/types';
import { useAuthStore } from '@store/authStore';
import { useStatusStore } from '@store/statusStore';
import { useSettingsStore } from '@store/settingsStore';
import { Card, Button, StatusBadge } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';

type Props = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { session, logout, isLoading } = useAuthStore();
  const { currentStatus, isGpsActive } = useStatusStore();
  const { darkMode } = useSettingsStore();

  const handleSettings = () => {
    navigation.getParent()?.navigate('Settings');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
  ) => (
    <Card style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuRow}>
        <View style={styles.menuIcon}>
          <Icon name={icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        {rightElement || (onPress && <Icon name="chevron-right" size={24} color={Colors.textTertiary} />)}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session?.firstName?.[0] || ''}
              {session?.lastName?.[0] || ''}
            </Text>
          </View>
          <Text style={styles.name}>
            {session?.firstName} {session?.lastName}
          </Text>
          <Text style={styles.email}>{session?.email}</Text>
          {currentStatus && (
            <StatusBadge status={currentStatus.status} size="large" style={styles.statusBadge} />
          )}
        </View>

        {/* Truck Info */}
        <Text style={styles.sectionTitle}>Assigned Truck</Text>
        <Card style={styles.truckCard}>
          <View style={styles.truckRow}>
            <Icon name="truck" size={32} color={Colors.primary} />
            <View style={styles.truckInfo}>
              <Text style={styles.truckName}>{session?.truckName || 'No truck assigned'}</Text>
              <Text style={styles.truckId}>ID: {session?.truckId || 'N/A'}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Stats */}
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Icon
              name={isGpsActive ? 'satellite-variant' : 'satellite-off'}
              size={24}
              color={isGpsActive ? Colors.success : Colors.textSecondary}
            />
            <Text style={styles.statLabel}>GPS</Text>
            <Text style={[styles.statValue, { color: isGpsActive ? Colors.success : Colors.textSecondary }]}>
              {isGpsActive ? 'Active' : 'Off'}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="clock-check-outline" size={24} color={Colors.primary} />
            <Text style={styles.statLabel}>Session</Text>
            <Text style={styles.statValue}>Active</Text>
          </Card>
        </View>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Settings</Text>
        {renderMenuItem('cog', 'App Settings', 'GPS, notifications, display', handleSettings)}
        {renderMenuItem(
          'information-outline',
          'About',
          'TruckTrack Driver v1.0.0',
          undefined,
          <Text style={styles.versionText}>1.0.0</Text>,
        )}
        {renderMenuItem(
          'help-circle-outline',
          'Help & Support',
          'Contact your fleet manager',
        )}

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          fullWidth
          loading={isLoading}
          style={styles.logoutButton}
        />
      </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.white,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
  },
  email: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  truckCard: {
    padding: Spacing.md,
  },
  truckRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  truckInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  truckName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
  },
  truckId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  menuItem: {
    marginBottom: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  versionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  logoutButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});

export default ProfileScreen;
