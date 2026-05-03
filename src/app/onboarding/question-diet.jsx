import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Check } from "lucide-react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DIETS = [
    { label: "Vegetarian", emoji: "🥬", desc: "No meat or fish" },
    { label: "Vegan", emoji: "🌱", desc: "No animal products" },
    { label: "Non-Vegetarian", emoji: "🍖", desc: "Everything included" },
    { label: "Pescatarian", emoji: "🐟", desc: "Fish but no meat" },
    { label: "Flexitarian", emoji: "🥗", desc: "Mostly plant-based" },
    { label: "Halal", emoji: "🕌", desc: "Halal-certified foods only" },
    { label: "Kosher", emoji: "✡️", desc: "Kosher-certified foods only" },
    { label: "No preference", emoji: "🍽️", desc: "I eat everything" },
];

export default function QuestionDiet() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState(null);

    const handleSelect = async (label) => {
        setSelected(label);
        try {
            await AsyncStorage.setItem("onboarding_diet_preference", label);
        } catch (e) {
            console.error(e);
        }
        setTimeout(() => {
            router.push("/onboarding/question-concerns");
        }, 350);
    };

    // Progress: screen 4 of 10
    const progress = 4 / 10;

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            {/* Decorative Blurs */}
            <View
                style={{
                    position: "absolute", top: -100, right: -80,
                    width: 260, height: 260,
                    backgroundColor: "rgba(214, 228, 218, 0.25)",
                    borderRadius: 130,
                }}
            />
            <View
                style={{
                    position: "absolute", bottom: 120, left: -70,
                    width: 180, height: 180,
                    backgroundColor: "rgba(52, 168, 83, 0.06)",
                    borderRadius: 90,
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
                    {/* Progress Bar */}
                    <View style={{ flex: 1, marginHorizontal: 16 }}>
                        <View style={{ height: 4, backgroundColor: "#e1e6e3", borderRadius: 2 }}>
                            <View
                                style={{
                                    height: 4, borderRadius: 2,
                                    backgroundColor: "#34a853",
                                    width: `${progress * 100}%`,
                                }}
                            />
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            {/* Title */}
            <View style={{ paddingHorizontal: 24, marginTop: 28, marginBottom: 20 }}>
                <Text
                    style={{
                        fontSize: 26,
                        fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c",
                        lineHeight: 32,
                    }}
                >
                    Let's talk about your{"\n"}food preferences
                </Text>
                <Text
                    style={{
                        marginTop: 10,
                        fontSize: 14,
                        color: "#6c7570",
                        lineHeight: 22,
                        fontFamily: "Rubik_400Regular",
                    }}
                >
                    So we can show you the most relevant products and recommendations.
                </Text>
            </View>

            {/* Diet Grid */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: insets.bottom + 100,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                    {DIETS.map((diet) => {
                        const isSelected = selected === diet.label;
                        return (
                            <Pressable
                                key={diet.label}
                                onPress={() => handleSelect(diet.label)}
                                style={{
                                    width: "47%",
                                    padding: 16,
                                    borderRadius: 20,
                                    backgroundColor: isSelected ? "#d6e4da" : "#ffffff",
                                    borderWidth: 1.5,
                                    borderColor: isSelected ? "#34a853" : "rgba(225, 230, 227, 0.5)",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.04,
                                    shadowRadius: 3,
                                    elevation: 1,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ fontSize: 32, marginBottom: 8 }}>{diet.emoji}</Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: isSelected ? "Rubik_700Bold" : "Rubik_600SemiBold",
                                        color: isSelected ? "#243628" : "#1a1d1c",
                                        marginBottom: 2,
                                    }}
                                >
                                    {diet.label}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontFamily: "Rubik_400Regular",
                                        color: "#6c7570",
                                        textAlign: "center",
                                    }}
                                >
                                    {diet.desc}
                                </Text>
                                {isSelected && (
                                    <View
                                        style={{
                                            position: "absolute",
                                            top: 10,
                                            right: 10,
                                            width: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            backgroundColor: "#34a853",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Check size={14} color="#fff" strokeWidth={3} />
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Footer */}
            <View
                style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 12,
                    backgroundColor: "#f2f5f3",
                }}
            >
                <Pressable onPress={() => router.push("/sign-in")} style={{ paddingVertical: 12 }}>
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
