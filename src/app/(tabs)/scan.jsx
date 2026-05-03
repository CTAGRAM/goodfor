import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import {
  ArrowLeft,
  Zap,
  Camera,
  AlertCircle,
  ScanLine
} from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import AnimatedPressable from "@/components/AnimatedPressable";

import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";

export default function Scan() {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const isFocused = useIsFocused();

  const scanLinePos = useSharedValue(0);

  useEffect(() => {
    scanLinePos.value = withRepeat(
      withSequence(
        withTiming(196, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePos.value }]
  }));

  // V5: Reset scanned state every time the tab gains focus
  // This fixes the black screen issue when returning from results
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      return () => {
        // Cleanup: reset flash when leaving
        setFlashEnabled(false);
      };
    }, [])
  );

  useEffect(() => {
    // Request camera permission on mount if not granted
    if (permission && !permission.granted && !permission.canAskAgain) {
      showAlert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to scan barcodes.',
        [{ text: 'OK' }]
      );
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;

    // Check if profile is completed
    if (profile && !profile.is_profile_completed) {
      setScanned(true); // Pause scanning
      showAlert(
        'Complete Your Profile',
        'To provide accurate safety analysis, we need a few details about you.',
        [
          {
            text: 'Create Profile',
            onPress: () => {
              router.push('/edit-profile');
              // Reset scanned state after navigation so it works when they come back (if they cancel)
              // But actually create profile will redirect to home.
              setScanned(false);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setScanned(false)
          }
        ]
      );
      return;
    }

    setScanned(true);

    // Navigate to processing screen with barcode
    router.push({
      pathname: '/scan-processing',
      params: { barcode: data }
    });

    // Reset after navigation
    setTimeout(() => setScanned(false), 1000);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  // Loading state while checking permission
  if (permission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />

        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Camera size={48} color={colors.mutedForeground} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            To scan product barcodes, GoodFor needs access to your camera. Your privacy is important to us.
          </Text>
          <AnimatedPressable style={styles.permissionButton} onPress={requestPermission}>
            <Camera size={20} color={colors.primaryForeground} />
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  // Camera view with barcode scanner
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* V5: Only render camera when tab is focused to prevent black screen */}
      {isFocused ? (
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashEnabled}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={toggleFlash} style={styles.flashButton}>
              <Zap size={24} color={flashEnabled ? colors.chart1 : "#FFFFFF"} />
            </Pressable>
          </View>

          {/* Scanner Frame */}
          <View style={styles.scannerContainer}>
            <View style={styles.scanFrame}>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Scanning line animation */}
              {!scanned && (
                <Animated.View style={[styles.scanLine, scanLineStyle]} />
              )}
            </View>

            <Text style={styles.instruction}>
              Position barcode within the frame
            </Text>
          </View>

          {/* Footer - positioned above tab bar */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 100 }]}>
            {/* Scan Label Button — bypass barcode */}
            <AnimatedPressable
              style={styles.scanLabelButton}
              onPress={() => {
                setScanned(true);
                router.push({
                  pathname: '/scan-error',
                  params: { barcode: 'label-scan', error: 'Direct label scan' },
                });
                setTimeout(() => setScanned(false), 1000);
              }}
            >
              <ScanLine size={18} color={colors.primaryForeground} />
              <Text style={styles.scanLabelText}>No barcode? Scan the label instead</Text>
            </AnimatedPressable>

            <View style={styles.infoCard}>
              <AlertCircle size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Make sure the barcode is well-lit and steady for best results
              </Text>
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#000' }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.chart1,
    shadowColor: colors.chart1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  instruction: {
    marginTop: spacing[8],
    fontSize: 16,
    fontFamily: fonts.sans.semiBold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    gap: 10,
  },
  scanLabelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing[6],
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanLabelText: {
    fontSize: 15,
    fontFamily: fonts.sans.bold,
    color: colors.primaryForeground,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: radius['3xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.sans.medium,
    color: colors.foreground,
  },

  // Permission screen styles
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.accent}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: fonts.heading.bold,
    color: colors.foreground,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.primary,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: fonts.sans.bold,
    color: colors.primaryForeground,
  },
});
