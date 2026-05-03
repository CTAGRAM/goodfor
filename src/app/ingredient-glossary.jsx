import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from "react-native";
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
    Share2,
    User
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function IngredientGlossary() {
    const { productData } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();
    const [expandedIndex, setExpandedIndex] = useState(0);

    // Defensive parsing
    let product = {};
    try {
        product = JSON.parse(productData || '{}');
    } catch (e) {
        console.error('Failed to parse product data:', e);
    }

    // Share handler
    const handleShare = async () => {
        try {
            const ingredientList = parseIngredients();
            const ingredientSummary = ingredientList
                .slice(0, 5)
                .map(i => `• ${i.name}: ${i.statusLabel}`)
                .join('\n');

            const message = `Ingredient Analysis for ${product.name || 'Product'}\n\n${ingredientSummary}\n\nAnalyzed with GoodFor - Your family's food & beauty safety companion`;

            await Share.share({
                message,
                title: `${product.name || 'Product'} Ingredients`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    // Parse ingredients from text with "For You" personalization
    const parseIngredients = () => {
        if (!product.ingredientsText) return [];

        const ingredientNames = product.ingredientsText
            .split(/[,;()]/)
            .map(i => i.trim())
            .filter(i => i.length > 2 && i.length < 50);

        // Get user preferences for personalization
        const userAllergies = (profile?.allergies || []).map(a => a.toLowerCase());
        const skinConcerns = profile?.skin_conditions || [];
        const dietaryPrefs = profile?.dietary_preferences || [];
        const skinType = (profile?.skin_type || '').toLowerCase();
        const isPregnant = profile?.is_pregnant || false;
        const isBreastfeeding = profile?.is_breastfeeding || false;
        const ageGroup = profile?.age_group || 'adult';
        const cosmeticAllergens = (profile?.cosmetic_allergens || []).map(a => a.toLowerCase());
        const sensitivityLevel = profile?.sensitivity_level || 'standard';
        const isExtraCautious = sensitivityLevel === 'extra_cautious' || sensitivityLevel === 'very_sensitive';

        return ingredientNames.slice(0, 15).map((name, index) => {
            const lowerName = name.toLowerCase();
            let status = 'safe';
            let statusLabel = 'Generally safe';
            let forYouTag = null;

            // === ALLERGEN CHECK (highest priority) ===
            for (const allergy of userAllergies) {
                if (lowerName.includes(allergy)) {
                    forYouTag = { text: '🚫 Your Allergen — Avoid', color: colors.destructive, emoji: '' };
                    status = 'warning';
                    statusLabel = 'Contains your allergen';
                    break;
                }
            }

            // === COSMETIC ALLERGEN CHECK ===
            if (!forYouTag) {
                for (const cosmAllergy of cosmeticAllergens) {
                    if (lowerName.includes(cosmAllergy)) {
                        forYouTag = { text: '🚫 Cosmetic Allergen — Avoid', color: colors.destructive, emoji: '' };
                        status = 'warning';
                        statusLabel = 'Contains your cosmetic allergen';
                        break;
                    }
                }
            }

            // === PREGNANCY / BREASTFEEDING WARNINGS ===
            if (!forYouTag && (isPregnant || isBreastfeeding)) {
                const pregnancyRisks = ['retinol', 'retinoid', 'retinoic', 'tretinoin', 'adapalene',
                    'salicylic', 'benzoyl peroxide', 'hydroquinone', 'formaldehyde',
                    'phthalate', 'oxybenzone', 'caffeine'];
                if (pregnancyRisks.some(r => lowerName.includes(r))) {
                    forYouTag = { text: `⚠️ Avoid during ${isPregnant ? 'pregnancy' : 'breastfeeding'}`, color: colors.chart3, emoji: '' };
                    status = 'warning';
                    statusLabel = `Avoid during ${isPregnant ? 'pregnancy' : 'breastfeeding'}`;
                }
            }

            // === SKIN TYPE PERSONALIZATION ===
            if (!forYouTag && skinType) {
                // Dry skin
                if (skinType === 'dry' || skinType === 'sensitive') {
                    if (lowerName.includes('alcohol denat') || lowerName.includes('isopropyl alcohol') || lowerName.includes('ethanol')) {
                        forYouTag = { text: `⚠️ May dry out ${skinType} skin`, color: colors.chart2, emoji: '' };
                        status = 'caution';
                    } else if (lowerName.includes('sulfate') || lowerName.includes('sls') || lowerName.includes('sles')) {
                        forYouTag = { text: `⚠️ Harsh for ${skinType} skin`, color: colors.chart2, emoji: '' };
                        status = 'caution';
                    } else if (lowerName.includes('fragrance') || lowerName.includes('parfum')) {
                        forYouTag = { text: '⚠️ May irritate sensitive skin', color: colors.chart2, emoji: '' };
                        status = 'caution';
                    } else if (lowerName.includes('glycerin') || lowerName.includes('hyaluronic') || lowerName.includes('shea') || lowerName.includes('ceramide')) {
                        forYouTag = { text: `✅ Excellent for ${skinType} skin`, color: colors.chart1, emoji: '' };
                    }
                }
                // Oily skin
                if (skinType === 'oily' || skinType === 'combination') {
                    if (lowerName.includes('coconut oil') || lowerName.includes('cocoa butter') || lowerName.includes('lanolin')) {
                        forYouTag = { text: '⚠️ May clog pores (oily skin)', color: colors.chart2, emoji: '' };
                        status = 'caution';
                    } else if (lowerName.includes('niacinamide') || lowerName.includes('salicylic') || lowerName.includes('tea tree')) {
                        forYouTag = { text: '✅ Great for oil control', color: colors.chart1, emoji: '' };
                    }
                }
            }

            // === SKIN CONCERN PERSONALIZATION ===
            if (!forYouTag && skinConcerns.length > 0) {
                if (lowerName.includes('salicylic') && skinConcerns.includes('Acne')) {
                    forYouTag = { text: '✅ Targets acne', color: colors.chart1, emoji: '' };
                } else if (lowerName.includes('niacinamide')) {
                    forYouTag = { text: '✅ Multi-benefit for your skin', color: colors.chart1, emoji: '' };
                } else if ((lowerName.includes('retinol') || lowerName.includes('peptide')) && skinConcerns.includes('Aging')) {
                    forYouTag = { text: '✅ Anti-aging benefit', color: colors.chart1, emoji: '' };
                } else if (lowerName.includes('vitamin c') && (skinConcerns.includes('Dark Spots') || skinConcerns.includes('Hyperpigmentation'))) {
                    forYouTag = { text: '✅ Brightening for dark spots', color: colors.chart1, emoji: '' };
                } else if (lowerName.includes('fragrance') && skinConcerns.includes('Eczema')) {
                    forYouTag = { text: '⚠️ May worsen eczema', color: colors.chart3, emoji: '' };
                    status = 'caution';
                }
            }

            // === DIETARY PERSONALIZATION (food) ===
            if (!forYouTag) {
                if (lowerName.includes('sugar') || lowerName.includes('syrup') || lowerName.includes('dextrose') || lowerName.includes('fructose')) {
                    status = 'caution';
                    statusLabel = 'Added sugar';
                    if (dietaryPrefs.some(d => d.toLowerCase().includes('sugar') || d.toLowerCase().includes('diabetic'))) {
                        forYouTag = { text: '⚠️ Watch — sugar concern', color: colors.chart2, emoji: '' };
                    }
                } else if (lowerName.includes('salt') || lowerName.includes('sodium')) {
                    status = 'caution';
                    statusLabel = 'Contains sodium';
                    if (dietaryPrefs.some(d => d.toLowerCase().includes('sodium') || d.toLowerCase().includes('blood pressure'))) {
                        forYouTag = { text: '⚠️ Watch — sodium concern', color: colors.chart2, emoji: '' };
                    }
                } else if (lowerName.includes('gluten') || lowerName.includes('wheat') || lowerName.includes('flour') || lowerName.includes('barley') || lowerName.includes('rye')) {
                    if (dietaryPrefs.some(d => d.toLowerCase().includes('gluten'))) {
                        forYouTag = { text: '🚫 Contains gluten', color: colors.chart3, emoji: '' };
                        status = 'warning';
                        statusLabel = 'Contains gluten';
                    }
                } else if (lowerName.includes('milk') || lowerName.includes('whey') || lowerName.includes('casein') || lowerName.includes('lactose') || lowerName.includes('cream')) {
                    if (dietaryPrefs.some(d => d.toLowerCase().includes('dairy') || d.toLowerCase().includes('lactose') || d.toLowerCase().includes('vegan'))) {
                        forYouTag = { text: '⚠️ Dairy-derived ingredient', color: colors.chart2, emoji: '' };
                        status = 'caution';
                    }
                } else if (lowerName.includes('gelatin')) {
                    if (dietaryPrefs.some(d => d.toLowerCase().includes('vegetarian') || d.toLowerCase().includes('vegan') || d.toLowerCase().includes('halal'))) {
                        forYouTag = { text: '🚫 Animal-derived (not suitable)', color: colors.chart3, emoji: '' };
                        status = 'warning';
                    }
                }
            }

            // === GENERAL CAUTION INGREDIENTS ===
            if (!forYouTag) {
                if (lowerName.includes('color') || lowerName.includes('colour') || lowerName.match(/e\d{3}/)) {
                    status = 'caution';
                    statusLabel = 'Additive';
                    if (ageGroup === 'child' || ageGroup === 'infant') {
                        forYouTag = { text: '⚠️ Limit for children', color: colors.chart2, emoji: '' };
                    }
                } else if (lowerName.includes('paraben')) {
                    status = 'caution';
                    statusLabel = 'Preservative';
                    if (isExtraCautious) {
                        forYouTag = { text: '⚠️ Avoid — extra cautious mode', color: colors.chart2, emoji: '' };
                    }
                } else if (lowerName.includes('formaldehyde') || lowerName.includes('phthalate')) {
                    status = 'warning';
                    statusLabel = 'Avoid if possible';
                    forYouTag = { text: '🚫 Best avoided', color: colors.chart3, emoji: '' };
                }
            }

            // === DEFAULT POSITIVE TAG ===
            if (!forYouTag && status === 'safe') {
                forYouTag = { text: '✅ Safe for your profile', color: colors.chart1, emoji: '' };
            }

            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                status,
                statusLabel,
                description: getIngredientDescription(lowerName),
                importance: getIngredientImportance(lowerName),
                forYouTag,
            };
        });
    };

    function getIngredientDescription(name) {
        // Food ingredients
        if (name.includes('water')) return 'Essential liquid base providing hydration and texture.';
        if (name.includes('sugar') || name.includes('sucrose') || name.includes('dextrose') || name.includes('fructose')) return 'Sweetener that adds calories and raises blood sugar. Monitor daily intake.';
        if (name.includes('glucose syrup') || name.includes('corn syrup') || name.includes('high fructose')) return 'Processed sweetener linked to metabolic concerns when consumed in excess.';
        if (name.includes('flour') || name.includes('wheat')) return 'Ground grain providing structure and carbohydrates. Contains gluten.';
        if (name.includes('palm oil') || name.includes('palm fat')) return 'Tropical vegetable oil high in saturated fat. Environmental concerns with deforestation.';
        if (name.includes('sunflower') || name.includes('rapeseed') || name.includes('canola')) return 'Vegetable oil providing unsaturated fats. Common cooking oil.';
        if (name.includes('oil') || name.includes('fat')) return 'Fat source used for texture, flavor, and cooking.';
        if (name.includes('salt') || name.includes('sodium')) return 'Mineral for flavor and preservation. Excess linked to high blood pressure.';
        if (name.includes('milk') || name.includes('cream') || name.includes('whey') || name.includes('casein')) return 'Dairy-derived providing protein and calcium. Contains lactose.';
        if (name.includes('egg')) return 'Complete protein source used as binder and leavening agent.';
        if (name.includes('soy') || name.includes('lecithin')) return 'Soy-derived ingredient used as emulsifier. Common allergen.';
        if (name.includes('cocoa') || name.includes('chocolate')) return 'Cocoa-based ingredient providing flavor and antioxidants.';
        if (name.includes('starch')) return 'Carbohydrate thickener and texturizer extracted from plants.';
        if (name.includes('gelatin')) return 'Animal-derived protein used as gelling agent. Not suitable for vegetarians.';
        if (name.includes('pectin')) return 'Plant-based gelling agent from fruit. Suitable for vegetarians.';
        if (name.includes('citric acid') || name.includes('e330')) return 'Natural acid from citrus fruits. Used as preservative and flavor enhancer.';
        if (name.includes('ascorbic') || name.includes('e300')) return 'Vitamin C. Used as antioxidant preservative.';
        if (name.includes('xanthan') || name.includes('guar')) return 'Natural thickening gum used to improve texture and stability.';
        if (name.includes('carrageenan')) return 'Seaweed-derived thickener. Some debate about digestive effects.';
        if (name.includes('mono') || name.includes('diglyceride') || name.includes('e471')) return 'Emulsifier that blends oil and water. Made from fats.';
        if (name.includes('aspartame') || name.includes('e951')) return 'Artificial sweetener, 200x sweeter than sugar. Zero calories.';
        if (name.includes('stevia')) return 'Natural zero-calorie sweetener from the stevia plant.';
        if (name.includes('yeast')) return 'Microorganism used for fermentation and leavening. Rich in B vitamins.';
        if (name.includes('vinegar') || name.includes('acetic')) return 'Acidic liquid used for flavor, preservation, and pickling.';
        if (name.includes('fiber') || name.includes('fibre') || name.includes('inulin')) return 'Dietary fiber supporting digestive health and regularity.';
        if (name.includes('vitamin') || name.includes('iron') || name.includes('calcium') || name.includes('zinc')) return 'Essential micronutrient added for nutritional fortification.';
        // Beauty/cosmetic ingredients
        if (name.includes('glycerin')) return 'Humectant that draws moisture to skin. Very well tolerated.';
        if (name.includes('hyaluronic')) return 'Powerful moisturizer holding up to 1000x its weight in water.';
        if (name.includes('retinol') || name.includes('retinoid')) return 'Vitamin A derivative promoting cell turnover. Gold standard for anti-aging.';
        if (name.includes('niacinamide')) return 'Vitamin B3 that reduces pores, brightens skin, and strengthens the barrier.';
        if (name.includes('salicylic')) return 'Beta-hydroxy acid (BHA) that unclogs pores. Excellent for acne-prone skin.';
        if (name.includes('benzoyl peroxide')) return 'Antibacterial agent that kills acne-causing bacteria. Can be drying.';
        if (name.includes('cetearyl') || name.includes('cetyl')) return 'Fatty alcohol emollient that softens and smooths skin.';
        if (name.includes('dimethicone') || name.includes('silicone')) return 'Silicone-based ingredient creating a smooth, protective barrier on skin.';
        if (name.includes('paraben')) return 'Synthetic preservative. Some concerns about endocrine disruption.';
        if (name.includes('sulfate') || name.includes('sls') || name.includes('sles')) return 'Strong surfactant/cleanser. Can strip natural oils and irritate sensitive skin.';
        if (name.includes('fragrance') || name.includes('parfum')) return 'Scent compound. Common cause of skin sensitivity and allergic reactions.';
        if (name.includes('phenoxyethanol')) return 'Preservative considered safer alternative to parabens. Generally well tolerated.';
        if (name.includes('tocopherol') || name.includes('vitamin e')) return 'Antioxidant that protects skin from free radical damage.';
        if (name.includes('titanium dioxide') || name.includes('zinc oxide')) return 'Mineral UV filter providing physical sun protection.';
        if (name.includes('aloe')) return 'Natural plant extract with soothing and moisturizing properties.';
        if (name.includes('shea') || name.includes('cocoa butter')) return 'Rich natural butter providing deep moisturization and nourishment.';
        return 'An ingredient used in this product\'s formulation.';
    }

    function getIngredientImportance(name) {
        // Food ingredients
        if (name.includes('water')) return 'Water is the primary solvent and base. Its position in the ingredients list indicates it makes up the largest proportion of this product.';
        if (name.includes('sugar') || name.includes('sucrose') || name.includes('dextrose') || name.includes('fructose')) return 'Added sugars contribute to daily intake limits. WHO recommends under 25g/day for adults and 19g for children. High sugar intake is linked to obesity, diabetes, and dental decay.';
        if (name.includes('glucose syrup') || name.includes('corn syrup') || name.includes('high fructose')) return 'Processed sweetener that can spike blood sugar more rapidly than table sugar. Frequent consumption is linked to metabolic syndrome and fatty liver disease.';
        if (name.includes('flour') || name.includes('wheat')) return 'Primary source of carbohydrates and gluten. People with celiac disease or gluten sensitivity must avoid this. Whole wheat versions offer more fiber and nutrients.';
        if (name.includes('palm oil') || name.includes('palm fat')) return 'High in saturated fat (50%), which can raise LDL cholesterol. Also linked to significant environmental concerns including rainforest deforestation and habitat loss.';
        if (name.includes('sunflower') || name.includes('rapeseed') || name.includes('canola')) return 'Contains heart-healthy unsaturated fats. High omega-6 content — balance with omega-3 sources for optimal health.';
        if (name.includes('oil') || name.includes('fat')) return 'Fats are calorie-dense (9 kcal/g vs 4 for protein/carbs). The type of fat matters: unsaturated fats are healthier than saturated or trans fats.';
        if (name.includes('salt') || name.includes('sodium')) return 'Adults should consume under 6g salt (2.4g sodium) daily. Excess sodium raises blood pressure and increases cardiovascular risk. This is especially important for children and elderly.';
        if (name.includes('milk') || name.includes('cream') || name.includes('whey') || name.includes('casein')) return 'Dairy allergen — one of the top 14 allergens. Contains lactose which ~65% of adults have difficulty digesting. Good source of calcium and protein.';
        if (name.includes('egg')) return 'One of the top 14 allergens. Excellent complete protein source. The cholesterol in eggs is less concerning than previously thought for most people.';
        if (name.includes('soy') || name.includes('lecithin')) return 'One of the top 14 allergens. Soy lecithin is used widely as an emulsifier — even small traces can trigger reactions in severely allergic individuals.';
        if (name.includes('cocoa') || name.includes('chocolate')) return 'Contains beneficial flavonoids and antioxidants. Higher cocoa percentage means more health benefits. Also contains caffeine and theobromine.';
        if (name.includes('starch')) return 'A fast-digesting carbohydrate that can spike blood sugar. Modified starches have been chemically or physically altered for improved function.';
        if (name.includes('citric acid') || name.includes('e330')) return 'Generally recognized as safe (GRAS). Acts as a natural preservative and pH regulator. May erode tooth enamel with frequent exposure.';
        if (name.includes('aspartame') || name.includes('e951')) return 'FDA-approved artificial sweetener. Safe for most people but must be avoided by those with phenylketonuria (PKU). Provides sweetness without calories.';
        if (name.includes('carrageenan')) return 'While FDA-approved, some research suggests degraded carrageenan may cause intestinal inflammation. People with IBS or digestive sensitivities may want to limit intake.';
        if (name.includes('mono') || name.includes('diglyceride') || name.includes('e471')) return 'Common emulsifier generally considered safe. Can be derived from animal or plant fats — not always suitable for vegans unless specified.';
        if (name.includes('fiber') || name.includes('fibre') || name.includes('inulin')) return 'Dietary fiber is essential for digestive health. Adults should aim for 30g/day. Fiber helps regulate blood sugar, lower cholesterol, and maintain healthy weight.';
        if (name.includes('vitamin') || name.includes('iron') || name.includes('calcium') || name.includes('zinc')) return 'Added to fortify nutritional value. While beneficial, excessive intake of some vitamins (A, D, E, K) can be harmful. Check your total daily intake from all sources.';
        // Beauty/cosmetic ingredients
        if (name.includes('glycerin')) return 'One of the most effective humectants available. Draws water from the air and deeper skin layers to keep the surface hydrated. Essential in most skincare formulations.';
        if (name.includes('hyaluronic')) return 'Each molecule holds up to 1000x its weight in water. Naturally present in skin but decreases with age. Different molecular weights penetrate to different skin depths.';
        if (name.includes('retinol') || name.includes('retinoid')) return 'Clinically proven to reduce wrinkles, stimulate collagen, and improve skin texture. Start with low concentrations. Avoid during pregnancy. Always use sunscreen with retinoids.';
        if (name.includes('niacinamide')) return 'Versatile ingredient that regulates oil production, minimizes pores, fades dark spots, and strengthens the skin barrier. Safe for most skin types at 2-5% concentration.';
        if (name.includes('salicylic')) return 'Oil-soluble BHA that penetrates into pores to dissolve sebum plugs. Most effective at 0.5-2% concentration. Can cause dryness — pair with a good moisturizer.';
        if (name.includes('paraben')) return 'Preservative that prevents bacterial growth. Studies suggest potential endocrine disruption, though concentrations in cosmetics are generally below concerning levels. Many brands now offer paraben-free alternatives.';
        if (name.includes('sulfate') || name.includes('sls') || name.includes('sles')) return 'Creates lathering/foaming action. Can strip natural oils, disrupt the skin barrier, and cause irritation — especially for eczema, rosacea, or sensitive skin. Sulfate-free alternatives are gentler.';
        if (name.includes('fragrance') || name.includes('parfum')) return 'One of the top causes of allergic contact dermatitis. "Fragrance" can represent dozens of undisclosed chemicals. People with sensitive skin, eczema, or allergies should choose fragrance-free products.';
        if (name.includes('dimethicone') || name.includes('silicone')) return 'Creates a smooth, silky feel and helps retain moisture. Non-comedogenic despite myths. Rinses off easily. Some environmental concerns about persistence in waterways.';
        if (name.includes('titanium dioxide') || name.includes('zinc oxide')) return 'Physical/mineral UV filters that sit on skin surface reflecting UV rays. Considered safer than chemical sunscreens. May leave white cast on darker skin tones.';
        // Contextual fallback based on status
        return 'This ingredient is part of the product\'s formulation. Check the ingredient list position — ingredients are listed in descending order of quantity, so earlier items make up a larger proportion.';
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

                                {/* For You Tag - Phase 3 */}
                                {ingredient.forYouTag && (
                                    <View style={[styles.forYouTag, { backgroundColor: `${ingredient.forYouTag.color}15`, borderColor: `${ingredient.forYouTag.color}30` }]}>
                                        <Text style={styles.forYouEmoji}>{ingredient.forYouTag.emoji}</Text>
                                        <Text style={[styles.forYouText, { color: ingredient.forYouTag.color }]}>{ingredient.forYouTag.text}</Text>
                                        <User size={12} color={ingredient.forYouTag.color} />
                                    </View>
                                )}

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
                <Pressable style={styles.shareButton} onPress={handleShare}>
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
    // For You tag styles
    forYouTag: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing[3], alignSelf: 'flex-start' },
    forYouEmoji: { fontSize: 14 },
    forYouText: { fontSize: 12, fontFamily: fonts.sans.bold },
});
