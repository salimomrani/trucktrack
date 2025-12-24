/**
 * App Navigator
 * Root navigation container
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import type { RootStackParamList } from './types';
import { Colors } from '@constants/theme';
import { useAuthStore } from '@store/authStore';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Screens
import TripDetailScreen from '@screens/trips/TripDetailScreen';
import MessageDetailScreen from '@screens/messages/MessageDetailScreen';
import SettingsScreen from '@screens/settings/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Show loading while restoring session
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="TripDetail"
              component={TripDetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Trip Details',
                headerBackTitle: 'Back',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="MessageDetail"
              component={MessageDetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Message',
                headerBackTitle: 'Back',
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Settings',
                headerBackTitle: 'Back',
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default AppNavigator;
