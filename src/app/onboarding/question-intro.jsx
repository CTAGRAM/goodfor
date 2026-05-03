import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react-native";

export default function QuestionIntro() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            {/* Decorative Blur Backgrounds */}
            <View
                style={{
                    position: "absolute", top: -128, right: -60,
                    width: 256, height: 256,
                    backgroundColor: "rgba(214, 228, 218, 0.3)",
                    borderRadius: 128, opacity: 0.6,
                }}
            />
            <View
                style={{
                    position: "absolute", bottom: 200, left: -96,
                    width: 192, height: 192,
                    backgroundColor: "rgba(52, 168, 83, 0.08)",
                    borderRadius: 96, opacity: 0.6,
                }}
            />

            {/* Header with back button */}
            <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
                <Pressable
                    onPress={() => router.back()}
                    style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
                >
                    <ArrowLeft size={24} color="#1a1a1a" />
                </Pressable>
            </View>

            <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
                {/* Panda Illustration */}
                <View style={{ alignItems: "center", marginBottom: 24, marginTop: 20 }}>
                    <Image
                        source={require("../../../assets/images/panda-detective-large.png")}
                        style={{ width: 280, height: 280 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Title */}
                <Text
                    style={{
                        fontSize: 28, fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c", lineHeight: 34, textAlign: "center",
                    }}
                >
                    A few quick questions
                </Text>

                {/* Description */}
                <Text
                    style={{
                        marginTop: 16, fontSize: 15, color: "#6c7570",
                        lineHeight: 24, fontFamily: "Rubik_400Regular",
                        textAlign: "center", maxWidth: "85%", alignSelf: "center",
                    }}
                >
                    We'll personalise your experience based on your answers. It only takes a moment.
                </Text>

                {/* Badge */}
                <View
                    style={{
                        marginTop: 24, flexDirection: "row", alignItems: "center",
                        alignSelf: "center", gap: 8,
                        paddingHorizontal: 17, paddingVertical: 10,
                        backgroundColor: "#ffffff", borderRadius: 999,
                        borderWidth: 1, borderColor: "rgba(225, 230, 227, 0.4)",
                    }}
                >
                    <Sparkles size={16} color="#34a853" />
                    <Text
                        style={{ fontSize: 12, fontFamily: "Rubik_500Medium", color: "#1a1d1c", lineHeight: 16 }}
                    >
                        Personalised for you
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View
                style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 16,
                    backgroundColor: "#f2f5f3",
                }}
            >
                <Pressable
                    onPress={() => router.push("/onboarding/question-age")}
                    style={{
                        width: "100%", height: 56, backgroundColor: "#243628",
                        borderRadius: 999, flexDirection: "row",
                        alignItems: "center", justifyContent: "center",
                        shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1, shadowRadius: 15, elevation: 5,
                    }}
                >
                    <Text style={{ color: "#ffffff", fontSize: 16, fontFamily: "Rubik_700Bold", lineHeight: 24 }}>
                        Let's go
                    </Text>
                    <View
                        style={{
                            position: "absolute", right: 10,
                            width: 36, height: 36, backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: 18, alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <ArrowRight size={20} color="#ffffff" />
                    </View>
                </Pressable>

                <Pressable onPress={() => router.push("/sign-in")} style={{ paddingVertical: 12, marginTop: 8 }}>
                    <Text
                        style={{
                            color: "#6c7570", fontSize: 12,
                            fontFamily: "Rubik_600SemiBold", textAlign: "center", lineHeight: 16,
                        }}
                    >
                        Already have an account? Sign in
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
