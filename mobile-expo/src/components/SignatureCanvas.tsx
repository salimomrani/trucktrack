/**
 * Signature Canvas Component
 * Feature: 015-proof-of-delivery (T022, T023)
 *
 * Captures electronic signatures using react-native-svg and PanResponder.
 * Simple and reliable on Android.
 */

import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder, GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 64;
const CANVAS_HEIGHT = 250;
const MIN_POINTS = 50; // Minimum points for valid signature

export interface SignatureCanvasRef {
  getSignature: () => Promise<string | null>;
  clear: () => void;
  isEmpty: () => boolean;
}

interface SignatureCanvasProps {
  onSignatureChange?: (hasSignature: boolean) => void;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ onSignatureChange, onDrawStart, onDrawEnd, disabled = false }, ref) => {
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [hasSignature, setHasSignature] = useState(false);
    const [totalPoints, setTotalPoints] = useState(0);

    const pointsRef = useRef<Point[]>([]);
    const containerRef = useRef<View>(null);

    // Keep refs in sync with state for getSignature closure
    const pathsRef = useRef<string[]>([]);
    const hasSignatureRef = useRef(false);

    // Sync refs with state
    pathsRef.current = paths;
    hasSignatureRef.current = hasSignature;

    const generateSvgContentFromPaths = (pathsToUse: string[]): string => {
      const allPaths = pathsToUse.filter(p => p.length > 0);
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
          <rect width="100%" height="100%" fill="white"/>
          ${allPaths.map(p => `<path d="${p}" stroke="black" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
        </svg>
      `;
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      return `data:image/svg+xml;base64,${base64}`;
    };

    useImperativeHandle(ref, () => ({
      getSignature: async () => {
        // Use refs to get current values (avoid stale closure)
        if (!hasSignatureRef.current || pathsRef.current.length === 0) {
          return null;
        }
        return generateSvgContentFromPaths(pathsRef.current);
      },
      clear: () => {
        setPaths([]);
        setCurrentPath('');
        setHasSignature(false);
        setTotalPoints(0);
        pointsRef.current = [];
        pathsRef.current = [];
        hasSignatureRef.current = false;
        onSignatureChange?.(false);
      },
      isEmpty: () => !hasSignatureRef.current,
    }));

    const generateSvgContent = (): string => {
      const allPaths = [...paths, currentPath].filter(p => p.length > 0);
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
          <rect width="100%" height="100%" fill="white"/>
          ${allPaths.map(p => `<path d="${p}" stroke="black" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
        </svg>
      `;
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      return `data:image/svg+xml;base64,${base64}`;
    };

    const pointToPath = (points: Point[]): string => {
      if (points.length === 0) return '';
      if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
      }

      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      return path;
    };

    const getLocationFromEvent = (event: GestureResponderEvent): Point => {
      return {
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      };
    };

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event) => {
          onDrawStart?.();
          const point = getLocationFromEvent(event);
          pointsRef.current = [point];
          setCurrentPath(`M ${point.x} ${point.y}`);
        },
        onPanResponderMove: (event) => {
          const point = getLocationFromEvent(event);
          pointsRef.current.push(point);
          const newPath = pointToPath(pointsRef.current);
          setCurrentPath(newPath);
        },
        onPanResponderRelease: () => {
          if (pointsRef.current.length > 0) {
            const finalPath = pointToPath(pointsRef.current);
            setPaths(prev => [...prev, finalPath]);
            const newTotalPoints = totalPoints + pointsRef.current.length;
            setTotalPoints(newTotalPoints);

            const isValid = newTotalPoints >= MIN_POINTS;
            setHasSignature(isValid);
            onSignatureChange?.(isValid);
          }
          setCurrentPath('');
          pointsRef.current = [];
          onDrawEnd?.();
        },
        onPanResponderTerminate: () => {
          setCurrentPath('');
          pointsRef.current = [];
          onDrawEnd?.();
        },
      })
    ).current;

    const handleClear = () => {
      setPaths([]);
      setCurrentPath('');
      setHasSignature(false);
      setTotalPoints(0);
      pointsRef.current = [];
      onSignatureChange?.(false);
    };

    const allPaths = [...paths];
    if (currentPath) {
      allPaths.push(currentPath);
    }

    return (
      <View style={styles.container}>
        <View style={styles.labelContainer}>
          <Ionicons name="pencil" size={20} color="#666" />
          <Text style={styles.label}>Signature du client</Text>
        </View>

        <View
          ref={containerRef}
          style={[styles.canvasContainer, disabled && styles.disabled]}
          {...panResponder.panHandlers}
        >
          <Svg
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={styles.canvas}
          >
            {allPaths.map((path, index) => (
              <Path
                key={index}
                d={path}
                stroke="black"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>

          {!hasSignature && allPaths.length === 0 && (
            <View style={styles.placeholderOverlay} pointerEvents="none">
              <Text style={styles.placeholderText}>Signez ici</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.clearButton, allPaths.length === 0 && styles.clearButtonDisabled]}
            onPress={handleClear}
            disabled={allPaths.length === 0 || disabled}
          >
            <Ionicons name="trash-outline" size={20} color={allPaths.length > 0 ? '#dc3545' : '#999'} />
            <Text style={[styles.clearButtonText, allPaths.length === 0 && styles.clearButtonTextDisabled]}>
              Effacer
            </Text>
          </TouchableOpacity>

          {hasSignature && (
            <View style={styles.validBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#28A745" />
              <Text style={styles.validText}>Signature valide</Text>
            </View>
          )}
        </View>

        <Text style={styles.hint}>
          Dessinez votre signature ci-dessus
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  canvasContainer: {
    height: CANVAS_HEIGHT,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  canvas: {
    backgroundColor: 'white',
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#ccc',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff3f3',
  },
  clearButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#dc3545',
    marginLeft: 4,
  },
  clearButtonTextDisabled: {
    color: '#999',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
  },
  validText: {
    fontSize: 14,
    color: '#28A745',
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

SignatureCanvas.displayName = 'SignatureCanvas';

export default SignatureCanvas;
