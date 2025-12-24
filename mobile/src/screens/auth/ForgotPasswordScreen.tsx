/**
 * Forgot Password Screen
 * Password reset request screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthStackScreenProps } from '@navigation/types';
import { Button, TextInput } from '@components/common';
import { Colors, Spacing, Typography } from '@constants/theme';
import { api } from '@services/api/client';

type Props = AuthStackScreenProps<'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setIsSuccess(true);
    } catch (error: any) {
      // Show success even on error to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            If an account exists with {email}, you will receive a password reset link shortly.
          </Text>
          <Button
            title="Back to Login"
            onPress={handleBackToLogin}
            variant="primary"
            size="large"
            fullWidth
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="email-outline"
              testID="forgot-password-email-input"
            />

            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              size="large"
              style={styles.submitButton}
              testID="forgot-password-submit-button"
            />

            <Button
              title="Back to Login"
              onPress={handleBackToLogin}
              variant="text"
              size="medium"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successMessage: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.lg,
  },
});

export default ForgotPasswordScreen;
