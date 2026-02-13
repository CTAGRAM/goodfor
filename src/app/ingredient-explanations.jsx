import { View, Text, Pressable, ScrollView, StyleSheet, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, CheckCircle, AlertTriangle, AlertCircle, Share2, Shield } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { Card } from '@/components/ui';
import { getIngredientInfo } from '@/data/ingredientDatabase';

// V4: Common ingredient knowledge base for items not in the DB
const COMMON_INGREDIENTS = {
    'water': { description: 'Purified water used as the base solvent. Essential and completely safe.', safety: 'safe' },
    'purified water': { description: 'Filtered and deionized water, free of contaminants. Used as the product base.', safety: 'safe' },
    'salt': { description: 'Sodium chloride, used for flavor and preservation. Excessive intake linked to high blood pressure.', safety: 'caution' },
    'sugar': { description: 'Sucrose, a natural sweetener. Excess consumption contributes to obesity, diabetes, and tooth decay.', safety: 'caution' },
    'cane sugar': { description: 'Natural sweetener derived from sugar cane. Still high in calories and spikes blood sugar levels.', safety: 'caution' },
    'corn syrup': { description: 'Sweetener made from corn starch. High glycemic index and linked to metabolic issues when over-consumed.', safety: 'caution' },
    'high fructose corn syrup': { description: 'Highly processed sweetener associated with obesity, insulin resistance, and fatty liver disease.', safety: 'caution' },
    'palm oil': { description: 'Vegetable oil high in saturated fat. Linked to cardiovascular concerns and major deforestation.', safety: 'caution' },
    'soybean oil': { description: 'Common cooking oil. Rich in omega-6 fatty acids, but excessive intake may promote inflammation.', safety: 'safe' },
    'sunflower oil': { description: 'Light cooking oil with vitamin E. Generally safe but high in omega-6 when over-consumed.', safety: 'safe' },
    'olive oil': { description: 'Heart-healthy monounsaturated fat. Associated with reduced cardiovascular risk.', safety: 'safe' },
    'milk': { description: 'Dairy product providing calcium and protein. Common allergen — check if lactose intolerant.', safety: 'safe' },
    'wheat flour': { description: 'Refined grain flour. Contains gluten — avoid if celiac or gluten-sensitive.', safety: 'safe' },
    'whole wheat flour': { description: 'Less refined than white flour, retaining fiber and nutrients. Contains gluten.', safety: 'safe' },
    'citric acid': { description: 'Natural acid found in citrus fruits. Used as a preservative and flavor enhancer. Generally safe.', safety: 'safe' },
    'pectin': { description: 'Natural fiber from fruits. Used as a thickener and stabilizer. Beneficial for digestion.', safety: 'safe' },
    'gelatin': { description: 'Protein derived from animal collagen. Used as a gelling agent. Not suitable for vegetarians.', safety: 'safe' },
    'soy lecithin': { description: 'Emulsifier derived from soybeans. Helps mix oil and water. Generally safe but is a soy allergen.', safety: 'safe' },
    'vitamin c': { description: 'Ascorbic acid, an essential antioxidant vitamin. Used for preservation and nutritional fortification.', safety: 'safe' },
    'ascorbic acid': { description: 'Vitamin C, a powerful antioxidant. Used as a preservative. Completely safe at normal levels.', safety: 'safe' },
    'natural flavors': { description: 'Extracts from plant or animal sources. Generally safe but composition varies and is not always disclosed.', safety: 'safe' },
    'artificial flavors': { description: 'Synthetically produced flavor compounds. FDA-approved but some people prefer to avoid them.', safety: 'caution' },
    'modified food starch': { description: 'Chemically or physically altered starch used as a thickener. Generally recognized as safe.', safety: 'safe' },
    'xanthan gum': { description: 'Natural thickener produced by bacterial fermentation. Common in gluten-free cooking. Safe in normal amounts.', safety: 'safe' },
    'carrageenan': { description: 'Seaweed-derived thickener. Some studies suggest it may cause gut inflammation in sensitive individuals.', safety: 'caution' },
    'baking soda': { description: 'Sodium bicarbonate, a leavening agent. Completely safe in food quantities.', safety: 'safe' },
    'yeast': { description: 'Microorganism used for fermentation and leavening. Safe and beneficial for bread-making.', safety: 'safe' },
    'cocoa': { description: 'Processed cacao beans. Rich in antioxidants and flavonoids. Safe and potentially beneficial.', safety: 'safe' },
    'cocoa butter': { description: 'Fat extracted from cacao beans. Used in chocolate. Neutral health impact in moderation.', safety: 'safe' },
    'vanilla': { description: 'Natural flavor extract from vanilla beans. Completely safe and widely used.', safety: 'safe' },
    'vanillin': { description: 'Synthetic or natural vanilla flavoring. Safe for consumption.', safety: 'safe' },
    // Cosmetic common ingredients
    'glycerin': { description: 'Humectant that draws moisture to the skin. Very well-tolerated and found in most skincare products.', safety: 'safe' },
    'dimethicone': { description: 'Silicone-based polymer. Creates a smooth barrier on skin. Non-comedogenic and safe for most skin types.', safety: 'safe' },
    'tocopherol': { description: 'Vitamin E, a powerful antioxidant. Protects skin from free radical damage.', safety: 'safe' },
    'hyaluronic acid': { description: 'Naturally occurring molecule that holds 1000x its weight in water. Excellent for hydration.', safety: 'safe' },
    'retinol': { description: 'Vitamin A derivative. Promotes cell turnover and reduces wrinkles. Can cause sensitivity in some.', safety: 'caution' },
    'niacinamide': { description: 'Vitamin B3. Improves skin barrier, reduces pores, and brightens skin tone. Very well-tolerated.', safety: 'safe' },
    'salicylic acid': { description: 'Beta hydroxy acid (BHA). Exfoliates inside pores. Effective for acne but can cause dryness.', safety: 'caution' },
    'fragrance': { description: 'Scent blend of up to hundreds of chemicals. Common irritant — avoid if you have sensitive skin.', safety: 'caution' },
    'parfum': { description: 'Same as fragrance. Undisclosed blend of aromatic chemicals. Potential allergen and irritant.', safety: 'caution' },
    'phenoxyethanol': { description: 'Preservative used to prevent bacterial growth. Safe at regulated concentrations (≤1%).', safety: 'safe' },
};

export default function IngredientExplanations() {
    const router = useRouter();
    const { productData } = useLocalSearchParams();

    // V4: Parse actual product data
    let product = {};
    try {
        product = productData ? JSON.parse(productData) : {};
    } catch (e) {
        product = {};
    }

    // V4: Dynamically generate ingredient list from actual product ingredients
    const parseIngredients = () => {
        const ingredientText = product.ingredientsText || '';
        if (!ingredientText) return [];

        const ingredientNames = ingredientText
            .split(/[,;()]/)
            .map(i => i.trim())
            .filter(i => i.length > 1 && i.length < 60);

        return ingredientNames.slice(0, 15).map((name) => {
            const lowerName = name.toLowerCase().trim();

            // 1. Check ingredient database (E-numbers, additives)
            const dbInfo = getIngredientInfo(lowerName);
            if (dbInfo) {
                const safetyMap = {
                    'SAFE': { label: 'Generally safe', icon: CheckCircle, color: colors.chart1 },
                    'CAUTION': { label: 'Needs caution', icon: AlertTriangle, color: colors.chart2 },
                    'AVOID': { label: 'Avoid if possible', icon: AlertCircle, color: colors.chart3 },
                    'CRITICAL': { label: 'Avoid', icon: AlertCircle, color: colors.destructive },
                };
                const info = safetyMap[dbInfo.safetyLevel] || safetyMap['SAFE'];
                return {
                    name: dbInfo.name || name,
                    safety: dbInfo.safetyLevel?.toLowerCase() || 'safe',
                    safetyLabel: info.label,
                    description: dbInfo.scientificEvidence || `${dbInfo.category}. ${(dbInfo.concerns || []).join('. ') || 'No major concerns.'}`,
                    details: dbInfo.alternatives ? `Alternatives: ${dbInfo.alternatives}` : null,
                    icon: info.icon,
                    color: info.color,
                };
            }

            // 2. Check common ingredients knowledge base
            const common = COMMON_INGREDIENTS[lowerName];
            if (common) {
                const safetyInfo = common.safety === 'caution'
                    ? { label: 'Needs caution', icon: AlertTriangle, color: colors.chart2 }
                    : { label: 'Generally safe', icon: CheckCircle, color: colors.chart1 };
                return {
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    safety: common.safety,
                    safetyLabel: safetyInfo.label,
                    description: common.description,
                    details: null,
                    icon: safetyInfo.icon,
                    color: safetyInfo.color,
                };
            }

            // 3. Fallback: keyword-based classification
            let safety = 'safe';
            let safetyLabel = 'Generally safe';
            let icon = CheckCircle;
            let color = colors.chart1;
            let description = `${name} is used in this product. No specific safety concerns are widely documented.`;

            if (lowerName.includes('sugar') || lowerName.includes('syrup') || lowerName.includes('dextrose')) {
                safety = 'caution'; safetyLabel = 'Needs caution'; icon = AlertTriangle; color = colors.chart2;
                description = `A sweetener that adds calories. Excessive sugar intake is linked to weight gain and metabolic issues.`;
            } else if (lowerName.includes('color') || lowerName.includes('colour') || lowerName.match(/e\d{3}/)) {
                safety = 'caution'; safetyLabel = 'Additive'; icon = AlertTriangle; color = colors.chart2;
                description = `A coloring additive. Some artificial colors have been linked to hyperactivity in sensitive children.`;
            } else if (lowerName.includes('oil') || lowerName.includes('fat')) {
                description = `A fat/oil ingredient providing texture and calories. Quality varies between types.`;
            } else if (lowerName.includes('flour') || lowerName.includes('starch')) {
                description = `A carbohydrate source that provides texture and energy. Contains gluten if wheat-based.`;
            } else if (lowerName.includes('extract') || lowerName.includes('juice')) {
                description = `A natural extract used for flavor or nutritional benefit.`;
            } else if (lowerName.includes('vitamin') || lowerName.includes('mineral')) {
                description = `A nutrient added for fortification. Beneficial for overall health.`;
            } else if (lowerName.includes('preserv')) {
                safety = 'caution'; safetyLabel = 'Preservative'; icon = Shield; color = colors.chart2;
                description = `A preservative that extends shelf life. Some preservatives may cause sensitivities.`;
            }

            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                safety,
                safetyLabel,
                description,
                details: null,
                icon,
                color,
            };
        });
    };

    const ingredients = parseIngredients();

    // Share handler
    const handleShare = async () => {
        try {
            const items = ingredients.map(i => `• ${i.name}: ${i.safetyLabel}`).join('\n');
            const message = `Ingredient Analysis${product.name ? ` — ${product.name}` : ''}\n\n${items}\n\nAnalyzed with GoodFor - Your family's food & beauty safety companion`;

            await Share.share({
                message,
                title: 'Ingredient Analysis',
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurLeft} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.backButton}>
                    <Search size={24} color={colors.foreground} />
                </Pressable>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Ingredient Glossary</Text>
                    <Text style={styles.subtitle}>
                        {ingredients.length > 0
                            ? `${ingredients.length} ingredients analyzed${product.name ? ` in ${product.name}` : ''}. Tap any ingredient for details.`
                            : 'Simple, honest explanations for every ingredient in this product. No jargon, just the facts.'
                        }
                    </Text>
                </View>

                {/* Ingredients List */}
                <View style={styles.ingredientsList}>
                    {ingredients.length > 0 ? (
                        ingredients.map((ingredient, index) => {
                            const Icon = ingredient.icon;
                            return (
                                <Card key={index} style={styles.ingredientCard}>
                                    <View style={styles.ingredientHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                            <View style={[
                                                styles.safetyBadge,
                                                { backgroundColor: `${ingredient.color}1A` }
                                            ]}>
                                                <Text style={[styles.safetyBadgeText, { color: ingredient.color }]}>
                                                    {ingredient.safetyLabel}
                                                </Text>
                                            </View>
                                        </View>
                                        <Icon size={24} color={ingredient.color} />
                                    </View>

                                    <Text style={styles.ingredientDescription}>{ingredient.description}</Text>

                                    {ingredient.details && (
                                        <View style={styles.ingredientDetails}>
                                            <Text style={styles.detailsTitle}>ADDITIONAL INFO</Text>
                                            <Text style={styles.detailsText}>{ingredient.details}</Text>
                                        </View>
                                    )}
                                </Card>
                            );
                        })
                    ) : (
                        <Card style={styles.ingredientCard}>
                            <Text style={styles.ingredientName}>No ingredient data available</Text>
                            <Text style={styles.ingredientDescription}>
                                This product's ingredients couldn't be loaded. Try scanning the product again or check the product label manually.
                            </Text>
                        </Card>
                    )}
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>Our Standard</Text>
                    <Text style={styles.infoText}>
                        Our labels are based on the latest health guidelines and independent research. We focus on transparency so you can shop with confidence.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Pressable style={styles.shareButton} onPress={handleShare}>
                    <Share2 size={20} color={colors.primaryForeground} />
                    <Text style={styles.shareButtonText}>Share Analysis</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    blurTop: {
        position: 'absolute',
        top: -128,
        right: -128,
        width: 256,
        height: 256,
        backgroundColor: colors.accent,
        opacity: 0.3,
        borderRadius: 128,
    },
    blurLeft: {
        position: 'absolute',
        top: '25%',
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: spacing[14],
        paddingBottom: spacing[4],
        paddingHorizontal: spacing[6],
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[6],
    },
    titleSection: {
        marginTop: spacing[4],
        marginBottom: spacing[8],
    },
    title: {
        fontSize: 28,
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
        lineHeight: 34,
        marginBottom: spacing[3],
    },
    subtitle: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: fontSizes.base * 1.5,
    },
    ingredientsList: {
        gap: spacing[4],
    },
    ingredientCard: {
        padding: spacing[5],
    },
    ingredientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing[3],
    },
    ingredientName: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    safetyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    safetyBadgeText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
    },
    ingredientDescription: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: fontSizes.sm * 1.5,
        marginBottom: spacing[4],
    },
    ingredientDetails: {
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}80`,
    },
    detailsTitle: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        letterSpacing: 1.5,
        marginBottom: spacing[2],
    },
    detailsText: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sans,
        color: `${colors.foreground}CC`,
        lineHeight: fontSizes.sm * 1.5,
    },
    infoBox: {
        marginTop: spacing[8],
        marginBottom: spacing[6],
        padding: spacing[6],
        borderRadius: radius['3xl'],
        backgroundColor: `${colors.accent}33`,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    infoTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansBold,
        color: colors.primary,
        marginBottom: spacing[2],
    },
    infoText: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    footer: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        height: 56,
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    shareButtonText: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
});
