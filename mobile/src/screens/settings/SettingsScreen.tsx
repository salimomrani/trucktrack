/**
 * Settings Screen
 * App settings and preferences
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackScreenProps } from '@navigation/types';
import { useSettingsStore } from '@store/settingsStore';
import { Card, Button } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';
import { Config } from '@constants/config';

type Props = RootStackScreenProps<'Settings'>;

export const SettingsScreen: React.FC<Props> = () => {
  const settings = useSettingsStore();

  const renderSettingRow = (
    icon: string,
    title: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    description?: string,
  ) => (
    <View style={styles.settingRow}>
      <Icon name={icon} size={22} color={Colors.primary} style={styles.settingIcon} />
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.textTertiary}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* GPS Settings */}
        <Text style={styles.sectionTitle}>GPS Tracking</Text>
        <Card style={styles.card}>
          {renderSettingRow(
            'crosshairs-gps',
            'High Accuracy Mode',
            settings.highAccuracyMode,
            settings.setHighAccuracyMode,
            'Uses more battery but provides precise location',
          )}
          {renderSettingRow(
            'battery-charging',
            'Battery Optimization',
            settings.batteryOptimization,
            settings.setBatteryOptimization,
            'Reduce GPS frequency when battery is low',
          )}
        </Card>

        {/* Notification Settings */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.card}>
          {renderSettingRow(
            'bell',
            'Push Notifications',
            settings.notificationsEnabled,
            settings.setNotificationsEnabled,
            'Receive alerts and messages',
          )}
          {renderSettingRow(
            'volume-high',
            'Sound',
            settings.soundEnabled,
            settings.setSoundEnabled,
          )}
          {renderSettingRow(
            'vibrate',
            'Vibration',
            settings.vibrationEnabled,
            settings.setVibrationEnabled,
          )}
        </Card>

        {/* Offline Settings */}
        <Text style={styles.sectionTitle}>Offline Mode</Text>
        <Card style={styles.card}>
          {renderSettingRow(
            'cloud-off-outline',
            'Enable Offline Mode',
            settings.offlineModeEnabled,
            settings.setOfflineModeEnabled,
            'Store data locally when offline',
          )}
          {renderSettingRow(
            'sync',
            'Auto Sync When Online',
            settings.autoSyncWhenOnline,
            settings.setAutoSyncWhenOnline,
            'Automatically sync pending data',
          )}
        </Card>

        {/* Display Settings */}
        <Text style={styles.sectionTitle}>Display</Text>
        <Card style={styles.card}>
          {renderSettingRow(
            'theme-light-dark',
            'Dark Mode',
            settings.darkMode,
            settings.setDarkMode,
            'Switch to dark color scheme',
          )}
          <View style={styles.settingRow}>
            <Icon name="translate" size={22} color={Colors.primary} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Language</Text>
              <Text style={styles.settingDescription}>
                {settings.language === 'en' ? 'English' : 'Français'}
              </Text>
            </View>
            <View style={styles.languageButtons}>
              <Button
                title="EN"
                variant={settings.language === 'en' ? 'primary' : 'outline'}
                size="small"
                onPress={() => settings.setLanguage('en')}
                style={styles.langButton}
              />
              <Button
                title="FR"
                variant={settings.language === 'fr' ? 'primary' : 'outline'}
                size="small"
                onPress={() => settings.setLanguage('fr')}
              />
            </View>
          </View>
          <View style={styles.settingRow}>
            <Icon name="map-marker-distance" size={22} color={Colors.primary} style={styles.settingIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Distance Unit</Text>
              <Text style={styles.settingDescription}>
                {settings.distanceUnit === 'km' ? 'Kilometers' : 'Miles'}
              </Text>
            </View>
            <View style={styles.languageButtons}>
              <Button
                title="KM"
                variant={settings.distanceUnit === 'km' ? 'primary' : 'outline'}
                size="small"
                onPress={() => settings.setDistanceUnit('km')}
                style={styles.langButton}
              />
              <Button
                title="MI"
                variant={settings.distanceUnit === 'mi' ? 'primary' : 'outline'}
                size="small"
                onPress={() => settings.setDistanceUnit('mi')}
              />
            </View>
          </View>
        </Card>

        {/* Reset */}
        <Button
          title="Reset to Defaults"
          variant="outline"
          fullWidth
          onPress={settings.resetToDefaults}
          style={styles.resetButton}
        />

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>TruckTrack Driver</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 TruckTrack</Text>
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
  content: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  card: {
    padding: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    marginRight: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.textPrimary,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  languageButtons: {
    flexDirection: 'row',
  },
  langButton: {
    marginRight: Spacing.xs,
  },
  resetButton: {
    marginTop: Spacing.xl,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.textPrimary,
  },
  appVersion: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  appCopyright: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});

export default SettingsScreen;
