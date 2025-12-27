import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useThemeStore, useThemeColors } from '../store/themeStore';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { isDark, toggleTheme } = useThemeStore();

  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(true);
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

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    settingRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: '500' as const,
      color: colors.text,
    },
    settingDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>App Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* GPS Settings */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Location</Text>

          <View style={dynamicStyles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={22} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={dynamicStyles.settingTitle}>GPS Tracking</Text>
                <Text style={dynamicStyles.settingDescription}>Enable location tracking</Text>
              </View>
            </View>
            <Switch
              value={gpsEnabled}
              onValueChange={handleGpsToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={gpsEnabled ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={dynamicStyles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="speedometer" size={22} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={dynamicStyles.settingTitle}>High Accuracy GPS</Text>
                <Text style={dynamicStyles.settingDescription}>Uses more battery</Text>
              </View>
            </View>
            <Switch
              value={highAccuracyGps}
              onValueChange={setHighAccuracyGps}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={highAccuracyGps ? colors.primary : colors.textMuted}
              disabled={!gpsEnabled}
            />
          </View>
        </View>

        {/* Notifications Settings */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Notifications</Text>

          <View style={dynamicStyles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={22} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={dynamicStyles.settingTitle}>Push Notifications</Text>
                <Text style={dynamicStyles.settingDescription}>Receive trip alerts</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* Display Settings */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Display</Text>

          <View style={dynamicStyles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={dynamicStyles.settingTitle}>Dark Mode</Text>
                <Text style={dynamicStyles.settingDescription}>
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDark ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={dynamicStyles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="refresh" size={22} color={colors.primary} />
              <View style={styles.settingText}>
                <Text style={dynamicStyles.settingTitle}>Auto Refresh</Text>
                <Text style={dynamicStyles.settingDescription}>Update data automatically</Text>
              </View>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={autoRefresh ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* Data Settings */}
        <View style={styles.section}>
          <Text style={dynamicStyles.sectionTitle}>Data</Text>

          <TouchableOpacity style={dynamicStyles.settingRow} onPress={handleClearCache}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <View style={styles.settingText}>
                <Text style={[dynamicStyles.settingTitle, { color: colors.error }]}>Clear Cache</Text>
                <Text style={dynamicStyles.settingDescription}>Free up storage space</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    padding: 4,
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
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
});
