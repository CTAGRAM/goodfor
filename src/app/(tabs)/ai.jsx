/**
 * AI Tab — "Ask Lumi" 
 * App-integrated premium design with real text input
 */

import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import {
    Baby,
    ShieldAlert,
    Leaf,
    Droplets,
    ArrowUp,
    Clock,
    ChevronRight,
    FlaskConical,
    AlertTriangle,
    Globe,
    Utensils,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function AI() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile, activeFamilyMember } = useAuth();
    const [inputText, setInputText] = useState("");

    const opacity = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    useFocusEffect(
        useCallback(() => {
            opacity.value = withTiming(1, { duration: 400 });
            return () => {
                opacity.value = 0;
            };
        }, [])
    );

    const displayProfile = activeFamilyMember ? {
        name: activeFamilyMember.name,
        avatar: activeFamilyMember.avatar_url,
    } : {
        name: profile?.full_name || profile?.email?.split('@')[0] || 'User',
        avatar: profile?.avatar_url,
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name[0].toUpperCase();
    };

    const handleSendMessage = () => {
        const text = inputText.trim();
        if (!text) return;
        setInputText("");
        router.push({
            pathname: "/ai-chat",
            params: { initialMessage: text },
        });
    };

    const handleTopicPress = (text) => {
        setInputText(text);
    };

    const topics = [
        { id: 1, icon: Baby, title: "Safety", desc: "Is this product safe for kids?", color: "#2E7D32", bg: "#E8F5E9" },
        { id: 2, icon: AlertTriangle, title: "Warnings", desc: "Does this product have any health risks?", color: "#E65100", bg: "#FFF3E0" },
        { id: 3, icon: Leaf, title: "Alternatives", desc: "What are healthier alternatives to this product?", color: "#00695C", bg: "#E0F2F1" },
        { id: 4, icon: Droplets, title: "Skincare", desc: "Are these ingredients safe for my skin?", color: "#283593", bg: "#E8EAF6" },
        { id: 5, icon: FlaskConical, title: "Ingredients", desc: "Explain the ingredients in this product simply", color: "#6A1B9A", bg: "#F3E5F5" },
        { id: 6, icon: ShieldAlert, title: "Allergens", desc: "Does this product contain allergens?", color: "#C62828", bg: "#FFEBEE" },
        { id: 7, icon: Globe, title: "Environment", desc: "Is this product environmentally friendly?", color: "#1565C0", bg: "#E3F2FD" },
        { id: 8, icon: Utensils, title: "Dietary", desc: "Is this product halal or kosher?", color: "#4E342E", bg: "#EFEBE9" },
    ];

    return (
        <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, animatedStyle]}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={{
                paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: spacing[6],
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            }}>
                <Image
                    source={{ uri: "https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/onAkNUUAGm7/ai/GoodFor-1-x16DQfFL43Z.png" }}
                    style={{ width: 120, height: 32 }}
                    resizeMode="contain"
                />
                <TouchableOpacity
                    onPress={() => router.push('/edit-profile')}
                    style={{
                        width: 44, height: 44, borderRadius: 22, overflow: "hidden",
                        borderWidth: 2, borderColor: colors.card,
                        backgroundColor: colors.primary,
                        alignItems: 'center', justifyContent: 'center',
                        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1, shadowRadius: 4,
                    }}
                >
                    {displayProfile.avatar ? (
                        <Image source={{ uri: displayProfile.avatar }} style={{ width: "100%", height: "100%" }} />
                    ) : (
                        <Text style={{ fontSize: 16, fontFamily: fonts.sans.bold, color: colors.primaryForeground }}>
                            {getInitials(displayProfile.name)}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Lumi Banner */}
                <View style={{
                    marginHorizontal: spacing[6],
                    marginTop: spacing[2],
                    marginBottom: spacing[6],
                    backgroundColor: colors.primary,
                    borderRadius: radius['3xl'],
                    padding: spacing[5],
                    overflow: 'hidden',
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 5,
                }}>
                    <View style={{ zIndex: 2, marginBottom: spacing[5] }}>
                        <Text style={{
                            fontSize: 22, fontFamily: fonts.heading.bold, color: colors.primaryForeground, marginBottom: 4
                        }}>
                            Ask Lumi Anything
                        </Text>
                        <Text style={{
                            fontSize: 14, fontFamily: fonts.sans.medium, color: `${colors.primaryForeground}dd`, lineHeight: 20
                        }}>
                            Clear answers for food & skincare.
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 2 }}>
                        {/* Glowing dot */}
                        <View style={{
                            width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80',
                            shadowColor: '#4ADE80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6,
                            elevation: 4, marginRight: spacing[3]
                        }} />
                        <TouchableOpacity 
                            onPress={() => setInputText('Is this food product safe?')}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                paddingHorizontal: spacing[4], paddingVertical: 6,
                                borderRadius: radius.full, marginRight: spacing[2]
                            }}
                        >
                            <Text style={{ color: colors.primaryForeground, fontSize: 13, fontFamily: fonts.sans.medium }}>Food</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setInputText('Are these skincare ingredients safe?')}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                paddingHorizontal: spacing[4], paddingVertical: 6,
                                borderRadius: radius.full
                            }}
                        >
                            <Text style={{ color: colors.primaryForeground, fontSize: 13, fontFamily: fonts.sans.medium }}>Skincare</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Real Text Input */}
                <View style={{
                    marginHorizontal: spacing[6],
                    backgroundColor: colors.card,
                    borderRadius: 24,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: `${colors.border}40`,
                    marginBottom: spacing[8],
                }}>
                    <TextInput
                        style={{
                            flex: 1, fontSize: 15, fontFamily: fonts.sans.regular,
                            color: colors.foreground, height: 42,
                        }}
                        placeholder="Ask Lumi something..."
                        placeholderTextColor={colors.mutedForeground}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!inputText.trim()}
                        style={{
                            backgroundColor: inputText.trim() ? colors.primary : colors.muted,
                            width: 34, height: 34, borderRadius: 17,
                            alignItems: 'center', justifyContent: 'center',
                            opacity: inputText.trim() ? 1 : 0.4,
                        }}
                    >
                        <ArrowUp size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Quick Topics Grid */}
                <View style={{ paddingHorizontal: spacing[6] }}>
                    <Text style={{
                        fontSize: 14, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: spacing[4]
                    }}>
                        Quick Topics
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
                        {topics.map((item) => {
                            const Icon = item.icon;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => handleTopicPress(item.desc)}
                                    activeOpacity={0.7}
                                    style={{
                                        width: '48%',
                                        backgroundColor: colors.card,
                                        borderRadius: radius['2xl'],
                                        padding: spacing[4],
                                        borderWidth: 1,
                                        borderColor: `${colors.border}30`,
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.03,
                                        shadowRadius: 4,
                                        elevation: 1,
                                    }}
                                >
                                    <View style={{
                                        width: 36, height: 36, borderRadius: 18,
                                        backgroundColor: item.bg,
                                        alignItems: "center", justifyContent: "center",
                                        marginBottom: spacing[3]
                                    }}>
                                        <Icon size={18} color={item.color} />
                                    </View>
                                    <Text style={{
                                        fontSize: 14, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: 2
                                    }}>
                                        {item.title}
                                    </Text>
                                    <Text style={{
                                        fontSize: 11, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 16
                                    }}>
                                        {item.desc}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Chat History Card */}
                <TouchableOpacity
                    onPress={() => router.push({ pathname: "/ai-chat", params: { showHistory: "true" } })}
                    activeOpacity={0.7}
                    style={{
                        marginHorizontal: spacing[6],
                        marginTop: spacing[6],
                        backgroundColor: colors.card,
                        borderRadius: radius['2xl'],
                        padding: spacing[5],
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: `${colors.border}30`,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.04,
                        shadowRadius: 8,
                        elevation: 2,
                    }}
                >
                    <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: `${colors.primary}12`,
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: spacing[4],
                    }}>
                        <Clock size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontFamily: fonts.sans.bold, color: colors.foreground }}>
                            Chat History
                        </Text>
                        <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, marginTop: 2 }}>
                            View your past conversations with Lumi
                        </Text>
                    </View>
                    <ChevronRight size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
            </ScrollView>
        </Animated.View>
    );
}
