/**
 * Driver Mobile App - Theme & Design Tokens
 */

export const Colors = {
  // Primary colors
  primary: '#1976D2',
  primaryDark: '#1565C0',
  primaryLight: '#42A5F5',

  // Secondary colors
  secondary: '#FF6F00',
  secondaryDark: '#E65100',
  secondaryLight: '#FFA726',

  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',

  // Background colors
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',

  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',

  // Border colors
  border: '#E0E0E0',
  borderLight: '#EEEEEE',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
} as const;

export const DarkColors = {
  ...Colors,
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textDisabled: '#666666',
  border: '#333333',
  borderLight: '#2C2C2C',
  overlay: 'rgba(255, 255, 255, 0.1)',
  overlayLight: 'rgba(255, 255, 255, 0.05)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  fontSize: FontSize,
  fontWeight: FontWeight,
  shadow: Shadow,
} as const;

export const DarkTheme = {
  ...Theme,
  colors: DarkColors,
} as const;

export type ThemeColors = typeof Colors;
export type ThemeSpacing = typeof Spacing;
