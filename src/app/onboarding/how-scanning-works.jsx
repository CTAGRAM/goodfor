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
                                source={require("../../../assets/images/panda-peek.png")}
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
