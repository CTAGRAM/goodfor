import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Check } from "lucide-react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONCERNS = [
    { label: "Allergies", color: "#EA4335", bg: "rgba(234, 67, 53, 0.08)" },
    { label: "Digestive issues", color: "#FBBC04", bg: "rgba(251, 188, 4, 0.08)" },
    { label: "High blood pressure", color: "#FCA5A5", bg: "rgba(252, 165, 165, 0.08)" },
    { label: "Weight management", color: "#4285F4", bg: "rgba(66, 133, 244, 0.08)" },
    { label: "Heart health", color: "#EA4335", bg: "rgba(234, 67, 53, 0.08)" },
    { label: "Diabetes", color: "#FBBC04", bg: "rgba(251, 188, 4, 0.08)" },
    { label: "Anxiety", color: "#9B59B6", bg: "rgba(155, 89, 182, 0.08)" },
    { label: "Afternoon fatigue", color: "#E67E22", bg: "rgba(230, 126, 34, 0.08)" },
    { label: "None of these", color: "#34a853", bg: "rgba(52, 168, 83, 0.08)" },
];

export default function QuestionConcerns() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState([]);

    const toggleConcern = (label) => {
        if (label === "None of these") {
            setSelected(selected.includes(label) ? [] : ["None of these"]);
        } else {
            setSelected((prev) => {
                const without = prev.filter((l) => l !== "None of these");
                return without.includes(label)
                    ? without.filter((l) => l !== label)
                    : [...without, label];
            });
        }
    };

    const handleContinue = async () => {
        try {
            await AsyncStorage.setItem("onboarding_health_concerns", JSON.stringify(selected));
        } catch (e) {
            console.error(e);
        }
        router.push("/onboarding/question-processed");
    };

    const progress = 5 / 10;

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            {/* Decorative Blurs */}
            <View
                style={{
                    position: "absolute", top: -80, left: -100,
                    width: 240, height: 240,
                    backgroundColor: "rgba(214, 228, 218, 0.3)",
                    borderRadius: 120, opacity: 0.6,
                }}
            />
            <View
                style={{
                    position: "absolute", bottom: 150, right: -60,
                    width: 200, height: 200,
                    backgroundColor: "rgba(52, 168, 83, 0.06)",
                    borderRadius: 100,
                }}
            />

            {/* Header */}
            <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Pressable
                        onPress={() => router.back()}
                        style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
                    >
                        <ArrowLeft size={24} color="#1a1a1a" />
                    </Pressable>
                    <View style={{ flex: 1, marginHorizontal: 16 }}>
                        <View style={{ height: 4, backgroundColor: "#e1e6e3", borderRadius: 2 }}>
                            <View
                                style={{
                                    height: 4, borderRadius: 2, backgroundColor: "#34a853",
                                    width: `${progress * 100}%`,
                                }}
                            />
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Title */}
            <View style={{ paddingHorizontal: 24, marginTop: 28, marginBottom: 8 }}>
                <Text
                    style={{
                        fontSize: 26, fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c", lineHeight: 32,
                    }}
                >
                    Are you experiencing{"\n"}any of these?
                </Text>
                <Text
                    style={{
                        marginTop: 10, fontSize: 14, color: "#6c7570",
                        lineHeight: 22, fontFamily: "Rubik_400Regular",
                    }}
                >
                    Select all that apply. We'll flag related ingredients.
                </Text>

                {/* Info Badge */}
                <View
                    style={{
                        marginTop: 14, flexDirection: "row", alignItems: "center",
                        alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8,
                        backgroundColor: "rgba(234, 67, 53, 0.06)", borderRadius: 12,
                        borderWidth: 1, borderColor: "rgba(234, 67, 53, 0.12)",
                    }}
                >
                    <Text style={{ fontSize: 11, fontFamily: "Rubik_500Medium", color: "#b91c1c" }}>
                        ⚠️  Processed food ingredients can worsen these issues
                    </Text>
                </View>
            </View>

            {/* Concern Tags */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 24, paddingTop: 16,
                    paddingBottom: insets.bottom + 140,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {CONCERNS.map((concern) => {
                        const isSelected = selected.includes(concern.label);
                        return (
                            <Pressable
                                key={concern.label}
                                onPress={() => toggleConcern(concern.label)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 999,
                                    backgroundColor: isSelected ? concern.bg : "#ffffff",
                                    borderWidth: 1.5,
                                    borderColor: isSelected ? concern.color : "rgba(225, 230, 227, 0.5)",
                                    gap: 6,
                                }}
                            >
                                {isSelected && (
                                    <View
                                        style={{
                                            width: 18, height: 18, borderRadius: 9,
                                            backgroundColor: concern.color,
                                            alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <Check size={12} color="#fff" strokeWidth={3} />
                                    </View>
                                )}
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: isSelected ? "Rubik_600SemiBold" : "Rubik_500Medium",
                                        color: isSelected ? concern.color : "#1a1d1c",
                                    }}
                                >
                                    {concern.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Footer with Continue Button */}
            <View
                style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 16,
                    backgroundColor: "#f2f5f3",
                }}
            >
                <Pressable
                    onPress={handleContinue}
                    style={{
                        width: "100%", height: 56, backgroundColor: "#243628",
                        borderRadius: 999, flexDirection: "row",
                        alignItems: "center", justifyContent: "center",
                        shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1, shadowRadius: 15, elevation: 5,
                        position: "relative",
                    }}
                >
                    <Text style={{ color: "#fff", fontSize: 16, fontFamily: "Rubik_700Bold" }}>
                        {selected.length > 0 ? `Continue (${selected.length})` : "Skip"}
                    </Text>
                    <View
                        style={{
                            position: "absolute", right: 10,
                            width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.1)",
                            borderRadius: 18, alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <ArrowRight size={20} color="#fff" />
                    </View>
                </Pressable>

                <Pressable onPress={() => router.push("/sign-in")} style={{ paddingVertical: 12, marginTop: 4 }}>
                    <Text
                        style={{
                            color: "#6c7570", fontSize: 12,
                            fontFamily: "Rubik_600SemiBold", textAlign: "center",
                        }}
                    >
                        Already have an account? Sign in
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
