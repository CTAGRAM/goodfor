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
import { searchProducts, getAlternatives } from "@/lib/openFoodFacts";
import { useState, useEffect } from "react";
import { analyzeProductSafety, yearsToMonths } from "@/lib/productSafety";

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
            // Use the new getAlternatives function
            const alts = await getAlternatives(product, 4);

            // Map to display format with safety analysis
            const mapped = alts.map((alt, index) => {
                // Calculate safety score
                const safetyAnalysis = analyzeProductSafety(alt, yearsToMonths(5));
                const score = Math.round(safetyAnalysis.safeScore);

                return {
                    barcode: alt.barcode,
                    name: alt.name,
                    brand: alt.brand,
                    imageUrl: alt.imageUrl,
                    score: score,
                    badge: index === 0 ? 'Top Match' : index === 1 ? 'Eco-Friendly' : 'Popular Choice',
                    reasons: getReasons(alt, product),
                };
            });

            setAlternatives(mapped);
        } catch (error) {
            console.error('Failed to load alternatives:', error);
            setAlternatives([]);
        } finally {
            setLoading(false);
        }
    };

    function getReasons(altProduct, originalProduct) {
        const reasons = [];

        // Compare nutriscore
        if (altProduct.nutriScore && altProduct.nutriScore < (originalProduct.nutriScore || 'e')) {
            reasons.push('Better nutritional profile');
        }

        // Check additives
        if (altProduct.additives.length < (originalProduct.additives?.length || 999)) {
            reasons.push('Fewer additives');
        }

        // Check sugars
        if (altProduct.nutriments.sugars < (originalProduct.nutriments?.sugars || 999)) {
            reasons.push('Lower sugar content');
        }

        // Fallback reasons
        if (reasons.length === 0) {
            reasons.push('No synthetic pesticides or additives');
            reasons.push('Naturally processed');
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
