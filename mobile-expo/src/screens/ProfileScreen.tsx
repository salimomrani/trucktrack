import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../store/themeStore';
import { RootStackParamList } from '../../App';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, status, logout } = useAuthStore();
  const colors = useThemeColors();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const gpsActive = status === 'AVAILABLE' || status === 'IN_DELIVERY';

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    name: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    truckName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
    },
    truckId: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statusLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.text,
      marginTop: 2,
    },
    menuItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    menuTitle: {
      fontSize: 15,
      fontWeight: '500' as const,
      color: colors.text,
    },
    menuSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={dynamicStyles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={dynamicStyles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={dynamicStyles.email}>{user?.email}</Text>
        </View>

        {/* Truck Info */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Assigned Truck</Text>
          <View style={dynamicStyles.card}>
            <Ionicons name="bus" size={32} color={colors.primary} />
            <View style={styles.truckInfo}>
              <Text style={dynamicStyles.truckName}>{user?.truckName}</Text>
              <Text style={dynamicStyles.truckId}>ID: {user?.truckId}</Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View style={dynamicStyles.statusCard}>
              <Ionicons
                name={gpsActive ? 'locate' : 'locate-outline'}
                size={24}
                color={gpsActive ? colors.success : colors.textMuted}
              />
              <Text style={dynamicStyles.statusLabel}>GPS</Text>
              <Text style={[dynamicStyles.statusValue, { color: gpsActive ? colors.success : colors.textMuted }]}>
                {gpsActive ? 'Active' : 'Off'}
              </Text>
            </View>
            <View style={dynamicStyles.statusCard}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              <Text style={dynamicStyles.statusLabel}>Session</Text>
              <Text style={dynamicStyles.statusValue}>Active</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={dynamicStyles.menuIcon}>
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={dynamicStyles.menuTitle}>App Settings</Text>
              <Text style={dynamicStyles.menuSubtitle}>GPS, notifications, display</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate('About')}>
            <View style={dynamicStyles.menuIcon}>
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={dynamicStyles.menuTitle}>About</Text>
              <Text style={dynamicStyles.menuSubtitle}>TruckTrack Driver v1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate('HelpSupport')}>
            <View style={dynamicStyles.menuIcon}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={dynamicStyles.menuTitle}>Help & Support</Text>
              <Text style={dynamicStyles.menuSubtitle}>Contact your fleet manager</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  truckInfo: {
    marginLeft: 16,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC3545',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
