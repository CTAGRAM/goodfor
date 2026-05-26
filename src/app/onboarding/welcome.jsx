import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, ArrowRight, Star, Leaf } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f6f5" }}>
      <StatusBar style="dark" />

      {/* Header - GoodFor Logo */}
      <View style={{ paddingTop: insets.top + 20, alignItems: "center" }}>
        <Image
          source={{
            uri: "https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/onAkNUUAGm7/ai/GoodFor-1-x16DQfFL43Z.png",
          }}
          style={{ width: 150, height: 36 }}
          resizeMode="contain"
        />
      </View>

      {/* Main Content Container */}
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Family Safe Badge */}
        <View
          style={{
            marginTop: 32,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: "#d4f0d9",
            borderRadius: 20,
          }}
        >
          <CheckCircle size={16} color="#3b7a4d" fill="#3b7a4d" />
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Rubik_600SemiBold",
              color: "#3b7a4d",
            }}
          >
            Family Safe
          </Text>
        </View>

        {/* Main Title with Panda Overlay */}
        <View style={{ marginTop: 24, position: "relative" }}>
          {/* Text Content */}
          <View style={{ zIndex: 2 }}>
            <Text
              style={{
                fontSize: 44,
                fontFamily: "Rubik_800ExtraBold",
                color: "#1a1a1a",
                lineHeight: 52,
                letterSpacing: -1,
              }}
            >
              Make Better
            </Text>
            <Text
              style={{
                fontSize: 44,
                fontFamily: "Rubik_800ExtraBold",
                color: "#4a9960",
                lineHeight: 52,
                letterSpacing: -1,
              }}
            >
              Choices
            </Text>
            <Text
              style={{
                fontSize: 44,
                fontFamily: "Rubik_800ExtraBold",
                color: "#1a1a1a",
                lineHeight: 52,
                letterSpacing: -1,
              }}
            >
              Calmly.
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                marginTop: 16,
                fontSize: 16,
                color: "#6c7570",
                lineHeight: 24,
                fontFamily: "Rubik_400Regular",
                maxWidth: "65%",
              }}
            >
              Healthy grocery & meal assistant,{"\n"}designed for your family.
            </Text>
          </View>

          {/* Floating Leaf Top Right */}
          <View
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              width: 40,
              height: 40,
              zIndex: 3,
            }}
          >
            <Leaf size={28} color="#4a9960" style={{ transform: [{ rotate: "25deg" }] }} />
          </View>

          {/* Panda Image - Positioned to overlap */}
          <View
            style={{
              position: "absolute",
              right: -40,
              top: 120,
              width: 340,
              height: 340,
              zIndex: 1,
            }}
          >
            <Image
              source={require("../../../assets/images/panda-bamboo.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>

          {/* Floating Leaf Bottom Right */}
          <View
            style={{
              position: "absolute",
              right: 10,
              top: 380,
              width: 40,
              height: 40,
              zIndex: 3,
            }}
          >
            <Leaf size={24} color="#4a9960" style={{ transform: [{ rotate: "-15deg" }] }} />
          </View>
        </View>

        {/* Trusted Badge */}
        <View
          style={{
            marginTop: 320,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: "#f0f4f1",
            borderRadius: 20,
            alignSelf: "flex-start",
          }}
        >
          <Star size={16} color="#243628" fill="#243628" />
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Rubik_700Bold",
              color: "#243628",
              letterSpacing: 0.5,
            }}
          >
            Trusted by Parents
          </Text>
        </View>

        {/* Description */}
        <Text
          style={{
            marginTop: 24,
            fontSize: 16,
            color: "#6c7570",
            lineHeight: 26,
            fontFamily: "Rubik_400Regular",
            maxWidth: "90%",
          }}
        >
          Scan everyday products and get clear, age-aware safety ratings you can
          understand and trust.
        </Text>
      </View>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          paddingTop: 24,
          backgroundColor: "#f5f6f5",
        }}
      >
        {/* Get Started Button */}
        <Pressable
          onPress={() => router.push("/onboarding/how-scanning-works")}
          style={{
            width: "100%",
            height: 56,
            backgroundColor: "#2d5238",
            borderRadius: 28,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 17,
              fontFamily: "Rubik_700Bold",
            }}
          >
            Get Started
          </Text>
          <View
            style={{
              width: 28,
              height: 28,
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowRight size={16} color="#ffffff" />
          </View>
        </Pressable>

        {/* Step Indicators */}
        <View
          style={{
            marginTop: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Scan */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#4a9960",
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Rubik_600SemiBold",
                color: "#1a1a1a",
              }}
            >
              Scan
            </Text>
          </View>

          {/* Understand */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#4a9960",
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Rubik_600SemiBold",
                color: "#1a1a1a",
              }}
            >
              Understand
            </Text>
          </View>

          {/* Choose Better */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#4a9960",
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Rubik_600SemiBold",
                color: "#1a1a1a",
              }}
            >
              Choose Better
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
