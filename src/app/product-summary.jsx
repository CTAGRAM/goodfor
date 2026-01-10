import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Share2,
    CheckCircle,
    AlertTriangle,
    AlertCircle,
    ShieldAlert,
    Heart,
    Leaf,
    Droplets,
    Shield,
    ChevronRight
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { SAFETY_LEVELS } from "@/lib/productSafety";
import { useAuth } from "@/contexts/AuthContext";

export default function ProductSummary() {
    const { productData } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);

    const product = JSON.parse(productData);
    const safety = product.safetyAnalysis;

    const getSafetyConfig = () => {
        switch (safety.safety) {
            case SAFETY_LEVELS.SAFE:
                return { color: colors.chart1, icon: CheckCircle, label: 'Safe', description: 'Matches all family health preferences' };
            case SAFETY_LEVELS.CAUTION:
                return { color: colors.chart2, icon: AlertCircle, label: 'Caution', description: 'Some concerns to be aware of' };
            case SAFETY_LEVELS.AVOID:
                return { color: colors.chart3, icon: AlertTriangle, label: 'Avoid', description: 'Not recommended for your profile' };
            case SAFETY_LEVELS.CRITICAL:
                return { color: colors.destructive, icon: ShieldAlert, label: 'Unsafe', description: 'Serious health risks detected' };
            default:
                return { color: colors.chart1, icon: CheckCircle, label: 'Safe', description: 'Safe to consume' };
        }
    };

    const safetyConfig = getSafetyConfig();
    const SafetyIcon = safetyConfig.icon;

    const getCategory = () => {
        if (product.categories && product.categories.length > 0) {
            return product.categories[0].replace('en:', '').replace(/-/g, ' ');
        }
        return 'Food Product';
    };

    const ingredientBreakdown = [
        {
            icon: Leaf,
            iconColor: colors.chart1,
            title: 'Natural Ingredients',
            subtitle: `${product.nutriScore === 'a' || product.nutriScore === 'b' ? 'High quality' : 'Standard quality'} sources`,
        },
        {
            icon: Droplets,
            iconColor: colors.chart2,
            title: 'Added Sugars',
            subtitle: product.nutriments.sugars > 10 ? `High (${product.nutriments.sugars.toFixed(0)}g per 100g)` : `Low (${product.nutriments.sugars.toFixed(0)}g per 100g)`,
        },
        {
            icon: Shield,
            iconColor: colors.primary,
            title: 'Allergen Status',
            subtitle: product.allergens.length > 0 ? `Contains ${product.allergens.length} allergen(s)` : 'No major allergens detected',
        },
    ];

    const handleSaveToFavorites = () => {
        setIsFavorite(!isFavorite);
        // TODO: Save to Supabase favorites
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurLeft} />
            <View style={styles.blurRight} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Pressable style={styles.headerButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Analysis Result</Text>
                <Pressable style={styles.headerButton} onPress={() => { }}>
                    <Share2 size={20} color={colors.foreground} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Card */}
                <View style={styles.mainCard}>
                    {/* Product Info */}
                    <View style={styles.productRow}>
                        <View style={styles.productInfo}>
                            <Text style={styles.category}>{getCategory()}</Text>
                            <Text style={styles.productName}>{product.name}</Text>
                        </View>
                        {product.imageUrl ? (
                            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                        ) : (
                            <View style={[styles.productImage, styles.noImage]}>
                                <Text style={styles.noImageText}>📦</Text>
                            </View>
                        )}
                    </View>

                    {/* Safety Status */}
                    <Pressable
                        style={[styles.safetyBox, { backgroundColor: `${safetyConfig.color}10` }]}
                        onPress={() => router.push({ pathname: '/safety-details', params: { productData } })}
                    >
                        <View style={[styles.safetyIconBg, { backgroundColor: `${safetyConfig.color}20` }]}>
                            <SafetyIcon size={40} color={safetyConfig.color} />
                        </View>
                        <Text style={[styles.safetyLabel, { color: safetyConfig.color }]}>{safetyConfig.label}</Text>
                        <Text style={styles.safetyDescription}>{safetyConfig.description}</Text>
                        <View style={styles.tapHint}>
                            <Text style={styles.tapHintText}>Tap for details</Text>
                            <ChevronRight size={14} color={colors.mutedForeground} />
                        </View>
                    </Pressable>

                    {/* Environmental note */}
                    <View style={styles.envNote}>
                        <Leaf size={14} color={colors.mutedForeground} />
                        <Text style={styles.envNoteText}>Environmental info available</Text>
                    </View>
                </View>

                {/* Family Profile */}
                {profile && (
                    <View style={styles.familyRow}>
                        <View style={styles.familyAvatars}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{profile.full_name?.[0] || '?'}</Text>
                            </View>
                        </View>
                        <Text style={styles.familyText}>
                            Based on <Text style={styles.familyName}>{profile.full_name || 'Your'} Profile</Text>
                        </Text>
                    </View>
                )}

                {/* Ingredient Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INGREDIENT BREAKDOWN</Text>
                    {ingredientBreakdown.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Pressable
                                key={index}
                                style={styles.breakdownCard}
                                onPress={() => router.push({ pathname: '/ingredient-glossary', params: { productData } })}
                            >
                                <View style={styles.breakdownLeft}>
                                    <View style={[styles.breakdownIcon, { backgroundColor: `${item.iconColor}10` }]}>
                                        <Icon size={20} color={item.iconColor} />
                                    </View>
                                    <View>
                                        <Text style={styles.breakdownTitle}>{item.title}</Text>
                                        <Text style={styles.breakdownSubtitle}>{item.subtitle}</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={`${colors.mutedForeground}40`} />
                            </Pressable>
                        );
                    })}
                </View>

                {/* Save Button */}
                <Pressable
                    style={[styles.saveButton, isFavorite && styles.saveButtonActive]}
                    onPress={handleSaveToFavorites}
                >
                    <Heart size={20} color={isFavorite ? '#fff' : colors.primaryForeground} fill={isFavorite ? '#fff' : 'none'} />
                    <Text style={styles.saveButtonText}>
                        {isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
                    </Text>
                </Pressable>

                {/* Alternatives Link */}
                <Pressable
                    style={styles.alternativesLink}
                    onPress={() => router.push({ pathname: '/alternatives', params: { productData } })}
                >
                    <Text style={styles.alternativesText}>View safer alternatives →</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    blurLeft: { position: 'absolute', top: '25%', left: -128, width: 256, height: 256, backgroundColor: colors.chart1, opacity: 0.05, borderRadius: 128 },
    blurRight: { position: 'absolute', bottom: '25%', right: -96, width: 192, height: 192, backgroundColor: colors.accent, opacity: 0.3, borderRadius: 96 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[6], paddingBottom: spacing[4], zIndex: 20 },
    headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.card}CC`, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
    headerTitle: { fontSize: 18, fontFamily: fonts.heading.bold, color: colors.primary },
    scrollView: { flex: 1, zIndex: 10 },
    scrollContent: { paddingHorizontal: spacing[6] },
    mainCard: { backgroundColor: colors.card, borderRadius: radius['3xl'], padding: spacing[6], marginBottom: spacing[4], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: `${colors.border}40` },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[6] },
    productInfo: { flex: 1, paddingRight: spacing[4] },
    category: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[1] },
    productName: { fontSize: 24, fontFamily: fonts.heading.bold, color: colors.primary, lineHeight: 30 },
    productImage: { width: 64, height: 64, borderRadius: radius['2xl'], backgroundColor: colors.muted, overflow: 'hidden' },
    noImage: { alignItems: 'center', justifyContent: 'center' },
    noImageText: { fontSize: 28 },
    safetyBox: { alignItems: 'center', paddingVertical: spacing[6], paddingHorizontal: spacing[4], borderRadius: radius['2xl'], borderWidth: 1, borderColor: 'transparent' },
    safetyIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] },
    safetyLabel: { fontSize: 24, fontFamily: fonts.heading.bold, marginBottom: spacing[1] },
    safetyDescription: { fontSize: 14, fontFamily: fonts.sans.medium, color: colors.mutedForeground, textAlign: 'center' },
    tapHint: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[3], gap: spacing[1] },
    tapHintText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    envNote: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[4], paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: `${colors.border}30` },
    envNoteText: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.mutedForeground },
    familyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], marginBottom: spacing[8] },
    familyAvatars: { flexDirection: 'row' },
    avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background },
    avatarText: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.primaryForeground },
    familyText: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.mutedForeground },
    familyName: { color: colors.primary, fontFamily: fonts.sans.bold },
    section: { marginBottom: spacing[8] },
    sectionTitle: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.primary, letterSpacing: 2, marginBottom: spacing[4], paddingHorizontal: spacing[1] },
    breakdownCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: spacing[4], borderRadius: radius['2xl'], marginBottom: spacing[3], borderWidth: 1, borderColor: `${colors.border}30` },
    breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
    breakdownIcon: { width: 40, height: 40, borderRadius: radius['xl'], alignItems: 'center', justifyContent: 'center' },
    breakdownTitle: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.foreground },
    breakdownSubtitle: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    saveButton: { backgroundColor: colors.primary, paddingVertical: spacing[4], borderRadius: radius['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    saveButtonActive: { backgroundColor: colors.chart1 },
    saveButtonText: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.primaryForeground },
    alternativesLink: { alignItems: 'center', paddingVertical: spacing[4] },
    alternativesText: { fontSize: 14, fontFamily: fonts.sans.semiBold, color: colors.primary },
});
