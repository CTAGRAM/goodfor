import { View, Text, Image, Animated, Platform, Dimensions, Linking } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/theme";
import { ScanningRings } from '@/components/AnimatedEffects';
import LottieView from 'lottie-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Splash() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    // Manually trigger Lottie animation (autoPlay is unreliable on Android)
    setTimeout(() => {
      lottieRef.current?.play();
    }, 100);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Animate dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Fade in mascot after a short delay
    Animated.timing(mascotAnim, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Check for deep-link from widget
    const checkDeepLink = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('goodfor://scan')) {
          // Widget "Scan Now" was tapped — go straight to scanner
          setTimeout(() => {
            if (user && profile) {
              router.replace('/(tabs)/scan');
            } else {
              router.replace('/onboarding/welcome');
            }
          }, 1500); // Shorter delay for widget launch
          return true;
        }
      } catch (e) {
        console.log('[Splash] Deep-link check failed:', e.message);
      }
      return false;
    };

    // Navigate after 2.5 seconds — home for logged-in, onboarding for new users
    checkDeepLink().then((handled) => {
      if (!handled) {
        const timer = setTimeout(() => {
          if (user && profile) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/onboarding/welcome');
          }
        }, 2500);
        // Store cleanup in ref-like closure
        cleanupRef.current = () => clearTimeout(timer);
      }
    });

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "33%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      {/* Background blurs */}
      <View
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          backgroundColor: colors.accent,
          opacity: 0.4,
          borderRadius: 160,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -120,
          left: -120,
          width: 384,
          height: 384,
          backgroundColor: colors.chart1,
          opacity: 0.1,
          borderRadius: 192,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 256,
          height: 256,
          backgroundColor: colors.accent,
          opacity: 0.2,
          borderRadius: 128,
          marginLeft: -128,
          marginTop: -128,
        }}
      />

      {/* Main content */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: '100%', alignItems: 'center', overflow: 'visible' }}>
          <LottieView
            ref={lottieRef}
            source={require('../assets/animations/logo.json')}
            loop
            style={{ width: SCREEN_WIDTH * 0.85, height: (SCREEN_WIDTH * 0.85) * 0.25, alignSelf: 'center' }}
            resizeMode="contain"
            renderMode={Platform.OS === 'android' ? 'SOFTWARE' : 'AUTOMATIC'}
          />
        </View>

        <Text
          style={{
            marginTop: 16,
            color: colors.mutedForeground,
            fontFamily: "Rubik_500Medium",
            fontSize: 14,
            letterSpacing: 0.5,
          }}
        >
          Safe choices for your family
        </Text>
      </View>

      {/* Bottom section */}
      <View
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          alignItems: "center",
          gap: 24,
          paddingHorizontal: 48,
        }}
      >
        {/* Progress bar */}
        <View
          style={{
            width: 120,
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              width: progressWidth,
              backgroundColor: colors.primary,
              borderRadius: 2,
            }}
          />
        </View>

        {/* Animated dots */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
              opacity: dotAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.5],
              }),
            }}
          />
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
              opacity: dotAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0.3],
              }),
            }}
          />
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.primary,
              opacity: 0.3,
            }}
          />
        </View>
      </View>

      {/* Footer text */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: colors.mutedForeground,
            opacity: 0.6,
            fontFamily: "Rubik_500Medium",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Powered by HealthyInsights
        </Text>
      </View>
    </View>
  );
}
