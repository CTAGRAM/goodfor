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
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function Alternatives() {
    const { productData } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();
    const [alternatives, setAlternatives] = useState([]);
    const [loading, setLoading] = useState(true);

    // Parse with defaults
    let product = {};
    try {
        product = JSON.parse(productData || '{}');
    } catch (e) {
        console.error('Failed to parse product data:', e);
    }

    // Detect if this is a beauty product
    const isBeautyProduct = product.productType === 'BEAUTY' || product.safetyAnalysis?.productType === 'BEAUTY';

    useEffect(() => {
        loadAlternatives();
    }, []);

    const loadAlternatives = async () => {
        try {
            setLoading(true);
            console.log('[Alternatives] Loading for product:', product.barcode, 'Type:', isBeautyProduct ? 'BEAUTY' : 'FOOD');

            let alts = [];

            if (isBeautyProduct) {
                // Use OpenBeautyFacts for cosmetics
                console.log('[Alternatives] Using OpenBeautyFacts for beauty product...');
                const { getBeautyAlternatives } = await import('@/lib/openBeautyFacts');
                alts = await getBeautyAlternatives(product, 5);

                // Map to display format
                const mapped = alts.map((alt, index) => ({
                    barcode: alt.barcode,
                    name: alt.name,
                    brand: alt.brand,
                    imageUrl: alt.imageUrl,
                    score: alt.safetyScore || 70,
                    badge: index === 0 ? 'Top Match' :
                        alt.isOrganic ? 'Organic' :
                            alt.isVegan ? 'Vegan' :
                                alt.isCrueltyFree ? 'Cruelty-Free' : 'Alternative',
                    reasons: getBeautyReasons(alt, product),
                }));
                setAlternatives(mapped);
                return;
            }

            // FOOD PRODUCT: Log product data for debugging
            const productCategories = product.categories || [];
            console.log('[Alternatives] Food product data:', {
                barcode: product.barcode,
                name: product.name,
                categories: productCategories,
                category: product.category || product.safetyAnalysis?.category,
                nutriScore: product.nutriScore || product.safetyAnalysis?.nutriScore?.grade,
            });

            // Helper: validate that an alternative is related to the scanned product
            // This prevents unrelated products (e.g., water for dates) from appearing
            const productNameKeywords = (product.name || '')
                .toLowerCase()
                .replace(/[^a-z\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !['with', 'and', 'the', 'for', 'from', 'pack', 'size',
                    'premium', 'original', 'classic', 'natural'].includes(w));

            const isRelevantAlternative = (alt) => {
                if (productCategories.length === 0) return true; // no categories to filter, accept all
                const altCategories = alt.categories_tags || alt.categories || [];

                // V7: When alt has NO categories, check name relevance instead of blind accept
                if (altCategories.length === 0) {
                    if (productNameKeywords.length === 0) return true; // can't validate, accept
                    const altName = (alt.name || alt.product_name || '').toLowerCase();
                    return productNameKeywords.some(word => altName.includes(word));
                }

                // Use the most specific categories (last 3) for comparison
                const specificCats = productCategories.length > 3
                    ? productCategories.slice(-3)
                    : productCategories;

                const categoryMatch = specificCats.some(cat => altCategories.includes(cat));

                // If broad categories only, also verify name relevance
                if (productCategories.length <= 2 && categoryMatch) {
                    // Broad category match (e.g., both share "plant-based-foods") — check name too
                    if (productNameKeywords.length > 0) {
                        const altName = (alt.name || alt.product_name || '').toLowerCase();
                        const altCatString = altCategories.join(' ').toLowerCase();
                        const nameMatch = productNameKeywords.some(word =>
                            altName.includes(word) || altCatString.includes(word)
                        );
                        return nameMatch;
                    }
                }

                return categoryMatch;
            };

            // ──── STRATEGY 1: OpenFoodFacts local (fast, category-filtered) ────
            console.log('[Alternatives] Strategy 1: OpenFoodFacts local for:', product.name);
            console.log('[Alternatives] Product categories:', productCategories);
            try {
                alts = await getAlternativesLocal(product, 5, { country: profile?.region || 'US' });
                console.log('[Alternatives] Got', alts.length, 'alternatives from OpenFoodFacts');
            } catch (localError) {
                console.log('[Alternatives] OpenFoodFacts failed:', localError.message);
            }

            // Map OpenFoodFacts format to display format
            if (alts.length > 0) {
                const mapped = alts.map((alt, index) => {
                    const nutriScoreMap = { 'a': 95, 'b': 85, 'c': 70, 'd': 55, 'e': 40 };
                    const baseScore = nutriScoreMap[alt.nutriScore?.toLowerCase()] || 65;
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

            // ──── STRATEGY 2: Edge Function fallback (only if local returned nothing) ────
            console.log('[Alternatives] Strategy 2: Edge Function fallback...');
            try {
                const edgeAlts = await getAlternativesEdge(product);
                console.log('[Alternatives] Got', edgeAlts.length, 'raw alternatives from Edge Function');

                // CRITICAL: Filter edge function results by category relevance
                // The edge function often returns unrelated products (water for dates, coke for biscuits)
                const filteredAlts = edgeAlts.filter(alt => isRelevantAlternative(alt));
                console.log('[Alternatives] After category filter:', filteredAlts.length, 'relevant alternatives');

                if (filteredAlts.length > 0) {
                    const mapped = filteredAlts.slice(0, 5).map((alt, index) => ({
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
                    return;
                }
            } catch (edgeError) {
                console.log('[Alternatives] Edge Function failed:', edgeError.message);
            }

            // No alternatives found from either source
            console.log('[Alternatives] No relevant alternatives found from any source');
            setAlternatives([]);
        } catch (error) {
            console.error('[Alternatives] Failed to load:', error);
            setAlternatives([]);
        } finally {
            setLoading(false);
        }
    };

    // Beauty-specific reasons
    function getBeautyReasons(altProduct, originalProduct) {
        const reasons = [];

        // Check positive attributes
        if (altProduct.isOrganic && !originalProduct.isOrganic) {
            reasons.push('Certified organic');
        }
        if (altProduct.isVegan && !originalProduct.isVegan) {
            reasons.push('Vegan formulation');
        }
        if (altProduct.isCrueltyFree && !originalProduct.isCrueltyFree) {
            reasons.push('Cruelty-free');
        }

        // Ingredients comparison
        const altIngredients = (altProduct.ingredientsText || '').toLowerCase();
        const origIngredients = (originalProduct.ingredientsText || '').toLowerCase();

        if (!altIngredients.includes('paraben') && origIngredients.includes('paraben')) {
            reasons.push('Paraben-free');
        }
        if (!altIngredients.includes('sulfate') && origIngredients.includes('sulfate')) {
            reasons.push('Sulfate-free');
        }
        if (!altIngredients.includes('fragrance') && !altIngredients.includes('parfum') &&
            (origIngredients.includes('fragrance') || origIngredients.includes('parfum'))) {
            reasons.push('Fragrance-free');
        }

        // Fallback
        if (reasons.length === 0) {
            reasons.push('Cleaner ingredient profile');
            reasons.push('Better safety score');
        }

        return reasons.slice(0, 2);
    }

    function getReasons(altProduct, originalProduct) {
        const reasons = [];

        // Nutri-Score comparison (a < b < c < d < e alphabetically = better)
        const altNutri = altProduct.nutriScore?.toLowerCase() || 'z';
        const origNutri = originalProduct.nutriScore?.toLowerCase() || originalProduct.safetyAnalysis?.nutriScore?.grade?.toLowerCase() || 'z';
        if (altNutri < origNutri) {
            const gradeLabels = { a: 'A (Excellent)', b: 'B (Good)', c: 'C (Fair)', d: 'D (Poor)', e: 'E (Bad)' };
            reasons.push(`Nutri-Score ${gradeLabels[altNutri] || altNutri.toUpperCase()} vs ${origNutri.toUpperCase()}`);
        }

        // Check additives — show specific reduction
        const altAdditives = altProduct.additives?.length || 0;
        const origAdditives = originalProduct.additives?.length || 999;
        if (altAdditives < origAdditives && origAdditives !== 999) {
            const diff = origAdditives - altAdditives;
            reasons.push(altAdditives === 0 ? 'No additives' : `${diff} fewer additives`);
        }

        // Check sugars — show percentage reduction
        const altSugars = altProduct.nutriments?.sugars || 0;
        const origSugars = originalProduct.nutriments?.sugars || 999;
        if (altSugars < origSugars && origSugars !== 999) {
            const reduction = Math.round(((origSugars - altSugars) / origSugars) * 100);
            if (reduction >= 50) {
                reasons.push(`${reduction}% less sugar`);
            } else if (altSugars < origSugars * 0.7) {
                reasons.push('Significantly lower sugar');
            } else {
                reasons.push('Lower sugar content');
            }
        }

        // Check sodium — show percentage
        const altSodium = altProduct.nutriments?.sodium || 0;
        const origSodium = originalProduct.nutriments?.sodium || 999;
        if (altSodium < origSodium && origSodium !== 999) {
            const reduction = Math.round(((origSodium - altSodium) / origSodium) * 100);
            reasons.push(reduction >= 30 ? `${reduction}% less sodium` : 'Lower sodium content');
        }

        // Check NOVA group (1-4, lower is less processed)
        const altNova = altProduct.novaGroup || 5;
        const origNova = originalProduct.novaGroup || 5;
        if (altNova < origNova && origNova !== 5) {
            const novaLabels = { 1: 'unprocessed', 2: 'minimally processed', 3: 'processed', 4: 'ultra-processed' };
            reasons.push(`${novaLabels[altNova] || 'Less processed'} food (NOVA ${altNova})`);
        }

        // Additional positive attributes
        if (reasons.length < 2) {
            // Higher fiber
            const altFiber = altProduct.nutriments?.fiber || 0;
            const origFiber = originalProduct.nutriments?.fiber || 0;
            if (altFiber > origFiber && altFiber > 2) {
                reasons.push(`Higher fiber (${altFiber.toFixed(1)}g)`);
            }

            // Higher protein
            const altProtein = altProduct.nutriments?.proteins || 0;
            const origProtein = originalProduct.nutriments?.proteins || 0;
            if (altProtein > origProtein && altProtein > 3) {
                reasons.push(`More protein (${altProtein.toFixed(1)}g)`);
            }

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

        return reasons.slice(0, 3); // Show up to 3 reasons now
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

                {/* Original Product Card — shows what you scanned */}
                {product.name && (
                    <View style={{
                        backgroundColor: `${colors.chart3}08`,
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: `${colors.chart3}20`,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <View style={{
                            width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                            backgroundColor: `${colors.chart3}15`, alignItems: 'center', justifyContent: 'center',
                        }}>
                            {product.imageUrl ? (
                                <Image source={{ uri: product.imageUrl }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>SCANNED</Text>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 10, fontFamily: fonts.sans?.bold || fonts.sansBold, color: colors.chart3, letterSpacing: 1, marginBottom: 2 }}>
                                YOU SCANNED
                            </Text>
                            <Text style={{ fontSize: 14, fontFamily: fonts.sans?.semiBold || fonts.sansSemiBold, color: colors.foreground }} numberOfLines={1}>
                                {product.name}
                            </Text>
                            {product.brand && (
                                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{product.brand}</Text>
                            )}
                        </View>
                        <View style={{
                            backgroundColor: `${colors.chart3}15`,
                            borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
                        }}>
                            <Text style={{ fontSize: 14, fontFamily: fonts.sans?.bold || fonts.sansBold, color: colors.chart3 }}>
                                {product.safetyAnalysis?.safeScore || product.safetyScore || '—'}
                            </Text>
                        </View>
                    </View>
                )}

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
                                                <Text style={styles.altImagePlaceholder}>ALT</Text>
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
