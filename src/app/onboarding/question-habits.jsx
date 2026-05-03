import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import AnimatedPressable from "@/components/AnimatedPressable";

const OPTIONS = ["Always", "Sometimes", "Rarely", "Never"];

export default function QuestionHabits() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState(null);

    const handleSelect = async (option) => {
        setSelected(option);
        try { await AsyncStorage.setItem("onboarding_ingredient_habit", option); } catch (e) { console.error(e); }
        setTimeout(() => { router.push("/onboarding/question-referral"); }, 300);
    };

    const progress = 7 / 10;

    return (
        <View style={{ flex: 1, backgroundColor: "#f2f5f3" }}>
            <StatusBar style="dark" />

            <View style={{ position: "absolute", top: -80, right: -60, width: 240, height: 240, backgroundColor: "rgba(214, 228, 218, 0.3)", borderRadius: 120, opacity: 0.6 }} />
            <View style={{ position: "absolute", bottom: 160, left: -80, width: 180, height: 180, backgroundColor: "rgba(52, 168, 83, 0.06)", borderRadius: 90 }} />

            {/* Header */}
            <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                        <ArrowLeft size={24} color="#1a1a1a" />
                    </Pressable>
                    <View style={{ flex: 1, marginHorizontal: 16 }}>
                        <View style={{ height: 4, backgroundColor: "#e1e6e3", borderRadius: 2 }}>
                            <View style={{ height: 4, borderRadius: 2, backgroundColor: "#34a853", width: `${progress * 100}%` }} />
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <Animated.View entering={FadeIn.duration(400)} style={{ paddingHorizontal: 24, marginTop: 28, marginBottom: 24 }}>
                <Text style={{ fontSize: 26, fontFamily: "Rubik_800ExtraBold", color: "#1a1d1c", lineHeight: 34 }}>
                    How often do you check{"\n"}ingredient lists before{"\n"}buying food?
                </Text>
                <Text style={{ marginTop: 8, fontSize: 14, color: "#6c7570", lineHeight: 22, fontFamily: "Rubik_400Regular" }}>
                    We'll know how to help you best.
                </Text>
            </Animated.View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 100, gap: 12 }} showsVerticalScrollIndicator={false}>
                {OPTIONS.map((option, index) => {
                    const isSelected = selected === option;
                    return (
                        <Animated.View key={option} entering={FadeInDown.delay(index * 100).springify().damping(14)}>
                            <AnimatedPressable onPress={() => handleSelect(option)}
                                style={{
                                    flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 20,
                                    backgroundColor: isSelected ? "#d6e4da" : "#ffffff",
                                    borderWidth: 1.5, borderColor: isSelected ? "#34a853" : "rgba(225, 230, 227, 0.5)",
                                    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
                                }}
                            >
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isSelected ? "#34a853" : "#eef2ef", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                                    {isSelected && <Check size={18} color="#ffffff" strokeWidth={3} />}
                                </View>
                                <Text style={{ fontSize: 16, fontFamily: isSelected ? "Rubik_700Bold" : "Rubik_500Medium", color: isSelected ? "#243628" : "#1a1d1c" }}>
                                    {option}
                                </Text>
                            </AnimatedPressable>
                        </Animated.View>
                    );
                })}
            </ScrollView>

            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 12, backgroundColor: "#f2f5f3" }}>
                <Pressable onPress={() => router.push("/sign-in")} style={{ paddingVertical: 12 }}>
                    <Text style={{ color: "#6c7570", fontSize: 12, fontFamily: "Rubik_600SemiBold", textAlign: "center", lineHeight: 16 }}>
                        Already have an account? Sign in
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
