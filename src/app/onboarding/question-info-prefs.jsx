import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    ArrowLeft, ArrowRight, Check,
    ShieldAlert, RefreshCcw, FlaskConical, BarChart3, Leaf
} from "lucide-react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFS = [
    { label: "Allergen warnings", desc: "Flag risky ingredients", icon: ShieldAlert, color: "#EA4335" },
    { label: "Safer alternatives", desc: "Better product suggestions", icon: RefreshCcw, color: "#4285F4" },
    { label: "Additive details", desc: "What each additive does", icon: FlaskConical, color: "#FBBC04" },
    { label: "Nutritional breakdown", desc: "Macros, calories & more", icon: BarChart3, color: "#34a853" },
    { label: "Ingredient safety", desc: "Toxicity & risk levels", icon: Leaf, color: "#9B59B6" },
];

export default function QuestionInfoPrefs() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState([]);

    const togglePref = (label) => {
        setSelected((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    const handleContinue = async () => {
        try {
            await AsyncStorage.setItem("onboarding_info_preferences", JSON.stringify(selected));
        } catch (e) {
            console.error(e);
        }
        router.push("/onboarding/personalizing");
    };

    const progress = 9 / 10;

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            {/* Decorative Blurs */}
            <View
                style={{
                    position: "absolute", top: -100, right: -50,
                    width: 240, height: 240,
                    backgroundColor: "rgba(214, 228, 218, 0.25)",
                    borderRadius: 120,
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
            <View style={{ paddingHorizontal: 24, marginTop: 28, marginBottom: 24 }}>
                <Text
                    style={{
                        fontSize: 26, fontFamily: "Rubik_800ExtraBold",
                        color: "#1a1d1c", lineHeight: 32,
                    }}
                >
                    What information{"\n"}matters most to you?
                </Text>
                <Text
                    style={{
                        marginTop: 10, fontSize: 14, color: "#6c7570",
                        lineHeight: 22, fontFamily: "Rubik_400Regular",
                    }}
                >
                    Select all that interest you. We'll highlight these in your scans.
                </Text>
            </View>

            {/* Info Preference Cards */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 24, paddingBottom: insets.bottom + 140,
                    gap: 12,
                }}
                showsVerticalScrollIndicator={false}
            >
                {PREFS.map((pref) => {
                    const isSelected = selected.includes(pref.label);
                    const Icon = pref.icon;
                    return (
                        <Pressable
                            key={pref.label}
                            onPress={() => togglePref(pref.label)}
                            style={{
                                flexDirection: "row", alignItems: "center",
                                padding: 16, borderRadius: 20,
                                backgroundColor: isSelected ? "#d6e4da" : "#ffffff",
                                borderWidth: 1.5,
                                borderColor: isSelected ? "#34a853" : "rgba(225, 230, 227, 0.5)",
                                shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                            }}
                        >
                            <View
                                style={{
                                    width: 42, height: 42, borderRadius: 14,
                                    backgroundColor: isSelected
                                        ? `${pref.color}20`
                                        : "#f2f5f3",
                                    alignItems: "center", justifyContent: "center",
                                    marginRight: 14,
                                }}
                            >
                                <Icon size={20} color={isSelected ? pref.color : "#6c7570"} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: isSelected ? "Rubik_700Bold" : "Rubik_600SemiBold",
                                        color: isSelected ? "#243628" : "#1a1d1c",
                                        marginBottom: 1,
                                    }}
                                >
                                    {pref.label}
                                </Text>
                                <Text style={{ fontSize: 12, fontFamily: "Rubik_400Regular", color: "#6c7570" }}>
                                    {pref.desc}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: 26, height: 26, borderRadius: 13,
                                    backgroundColor: isSelected ? "#34a853" : "#eef2ef",
                                    alignItems: "center", justifyContent: "center",
                                }}
                            >
                                {isSelected && <Check size={16} color="#fff" strokeWidth={3} />}
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Footer */}
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
