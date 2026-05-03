import { View, Text, Image, Animated } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { Leaf } from "lucide-react-native";

const STEPS = [
    "Analysing your preferences…",
    "Setting up your profile…",
    "Tailoring ingredient insights…",
    "Calibrating safety scores…",
    "Almost ready…",
];

export default function Personalizing() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [stepIndex, setStepIndex] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Fade in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 500, useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
            }),
        ]).start();

        // Animate progress bar over 4 seconds
        Animated.timing(progressAnim, {
            toValue: 1, duration: 4000, useNativeDriver: false,
        }).start();

        // Cycle through steps
        const interval = setInterval(() => {
            setStepIndex((prev) => {
                if (prev < STEPS.length - 1) return prev + 1;
                return prev;
            });
        }, 800);

        // Navigate after animation completes
        const timeout = setTimeout(() => {
            router.replace("/onboarding/complete");
        }, 4500);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            {/* Decorative Blurs */}
            <View
                style={{
                    position: "absolute", top: -140, right: -80,
                    width: 320, height: 320,
                    backgroundColor: "rgba(214, 228, 218, 0.2)",
                    borderRadius: 160,
                }}
            />
            <View
                style={{
                    position: "absolute", bottom: -100, left: -100,
                    width: 300, height: 300,
                    backgroundColor: "rgba(52, 168, 83, 0.06)",
                    borderRadius: 150,
                }}
            />
            <View
                style={{
                    position: "absolute", top: "45%", left: "55%",
                    width: 200, height: 200,
                    backgroundColor: "rgba(214, 228, 218, 0.15)",
                    borderRadius: 100,
                    marginLeft: -100, marginTop: -100,
                }}
            />

            {/* Content */}
            <Animated.View
                style={{
                    flex: 1, alignItems: "center", justifyContent: "center",
                    paddingHorizontal: 40,
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                }}
            >
                {/* Panda Illustration */}
                <Image
                    source={require("../../../assets/images/panda-peek.png")}
                    style={{ width: 180, height: 100, marginBottom: 48 }}
                    resizeMode="contain"
                />

                {/* Animated Leaf */}
                <View
                    style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: "rgba(52, 168, 83, 0.08)",
                        alignItems: "center", justifyContent: "center",
                        marginBottom: 32,
                    }}
                >
                    <View
                        style={{
                            width: 56, height: 56, borderRadius: 28,
                            backgroundColor: "rgba(52, 168, 83, 0.12)",
                            alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <Leaf size={28} color="#34a853" />
                    </View>
                </View>

                {/* Title */}
                <Text
                    style={{
                        fontSize: 24, fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c", textAlign: "center",
                        marginBottom: 12,
                    }}
                >
                    Personalising your{"\n"}experience
                </Text>

                {/* Rotating Status Text */}
                <Text
                    style={{
                        fontSize: 14, fontFamily: "Rubik_400Regular",
                        color: "#6c7570", textAlign: "center",
                        marginBottom: 40, height: 20,
                    }}
                >
                    {STEPS[stepIndex]}
                </Text>

                {/* Progress Bar */}
                <View
                    style={{
                        width: "100%", height: 6,
                        backgroundColor: "#e1e6e3", borderRadius: 3,
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        style={{
                            height: 6, borderRadius: 3,
                            backgroundColor: "#34a853",
                            width: progressWidth,
                        }}
                    />
                </View>

                {/* Badge */}
                <View
                    style={{
                        marginTop: 24,
                        flexDirection: "row", alignItems: "center",
                        paddingHorizontal: 14, paddingVertical: 8,
                        backgroundColor: "#ffffff", borderRadius: 999,
                        borderWidth: 1, borderColor: "rgba(225, 230, 227, 0.4)",
                        gap: 6,
                    }}
                >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34a853" }} />
                    <Text style={{ fontSize: 11, fontFamily: "Rubik_500Medium", color: "#1a1d1c" }}>
                        Collecting your answers
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
}
