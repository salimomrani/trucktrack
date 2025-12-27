import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../../App';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, status, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const gpsActive = status === 'AVAILABLE' || status === 'IN_DELIVERY';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Truck Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Truck</Text>
          <View style={styles.card}>
            <Ionicons name="bus" size={32} color="#1976D2" />
            <View style={styles.truckInfo}>
              <Text style={styles.truckName}>{user?.truckName}</Text>
              <Text style={styles.truckId}>ID: {user?.truckId}</Text>
            </View>
          </View>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusCard}>
              <Ionicons
                name={gpsActive ? 'locate' : 'locate-outline'}
                size={24}
                color={gpsActive ? '#28A745' : '#6c757d'}
              />
              <Text style={styles.statusLabel}>GPS</Text>
              <Text style={[styles.statusValue, { color: gpsActive ? '#28A745' : '#6c757d' }]}>
                {gpsActive ? 'Active' : 'Off'}
              </Text>
            </View>
            <View style={styles.statusCard}>
              <Ionicons name="checkmark-circle" size={24} color="#1976D2" />
              <Text style={styles.statusLabel}>Session</Text>
              <Text style={styles.statusValue}>Active</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.menuIcon}>
              <Ionicons name="settings-outline" size={22} color="#1976D2" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>App Settings</Text>
              <Text style={styles.menuSubtitle}>GPS, notifications, display</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('About')}>
            <View style={styles.menuIcon}>
              <Ionicons name="information-circle-outline" size={22} color="#1976D2" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>About</Text>
              <Text style={styles.menuSubtitle}>TruckTrack Driver v1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpSupport')}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle-outline" size={22} color="#1976D2" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSubtitle}>Contact your fleet manager</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  truckInfo: {
    marginLeft: 16,
  },
  truckName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  truckId: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
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
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    backgroundColor: '#1976D220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
