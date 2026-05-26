import { View, Text, Animated, Pressable, Dimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { Video, ResizeMode } from "expo-av";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { colors, fonts } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STEPS = [
  "Analysing your preferences…",
  "Setting up your profile…",
  "Tailoring ingredient insights…",
  "Calibrating safety scores…",
  "Your experience is ready ✓",
];

const VIDEO_SOURCE = require("../../../assets/video/demo_720p.mp4");

export default function Personalizing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);

  // Animations
  const progressAnim = useRef(new Animated.Value(0)).current;
  const panelFade = useRef(new Animated.Value(0)).current;
  const panelSlide = useRef(new Animated.Value(40)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(24)).current;
  const dotPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Panel entrance
    Animated.parallel([
      Animated.timing(panelFade, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.spring(panelSlide, {
        toValue: 0, tension: 40, friction: 8, useNativeDriver: true,
      }),
    ]).start();

    // Fill progress over 4s
    Animated.timing(progressAnim, {
      toValue: 1, duration: 4000, useNativeDriver: false,
    }).start();

    // Pulsing dot while loading
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 0.3, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Step text rotation
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 800);

    // Show button after progress fills
    const buttonTimer = setTimeout(() => {
      pulse.stop();
      dotPulse.setValue(1);
      setShowButton(true);
      Animated.parallel([
        Animated.timing(buttonFade, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.spring(buttonSlide, {
          toValue: 0, tension: 50, friction: 8, useNativeDriver: true,
        }),
      ]).start();
    }, 4400);

    return () => {
      clearInterval(interval);
      clearTimeout(buttonTimer);
      pulse.stop();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Full-screen video ── */}
      <Video
        source={VIDEO_SOURCE}
        shouldPlay
        isLooping
        isMuted
        resizeMode={ResizeMode.COVER}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Top gradient (subtle, for status bar readability) ── */}
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "transparent"]}
        style={styles.topGradient}
      />

      {/* ── Back button ── */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 8 }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={22} color="#fff" />
      </Pressable>

      {/* ── Bottom gradient ── */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(24,36,28,0.5)",
          "rgba(24,36,28,0.85)",
          "rgba(24,36,28,0.95)",
        ]}
        locations={[0, 0.3, 0.65, 1]}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + 20 }]}
      >
        <Animated.View
          style={[
            styles.bottomContent,
            {
              opacity: panelFade,
              transform: [{ translateY: panelSlide }],
            },
          ]}
        >
          {/* Status indicator */}
          <View style={styles.statusRow}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  opacity: dotPulse,
                  backgroundColor: showButton ? "#34A853" : "#FFF",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {STEPS[stepIndex]}
            </Text>
          </View>

          {/* Progress track */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            />
          </View>

          {/* ── Button area ── */}
          {showButton && (
            <Animated.View
              style={{
                opacity: buttonFade,
                transform: [{ translateY: buttonSlide }],
              }}
            >
              <Pressable
                onPress={() => router.replace("/onboarding/complete")}
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.ctaText}>Continue</Text>
                <View style={styles.ctaArrowCircle}>
                  <ArrowRight size={16} color={colors.primary} strokeWidth={2.5} />
                </View>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1a10",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 2,
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 80,
    justifyContent: "flex-end",
  },
  bottomContent: {
    paddingHorizontal: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Rubik_500Medium",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.1,
  },
  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#34A853",
  },
  ctaButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "Rubik_700Bold",
    color: "#243628",
  },
  ctaArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(36,54,40,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
