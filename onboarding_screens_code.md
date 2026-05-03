# Onboarding Screens Code

Here is the complete source code for the 4 onboarding screens.

## Screen 1: welcome.jsx

```jsx
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
              Food & skincare safety,{"\n"}explained for your family.
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
              source={require("../../../assets/images/onboarding-1.png")}
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

```

## Screen 2: how-scanning-works.jsx

```jsx
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Camera, ShieldCheck, FileText } from "lucide-react-native";

export default function HowScanningWorks() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            {/* Decorative Blur Backgrounds */}
            <View
                style={{
                    position: "absolute",
                    top: -128,
                    right: 302,
                    width: 256,
                    height: 256,
                    backgroundColor: "rgba(214, 228, 218, 0.3)",
                    borderRadius: 128,
                    opacity: 0.6,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    bottom: 138,
                    left: -96,
                    width: 192,
                    height: 192,
                    backgroundColor: "rgba(52, 168, 83, 0.05)",
                    borderRadius: 96,
                    opacity: 0.6,
                }}
            />

            {/* Header with back button */}
            <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
                <Pressable
                    onPress={() => router.back()}
                    style={{
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ArrowLeft size={24} color="#1a1a1a" />
                </Pressable>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingBottom: insets.bottom + 160,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Panda + Card Container */}
                <View style={{ marginTop: 100, alignItems: "center" }}>
                    {/* Steps Card */}
                    <View
                        style={{
                            width: "100%",
                            backgroundColor: "#ffffff",
                            borderRadius: 24,
                            paddingTop: 21,
                            paddingHorizontal: 21,
                            paddingBottom: 21,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            elevation: 2,
                            borderWidth: 1,
                            borderColor: "rgba(225, 230, 227, 0.4)",
                            position: "relative",
                        }}
                    >
                        {/* Peeking Panda - positioned ABOVE the card */}
                        <View
                            style={{
                                position: "absolute",
                                top: -90,
                                left: 0,
                                right: 0,
                                alignItems: "center",
                                zIndex: 10,
                            }}
                        >
                            <Image
                                source={require("../../../assets/images/onboarding-2.png")}
                                style={{ width: 200, height: 110 }}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Extra padding at top to account for panda */}
                        <View style={{ height: 40 }} />

                        {/* Step 1 */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: "#d6e4da",
                                    borderRadius: 20,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Camera size={20} color="#243628" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 10,
                                        fontFamily: "Rubik_700Bold",
                                        color: "#34a853",
                                        letterSpacing: 1,
                                        lineHeight: 15,
                                        textTransform: "uppercase",
                                        marginBottom: 2,
                                    }}
                                >
                                    Step 1
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: "Rubik_700Bold",
                                        color: "#1a1d1c",
                                        lineHeight: 20,
                                    }}
                                >
                                    Scan product
                                </Text>
                            </View>
                        </View>

                        {/* Connector Line 1 */}
                        <View
                            style={{
                                width: 2,
                                height: 16,
                                backgroundColor: "#d6e4da",
                                marginLeft: 20,
                                marginVertical: 0,
                                opacity: 0.6,
                            }}
                        />

                        {/* Step 2 */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: "#d6e4da",
                                    borderRadius: 20,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ShieldCheck size={20} color="#243628" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 10,
                                        fontFamily: "Rubik_700Bold",
                                        color: "#34a853",
                                        letterSpacing: 1,
                                        lineHeight: 15,
                                        textTransform: "uppercase",
                                        marginBottom: 2,
                                    }}
                                >
                                    Step 2
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: "Rubik_700Bold",
                                        color: "#1a1d1c",
                                        lineHeight: 20,
                                    }}
                                >
                                    Get safety score
                                </Text>
                            </View>
                        </View>

                        {/* Connector Line 2 */}
                        <View
                            style={{
                                width: 2,
                                height: 16,
                                backgroundColor: "#d6e4da",
                                marginLeft: 20,
                                marginVertical: 0,
                                opacity: 0.6,
                            }}
                        />

                        {/* Step 3 */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: "#d6e4da",
                                    borderRadius: 20,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <FileText size={20} color="#243628" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 10,
                                        fontFamily: "Rubik_700Bold",
                                        color: "#34a853",
                                        letterSpacing: 1,
                                        lineHeight: 15,
                                        textTransform: "uppercase",
                                        marginBottom: 2,
                                    }}
                                >
                                    Step 3
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: "Rubik_700Bold",
                                        color: "#1a1d1c",
                                        lineHeight: 20,
                                    }}
                                >
                                    See why
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Progress Dots */}
                <View
                    style={{
                        marginTop: 24,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    <View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#d1d5db",
                        }}
                    />
                    <View
                        style={{
                            width: 24,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#4a9960",
                        }}
                    />
                    <View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#d1d5db",
                        }}
                    />
                </View>

                {/* Title - Centered */}
                <Text
                    style={{
                        marginTop: 32,
                        fontSize: 26,
                        fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c",
                        lineHeight: 30,
                        textAlign: "center",
                    }}
                >
                    Scan & know in seconds
                </Text>

                {/* Description - Centered */}
                <Text
                    style={{
                        marginTop: 16,
                        fontSize: 14,
                        color: "#6c7570",
                        lineHeight: 23,
                        fontFamily: "Rubik_400Regular",
                        textAlign: "center",
                        paddingHorizontal: 20,
                    }}
                >
                    No medical jargon. Just clear explanations that help you choose better.
                </Text>

                {/* Real-time Badge - Centered */}
                <View
                    style={{
                        marginTop: 24,
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "center",
                        gap: 8,
                        paddingHorizontal: 17,
                        paddingVertical: 14,
                        backgroundColor: "#ffffff",
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(225, 230, 227, 0.4)",
                    }}
                >
                    <View
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#34a853",
                        }}
                    />
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: "Rubik_500Medium",
                            color: "#1a1d1c",
                            lineHeight: 16,
                        }}
                    >
                        Real-time analysis active
                    </Text>
                </View>
            </ScrollView>

            {/* Footer - Fixed at bottom with gradient */}
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 24,
                    paddingBottom: insets.bottom + 16,
                    paddingTop: 16,
                    backgroundColor: "#f2f5f3",
                }}
            >
                {/* Next Button */}
                <Pressable
                    onPress={() => router.push("/onboarding/family-profiles")}
                    style={{
                        width: "100%",
                        height: 56,
                        backgroundColor: "#243628",
                        borderRadius: 999,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 15,
                        elevation: 5,
                    }}
                >
                    <Text
                        style={{
                            color: "#ffffff",
                            fontSize: 16,
                            fontFamily: "Rubik_700Bold",
                            lineHeight: 24,
                        }}
                    >
                        Next
                    </Text>
                    <View
                        style={{
                            position: "absolute",
                            right: 10,
                            width: 36,
                            height: 36,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: 18,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <ArrowRight size={20} color="#ffffff" />
                    </View>
                </Pressable>

                {/* Sign In Link */}
                <Pressable
                    onPress={() => router.push("/sign-in")}
                    style={{ paddingVertical: 11, marginTop: 10 }}
                >
                    <Text
                        style={{
                            color: "#6c7570",
                            fontSize: 12,
                            fontFamily: "Rubik_600SemiBold",
                            textAlign: "center",
                            lineHeight: 16,
                        }}
                    >
                        Already have an account? Sign in
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

```

## Screen 3: family-profiles.jsx

```jsx
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Users } from "lucide-react-native";

export default function FamilyProfiles() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            {/* Decorative Blur Backgrounds */}
            <View
                style={{
                    position: "absolute",
                    top: -128,
                    right: 302,
                    width: 256,
                    height: 256,
                    backgroundColor: "rgba(214, 228, 218, 0.3)",
                    borderRadius: 128,
                    opacity: 0.6,
                }}
            />
            <View
                style={{
                    position: "absolute",
                    bottom: 138,
                    left: -96,
                    width: 192,
                    height: 192,
                    backgroundColor: "rgba(52, 168, 83, 0.1)",
                    borderRadius: 96,
                    opacity: 0.6,
                }}
            />

            {/* Header with back button */}
            <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
                <Pressable
                    onPress={() => router.back()}
                    style={{
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ArrowLeft size={24} color="#1a1a1a" />
                </Pressable>
            </View>

            <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
                {/* Panda Family Illustration */}
                <View style={{ alignItems: "center", marginTop: 40, marginBottom: 20 }}>
                    <Image
                        source={require("../../../assets/images/onboarding-3.png")}
                        style={{ width: 280, height: 160 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Progress Dots */}
                <View
                    style={{
                        marginTop: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                    }}
                >
                    <View
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "rgba(108, 117, 112, 0.3)",
                        }}
                    />
                    <View
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "rgba(108, 117, 112, 0.3)",
                        }}
                    />
                    <View
                        style={{
                            width: 20,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#34a853",
                        }}
                    />
                </View>

                {/* Title */}
                <Text
                    style={{
                        marginTop: 32,
                        fontSize: 28,
                        fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c",
                        lineHeight: 30.8,
                    }}
                >
                    Different Members
                </Text>
                <Text
                    style={{
                        fontSize: 28,
                        fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c",
                        lineHeight: 30.8,
                    }}
                >
                    Different needs
                </Text>

                {/* Description */}
                <Text
                    style={{
                        marginTop: 16,
                        fontSize: 15,
                        color: "#6c7570",
                        lineHeight: 24.38,
                        fontFamily: "Rubik_400Regular",
                    }}
                >
                    Get age-adjusted safety ratings specifically tailored for the babies, children, and adults in your household.
                </Text>

                {/* Multi-profile Support Badge */}
                <View
                    style={{
                        marginTop: 24,
                        flexDirection: "row",
                        alignItems: "center",
                        alignSelf: "flex-start",
                        gap: 10,
                        paddingHorizontal: 17,
                        paddingVertical: 9,
                        backgroundColor: "#ffffff",
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(225, 230, 227, 0.4)",
                    }}
                >
                    <Users size={16} color="#34a853" />
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: "Rubik_500Medium",
                            color: "#1a1d1c",
                            lineHeight: 16,
                        }}
                    >
                        Multi-profile support
                    </Text>
                </View>
            </View>

            {/* Footer - Fixed at bottom */}
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 24,
                    paddingBottom: insets.bottom + 16,
                    paddingTop: 16,
                    backgroundColor: "#f2f5f3",
                }}
            >
                {/* Next Button */}
                <Pressable
                    onPress={() => router.push("/onboarding/safety-scoring")}
                    style={{
                        width: "100%",
                        height: 56,
                        backgroundColor: "#243628",
                        borderRadius: 999,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 15,
                        elevation: 5,
                    }}
                >
                    <Text
                        style={{
                            color: "#ffffff",
                            fontSize: 16,
                            fontFamily: "Rubik_700Bold",
                            lineHeight: 24,
                        }}
                    >
                        Next
                    </Text>
                    <View
                        style={{
                            position: "absolute",
                            right: 10,
                            width: 36,
                            height: 36,
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: 18,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <ArrowRight size={20} color="#ffffff" />
                    </View>
                </Pressable>

                {/* Sign In Link */}
                <Pressable
                    onPress={() => router.push("/sign-in")}
                    style={{ paddingVertical: 12, marginTop: 8 }}
                >
                    <Text
                        style={{
                            color: "#6c7570",
                            fontSize: 12,
                            fontFamily: "Rubik_600SemiBold",
                            textAlign: "center",
                            lineHeight: 16,
                        }}
                    >
                        Already have an account? Sign in
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

```

## Screen 4: safety-scoring.tsx

```jsx
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, XCircle, BarChart3 } from "lucide-react-native";

export default function SafetyScoring() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Decorative Blur Backgrounds */}
            <View style={styles.blurTop} />
            <View style={styles.blurMiddle} />

            {/* Header with back button */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color="#1A1D1C" strokeWidth={1.5} />
                </Pressable>
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
                {/* Illustration and Card Container */}
                <View style={styles.topSection}>
                    {/* Panda Detective Illustration */}
                    <Image
                        source={require("../../../assets/images/onboarding-4.png")}
                        style={styles.illustration}
                        resizeMode="contain"
                    />

                    {/* Scoring System Card */}
                    <View style={styles.cardWrapper}>
                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>SCORING SYSTEM</Text>
                            <BarChart3 size={20} color="#243628" />
                        </View>

                        {/* White Card */}
                        <View style={styles.card}>
                            {/* Decorative blur inside card */}
                            <View style={styles.cardBlur} />

                            {/* Safe Score */}
                            <View style={[styles.scoreRow, { marginBottom: 12 }]}>
                                <View style={styles.scoreLeft}>
                                    <View style={[styles.iconCircle, styles.safeIconCircle]}>
                                        <CheckCircle size={20} color="#34A853" fill="#34A853" />
                                    </View>
                                    <View>
                                        <Text style={styles.scoreLabel}>Safe</Text>
                                        <Text style={styles.scoreRange}>80-100 Score range</Text>
                                    </View>
                                </View>
                                <View style={[styles.scoreBadge, styles.safeBadge]}>
                                    <Text style={styles.badgeText}>94</Text>
                                </View>
                            </View>

                            {/* Use with Caution Score */}
                            <View style={[styles.scoreRow, { marginBottom: 12 }]}>
                                <View style={styles.scoreLeft}>
                                    <View style={[styles.iconCircle, styles.cautionIconCircle]}>
                                        <AlertTriangle size={20} color="#FBBC04" fill="#FBBC04" />
                                    </View>
                                    <View>
                                        <Text style={styles.scoreLabel}>Use with caution</Text>
                                        <Text style={styles.scoreRange}>40-79 Score range</Text>
                                    </View>
                                </View>
                                <View style={[styles.scoreBadge, styles.cautionBadge]}>
                                    <Text style={styles.badgeText}>52</Text>
                                </View>
                            </View>

                            {/* Avoid Score */}
                            <View style={styles.scoreRow}>
                                <View style={styles.scoreLeft}>
                                    <View style={[styles.iconCircle, styles.avoidIconCircle]}>
                                        <XCircle size={20} color="#EA4335" fill="#EA4335" />
                                    </View>
                                    <View>
                                        <Text style={styles.scoreLabel}>Avoid</Text>
                                        <Text style={styles.scoreRange}>0-39 Score range</Text>
                                    </View>
                                </View>
                                <View style={[styles.scoreBadge, styles.avoidBadge]}>
                                    <Text style={styles.badgeText}>28</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Progress Dots */}
                <View style={styles.dotsContainer}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dotActive} />
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
                <View style={styles.footerContent}>
                    {/* Next Button */}
                    <Pressable
                        onPress={() => router.push("/onboarding/question-intro")}
                        style={styles.nextButton}
                    >
                        <Text style={styles.nextButtonText}>Next</Text>
                        <View style={styles.arrowContainer}>
                            <ArrowRight size={20} color="#FFF" strokeWidth={1.25} />
                        </View>
                    </Pressable>

                    {/* Sign In Link */}
                    <Pressable
                        onPress={() => router.push("/sign-in")}
                        style={styles.signInButton}
                    >
                        <Text style={styles.signInText}>
                            Already have an account? Sign in
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F5F3",
    },
    blurTop: {
        position: "absolute",
        top: -128,
        left: 302,
        width: 256,
        height: 256,
        backgroundColor: "rgba(214, 228, 218, 0.3)",
        borderRadius: 128,
    },
    blurMiddle: {
        position: "absolute",
        top: 507,
        left: 334,
        width: 192,
        height: 192,
        backgroundColor: "rgba(52, 168, 83, 0.1)",
        borderRadius: 96,
    },
    header: {
        height: 116,
        paddingHorizontal: 12,
        justifyContent: "flex-end",
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: "center",
    },
    topSection: {
        position: "relative",
        height: 453,
        marginBottom: 40,
    },
    illustration: {
        position: "absolute",
        right: -28,
        top: -56,
        width: 213,
        height: 320,
        zIndex: 2,
    },
    cardWrapper: {
        position: "absolute",
        top: 133,
        left: 0,
        right: 0,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 12,
        fontFamily: "Rubik_700Bold",
        color: "#243628",
        letterSpacing: 1.2,
        lineHeight: 16,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(225, 230, 227, 0.4)",
        position: "relative",
        overflow: "hidden",
    },
    cardBlur: {
        position: "absolute",
        top: -63,
        right: 65,
        width: 128,
        height: 128,
        backgroundColor: "rgba(214, 228, 218, 0.2)",
        borderRadius: 64,
        opacity: 0.5,
    },
    scoreRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F2F5F3",
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 13,
        height: 62,
    },
    scoreLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    safeIconCircle: {
        backgroundColor: "rgba(52, 168, 83, 0.1)",
    },
    cautionIconCircle: {
        backgroundColor: "rgba(251, 188, 4, 0.1)",
    },
    avoidIconCircle: {
        backgroundColor: "rgba(234, 67, 53, 0.1)",
    },
    scoreLabel: {
        fontSize: 14,
        fontFamily: "Rubik_700Bold",
        color: "#1A1D1C",
        lineHeight: 20,
    },
    scoreRange: {
        fontSize: 10,
        fontFamily: "Rubik_500Medium",
        color: "#6C7570",
        lineHeight: 15,
    },
    scoreBadge: {
        borderRadius: 16,
        paddingHorizontal: 10.5,
        paddingVertical: 5.5,
        minWidth: 38,
        alignItems: "center",
        height: 23,
        justifyContent: "center",
    },
    safeBadge: {
        backgroundColor: "#34A853",
    },
    cautionBadge: {
        backgroundColor: "#FBBC04",
    },
    avoidBadge: {
        backgroundColor: "#EA4335",
    },
    badgeText: {
        fontSize: 10,
        fontFamily: "Rubik_700Bold",
        color: "#FFFFFF",
        lineHeight: 15,
    },
    dotsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(108, 117, 112, 0.3)",
    },
    dotActive: {
        width: 24,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#34A853",
    },
    footer: {
        paddingHorizontal: 32,
        paddingTop: 24,
        backgroundColor: "#F2F5F3",
    },
    footerContent: {
        gap: 12,
    },
    nextButton: {
        width: "100%",
        height: 56,
        backgroundColor: "#243628",
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
        position: "relative",
    },
    nextButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: "Rubik_700Bold",
        lineHeight: 24,
    },
    arrowContainer: {
        position: "absolute",
        right: 10,
        width: 36,
        height: 36,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    signInButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    signInText: {
        color: "#6C7570",
        fontSize: 14,
        fontFamily: "Rubik_600SemiBold",
        textAlign: "center",
        lineHeight: 20,
    },
});

```

