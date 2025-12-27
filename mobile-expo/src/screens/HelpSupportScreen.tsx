import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const FAQ_ITEMS = [
  {
    question: 'How do I start a trip?',
    answer: 'Go to the Trips tab, select an assigned trip, and tap "Start Trip" to begin. Make sure your GPS is enabled.',
  },
  {
    question: 'Why is my GPS not working?',
    answer: 'Check that location services are enabled in your device settings. Go to App Settings and ensure GPS Tracking is turned on.',
  },
  {
    question: 'How do I change my status?',
    answer: 'On the Home screen, tap the status dropdown and select your current status (Available, On Break, or Off Duty).',
  },
  {
    question: 'What happens if I lose internet connection?',
    answer: 'The app will continue tracking your location offline. Data will sync automatically when you regain connection.',
  },
  {
    question: 'How do I contact my fleet manager?',
    answer: 'Use the contact options below to reach your fleet manager via phone or email.',
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const handleCall = () => {
    Linking.openURL('tel:+1234567890').catch(() => {
      Alert.alert('Error', 'Unable to make a call');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@trucktrack.app?subject=Driver%20App%20Support').catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback or issue');
      return;
    }

    // In a real app, this would send to an API
    Alert.alert(
      'Feedback Sent',
      'Thank you for your feedback! Our support team will get back to you soon.',
      [{ text: 'OK', onPress: () => setFeedbackText('') }]
    );
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Contact Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Fleet Manager</Text>

            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                <View style={[styles.contactIcon, { backgroundColor: '#28A74520' }]}>
                  <Ionicons name="call" size={24} color="#28A745" />
                </View>
                <Text style={styles.contactLabel}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                <View style={[styles.contactIcon, { backgroundColor: '#1976D220' }]}>
                  <Ionicons name="mail" size={24} color="#1976D2" />
                </View>
                <Text style={styles.contactLabel}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

            {FAQ_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </View>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send Feedback</Text>

            <View style={styles.feedbackCard}>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Describe your issue or feedback..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={feedbackText}
                onChangeText={setFeedbackText}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !feedbackText.trim() && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitFeedback}
                disabled={!feedbackText.trim()}
              >
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Send Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Emergency */}
          <View style={styles.emergencyCard}>
            <Ionicons name="warning" size={24} color="#DC3545" />
            <View style={styles.emergencyText}>
              <Text style={styles.emergencyTitle}>Emergency?</Text>
              <Text style={styles.emergencyDescription}>
                For urgent issues, call the emergency hotline directly
              </Text>
            </View>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => Linking.openURL('tel:911')}
            >
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  feedbackInput: {
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DC354520',
    marginBottom: 24,
  },
  emergencyText: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC3545',
  },
  emergencyDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emergencyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
