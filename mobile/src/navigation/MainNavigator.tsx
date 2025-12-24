/**
 * Main Navigator
 * Bottom tab navigation for authenticated users
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabParamList } from './types';
import { Colors, Spacing } from '@constants/theme';
import { useMessagesStore } from '@store/messagesStore';

// Screens
import HomeScreen from '@screens/main/HomeScreen';
import MapScreen from '@screens/main/MapScreen';
import TripsScreen from '@screens/main/TripsScreen';
import MessagesScreen from '@screens/main/MessagesScreen';
import ProfileScreen from '@screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getTabIcon = (routeName: keyof MainTabParamList, focused: boolean) => {
  const icons: Record<keyof MainTabParamList, string> = {
    Home: 'home',
    Map: 'map-marker',
    Trips: 'truck-delivery',
    Messages: 'message-text',
    Profile: 'account',
  };

  return icons[routeName] + (focused ? '' : '-outline');
};

export const MainNavigator: React.FC = () => {
  const unreadCount = useMessagesStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabIcon(route.name, focused);
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsScreen}
        options={{
          tabBarLabel: 'Trips',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: Colors.error,
    fontSize: 10,
  },
});

export default MainNavigator;
