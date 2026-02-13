import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Share } from "react-native";
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

    // Parse product with defensive defaults to handle both fresh scan and history navigation
    const product = JSON.parse(productData || '{}');

    // Ensure safety analysis exists with defaults (handles both fresh and history data)
    const safety = product.safetyAnalysis || {
        safety: SAFETY_LEVELS.SAFE,
        safeScore: 50,
        issues: [],
        ageAppropriate: true,
        nutriScore: null,
    };

    // Ensure required objects exist for UI calculations
    if (!product.nutriments) product.nutriments = {};
    if (!product.allergens) product.allergens = [];
    if (!product.categories) product.categories = [];
    if (!safety.issues) safety.issues = [];

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

    // Get Nutri-Score grade info
    const getNutriScoreInfo = () => {
        const grade = safety.nutriScore?.grade || product.nutriScore?.toUpperCase() || null;
        const gradeColors = {
            'A': '#038141', 'B': '#85BB2F', 'C': '#FECB02', 'D': '#EE8100', 'E': '#E63E11'
        };
        return { grade, color: gradeColors[grade] || colors.mutedForeground };
    };
    const nutriScoreInfo = getNutriScoreInfo();

    // Ingredients from OpenFoodFacts
    const ingredientsPreview = product.ingredientsText
        ? (product.ingredientsText.length > 80
            ? product.ingredientsText.substring(0, 80) + '...'
            : product.ingredientsText)
        : 'No ingredients data available';

    const ingredientBreakdown = [
        {
            icon: Leaf,
            iconColor: colors.chart1,
            title: 'Natural Ingredients',
            subtitle: ingredientsPreview || 'Standard quality sources',
        },
        {
            icon: Droplets,
            iconColor: (product.nutriments?.sugars || 0) > 12.5 ? colors.chart3 : (product.nutriments?.sugars || 0) > 4.5 ? colors.chart2 : colors.chart1,
            title: 'Added Sugars',
            subtitle: (product.nutriments?.sugars || 0) > 12.5 ? `High (${(product.nutriments?.sugars || 0).toFixed(1)}g per 100g)` :
                (product.nutriments?.sugars || 0) > 4.5 ? `Moderate (${(product.nutriments?.sugars || 0).toFixed(1)}g per 100g)` :
                    `Low (${(product.nutriments?.sugars || 0).toFixed(1)}g per 100g)`,
        },
        {
            icon: Shield,
            iconColor: product.allergens?.length > 0 ? colors.chart2 : colors.chart1,
            title: 'Allergen Status',
            subtitle: product.allergens?.length > 0 ? `Contains ${product.allergens.length} allergen(s)` : 'No major allergens detected',
        },
    ];

    const handleSaveToFavorites = () => {
        setIsFavorite(!isFavorite);
        // TODO: Save to Supabase favorites
    };

    const handleShare = async () => {
        try {
            const message = `🔍 ${product.name} - Safety Analysis\n\nRating: ${safetyConfig.label} (${safety.safeScore}/100)\nBrand: ${product.brand || 'Unknown'}\n\n${safetyConfig.description}\n\nAnalyzed with GoodFor`;
            await Share.share({ message, title: `${product.name} Analysis` });
        } catch (error) {
            console.error('Share error:', error);
        }
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
                <Pressable style={styles.headerButton} onPress={handleShare}>
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

                    {/* Environmental Badge + Analysis Button */}
                    <View style={styles.bottomSection}>
                        <View style={styles.badgeRow}>
                            {nutriScoreInfo.grade && (
                                <View style={[styles.nutriBadge, { backgroundColor: `${nutriScoreInfo.color}15`, borderColor: nutriScoreInfo.color }]}>
                                    <Text style={[styles.nutriGrade, { color: nutriScoreInfo.color }]}>{nutriScoreInfo.grade}</Text>
                                    <Text style={styles.nutriLabel}>Nutri-Score</Text>
                                </View>
                            )}
                            <View style={[styles.scoreBadge, { backgroundColor: `${safetyConfig.color}15`, borderColor: safetyConfig.color }]}>
                                <Text style={[styles.scoreValue, { color: safetyConfig.color }]}>{Math.round(safety.safeScore || 0)}</Text>
                                <Text style={styles.scoreLabel}>/100</Text>
                            </View>
                        </View>
                        <View style={styles.envBadge}>
                            <Leaf size={14} color={colors.mutedForeground} />
                            <Text style={styles.envBadgeText}>Environmental info available</Text>
                        </View>
                        <Pressable
                            style={styles.analysisButton}
                            onPress={() => router.push({ pathname: '/safety-details', params: { productData } })}
                        >
                            <Text style={styles.analysisButtonText}>📊 Detailed Score Analysis</Text>
                        </Pressable>
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

                    {/* Full Ingredients List */}
                    {product.ingredientsText && (
                        <View style={styles.ingredientsListCard}>
                            <Text style={styles.ingredientsListTitle}>Complete Ingredients</Text>
                            <Text style={styles.ingredientsListText}>{product.ingredientsText}</Text>
                        </View>
                    )}

                    {/* AI Ingredient Summary */}
                    {product.ingredientsText && (
                        <View style={styles.aiSummaryCard}>
                            <Text style={styles.aiSummaryTitle}>🤖 AI Ingredient Analysis</Text>
                            <Text style={styles.aiSummaryText}>
                                {product.ingredientsText.split(',').length} ingredients detected.
                                {safety.issues?.length > 0 ? ` ⚠️ ${safety.issues.length} concern(s): ${safety.issues.map(i => i.title).join(', ')}.` : ' ✅ No major concerns.'}
                                {product.allergens?.length > 0 ? ` Contains: ${product.allergens.join(', ')}.` : ''}
                            </Text>
                        </View>
                    )}

                    {/* Nutri-Score Breakdown */}
                    {safety.nutriScore && (
                        <View style={styles.nutriScoreCard}>
                            <View style={styles.nutriScoreHeader}>
                                <Text style={styles.nutriScoreTitle}>Nutri-Score Analysis</Text>
                                <View style={[styles.nutriScoreGradeBadge, { backgroundColor: safety.nutriScore.gradeColor }]}>
                                    <Text style={styles.nutriScoreGradeText}>{safety.nutriScore.grade}</Text>
                                </View>
                            </View>

                            {/* Positives */}
                            <View style={styles.nutriScoreSection}>
                                <Text style={styles.nutriScoreSectionTitle}>✅ Positives</Text>
                                {safety.nutriScore.breakdown?.positives && (
                                    <>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Fruits & Vegetables</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {safety.nutriScore.breakdown.positives.fruitVeg.value}%
                                            </Text>
                                            <View style={styles.nutriScorePoints}>
                                                <Text style={styles.nutriScorePointsText}>+{safety.nutriScore.breakdown.positives.fruitVeg.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Fiber</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {safety.nutriScore.breakdown.positives.fiber.value.toFixed(1)}g
                                            </Text>
                                            <View style={styles.nutriScorePoints}>
                                                <Text style={styles.nutriScorePointsText}>+{safety.nutriScore.breakdown.positives.fiber.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Protein</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {safety.nutriScore.breakdown.positives.protein.value.toFixed(1)}g
                                            </Text>
                                            <View style={styles.nutriScorePoints}>
                                                <Text style={styles.nutriScorePointsText}>+{safety.nutriScore.breakdown.positives.protein.points}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>

                            {/* Negatives */}
                            <View style={styles.nutriScoreSection}>
                                <Text style={styles.nutriScoreSectionTitle}>⚠️ Negatives</Text>
                                {safety.nutriScore.breakdown?.negatives && (
                                    <>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Energy</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {safety.nutriScore.breakdown.negatives.energy.value}kcal
                                            </Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.energy.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Sugar</Text>
                                            <View style={styles.nutriScoreBar}>
                                                <View style={[styles.nutriScoreBarFill, {
                                                    width: `${Math.min(100, (safety.nutriScore.breakdown.negatives.sugars.value / 45) * 100)}%`,
                                                    backgroundColor: safety.nutriScore.breakdown.negatives.sugars.points > 5 ? colors.destructive : colors.chart2
                                                }]} />
                                            </View>
                                            <Text style={styles.nutriScoreValue}>
                                                {safety.nutriScore.breakdown.negatives.sugars.value.toFixed(1)}g
                                            </Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.sugars.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Saturated Fat</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {safety.nutriScore.breakdown.negatives.saturates.value.toFixed(1)}g
                                            </Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.saturates.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Sodium</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {safety.nutriScore.breakdown.negatives.sodium.value}mg
                                            </Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.sodium.points}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    )}
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
    bottomSection: { marginTop: spacing[4], paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: `${colors.border}30`, gap: spacing[4] },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] },
    nutriBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.xl, borderWidth: 1.5 },
    nutriGrade: { fontSize: 20, fontFamily: fonts.heading.bold },
    nutriLabel: { fontSize: 10, fontFamily: fonts.sans.medium, color: colors.mutedForeground },
    scoreBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 2, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.xl, borderWidth: 1.5 },
    scoreValue: { fontSize: 18, fontFamily: fonts.heading.bold },
    scoreLabel: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.mutedForeground },
    envBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.muted, alignSelf: 'flex-start', paddingHorizontal: spacing[3], paddingVertical: 6, borderRadius: radius.full },
    envBadgeText: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.mutedForeground },
    analysisButton: { backgroundColor: colors.secondary, paddingVertical: spacing[3], borderRadius: radius.xl, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: `${colors.border}40` },
    analysisButtonText: { fontSize: 14, fontFamily: fonts.sans.medium, color: colors.secondaryForeground },
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
    breakdownSubtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: fonts.sans },
    ingredientsListCard: {
        backgroundColor: colors.card,
        padding: spacing[5],
        borderRadius: radius['2xl'],
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: spacing[3],
    },
    ingredientsListTitle: {
        fontSize: 14,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        marginBottom: spacing[3],
    },
    ingredientsListText: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 20,
    },
    aiSummaryCard: {
        backgroundColor: '#E8F5E9',
        padding: spacing[5],
        borderRadius: radius['2xl'],
        borderWidth: 1,
        borderColor: colors.chart1,
        marginTop: spacing[3],
    },
    aiSummaryTitle: {
        fontSize: 14,
        fontFamily: fonts.heading.bold,
        color: colors.chart1,
        marginBottom: spacing[2],
    },
    aiSummaryText: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
        lineHeight: 20,
    },
    saveButton: { backgroundColor: colors.primary, paddingVertical: spacing[4], borderRadius: radius['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    saveButtonActive: { backgroundColor: colors.chart1 },
    saveButtonText: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.primaryForeground },
    alternativesLink: { alignItems: 'center', paddingVertical: spacing[4] },
    alternativesText: { fontSize: 14, fontFamily: fonts.sans.semiBold, color: colors.primary },
    // Nutri-Score Styles
    nutriScoreCard: {
        backgroundColor: colors.card,
        padding: spacing[5],
        borderRadius: radius['2xl'],
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: spacing[4],
    },
    nutriScoreHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    nutriScoreTitle: {
        fontSize: 16,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    nutriScoreGradeBadge: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nutriScoreGradeText: {
        fontSize: 20,
        fontFamily: fonts.heading.bold,
        color: '#fff',
    },
    nutriScoreSection: {
        marginBottom: spacing[4],
    },
    nutriScoreSectionTitle: {
        fontSize: 12,
        fontFamily: fonts.sans.semiBold,
        color: colors.mutedForeground,
        marginBottom: spacing[2],
    },
    nutriScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[2],
        gap: spacing[2],
    },
    nutriScoreLabel: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
    },
    nutriScoreValue: {
        fontSize: 13,
        fontFamily: fonts.sans.semiBold,
        color: colors.foreground,
        minWidth: 50,
        textAlign: 'right',
    },
    nutriScorePoints: {
        backgroundColor: colors.chart1,
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: radius['xl'],
        minWidth: 32,
        alignItems: 'center',
    },
    nutriScorePointsNegative: {
        backgroundColor: colors.chart3,
    },
    nutriScorePointsText: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        color: '#fff',
    },
    nutriScoreBar: {
        flex: 1,
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        marginHorizontal: spacing[2],
        overflow: 'hidden',
    },
    nutriScoreBarFill: {
        height: '100%',
        borderRadius: 3,
    },
});
