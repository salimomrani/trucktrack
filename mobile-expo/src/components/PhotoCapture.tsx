/**
 * Photo Capture Component
 * Feature: 015-proof-of-delivery (T030, T031)
 *
 * Captures and compresses photos for proof of delivery.
 * Uses expo-camera for capture and expo-image-manipulator for compression.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_PHOTO_SIZE_KB = 500;

export interface CapturedPhoto {
  uri: string;
  base64: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
}

interface PhotoCaptureProps {
  visible: boolean;
  onClose: () => void;
  onPhotoCapture: (photo: CapturedPhoto) => void;
  maxPhotos?: number;
  currentPhotoCount?: number;
}

export default function PhotoCapture({
  visible,
  onClose,
  onPhotoCapture,
  maxPhotos = 3,
  currentPhotoCount = 0,
}: PhotoCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{
    uri: string;
    base64: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  // Check if we can add more photos
  const canAddMore = currentPhotoCount < maxPhotos;

  // Toggle camera facing
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Capture photo
  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      // Get current location
      let latitude = 0;
      let longitude = 0;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (locError) {
        console.log('Could not get location for photo:', locError);
      }

      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (!photo || !photo.base64) {
        throw new Error('Failed to capture photo');
      }

      // Compress photo (T031)
      const compressed = await compressPhoto(photo.uri);

      setPreviewPhoto({
        uri: compressed.uri,
        base64: compressed.base64 || '',
        latitude,
        longitude,
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Compress photo to max 500KB (T031)
  const compressPhoto = async (uri: string): Promise<{ uri: string; base64?: string }> => {
    let quality = 0.8;
    let result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Max width 1200px
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    // Check size and reduce quality if needed
    while (result.base64 && getBase64SizeKB(result.base64) > MAX_PHOTO_SIZE_KB && quality > 0.3) {
      quality -= 0.1;
      result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: Math.floor(1200 * quality) } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
    }

    return { uri: result.uri, base64: result.base64 };
  };

  // Calculate base64 size in KB
  const getBase64SizeKB = (base64: string): number => {
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((base64.length * 3) / 4 - padding) / 1024;
  };

  // Confirm photo
  const handleConfirm = () => {
    if (!previewPhoto) return;

    const capturedPhoto: CapturedPhoto = {
      uri: previewPhoto.uri,
      base64: previewPhoto.base64,
      latitude: previewPhoto.latitude,
      longitude: previewPhoto.longitude,
      capturedAt: new Date().toISOString(),
    };

    onPhotoCapture(capturedPhoto);
    setPreviewPhoto(null);
    onClose();
  };

  // Retake photo
  const handleRetake = () => {
    setPreviewPhoto(null);
  };

  // Close modal
  const handleClose = () => {
    setPreviewPhoto(null);
    onClose();
  };

  // Permission check
  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionTitle}>Permission requise</Text>
          <Text style={styles.permissionText}>
            L'accès à la caméra est nécessaire pour prendre des photos.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Photo {currentPhotoCount + 1}/{maxPhotos}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {previewPhoto ? (
          // Preview mode
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewPhoto.uri }} style={styles.previewImage} />

            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Reprendre</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Utiliser</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Camera mode
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            >
              {/* Camera controls overlay */}
              <View style={styles.cameraOverlay}>
                {/* Flip camera */}
                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                  <Ionicons name="camera-reverse" size={28} color="#fff" />
                </TouchableOpacity>

                {/* Capture button */}
                <View style={styles.captureContainer}>
                  <TouchableOpacity
                    style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <ActivityIndicator color="#fff" size="large" />
                    ) : (
                      <View style={styles.captureInner} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Placeholder for balance */}
                <View style={{ width: 44 }} />
              </View>
            </CameraView>
          </View>
        )}

        {/* Info banner */}
        {!previewPhoto && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.infoText}>
              Prenez une photo du colis ou de la livraison (max {MAX_PHOTO_SIZE_KB}KB)
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  flipButton: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
  },
  captureContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  previewContainer: {
    flex: 1,
    marginTop: 100,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#666',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#28A745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
