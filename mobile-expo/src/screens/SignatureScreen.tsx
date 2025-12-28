/**
 * Signature Screen
 * Feature: 015-proof-of-delivery (T024, T028, T033, T034, T035)
 *
 * Screen for capturing electronic signature for proof of delivery.
 * Supports both signed and refused delivery statuses.
 * Includes optional photo capture.
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import SignatureCanvas, { SignatureCanvasRef } from '../components/SignatureCanvas';
import PhotoCapture, { CapturedPhoto } from '../components/PhotoCapture';
import { usePodStore, CapturePhoto } from '../store/podStore';
import { ProofStatus } from '../services/api';

type SignatureRouteParams = {
  Signature: { tripId: string; tripOrigin: string; tripDestination: string };
};

type TabType = 'sign' | 'refuse';

export default function SignatureScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SignatureRouteParams, 'Signature'>>();
  const { tripId, tripOrigin, tripDestination } = route.params;

  const signatureRef = useRef<SignatureCanvasRef>(null);

  // Store
  const {
    captureSession,
    isSaving,
    saveError,
    startCapture,
    setSignature,
    setSignerName,
    setLocation,
    setStatus,
    setRefusalReason,
    addPhoto,
    removePhoto,
    submitProof,
    cancelCapture,
  } = usePodStore();

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('sign');
  const [hasValidSignature, setHasValidSignature] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize capture session
  useEffect(() => {
    startCapture(tripId);
    fetchLocation();

    return () => {
      // Cleanup on unmount
    };
  }, [tripId]);

  // Fetch current location
  const fetchLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission de localisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy || 10
      );
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Impossible de récupérer la position');
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setStatus(tab === 'sign' ? 'SIGNED' : 'REFUSED');

    // Clear signature when switching tabs
    signatureRef.current?.clear();
    setHasValidSignature(false);
  };

  // Handle signature change
  const handleSignatureChange = async (hasSignature: boolean) => {
    setHasValidSignature(hasSignature);

    if (hasSignature) {
      const signatureData = await signatureRef.current?.getSignature();
      if (signatureData) {
        setSignature(signatureData);
      }
    }
  };

  // Handle photo capture (T033)
  const handlePhotoCapture = (photo: CapturedPhoto) => {
    const capturePhoto: CapturePhoto = {
      uri: photo.uri,
      base64: photo.base64,
      latitude: photo.latitude,
      longitude: photo.longitude,
      capturedAt: photo.capturedAt,
    };
    addPhoto(capturePhoto);
  };

  // Handle photo removal (T035)
  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Supprimer la photo',
      'Voulez-vous vraiment supprimer cette photo?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removePhoto(index),
        },
      ]
    );
  };

  // Handle submit
  const handleSubmit = async () => {
    // Validate
    if (!hasValidSignature) {
      Alert.alert('Erreur', 'Veuillez fournir une signature valide.');
      return;
    }

    if (activeTab === 'refuse' && !captureSession?.refusalReason.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer le motif du refus.');
      return;
    }

    if (!captureSession?.latitude || !captureSession?.longitude) {
      Alert.alert('Erreur', 'Position GPS requise. Veuillez activer la localisation.');
      return;
    }

    // Get final signature
    const signatureData = await signatureRef.current?.getSignature();
    if (!signatureData) {
      Alert.alert('Erreur', 'Impossible de récupérer la signature.');
      return;
    }

    // Submit with signature passed directly to avoid race condition with state update
    const result = await submitProof(signatureData);

    if (result.success) {
      const message = result.isOffline
        ? 'Preuve enregistrée localement. Elle sera synchronisée automatiquement.'
        : 'Preuve de livraison enregistrée avec succès!';

      Alert.alert('Succès', message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      Alert.alert('Erreur', result.error || 'Échec de l\'enregistrement de la preuve.');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    Alert.alert(
      'Annuler',
      'Voulez-vous vraiment annuler? La signature sera perdue.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            cancelCapture();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const canSubmit = hasValidSignature &&
    (activeTab === 'sign' || captureSession?.refusalReason.trim()) &&
    captureSession?.latitude !== null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isDrawing}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Preuve de livraison</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Trip Info */}
          <View style={styles.tripInfo}>
            <View style={styles.tripRoute}>
              <Ionicons name="location" size={20} color="#28A745" />
              <Text style={styles.tripOrigin} numberOfLines={1}>{tripOrigin}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#666" />
            <View style={styles.tripRoute}>
              <Ionicons name="flag" size={20} color="#dc3545" />
              <Text style={styles.tripDestination} numberOfLines={1}>{tripDestination}</Text>
            </View>
          </View>

          {/* Location Status */}
          <View style={styles.locationStatus}>
            {locationLoading ? (
              <>
                <ActivityIndicator size="small" color="#1976D2" />
                <Text style={styles.locationText}>Récupération de la position...</Text>
              </>
            ) : locationError ? (
              <>
                <Ionicons name="warning" size={20} color="#FFC107" />
                <Text style={styles.locationErrorText}>{locationError}</Text>
                <TouchableOpacity onPress={fetchLocation}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="location" size={20} color="#28A745" />
                <Text style={styles.locationSuccessText}>Position GPS capturée</Text>
              </>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'sign' && styles.activeTab]}
              onPress={() => handleTabChange('sign')}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={activeTab === 'sign' ? '#28A745' : '#666'}
              />
              <Text style={[styles.tabText, activeTab === 'sign' && styles.activeTabText]}>
                Livraison confirmée
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'refuse' && styles.activeTabRefuse]}
              onPress={() => handleTabChange('refuse')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={activeTab === 'refuse' ? '#dc3545' : '#666'}
              />
              <Text style={[styles.tabText, activeTab === 'refuse' && styles.activeTabTextRefuse]}>
                Livraison refusée
              </Text>
            </TouchableOpacity>
          </View>

          {/* Refusal Reason (T028) */}
          {activeTab === 'refuse' && (
            <View style={styles.refusalContainer}>
              <Text style={styles.inputLabel}>Motif du refus *</Text>
              <TextInput
                style={styles.refusalInput}
                placeholder="Indiquez la raison du refus..."
                value={captureSession?.refusalReason || ''}
                onChangeText={setRefusalReason}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {captureSession?.refusalReason?.length || 0}/500
              </Text>
            </View>
          )}

          {/* Signer Name (Optional - T049) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nom du signataire (optionnel)</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Nom de la personne qui signe"
              value={captureSession?.signerName || ''}
              onChangeText={setSignerName}
              maxLength={200}
            />
          </View>

          {/* Signature Canvas */}
          <View style={styles.signatureWrapper}>
            <SignatureCanvas
              ref={signatureRef}
              onSignatureChange={handleSignatureChange}
              onDrawStart={() => setIsDrawing(true)}
              onDrawEnd={() => setIsDrawing(false)}
              disabled={isSaving}
            />
          </View>

          {/* Photos Section (T033, T034, T035) */}
          <View style={styles.photosSection}>
            <View style={styles.photosSectionHeader}>
              <View style={styles.photosLabelContainer}>
                <Ionicons name="camera" size={20} color="#666" />
                <Text style={styles.photosLabel}>Photos (optionnel)</Text>
              </View>
              <Text style={styles.photosCount}>
                {captureSession?.photos.length || 0}/3
              </Text>
            </View>

            {/* Photo Thumbnails (T034) */}
            {captureSession?.photos && captureSession.photos.length > 0 && (
              <View style={styles.photoThumbnails}>
                {captureSession.photos.map((photo, index) => (
                  <View key={index} style={styles.photoThumbnailContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Photo Button (T033) */}
            {(!captureSession?.photos || captureSession.photos.length < 3) && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => setShowPhotoCapture(true)}
                disabled={isSaving}
              >
                <Ionicons name="add-circle-outline" size={24} color="#1976D2" />
                <Text style={styles.addPhotoButtonText}>Ajouter une photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photo Capture Modal */}
          <PhotoCapture
            visible={showPhotoCapture}
            onClose={() => setShowPhotoCapture(false)}
            onPhotoCapture={handlePhotoCapture}
            maxPhotos={3}
            currentPhotoCount={captureSession?.photos.length || 0}
          />

          {/* Error Display */}
          {saveError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#dc3545" />
              <Text style={styles.errorBannerText}>{saveError}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              activeTab === 'refuse' ? styles.submitButtonRefuse : styles.submitButtonSign,
              !canSubmit && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={activeTab === 'sign' ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.submitButtonText}>
                  {activeTab === 'sign' ? 'Confirmer la livraison' : 'Enregistrer le refus'}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripOrigin: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  tripDestination: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  locationErrorText: {
    fontSize: 14,
    color: '#FFC107',
    marginLeft: 8,
    flex: 1,
  },
  locationSuccessText: {
    fontSize: 14,
    color: '#28A745',
    marginLeft: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginLeft: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#e8f5e9',
  },
  activeTabRefuse: {
    backgroundColor: '#ffebee',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#28A745',
    fontWeight: '600',
  },
  activeTabTextRefuse: {
    color: '#dc3545',
    fontWeight: '600',
  },
  refusalContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  refusalInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  signatureWrapper: {
    // Prevents ScrollView from intercepting touch events
  },
  photosSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  photosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photosLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photosLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  photosCount: {
    fontSize: 14,
    color: '#666',
  },
  photoThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  photoThumbnailContainer: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976D2',
    borderStyle: 'dashed',
  },
  addPhotoButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#dc3545',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  submitButtonSign: {
    backgroundColor: '#28A745',
  },
  submitButtonRefuse: {
    backgroundColor: '#dc3545',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
