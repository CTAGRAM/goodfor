import { View, Text, Image, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/theme";

export default function Splash() {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    // Navigate to onboarding after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace("/onboarding/welcome");
    }, 2500);

    return () => clearTimeout(timer);
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
        <Image
          source={{
            uri: "https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/onAkNUUAGm7/ai/GoodFor-1-x16DQfFL43Z.png",
          }}
          style={{ width: 200, height: 48 }}
          resizeMode="contain"
        />
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
