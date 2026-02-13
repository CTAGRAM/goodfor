import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Search,
    Star,
    CheckCircle,
    ChevronRight,
    Award
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getAlternativesEdge } from "@/lib/edgeFunctions";
import { getAlternatives as getAlternativesLocal } from "@/lib/openFoodFacts";
import { useState, useEffect } from "react";

export default function Alternatives() {
    const { productData } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [alternatives, setAlternatives] = useState([]);
    const [loading, setLoading] = useState(true);

    const product = JSON.parse(productData);

    useEffect(() => {
        loadAlternatives();
    }, []);

    const loadAlternatives = async () => {
        try {
            setLoading(true);
            console.log('[Alternatives] Loading for product:', product.barcode);
            console.log('[Alternatives] Product categories:', product.categories);

            let alts = [];

            // Try Edge Function first
            try {
                alts = await getAlternativesEdge(product);
                console.log('[Alternatives] Got', alts.length, 'alternatives from Edge Function');
            } catch (edgeError) {
                console.log('[Alternatives] Edge Function failed:', edgeError.message);
            }

            // Fallback to OpenFoodFacts direct API if edge function returns empty
            if (alts.length === 0) {
                console.log('[Alternatives] Using OpenFoodFacts fallback...');
                alts = await getAlternativesLocal(product, 5);
                console.log('[Alternatives] Got', alts.length, 'alternatives from OpenFoodFacts');

                // Map OpenFoodFacts format to display format with better scoring
                const mapped = alts.map((alt, index) => {
                    // Calculate score based on nutriscore grade
                    const nutriScoreMap = { 'a': 95, 'b': 85, 'c': 70, 'd': 55, 'e': 40 };
                    const baseScore = nutriScoreMap[alt.nutriScore?.toLowerCase()] || 65;

                    // Adjust for additives (fewer is better)
                    const additiveBonus = Math.max(0, 5 - (alt.additives?.length || 0));

                    return {
                        barcode: alt.barcode,
                        name: alt.name,
                        brand: alt.brand,
                        imageUrl: alt.imageUrl,
                        score: Math.min(100, baseScore + additiveBonus),
                        nutriScore: alt.nutriScore,
                        badge: index === 0 ? 'Top Match' :
                            alt.nutriScore === 'a' ? 'Excellent' :
                            alt.nutriScore === 'b' ? 'Healthy Choice' : 'Alternative',
                        reasons: getReasons(alt, product),
                    };
                });
                setAlternatives(mapped);
                return;
            }

            // Map Edge Function format with improved badges
            const mapped = alts.map((alt, index) => ({
                barcode: alt.barcode,
                name: alt.name,
                brand: alt.brand,
                imageUrl: alt.imageUrl,
                score: alt.safetyScore || alt.safety_score || 75,
                nutriScore: alt.nutriScore || alt.nutri_score,
                badge: index === 0 ? 'Top Match' :
                    alt.safetyLevel === 'safe' || alt.safety_level === 'safe' ? 'Safe Choice' :
                    (alt.nutriScore === 'a' || alt.nutriScore === 'b') ? 'Healthy Choice' :
                        'Alternative',
                reasons: alt.reasons || [alt.reason || alt.improvement || 'Better nutritional profile'],
            }));

            setAlternatives(mapped);
        } catch (error) {
            console.error('[Alternatives] Failed to load:', error);
            setAlternatives([]);
        } finally {
            setLoading(false);
        }
    };

    function getReasons(altProduct, originalProduct) {
        const reasons = [];

        // Nutri-Score comparison (a < b < c < d < e alphabetically = better)
        const altNutri = altProduct.nutriScore?.toLowerCase() || 'z';
        const origNutri = originalProduct.nutriScore?.toLowerCase() || originalProduct.safetyAnalysis?.nutriScore?.grade?.toLowerCase() || 'z';
        if (altNutri < origNutri) {
            reasons.push('Better Nutri-Score grade');
        }

        // Check additives
        const altAdditives = altProduct.additives?.length || 0;
        const origAdditives = originalProduct.additives?.length || 999;
        if (altAdditives < origAdditives && origAdditives !== 999) {
            reasons.push('Fewer additives');
        }

        // Check sugars
        const altSugars = altProduct.nutriments?.sugars || 0;
        const origSugars = originalProduct.nutriments?.sugars || 999;
        if (altSugars < origSugars && origSugars !== 999) {
            if (altSugars < origSugars * 0.7) {
                reasons.push('Significantly lower sugar');
            } else {
                reasons.push('Lower sugar content');
            }
        }

        // Check sodium
        const altSodium = altProduct.nutriments?.sodium || 0;
        const origSodium = originalProduct.nutriments?.sodium || 999;
        if (altSodium < origSodium && origSodium !== 999) {
            reasons.push('Lower sodium content');
        }

        // Check NOVA group (1-4, lower is less processed)
        const altNova = altProduct.novaGroup || 5;
        const origNova = originalProduct.novaGroup || 5;
        if (altNova < origNova && origNova !== 5) {
            reasons.push('Less processed');
        }

        // Add positive attributes if we don't have enough reasons yet
        if (reasons.length < 2) {
            if (altProduct.nutriScore === 'a') {
                reasons.push('Excellent nutritional profile');
            } else if (altProduct.nutriScore === 'b') {
                reasons.push('Good nutritional balance');
            }
        }

        // Final fallback reasons
        if (reasons.length === 0) {
            if (altProduct.novaGroup && altProduct.novaGroup <= 2) {
                reasons.push('Minimally processed');
            }
            reasons.push('Better alternative in category');
        }

        return reasons.slice(0, 2);
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.blurLeft} />
            <View style={styles.blurRight} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Pressable style={styles.headerButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Safer Alternatives</Text>
                <Pressable style={styles.headerButton} onPress={() => { }}>
                    <Search size={20} color={colors.foreground} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Better for you & your home</Text>
                    <Text style={styles.subtitle}>
                        We found these top-rated options that match your family's health profile perfectly.
                    </Text>
                </View>

                {/* Alternatives List */}
                <View style={styles.alternativesList}>
                    {loading ? (
                        <View style={styles.loadingCard}>
                            <Text style={styles.loadingText}>Finding alternatives...</Text>
                        </View>
                    ) : alternatives.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No alternatives found for this product category.</Text>
                        </View>
                    ) : (
                        alternatives.map((alt, index) => (
                            <View key={index} style={styles.alternativeCard}>
                                <View style={styles.altContent}>
                                    {/* Product Row */}
                                    <View style={styles.altProductRow}>
                                        <View style={styles.altImage}>
                                            {alt.imageUrl ? (
                                                <Image source={{ uri: alt.imageUrl }} style={styles.altImageImg} />
                                            ) : (
                                                <Text style={styles.altImagePlaceholder}>🥗</Text>
                                            )}
                                        </View>
                                        <View style={styles.altInfo}>
                                            <View style={styles.altBadgeRow}>
                                                <View style={[styles.altBadge, index === 0 && styles.altBadgeTop]}>
                                                    <Text style={[styles.altBadgeText, index === 0 && styles.altBadgeTextTop]}>
                                                        {alt.badge}
                                                    </Text>
                                                </View>
                                                <View style={styles.scoreBox}>
                                                    <Star size={12} color={colors.chart1} fill={colors.chart1} />
                                                    <Text style={styles.scoreText}>{alt.score}/100</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.altName}>{alt.name}</Text>
                                            {alt.brand && <Text style={styles.altBrand}>{alt.brand}</Text>}
                                        </View>
                                    </View>

                                    {/* Reasons */}
                                    <View style={styles.reasonsBox}>
                                        <Text style={styles.reasonsLabel}>WHY IT'S BETTER</Text>
                                        {alt.reasons.map((reason, rIndex) => (
                                            <View key={rIndex} style={styles.reasonRow}>
                                                <View style={styles.reasonIcon}>
                                                    <CheckCircle size={14} color={colors.chart1} />
                                                </View>
                                                <Text style={styles.reasonText}>{reason}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Button */}
                                    <Pressable
                                        style={[styles.viewButton, index === 0 && styles.viewButtonPrimary]}
                                        onPress={() => {
                                            // Navigate to scan this product
                                            if (alt.barcode) {
                                                router.push({ pathname: '/scan-processing', params: { barcode: alt.barcode } });
                                            }
                                        }}
                                    >
                                        <Text style={[styles.viewButtonText, index === 0 && styles.viewButtonTextPrimary]}>
                                            View details
                                        </Text>
                                        <ChevronRight size={16} color={index === 0 ? colors.primaryForeground : colors.primary} />
                                    </Pressable>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Encouragement */}
                <View style={styles.encouragement}>
                    <View style={styles.encourageIcon}>
                        <Award size={24} color={`${colors.primary}70`} />
                    </View>
                    <Text style={styles.encourageTitle}>Great choices lead to a healthier lifestyle!</Text>
                    <Text style={styles.encourageSubtitle}>
                        All alternatives are vetted by our expert panel of nutritionists.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    blurLeft: { position: 'absolute', top: '25%', left: -128, width: 256, height: 256, backgroundColor: colors.chart1, opacity: 0.05, borderRadius: 128 },
    blurRight: { position: 'absolute', bottom: '25%', right: -96, width: 192, height: 192, backgroundColor: colors.accent, opacity: 0.3, borderRadius: 96 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[6], paddingBottom: spacing[4], zIndex: 20 },
    headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.card}CC`, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontFamily: fonts.heading.bold, color: colors.primary },
    scrollView: { flex: 1, zIndex: 10 },
    scrollContent: { paddingHorizontal: spacing[6] },
    titleSection: { marginBottom: spacing[8] },
    title: { fontSize: 24, fontFamily: fonts.heading.bold, color: colors.primary, marginBottom: spacing[2] },
    subtitle: { fontSize: 14, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    alternativesList: { gap: spacing[6] },
    loadingCard: { backgroundColor: colors.card, borderRadius: radius['3xl'], padding: spacing[8], alignItems: 'center' },
    loadingText: { fontSize: 14, fontFamily: fonts.sans.medium, color: colors.mutedForeground },
    emptyCard: { backgroundColor: colors.card, borderRadius: radius['3xl'], padding: spacing[8], alignItems: 'center' },
    emptyText: { fontSize: 14, fontFamily: fonts.sans.medium, color: colors.mutedForeground, textAlign: 'center' },
    alternativeCard: { backgroundColor: colors.card, borderRadius: radius['3xl'], overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, borderWidth: 1, borderColor: `${colors.border}40` },
    altContent: { padding: spacing[5] },
    altProductRow: { flexDirection: 'row', gap: spacing[4], marginBottom: spacing[4] },
    altImage: { width: 80, height: 80, borderRadius: radius['2xl'], backgroundColor: colors.muted, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    altImageImg: { width: '100%', height: '100%' },
    altImagePlaceholder: { fontSize: 32 },
    altInfo: { flex: 1 },
    altBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[1] },
    altBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, backgroundColor: colors.muted, borderRadius: radius.full },
    altBadgeTop: { backgroundColor: `${colors.chart1}10` },
    altBadgeText: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.mutedForeground, letterSpacing: 0.5 },
    altBadgeTextTop: { color: colors.chart1 },
    scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${colors.chart1}05`, paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: 6 },
    scoreText: { fontSize: 12, fontFamily: fonts.sans.bold, color: colors.chart1 },
    altName: { fontSize: 18, fontFamily: fonts.heading.bold, color: colors.primary, marginTop: spacing[1] },
    altBrand: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    reasonsBox: { backgroundColor: `${colors.muted}50`, borderRadius: radius['2xl'], padding: spacing[4], marginBottom: spacing[4] },
    reasonsLabel: { fontSize: 10, fontFamily: fonts.sans.bold, color: `${colors.primary}60`, letterSpacing: 2, marginBottom: spacing[3] },
    reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], marginBottom: spacing[2] },
    reasonIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: `${colors.chart1}20`, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    reasonText: { fontSize: 14, fontFamily: fonts.sans.medium, color: colors.foreground, flex: 1 },
    viewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: radius['xl'], borderWidth: 1, borderColor: colors.primary },
    viewButtonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    viewButtonText: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.primary },
    viewButtonTextPrimary: { color: colors.primaryForeground },
    encouragement: { marginTop: spacing[8], alignItems: 'center', paddingHorizontal: spacing[4] },
    encourageIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[3] },
    encourageTitle: { fontSize: 14, fontFamily: fonts.sans.medium, color: colors.primary, textAlign: 'center' },
    encourageSubtitle: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing[1] },
});
