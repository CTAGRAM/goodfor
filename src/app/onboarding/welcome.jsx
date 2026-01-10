import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ShieldCheck,
  CheckCircle2,
  Heart,
  ArrowRight,
} from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      {/* Background blurs */}
      <View
        style={{
          position: "absolute",
          top: -128,
          right: -128,
          width: 256,
          height: 256,
          backgroundColor: colors.accent,
          opacity: 0.3,
          borderRadius: 128,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 200,
          left: -96,
          width: 192,
          height: 192,
          backgroundColor: colors.chart1,
          opacity: 0.05,
          borderRadius: 96,
        }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            marginLeft: -12,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 32 }}
      >
        {/* Hero illustration */}
        <View style={{ marginTop: 32, marginBottom: 40, alignItems: "center" }}>
          <View
            style={{
              width: 240,
              height: 240,
              backgroundColor: "rgba(255,255,255,0.4)",
              borderRadius: 120,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.5)",
            }}
          >
            <View
              style={{
                width: 192,
                height: 192,
                backgroundColor: colors.accent,
                opacity: 0.5,
                borderRadius: 96,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck
                size={96}
                color={colors.primary}
                style={{ opacity: 0.8 }}
              />
            </View>

            {/* Floating badge */}
            <View
              style={{
                position: "absolute",
                top: -8,
                right: -8,
                width: 56,
                height: 56,
                backgroundColor: colors.card,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: 0.5,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: "12deg" }],
              }}
            >
              <CheckCircle2 size={28} color={colors.chart1} />
            </View>

            {/* Floating heart */}
            <View
              style={{
                position: "absolute",
                bottom: -16,
                left: -8,
                width: 48,
                height: 48,
                backgroundColor: colors.card,
                borderRadius: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: 0.5,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: "-12deg" }],
              }}
            >
              <Heart
                size={24}
                color={colors.destructive}
                fill={colors.destructive}
              />
            </View>
          </View>
        </View>

        {/* Pagination dots */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 40,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.chart1,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.mutedForeground,
              opacity: 0.3,
            }}
          />
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.mutedForeground,
              opacity: 0.3,
            }}
          />
        </View>

        {/* Content */}
        <View style={{ gap: 24 }}>
          <Text
            style={{
              fontSize: 34,
              fontFamily: "Rubik_800ExtraBold",
              color: colors.foreground,
              lineHeight: 38,
              letterSpacing: -0.5,
            }}
          >
            Make safer choices{"\n"}for your family
          </Text>

          <Text
            style={{
              fontSize: 17,
              color: colors.mutedForeground,
              lineHeight: 26,
              maxWidth: "90%",
            }}
          >
            Scan everyday products and get clear, age-aware safety ratings you
            can understand and trust.
          </Text>
        </View>

        {/* Badge */}
        <View
          style={{
            marginTop: 40,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: colors.accent,
              opacity: 0.3,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.accent,
              opacity: 0.2,
            }}
          >
            <Text style={{ fontSize: 16 }}>⭐</Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Rubik_700Bold",
                color: colors.primary,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Trusted by Parents
            </Text>
          </View>
        </View>

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 40,
          paddingTop: 32,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          onPress={() => router.push("/onboarding/how-scanning-works")}
          style={{
            width: "100%",
            height: 64,
            backgroundColor: colors.primary,
            borderRadius: 32,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              color: colors.primaryForeground,
              fontSize: 18,
              fontFamily: "Rubik_700Bold",
            }}
          >
            Get started
          </Text>
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
            }}
          >
            <ArrowRight size={20} color={colors.primaryForeground} />
          </View>
        </Pressable>

        <Pressable
          style={{ paddingHorizontal: 24, paddingVertical: 8, marginTop: 16 }}
        >
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 14,
              fontFamily: "Rubik_600SemiBold",
              textAlign: "center",
            }}
          >
            Already have an account? Sign in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
