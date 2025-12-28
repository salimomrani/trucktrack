import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ActivityIndicator, View } from 'react-native';
import {
  addNotificationResponseListener,
  getNotificationData,
  getLastNotificationResponse,
} from './src/services/notifications';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import TripsScreen from './src/screens/TripsScreen';
import TripDetailScreen from './src/screens/TripDetailScreen';
import SignatureScreen from './src/screens/SignatureScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';

// Store
import { useAuthStore } from './src/store/authStore';

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TripDetail: { tripId: string };
  Signature: { tripId: string; tripOrigin: string; tripDestination: string };
  Settings: undefined;
  About: undefined;
  HelpSupport: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Trips') iconName = focused ? 'car' : 'car-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    initialize();
    // Request location permission
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  // T042: Handle notification tap to navigate to trip details
  useEffect(() => {
    // Handle notification when app is opened from background/closed state
    const checkInitialNotification = async () => {
      const response = await getLastNotificationResponse();
      if (response && isAuthenticated && navigationRef.current) {
        const data = getNotificationData(response);
        if (data?.tripId && data?.type === 'TRIP_ASSIGNED') {
          navigationRef.current.navigate('TripDetail', { tripId: data.tripId });
        }
      }
    };

    if (isAuthenticated && isInitialized) {
      checkInitialNotification();
    }

    // Handle notification when app is in foreground
    const subscription = addNotificationResponseListener((response) => {
      const data = getNotificationData(response);
      if (data?.tripId && navigationRef.current && isAuthenticated) {
        navigationRef.current.navigate('TripDetail', { tripId: data.tripId });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isInitialized]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} />
            <Stack.Screen name="Signature" component={SignatureScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
