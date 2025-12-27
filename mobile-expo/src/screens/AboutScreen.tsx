import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';
const BUILD_NUMBER = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1';

export default function AboutScreen() {
  const navigation = useNavigation();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // Handle error silently
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* App Logo & Info */}
        <View style={styles.appInfo}>
          <View style={styles.logoContainer}>
            <Ionicons name="bus" size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>TruckTrack Driver</Text>
          <Text style={styles.appVersion}>Version {APP_VERSION} (Build {BUILD_NUMBER})</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>
            TruckTrack Driver is the official mobile companion for drivers in the TruckTrack fleet management system.
            Track your trips, update your status, and stay connected with your fleet manager.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>

          <View style={styles.featureRow}>
            <Ionicons name="location" size={20} color="#1976D2" />
            <Text style={styles.featureText}>Real-time GPS tracking</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="car" size={20} color="#1976D2" />
            <Text style={styles.featureText}>Trip management</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="notifications" size={20} color="#1976D2" />
            <Text style={styles.featureText}>Push notifications for new trips</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="map" size={20} color="#1976D2" />
            <Text style={styles.featureText}>Interactive route maps</Text>
          </View>

          <View style={styles.featureRow}>
            <Ionicons name="sync" size={20} color="#1976D2" />
            <Text style={styles.featureText}>Status synchronization</Text>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('https://trucktrack.app/privacy')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#1976D2" />
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('https://trucktrack.app/terms')}
          >
            <Ionicons name="document-text-outline" size={20} color="#1976D2" />
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openLink('https://trucktrack.app/licenses')}
          >
            <Ionicons name="code-slash-outline" size={20} color="#1976D2" />
            <Text style={styles.linkText}>Open Source Licenses</Text>
            <Ionicons name="open-outline" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with</Text>
          <Ionicons name="heart" size={16} color="#DC3545" />
          <Text style={styles.footerText}>by TruckTrack Team</Text>
        </View>

        <Text style={styles.copyright}>
          {'\u00A9'} {new Date().getFullYear()} TruckTrack. All rights reserved.
        </Text>
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
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#1976D2',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});
