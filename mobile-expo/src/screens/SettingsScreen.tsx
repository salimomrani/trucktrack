import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleGpsToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'GPS permission is required for location tracking. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setGpsEnabled(value);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* GPS Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={22} color="#1976D2" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>GPS Tracking</Text>
                <Text style={styles.settingDescription}>Enable location tracking</Text>
              </View>
            </View>
            <Switch
              value={gpsEnabled}
              onValueChange={handleGpsToggle}
              trackColor={{ false: '#ddd', true: '#1976D280' }}
              thumbColor={gpsEnabled ? '#1976D2' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="speedometer" size={22} color="#1976D2" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>High Accuracy GPS</Text>
                <Text style={styles.settingDescription}>Uses more battery</Text>
              </View>
            </View>
            <Switch
              value={highAccuracyGps}
              onValueChange={setHighAccuracyGps}
              trackColor={{ false: '#ddd', true: '#1976D280' }}
              thumbColor={highAccuracyGps ? '#1976D2' : '#f4f3f4'}
              disabled={!gpsEnabled}
            />
          </View>
        </View>

        {/* Notifications Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={22} color="#1976D2" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive trip alerts</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ddd', true: '#1976D280' }}
              thumbColor={notificationsEnabled ? '#1976D2' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={22} color="#1976D2" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Coming soon</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#ddd', true: '#1976D280' }}
              thumbColor={darkMode ? '#1976D2' : '#f4f3f4'}
              disabled={true}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="refresh" size={22} color="#1976D2" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Auto Refresh</Text>
                <Text style={styles.settingDescription}>Update data automatically</Text>
              </View>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#ddd', true: '#1976D280' }}
              thumbColor={autoRefresh ? '#1976D2' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Data Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash-outline" size={22} color="#DC3545" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: '#DC3545' }]}>Clear Cache</Text>
                <Text style={styles.settingDescription}>Free up storage space</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
