import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Search,
    CheckCircle,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Info,
    Leaf,
    Share2
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";

export default function IngredientGlossary() {
    const { productData } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [expandedIndex, setExpandedIndex] = useState(0);

    const product = JSON.parse(productData);

    // Parse ingredients from text
    const parseIngredients = () => {
        if (!product.ingredientsText) return [];

        const ingredientNames = product.ingredientsText
            .split(/[,;()]/)
            .map(i => i.trim())
            .filter(i => i.length > 2 && i.length < 50);

        return ingredientNames.slice(0, 10).map((name, index) => {
            const lowerName = name.toLowerCase();
            let status = 'safe';
            let statusLabel = 'Generally safe';

            // Check for concerning ingredients
            if (lowerName.includes('sugar') || lowerName.includes('syrup')) {
                status = 'caution';
                statusLabel = 'Needs caution';
            } else if (lowerName.includes('salt') || lowerName.includes('sodium')) {
                status = 'caution';
                statusLabel = 'Needs caution';
            } else if (lowerName.includes('color') || lowerName.includes('colour') || lowerName.match(/e\d{3}/)) {
                status = 'caution';
                statusLabel = 'Additive';
            }

            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                status,
                statusLabel,
                description: getIngredientDescription(lowerName),
                importance: getIngredientImportance(lowerName),
            };
        });
    };

    function getIngredientDescription(name) {
        if (name.includes('water')) return 'Essential liquid base providing hydration and texture.';
        if (name.includes('sugar')) return 'Sweetener that enhances taste. Consume in moderation.';
        if (name.includes('flour')) return 'Ground grain providing structure and carbohydrates.';
        if (name.includes('oil')) return 'Fat source used for texture and cooking.';
        if (name.includes('salt')) return 'Mineral for flavor. Monitor intake for heart health.';
        if (name.includes('milk') || name.includes('cream')) return 'Dairy product providing protein and calcium.';
        if (name.includes('egg')) return 'Protein source used as binder and leavening agent.';
        return 'A common food ingredient used in this product.';
    }

    function getIngredientImportance(name) {
        if (name.includes('water')) return 'Water provides the liquid base and helps combine ingredients evenly.';
        if (name.includes('sugar')) return 'Added sugars contribute to daily intake limits. WHO recommends under 25g/day for children.';
        if (name.includes('salt')) return 'Sodium intake should be monitored. Excess can affect blood pressure.';
        return 'This ingredient contributes to the product\'s taste, texture, or preservation.';
    }

    const ingredients = parseIngredients();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.blurTop} />
            <View style={styles.blurLeft} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Pressable style={styles.headerButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.headerButton} onPress={() => { }}>
                    <Search size={24} color={colors.foreground} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Ingredient Glossary</Text>
                    <Text style={styles.subtitle}>
                        Simple, honest explanations for every ingredient in this product. No jargon, just the facts.
                    </Text>
                </View>

                {/* Ingredient Cards */}
                <View style={styles.ingredientsList}>
                    {ingredients.map((ingredient, index) => {
                        const isExpanded = expandedIndex === index;
                        const isGreen = ingredient.status === 'safe';
                        const statusColor = isGreen ? colors.chart1 : colors.chart2;
                        const StatusIcon = isGreen ? CheckCircle : AlertTriangle;

                        return (
                            <View key={index} style={styles.ingredientCard}>
                                <View style={styles.ingredientHeader}>
                                    <View>
                                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}10` }]}>
                                            <Text style={[styles.statusText, { color: statusColor }]}>{ingredient.statusLabel}</Text>
                                        </View>
                                    </View>
                                    <StatusIcon size={24} color={statusColor} />
                                </View>

                                <Text style={styles.ingredientDesc}>{ingredient.description}</Text>

                                <Pressable
                                    style={styles.expandSection}
                                    onPress={() => setExpandedIndex(isExpanded ? -1 : index)}
                                >
                                    <Text style={styles.expandLabel}>Why this ingredient matters</Text>
                                    {isExpanded ? (
                                        <ChevronDown size={20} color={colors.mutedForeground} />
                                    ) : (
                                        <ChevronRight size={20} color={colors.mutedForeground} />
                                    )}
                                </Pressable>

                                {isExpanded && (
                                    <Text style={styles.expandContent}>{ingredient.importance}</Text>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Standard note */}
                <View style={styles.standardCard}>
                    <View style={styles.standardHeader}>
                        <Info size={20} color={colors.primary} />
                        <Text style={styles.standardTitle}>Our Standard</Text>
                    </View>
                    <Text style={styles.standardText}>
                        Our labels are based on the latest health guidelines and independent research. We focus on transparency so you can shop with confidence.
                    </Text>
                </View>

                {/* Environmental link */}
                <Pressable style={styles.envLink}>
                    <Leaf size={20} color={colors.chart1} />
                    <Text style={styles.envLinkText}>Environmental notes</Text>
                    <ChevronRight size={20} color={colors.mutedForeground} />
                </Pressable>
            </ScrollView>

            {/* Footer Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
                <Pressable style={styles.shareButton}>
                    <Share2 size={20} color={colors.primaryForeground} />
                    <Text style={styles.shareButtonText}>Share Analysis</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    blurTop: { position: 'absolute', top: -128, right: -128, width: 256, height: 256, backgroundColor: colors.accent, opacity: 0.3, borderRadius: 128 },
    blurLeft: { position: 'absolute', top: '25%', left: -96, width: 192, height: 192, backgroundColor: colors.chart1, opacity: 0.05, borderRadius: 96 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[6], paddingBottom: spacing[4], zIndex: 10 },
    headerButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    scrollView: { flex: 1, zIndex: 10 },
    scrollContent: { paddingHorizontal: spacing[6] },
    titleSection: { marginTop: spacing[4], marginBottom: spacing[8] },
    title: { fontSize: 28, fontFamily: fonts.heading.bold, color: colors.foreground, marginBottom: spacing[3] },
    subtitle: { fontSize: 16, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 24 },
    ingredientsList: { gap: spacing[4] },
    ingredientCard: { backgroundColor: colors.card, borderRadius: radius['3xl'], padding: spacing[5], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
    ingredientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] },
    ingredientName: { fontSize: 18, fontFamily: fonts.heading.bold, color: colors.foreground, marginBottom: spacing[1] },
    statusBadge: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, alignSelf: 'flex-start' },
    statusText: { fontSize: 12, fontFamily: fonts.sans.bold },
    ingredientDesc: { fontSize: 14, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 22, marginBottom: spacing[4] },
    expandSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: `${colors.border}50` },
    expandLabel: { fontSize: 12, fontFamily: fonts.sans.bold, color: colors.foreground, letterSpacing: 0.5 },
    expandContent: { marginTop: spacing[2], fontSize: 14, fontFamily: fonts.sans.regular, color: `${colors.foreground}80`, lineHeight: 22 },
    standardCard: { marginTop: spacing[8], padding: spacing[6], backgroundColor: `${colors.accent}20`, borderRadius: radius['3xl'], borderWidth: 1, borderColor: colors.accent },
    standardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] },
    standardTitle: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.primary },
    standardText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 18 },
    envLink: { marginTop: spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: spacing[5], borderRadius: radius['3xl'], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
    envLinkText: { flex: 1, marginLeft: spacing[3], fontSize: 14, fontFamily: fonts.sans.bold, color: colors.foreground },
    footer: { paddingHorizontal: spacing[6], paddingTop: spacing[4], backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
    shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[3], backgroundColor: colors.primary, paddingVertical: spacing[4], borderRadius: radius.full, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    shareButtonText: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.primaryForeground },
});
