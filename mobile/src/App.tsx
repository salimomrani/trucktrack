/**
 * TruckTrack Driver App
 * Main entry point
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from '@navigation/AppNavigator';
import { initializeInterceptors } from '@services/api/interceptors';
import { Colors } from '@constants/theme';

// Ignore specific warnings in dev
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
  useEffect(() => {
    // Initialize API interceptors
    initializeInterceptors();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
