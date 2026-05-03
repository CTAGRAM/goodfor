import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, CheckCircle, AlertTriangle, AlertCircle, Share2, Shield, ChevronRight, Users, FlaskConical, Heart, Zap, ShieldAlert, BookOpen, Droplets, Leaf, Eye } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { Card } from '@/components/ui';
import { getIngredientInfo } from '@/data/ingredientDatabase';
import { useAuth } from '@/contexts/AuthContext';
import IngredientDetailModal from '@/components/IngredientDetailModal';

// V4→V7: Common ingredient knowledge base — enriched with source, function, health context, and who should avoid
const COMMON_INGREDIENTS = {
    'water': { description: 'Purified water used as the base solvent in this product. Water is the most common ingredient in food and beverages, serving as a carrier for flavors and nutrients.', safety: 'safe', role: 'Base', source: 'Purified municipal or spring water' },
    'purified water': { description: 'Filtered and deionized water, free of contaminants, heavy metals, and microorganisms. Used as the primary base for liquid products.', safety: 'safe', role: 'Base', source: 'Multi-stage filtered water' },
    'salt': { description: 'Sodium chloride (NaCl), used for flavor enhancement and as a natural preservative. Essential mineral in small amounts, but excessive intake is strongly linked to high blood pressure, cardiovascular disease, and kidney problems. WHO recommends less than 5g daily.', safety: 'caution', role: 'Flavor / Preservative', source: 'Mined rock salt or evaporated sea water', avoid: 'People with hypertension, kidney disease, or on low-sodium diets' },
    'sugar': { description: 'Sucrose, a disaccharide composed of glucose and fructose. Provides sweetness and energy (4 kcal/g) but has no other nutritional value. Excess consumption is a leading cause of obesity, type 2 diabetes, tooth decay, and fatty liver disease. Check the nutrition label for total sugar content.', safety: 'caution', role: 'Sweetener', source: 'Extracted from sugar cane or sugar beet', avoid: 'Diabetics, children under 4, people managing weight' },
    'cane sugar': { description: 'Natural sweetener derived from pressed sugar cane juice, then crystallized. Chemically identical to regular sugar (sucrose). Despite marketing as "natural", it has the same metabolic impact — still high in calories and rapidly spikes blood sugar levels.', safety: 'caution', role: 'Sweetener', source: 'Sugar cane (Saccharum officinarum)', avoid: 'Diabetics, people monitoring blood sugar' },
    'corn syrup': { description: 'A thick, sweet liquid made by breaking down corn starch into individual glucose molecules using enzymes. Has a high glycemic index (GI ~90), meaning it causes rapid blood sugar spikes. Commonly used in processed foods for texture and sweetness.', safety: 'caution', role: 'Sweetener / Texturizer', source: 'Enzymatically processed corn starch', avoid: 'Diabetics, people with metabolic syndrome' },
    'high fructose corn syrup': { description: 'A highly processed sweetener where some glucose in corn syrup is enzymatically converted to fructose. Heavily associated with obesity, insulin resistance, fatty liver disease, and metabolic syndrome in numerous studies. Found predominantly in ultra-processed foods and soft drinks.', safety: 'caution', role: 'Sweetener', source: 'Enzymatically modified corn starch', avoid: 'Diabetics, children, people managing weight or liver health' },
    'palm oil': { description: 'A semi-solid vegetable oil extracted from the fruit of oil palms. Contains roughly 50% saturated fat, which raises LDL cholesterol when consumed in excess. Also a major driver of tropical deforestation, habitat destruction, and biodiversity loss in Southeast Asia and Africa.', safety: 'caution', role: 'Fat / Texturizer', source: 'Oil palm fruit (Elaeis guineensis)', avoid: 'People with high cholesterol, those concerned about environmental impact' },
    'soybean oil': { description: 'A widely used cooking and food-processing oil extracted from soybeans. Rich in polyunsaturated fats, particularly omega-6 fatty acids. Generally safe, though an imbalanced omega-6 to omega-3 ratio may promote low-grade inflammation.', safety: 'safe', role: 'Fat / Cooking oil', source: 'Soybeans (Glycine max)', avoid: 'People with soy allergies' },
    'sunflower oil': { description: 'Light, mild-flavored oil pressed from sunflower seeds. Good source of vitamin E and low in saturated fat. High-oleic varieties are preferred for cooking stability. Generally considered heart-healthy in moderation.', safety: 'safe', role: 'Fat / Cooking oil', source: 'Sunflower seeds (Helianthus annuus)' },
    'olive oil': { description: 'A premium oil pressed from olives, central to the Mediterranean diet. Rich in heart-healthy monounsaturated fatty acids (oleic acid) and polyphenol antioxidants. Associated with reduced cardiovascular risk, anti-inflammatory effects, and improved cholesterol ratios in extensive clinical research.', safety: 'safe', role: 'Fat / Flavor', source: 'Olive fruit (Olea europaea)' },
    'milk': { description: 'A nutrient-dense dairy product providing high-quality protein (casein and whey), calcium, phosphorus, and vitamins B2 and B12. Essential for bone health. However, it is one of the most common food allergens — contains both lactose (sugar) and casein (protein) that many people cannot tolerate.', safety: 'safe', role: 'Protein / Calcium source', source: 'Cow dairy', avoid: 'People with lactose intolerance, milk protein allergy, or vegan diets' },
    'wheat flour': { description: 'Finely milled flour from wheat grains, providing structure through gluten formation. A primary source of carbohydrates and some B vitamins (when enriched). Refined white flour has had bran and germ removed, reducing fiber content significantly.', safety: 'safe', role: 'Structure / Carbohydrate', source: 'Wheat grain (Triticum aestivum)', avoid: 'People with celiac disease, wheat allergy, or gluten sensitivity' },
    'whole wheat flour': { description: 'Flour milled from entire wheat kernels, retaining the bran (fiber), germ (vitamins, healthy fats), and endosperm. Significantly higher in dietary fiber, B vitamins, iron, and magnesium compared to refined flour. Still contains gluten.', safety: 'safe', role: 'Structure / Fiber source', source: 'Whole wheat grain', avoid: 'People with celiac disease or gluten sensitivity' },
    'citric acid': { description: 'A weak organic acid naturally abundant in citrus fruits (lemons, oranges, limes). Widely used as a flavor enhancer (adds tartness), preservative (inhibits bacterial growth), and acidity regulator. Generally recognized as safe (GRAS) with no known health concerns at normal food levels.', safety: 'safe', role: 'Acidity regulator / Preservative', source: 'Citrus fruits or fermented sugars (Aspergillus niger)' },
    'pectin': { description: 'A natural soluble fiber found in the cell walls of fruits, especially apples and citrus peel. Functions as a gelling and thickening agent in jams, jellies, and fruit preparations. Also acts as a prebiotic, supporting beneficial gut bacteria and aiding digestive health.', safety: 'safe', role: 'Gelling agent / Fiber', source: 'Apple pomace or citrus peel' },
    'gelatin': { description: 'A protein derived by partially hydrolyzing collagen from animal bones, skin, and connective tissue (typically pork or beef). Used as a gelling agent in desserts, candy, and supplements. Contains amino acids like glycine and proline. Not suitable for vegetarians, vegans, or those following halal/kosher diets unless specified.', safety: 'safe', role: 'Gelling agent', source: 'Animal collagen (pork or beef)', avoid: 'Vegetarians, vegans, some religious dietary requirements' },
    'soy lecithin': { description: 'A phospholipid emulsifier extracted from soybeans during oil processing. Helps blend ingredients that normally separate (oil and water). Also provides small amounts of choline, an essential nutrient for brain and liver function. Generally well-tolerated, though it is derived from a major allergen.', safety: 'safe', role: 'Emulsifier', source: 'Soybean (Glycine max)', avoid: 'People with soy allergies' },
    'vitamin c': { description: 'Ascorbic acid (vitamin C), an essential water-soluble vitamin and powerful antioxidant. Protects cells from oxidative damage, supports immune function, and aids iron absorption. Also used as a natural preservative to prevent browning and maintain freshness. No safety concerns at food-level amounts.', safety: 'safe', role: 'Antioxidant / Preservative', source: 'Synthetic or extracted from fruits' },
    'ascorbic acid': { description: 'The chemical name for vitamin C. A powerful antioxidant that scavenges free radicals and prevents oxidative degradation of food. Also essential for collagen synthesis, immune defense, and wound healing. Used both as a nutritional supplement and a processing aid (anti-browning agent).', safety: 'safe', role: 'Antioxidant / Preservative', source: 'Synthetic production or citrus extraction' },
    'natural flavors': { description: 'Flavor compounds extracted from plant or animal sources through distillation, fermentation, or enzymatic processes. May contain dozens of individual chemical components. While derived from natural sources, the composition is proprietary and rarely disclosed on labels. Generally safe but may trigger reactions in sensitive individuals.', safety: 'safe', role: 'Flavor enhancer', source: 'Various plant and animal extracts' },
    'artificial flavors': { description: 'Synthetically produced chemical compounds designed to mimic natural flavors. Created in laboratories, they are chemically identical to natural counterparts but manufactured more economically. FDA-approved after safety testing, though some consumers prefer to avoid them as part of a clean-label diet.', safety: 'caution', role: 'Flavor enhancer', source: 'Synthetic chemical synthesis' },
    'modified food starch': { description: 'Starch that has been chemically, physically, or enzymatically altered to improve its functional properties — such as thickening, stability under heat/acid, or freeze-thaw tolerance. Commonly derived from corn, potato, or tapioca. Generally recognized as safe (GRAS) by the FDA.', safety: 'safe', role: 'Thickener / Stabilizer', source: 'Corn, potato, or tapioca starch' },
    'xanthan gum': { description: 'A polysaccharide produced by bacterial fermentation of sugars (Xanthomonas campestris). Creates viscosity and stabilizes emulsions at very low concentrations. Widely used in gluten-free baking as a gluten substitute. Safe in normal food amounts; excessive intake may cause digestive discomfort.', safety: 'safe', role: 'Thickener / Stabilizer', source: 'Bacterial fermentation (Xanthomonas campestris)' },
    'carrageenan': { description: 'A sulfated polysaccharide extracted from red seaweed, used as a thickener and stabilizer in dairy products, plant milks, and deli meats. Some animal studies suggest "degraded carrageenan" (poligeenan) may cause gut inflammation, though food-grade carrageenan is considered safe by regulatory agencies. Controversial among clean-label advocates.', safety: 'caution', role: 'Thickener / Stabilizer', source: 'Red seaweed (Chondrus crispus)', avoid: 'People with IBS or sensitive digestive systems' },
    'baking soda': { description: 'Sodium bicarbonate (NaHCO₃), a leavening agent that produces carbon dioxide gas when mixed with acid, causing baked goods to rise. Also used as an acidity regulator. Completely safe in food quantities.', safety: 'safe', role: 'Leavening agent', source: 'Mined trona mineral or synthesized' },
    'yeast': { description: 'A single-celled fungus (Saccharomyces cerevisiae) used for fermentation and leavening. Converts sugars into CO₂ and alcohol, making bread rise and enabling beer/wine production. Also a source of B vitamins and protein. Safe and beneficial in food production.', safety: 'safe', role: 'Leavening / Fermentation', source: 'Cultivated Saccharomyces cerevisiae' },
    'cocoa': { description: 'Processed cacao beans (Theobroma cacao), rich in flavonoid antioxidants, magnesium, iron, and theobromine. Research indicates cardiovascular benefits from regular consumption of dark chocolate/cocoa. Contains small amounts of caffeine. Minimally processed cocoa retains the most health benefits.', safety: 'safe', role: 'Flavor / Nutrition', source: 'Cacao beans (Theobroma cacao)' },
    'cocoa butter': { description: 'The pale-yellow fat extracted from cacao beans during chocolate production. Composed primarily of saturated and monounsaturated fatty acids (stearic, oleic, palmitic acid). Stearic acid is "cholesterol-neutral" — unlike other saturated fats, it does not significantly raise LDL cholesterol.', safety: 'safe', role: 'Fat / Texturizer', source: 'Cacao beans' },
    'vanilla': { description: 'Natural flavor extract obtained from the cured seed pods of the vanilla orchid (Vanilla planifolia). Contains over 200 flavor compounds, with vanillin as the primary one. Among the most expensive spices globally. Completely safe and widely appreciated for its complex, warm flavor profile.', safety: 'safe', role: 'Flavor', source: 'Vanilla orchid pods (Vanilla planifolia)' },
    'vanillin': { description: 'The primary flavor compound in vanilla. Can be derived naturally from vanilla beans or synthesized from lignin (wood pulp) or guaiacol (petroleum-derived). Synthetic vanillin is chemically identical to natural vanillin. Safe for consumption with no known health concerns.', safety: 'safe', role: 'Flavor', source: 'Vanilla beans, lignin, or guaiacol synthesis' },
    // Cosmetic common ingredients
    'glycerin': { description: 'A powerful humectant that attracts and retains moisture from the environment to the skin surface. Found naturally in all animal and vegetable fats. One of the most well-studied and well-tolerated skincare ingredients. Strengthens the skin barrier and improves skin texture.', safety: 'safe', role: 'Humectant / Moisturizer', source: 'Vegetable oils (palm, coconut) or synthetic' },
    'dimethicone': { description: 'A silicone-based polymer that creates a smooth, protective barrier on the skin surface. Non-comedogenic (does not clog pores), hypoallergenic, and very stable. Gives products a silky, spreadable texture. Does not penetrate the skin. Safe for all skin types including sensitive skin.', safety: 'safe', role: 'Emollient / Skin protectant', source: 'Synthetic (silicone polymer)' },
    'tocopherol': { description: 'Vitamin E, a fat-soluble antioxidant that protects cell membranes from free radical damage caused by UV exposure and pollution. Supports skin healing, reduces inflammation, and improves moisture retention. Used both as an active ingredient and as a natural preservative to prevent oil oxidation.', safety: 'safe', role: 'Antioxidant', source: 'Soybean, sunflower, or wheat germ oil' },
    'hyaluronic acid': { description: 'A naturally occurring glycosaminoglycan that can hold up to 1000x its weight in water. Found in skin, connective tissue, and eyes. As a topical ingredient, it provides intense hydration, plumps fine lines, and improves skin elasticity. Different molecular weights penetrate to different skin depths.', safety: 'safe', role: 'Hydration / Anti-aging', source: 'Bacterial fermentation or rooster comb extraction' },
    'retinol': { description: 'A vitamin A derivative and gold-standard anti-aging ingredient. Accelerates cell turnover, stimulates collagen production, reduces fine lines, and fades hyperpigmentation. Can cause initial irritation, dryness, and sun sensitivity ("retinization period"). Start with low concentrations and always use sunscreen.', safety: 'caution', role: 'Anti-aging / Cell turnover', source: 'Synthetic vitamin A derivative', avoid: 'Pregnant/breastfeeding women, very sensitive skin' },
    'niacinamide': { description: 'Vitamin B3 (nicotinamide), a versatile and extensively studied skincare active. Strengthens the skin barrier, reduces pore appearance, controls sebum production, brightens uneven skin tone, and has anti-inflammatory properties. Well-tolerated by virtually all skin types at concentrations up to 10%.', safety: 'safe', role: 'Barrier repair / Brightening', source: 'Synthetic vitamin B3' },
    'salicylic acid': { description: 'A beta hydroxy acid (BHA) that exfoliates inside pores by dissolving the bonds between dead skin cells. The only lipid-soluble exfoliating acid, making it uniquely effective for oily/acne-prone skin. Anti-inflammatory and comedolytic (prevents blackheads). Can cause dryness and peeling at higher concentrations.', safety: 'caution', role: 'Exfoliant / Anti-acne', source: 'Willow bark or synthetic', avoid: 'Pregnant women (topical use debated), aspirin-sensitive individuals' },
    'fragrance': { description: 'A proprietary blend of potentially hundreds of aromatic chemicals used to create a pleasant scent. EU regulations require disclosure of 26 known allergenic fragrance compounds. One of the most common causes of contact dermatitis and skin sensitization. The term hides the exact composition.', safety: 'caution', role: 'Scent', source: 'Synthetic and/or natural aromatic compounds', avoid: 'Sensitive skin, eczema-prone skin, fragrance-allergic individuals' },
    'parfum': { description: 'European labeling term for fragrance. Refers to the same undisclosed blend of aromatic chemicals. A significant allergen and irritant risk, especially for sensitive skin. EU law mandates listing specific allergens if present above certain thresholds.', safety: 'caution', role: 'Scent', source: 'Synthetic and natural aromatic compounds', avoid: 'Sensitive skin, allergy-prone individuals' },
    'phenoxyethanol': { description: 'A glycol ether preservative used to prevent bacterial and fungal growth in cosmetic products. Considered a safer alternative to parabens. Safe at regulated concentrations (≤1% in EU). Very well-tolerated by most skin types. Occasionally may cause irritation at higher concentrations.', safety: 'safe', role: 'Preservative', source: 'Synthetic (or naturally occurs in green tea)' },
};

export default function IngredientExplanations() {
    const router = useRouter();
    const { productData } = useLocalSearchParams();
    const { profile, activeFamilyMember } = useAuth();
    const [expandedIndex, setExpandedIndex] = useState(-1);
    const [selectedIngredientCode, setSelectedIngredientCode] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // V4: Parse actual product data
    let product = {};
    try {
        product = productData ? JSON.parse(productData) : {};
    } catch (e) {
        product = {};
    }

    // V7: Get current profile's allergies for per-ingredient safety matching
    const profileAllergies = (activeFamilyMember?.allergies || profile?.allergens || []).map(a => a.toLowerCase());
    const profileDietary = (activeFamilyMember?.dietary_restrictions || profile?.dietary_preferences || []).map(d => d.toLowerCase());

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
                    'CAUTION': { label: 'Limited risk', icon: AlertTriangle, color: colors.chart2 },
                    'AVOID': { label: 'High-risk', icon: AlertCircle, color: colors.chart3 },
                    'CRITICAL': { label: 'Avoid', icon: AlertCircle, color: colors.destructive },
                };
                const info = safetyMap[dbInfo.safetyLevel] || safetyMap['SAFE'];
                const isAllergenMatch = profileAllergies.some(a => lowerName.includes(a) || (dbInfo.name || '').toLowerCase().includes(a));
                // Extract E-number code if available
                const eCode = Object.keys(require('@/data/ingredientDatabase').INGREDIENT_DATABASE).find(k => {
                    const entry = require('@/data/ingredientDatabase').INGREDIENT_DATABASE[k];
                    return entry === dbInfo && /^e\d+/.test(k);
                });
                return {
                    name: dbInfo.name || name,
                    safety: dbInfo.safetyLevel?.toLowerCase() || 'safe',
                    safetyLabel: info.label,
                    description: dbInfo.scientificEvidence || `${dbInfo.category}. ${(dbInfo.concerns || []).join('. ') || 'No major concerns.'}`,
                    details: dbInfo.alternatives ? `Alternatives: ${dbInfo.alternatives}` : null,
                    icon: info.icon,
                    color: isAllergenMatch ? colors.chart3 : info.color,
                    role: dbInfo.category || null,
                    functionDesc: dbInfo.function || null,
                    source: null,
                    avoid: dbInfo.concerns?.length > 0 ? dbInfo.concerns.join('. ') : null,
                    profileSafe: !isAllergenMatch,
                    profileConflict: isAllergenMatch ? 'Matches your allergen profile' : null,
                    // Yuka-level fields
                    eCode: eCode ? eCode.toUpperCase() : null,
                    associatedRisks: dbInfo.associatedRisks || [],
                    concerns: dbInfo.concerns || [],
                    sources: dbInfo.sources || [],
                    exposureContext: dbInfo.exposureContext || null,
                    regulatoryStatus: dbInfo.regulatoryStatus || null,
                    hasDeepData: true,
                    dbKey: eCode || lowerName,
                };
            }

            // 2. Check common ingredients knowledge base
            const common = COMMON_INGREDIENTS[lowerName];
            if (common) {
                const safetyInfo = common.safety === 'caution'
                    ? { label: 'Needs caution', icon: AlertTriangle, color: colors.chart2 }
                    : { label: 'Generally safe', icon: CheckCircle, color: colors.chart1 };
                const isAllergenMatch = profileAllergies.some(a => lowerName.includes(a));
                const isDietaryConflict = profileDietary.some(d => {
                    if (d.includes('vegan') && ['milk', 'gelatin', 'whey', 'casein', 'egg'].some(k => lowerName.includes(k))) return true;
                    if (d.includes('vegetarian') && ['gelatin'].some(k => lowerName.includes(k))) return true;
                    if (d.includes('gluten') && ['wheat', 'barley', 'rye', 'flour'].some(k => lowerName.includes(k))) return true;
                    return false;
                });
                const hasConflict = isAllergenMatch || isDietaryConflict;
                return {
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    safety: hasConflict ? 'caution' : common.safety,
                    safetyLabel: hasConflict ? 'Profile conflict' : safetyInfo.label,
                    description: common.description,
                    details: null,
                    icon: hasConflict ? AlertTriangle : safetyInfo.icon,
                    color: hasConflict ? colors.chart3 : safetyInfo.color,
                    role: common.role || null,
                    functionDesc: null,
                    source: common.source || null,
                    avoid: common.avoid || null,
                    profileSafe: !hasConflict,
                    profileConflict: isAllergenMatch ? 'Matches your allergen profile' : isDietaryConflict ? 'Conflicts with your dietary restrictions' : null,
                    eCode: null,
                    associatedRisks: [],
                    concerns: [],
                    sources: [],
                    exposureContext: null,
                    regulatoryStatus: null,
                    hasDeepData: false,
                    dbKey: null,
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
                description = `Fats and oils provide texture and flavor. We recommend checking if this is a healthy unsaturated fat (like olive or sunflower) or a saturated fat to limit.`;
            } else if (lowerName.includes('flour') || lowerName.includes('starch')) {
                description = `A carbohydrate source used for structure and energy. Whole grain sources are generally preferred over refined options for better nutrition.`;
            } else if (lowerName.includes('extract') || lowerName.includes('juice')) {
                description = `Concentrated flavor or nutrients derived from natural sources. Generally considered a clean label ingredient.`;
            } else if (lowerName.includes('vitamin') || lowerName.includes('mineral')) {
                description = `A nutrient added to fortify the product. These help meet daily nutritional requirements.`;
            } else if (lowerName.includes('preserv')) {
                safety = 'caution'; safetyLabel = 'Preservative'; icon = Shield; color = colors.chart2;
                description = `Added to prevent spoilage and extend shelf life. While necessary for safety, some individuals prefer to minimize preservative intake.`;
            } else if (lowerName.includes('gum') || lowerName.includes('thickener')) {
                description = `Used to improve texture and stability. Common natural gums include xanthan, guar, and acacia.`;
            } else if (lowerName.includes('protein')) {
                description = `A source of protein, essential for muscle and tissue repair. Source can be plant-based (pea, soy) or animal-based (whey, casein).`
            }

            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                safety,
                safetyLabel,
                description,
                details: null,
                icon,
                color,
                role: null,
                functionDesc: null,
                source: null,
                avoid: null,
                profileSafe: true,
                profileConflict: null,
                eCode: null,
                associatedRisks: [],
                concerns: [],
                sources: [],
                exposureContext: null,
                regulatoryStatus: null,
                hasDeepData: false,
                dbKey: null,
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
                            return (
                                <View key={index} style={styles.ingredientCardWrapper}>
                                    {/* Safety Indicator Line */}
                                    <View style={[styles.safetyLine, { backgroundColor: ingredient.color }]} />
                                    
                                    <View style={styles.ingredientCardContent}>
                                        {/* Header: Name + E-code badge + Risk dot */}
                                        <View style={styles.ingredientHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                    <View style={[styles.riskDot, { backgroundColor: ingredient.color }]} />
                                                    <Text style={[styles.riskLevelText, { color: ingredient.color }]}>{ingredient.safetyLabel}</Text>
                                                </View>
                                            </View>
                                            {ingredient.eCode && (
                                                <View style={styles.eCodeBadge}>
                                                    <Text style={styles.eCodeText}>{ingredient.eCode}</Text>
                                                </View>
                                            )}
                                        </View>

                                    {/* Function card (like Yuka's "Texturizing agent" card) */}
                                    {(ingredient.functionDesc || ingredient.role) && (
                                        <View style={styles.functionCard}>
                                            <View style={styles.functionIconWrap}>
                                                <FlaskConical size={20} color={colors.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.functionTitle}>{ingredient.role || 'Ingredient'}</Text>
                                                {ingredient.functionDesc && (
                                                    <Text style={styles.functionSubtitle}>{ingredient.functionDesc}</Text>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    {/* Profile match indicator */}
                                    {ingredient.profileConflict ? (
                                        <View style={[styles.profileMatchBadge, { backgroundColor: `${colors.chart3}10`, borderColor: `${colors.chart3}30` }]}>
                                            <AlertTriangle size={14} color={colors.chart3} />
                                            <Text style={[styles.profileMatchText, { color: colors.chart3 }]}>
                                                {ingredient.profileConflict}
                                            </Text>
                                            <Users size={12} color={colors.chart3} />
                                        </View>
                                    ) : (
                                        <View style={[styles.profileMatchBadge, { backgroundColor: `${colors.chart1}10`, borderColor: `${colors.chart1}30` }]}>
                                            <CheckCircle size={14} color={colors.chart1} />
                                            <Text style={[styles.profileMatchText, { color: colors.chart1 }]}>
                                                Good for your profile
                                            </Text>
                                            <Users size={12} color={colors.chart1} />
                                        </View>
                                    )}

                                    {/* Potential Associated Risks (horizontal scroll like Yuka) */}
                                    {ingredient.associatedRisks?.length > 0 && (
                                        <View style={{ marginBottom: spacing[3] }}>
                                            <Text style={styles.risksLabel}>Potential associated risks</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing[2] }}>
                                                <View style={{ flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[2] }}>
                                                    {ingredient.associatedRisks.map((risk, ri) => {
                                                        const riskIcons = {
                                                            'Potential endocrine disruptor': { icon: Zap, color: '#8B5CF6' },
                                                            'Potential allergen': { icon: ShieldAlert, color: '#F59E0B' },
                                                            'Irritant': { icon: Droplets, color: '#EF4444' },
                                                            'Pollutant': { icon: Leaf, color: '#6B7280' },
                                                        };
                                                        const rc = riskIcons[risk] || { icon: AlertCircle, color: colors.chart2 };
                                                        const RiskIcon = rc.icon;
                                                        return (
                                                            <View key={ri} style={styles.riskCard}>
                                                                <View style={[styles.riskCardIcon, { backgroundColor: `${rc.color}12` }]}>
                                                                    <RiskIcon size={20} color={rc.color} />
                                                                </View>
                                                                <Text style={styles.riskCardText} numberOfLines={2}>{risk.replace('Potential ', '')}</Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </ScrollView>
                                        </View>
                                    )}

                                    {/* Health Concerns (bullet list) */}
                                    {ingredient.concerns?.length > 0 && (
                                        <View style={{ marginBottom: spacing[3] }}>
                                            {ingredient.concerns.slice(0, 3).map((concern, ci) => (
                                                <View key={ci} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                                                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ingredient.color, marginTop: 7 }} />
                                                    <Text style={styles.ingredientDescription}>{concern}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Main description */}
                                    <Text style={styles.ingredientDescription}>{ingredient.description}</Text>

                                    {ingredient.details && (
                                        <View style={styles.ingredientDetails}>
                                            <Text style={styles.detailsTitle}>ALTERNATIVES</Text>
                                            <Text style={styles.detailsText}>{ingredient.details}</Text>
                                        </View>
                                    )}

                                    {/* Scientific Sources (numbered) */}
                                    {ingredient.sources?.length > 0 && (
                                        <View style={styles.sourcesSection}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing[2] }}>
                                                <BookOpen size={14} color={colors.primary} />
                                                <Text style={styles.sourcesLabel2}>Scientific sources</Text>
                                            </View>
                                            {ingredient.sources.map((src, si) => (
                                                <View key={si} style={{ flexDirection: 'row', gap: 6, marginBottom: 3 }}>
                                                    <View style={styles.sourceBullet}>
                                                        <Text style={styles.sourceBulletText}>{si + 1}</Text>
                                                    </View>
                                                    <Text style={styles.sourceText}>{src}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* "Why this ingredient matters" expandable */}
                                    <Pressable
                                        onPress={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
                                        style={styles.whyMattersButton}
                                    >
                                        <Text style={styles.whyMattersText}>Why this ingredient matters</Text>
                                        <ChevronRight
                                            size={16}
                                            color={colors.mutedForeground}
                                            style={{ transform: [{ rotate: expandedIndex === index ? '90deg' : '0deg' }] }}
                                        />
                                    </Pressable>
                                    {expandedIndex === index && (
                                        <View style={styles.whyMattersContent}>
                                            {ingredient.source && (
                                                <View style={styles.whyMattersRow}>
                                                    <Text style={styles.whyMattersLabel}>Source</Text>
                                                    <Text style={styles.whyMattersValue}>{ingredient.source}</Text>
                                                </View>
                                            )}
                                            {ingredient.role && (
                                                <View style={styles.whyMattersRow}>
                                                    <Text style={styles.whyMattersLabel}>Function</Text>
                                                    <Text style={styles.whyMattersValue}>{ingredient.role} — helps define the product's texture, taste, or shelf life.</Text>
                                                </View>
                                            )}
                                            {ingredient.avoid && (
                                                <View style={styles.whyMattersRow}>
                                                    <Text style={[styles.whyMattersLabel, { color: colors.chart2 }]}>Who should avoid</Text>
                                                    <Text style={styles.whyMattersValue}>{ingredient.avoid}</Text>
                                                </View>
                                            )}
                                            {ingredient.exposureContext && (
                                                <View style={styles.whyMattersRow}>
                                                    <Text style={styles.whyMattersLabel}>Exposure context</Text>
                                                    <Text style={styles.whyMattersValue}>{ingredient.exposureContext}</Text>
                                                </View>
                                            )}
                                            {ingredient.regulatoryStatus && (
                                                <View style={styles.whyMattersRow}>
                                                    <Text style={styles.whyMattersLabel}>Regulatory status</Text>
                                                    {Object.entries(ingredient.regulatoryStatus).map(([region, status]) => (
                                                        <Text key={region} style={styles.whyMattersValue}>• {region}: {status}</Text>
                                                    ))}
                                                </View>
                                            )}
                                            {!ingredient.source && !ingredient.avoid && !ingredient.exposureContext && (
                                                <Text style={styles.whyMattersValue}>This ingredient is commonly found in products of this type. No specific population needs to avoid it.</Text>
                                            )}
                                        </View>
                                    )}

                                        {/* Learn more button (opens IngredientDetailModal) */}
                                        {ingredient.hasDeepData && (
                                            <Pressable
                                                onPress={() => {
                                                    setSelectedIngredientCode(ingredient.dbKey);
                                                    setShowDetailModal(true);
                                                }}
                                                style={styles.learnMoreButton}
                                            >
                                                <Text style={styles.learnMoreText}>Expert Detail</Text>
                                                <ChevronRight size={16} color={colors.primaryForeground} />
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
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

            {/* Ingredient Detail Modal (deep-dive when "Learn more" is tapped) */}
            <IngredientDetailModal
                visible={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                ingredientCode={selectedIngredientCode}
            />
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
    ingredientCardWrapper: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        marginBottom: spacing[4],
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    safetyLine: {
        width: 8,
    },
    ingredientCardContent: {
        flex: 1,
        padding: spacing[5],
    },
    ingredientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing[4],
    },
    ingredientName: {
        fontSize: fontSizes.xl,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        marginBottom: spacing[1],
        lineHeight: 28,
    },
    safetyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.full,
    },
    safetyBadgeText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
    },
    ingredientDescription: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: fontSizes.base * 1.6,
        marginBottom: spacing[4],
    },
    ingredientDetails: {
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}80`,
    },
    detailsTitle: {
        fontSize: 11,
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
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 20,
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
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    shareButtonText: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    profileMatchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius.xl,
        borderWidth: 1.5,
        marginBottom: spacing[4],
    },
    profileMatchText: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        flex: 1,
    },
    eCodeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    eCodeText: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        letterSpacing: 0.5,
    },
    riskDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    riskLevelText: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
    },
    functionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        padding: spacing[4],
        borderRadius: radius['2xl'],
        backgroundColor: `${colors.primary}05`,
        borderWidth: 1,
        borderColor: `${colors.primary}15`,
        marginBottom: spacing[4],
    },
    functionIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${colors.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    functionTitle: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: 2,
    },
    functionSubtitle: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    risksLabel: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing[3],
    },
    riskCard: {
        width: 150,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[3],
        borderRadius: radius['2xl'],
        backgroundColor: colors.card,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        gap: spacing[2],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    riskCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    riskCardText: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
        textAlign: 'center',
        lineHeight: 18,
    },
    sourcesSection: {
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}60`,
        marginBottom: spacing[4],
    },
    sourcesLabel2: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
    sourceBullet: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: `${colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    learnMoreButton: {
        marginTop: spacing[4],
        backgroundColor: colors.primary,
        paddingVertical: spacing[3],
        borderRadius: radius.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    learnMoreText: {
        color: colors.primaryForeground,
        fontSize: 14,
        fontFamily: fonts.sansBold,
    },
    sourceBulletText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
    sourceText: {
        flex: 1,
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 17,
    },
    // Learn more button
    learnMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: spacing[3],
        paddingVertical: spacing[3],
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: `${colors.primary}30`,
        backgroundColor: `${colors.primary}08`,
    },
    learnMoreText: {
        fontSize: 14,
        fontFamily: fonts.sansMedium,
        color: colors.primary,
    },
    whyMattersButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}60`,
    },
    whyMattersText: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    whyMattersContent: {
        marginTop: spacing[3],
        gap: spacing[3],
    },
    whyMattersRow: {
        gap: 2,
    },
    whyMattersLabel: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    whyMattersValue: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
});
