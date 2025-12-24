/**
 * StatusBadge Component
 * Display driver status with appropriate styling
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { DriverStatusType } from '@types/entities';
import { Colors, Spacing, Typography, BorderRadius } from '@constants/theme';

export interface StatusBadgeProps {
  status: DriverStatusType;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: ViewStyle;
}

const statusConfig: Record<
  DriverStatusType,
  { label: string; color: string; icon: string; backgroundColor: string }
> = {
  AVAILABLE: {
    label: 'Available',
    color: Colors.success,
    icon: 'check-circle',
    backgroundColor: `${Colors.success}20`,
  },
  IN_DELIVERY: {
    label: 'In Delivery',
    color: Colors.primary,
    icon: 'truck-delivery',
    backgroundColor: `${Colors.primary}20`,
  },
  ON_BREAK: {
    label: 'On Break',
    color: Colors.warning,
    icon: 'coffee',
    backgroundColor: `${Colors.warning}20`,
  },
  OFF_DUTY: {
    label: 'Off Duty',
    color: Colors.textSecondary,
    icon: 'moon-waning-crescent',
    backgroundColor: `${Colors.textSecondary}20`,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  showIcon = true,
  style,
}) => {
  const config = statusConfig[status];

  const containerStyles = [
    styles.container,
    { backgroundColor: config.backgroundColor },
    styles[size],
    style,
  ];

  const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const fontSize = size === 'small' ? 11 : size === 'medium' ? 13 : 15;

  return (
    <View style={containerStyles}>
      {showIcon && (
        <Icon name={config.icon} size={iconSize} color={config.color} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: config.color, fontSize }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    fontWeight: Typography.fontWeight.semibold as any,
  },

  // Sizes
  small: {
    paddingVertical: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
  },
  medium: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  large: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});

export default StatusBadge;
