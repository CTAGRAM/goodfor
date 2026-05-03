import { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Share, TouchableOpacity, Modal, Alert } from "react-native";
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
    ChevronRight,
    ChevronDown,
    Info,
    Users,
    Apple,
    ChefHat,
    Package,
    Factory,
    Trophy,
    ThumbsUp,
    Scale,
    Clock,
    BarChart3,
    Globe,
    Sprout,
    Recycle,
    Box,
    MessageCircle,
    Sparkles,
    Award,
    ShoppingCart,
    X
} from "lucide-react-native";
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from "react-native-reanimated";
import AnimatedPressable from "@/components/AnimatedPressable";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { SAFETY_LEVELS, analyzeProductSafety, yearsToMonths } from "@/lib/productSafety";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";
// NutriScoreInfo is now inlined as a tooltip modal below
import IngredientDetailModal from "@/components/IngredientDetailModal";
import RecallAlert from "@/components/RecallAlert";
import { checkProductRecall } from "@/lib/recallService";
import { isProductFavorite, addToFavorites, removeFromFavorites } from "@/lib/productService";
import { hapticLight, hapticMedium, hapticSelection, hapticSuccess } from "@/lib/haptics";
import { ConfettiBurst } from '@/components/AnimatedEffects';
import { getOrCreateTodayBasket, addToBasket as addProductToBasket, replaceBasketItem } from '@/lib/basketService';
import { useAlert } from '@/contexts/AlertContext';

export default function ProductSummary() {
    const { productData, replaceItemId, basketId: replaceBasketId } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile, user } = useAuth();
    const { showAlert } = useAlert();
    const [isFavorite, setIsFavorite] = useState(false);
    const [showNutriScoreInfo, setShowNutriScoreInfo] = useState(false);
    const [showIngredientDetail, setShowIngredientDetail] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    // Phase 4: Profile Switcher state
    const [familyMembers, setFamilyMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null); // null = main profile
    const [showProfilePicker, setShowProfilePicker] = useState(false);
    // Phase 4: Portion Toggle state
    const [showPerServing, setShowPerServing] = useState(false);
    // V4: Tooltip modals
    const [showNovaTooltip, setShowNovaTooltip] = useState(false);
    const [showEnvTooltip, setShowEnvTooltip] = useState(false);

    // Phase 5: Product Recall state
    const [productRecall, setProductRecall] = useState(null);
    const [recallDismissed, setRecallDismissed] = useState(false);
    const [productId, setProductId] = useState(null); // For favorites tracking
    const [showSources, setShowSources] = useState(false); // V6: Sources & Methodology

    // Phase 4: Fetch family members
    useEffect(() => {
        const fetchFamilyMembers = async () => {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('family_members')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });

                if (data && !error) {
                    setFamilyMembers(data);
                }
            } catch (e) {
                console.error('[ProfileSwitcher] Error fetching family:', e);
            }
        };
        fetchFamilyMembers();
    }, [user?.id]);

    // Phase 5: Check for product recalls
    useEffect(() => {
        const checkRecalls = async () => {
            if (!product?.code && !product?.product_name) return;
            try {
                const recall = await checkProductRecall(product);
                if (recall) {
                    console.log('[RecallCheck] Found recall for product:', recall.id);
                    setProductRecall(recall);
                }
            } catch (e) {
                console.error('[RecallCheck] Error:', e);
            }
        };
        checkRecalls();
    }, [product?.code]);

    // Fetch product ID and check if favorited
    useEffect(() => {
        const loadProductAndFavoriteStatus = async () => {
            if (!user?.id || !product?.barcode) return;
            try {
                // Get product ID from database using barcode
                const { data: productData, error } = await supabase
                    .from('products')
                    .select('id')
                    .eq('barcode', product.barcode)
                    .maybeSingle();

                if (productData?.id) {
                    setProductId(productData.id);
                    // Check if this product is already favorited
                    const favorited = await isProductFavorite(user.id, productData.id);
                    setIsFavorite(favorited);
                }
            } catch (e) {
                console.error('[ProductSummary] Error loading favorite status:', e);
            }
        };
        loadProductAndFavoriteStatus();
    }, [user?.id, product?.barcode]);

    // Get current viewing profile (main or family member)
    const viewingProfile = selectedMember || {
        name: profile?.full_name || 'You',
        age_group: profile?.age_group || 'adult',
        allergies: profile?.allergens || [],
        dietary_restrictions: profile?.dietary_preferences || [],
        isMainProfile: true
    };

    // Parse product with defensive defaults to handle both fresh scan and history navigation
    const product = JSON.parse(productData || '{}');

    // Ensure safety analysis exists with defaults (handles both fresh and history data)
    const originalSafety = product.safetyAnalysis || {
        safety: SAFETY_LEVELS.SAFE,
        safeScore: 50,
        issues: [],
        ageAppropriate: true,
        nutriScore: null,
    };

    // Re-analyze safety when profile changes (Client request: score should update per person)
    const safety = useMemo(() => {
        if (!selectedMember || selectedMember === 'FAMILY_OVERVIEW') {
            return originalSafety; // Use original analysis for main profile
        }
        try {
            const memberAgeYears = selectedMember.age_years ||
                (selectedMember.age_group === 'infant' ? 1 : selectedMember.age_group === 'child' ? 8 : 30);
            const memberAgeMonths = yearsToMonths(memberAgeYears);
            const memberPrefs = {
                allergies: selectedMember.allergies || [],
                dietaryRestrictions: selectedMember.dietary_restrictions || [],
                healthConditions: selectedMember.health_conditions || [],
            };
            return analyzeProductSafety(product, memberAgeMonths, memberPrefs);
        } catch (e) {
            console.error('[ProductSummary] Re-analysis error:', e);
            return originalSafety;
        }
    }, [selectedMember, product.barcode]);

    // Determine if this is a beauty/cosmetic product — broad detection
    const BEAUTY_KEYWORDS = /beauty|cosmetic|shampoo|soap|skin\s?care|skincare|hair\s?care|haircare|lotion|cream|face|body\s?wash|hygiene|moisturi[sz]|serum|cleanser|conditioner|sunscreen|spf|makeup|mascara|lipstick|foundation|perfume|fragrance|deodorant|toothpaste|dental|mouthwash|exfoliat|toner|scrub/i;
    const isBeautyProduct = product.productType === 'BEAUTY' || safety.productType === 'BEAUTY' ||
        (typeof product.category === 'string' && product.category.toLowerCase().includes('beauty')) ||
        (product.categories_tags || []).some(t => BEAUTY_KEYWORDS.test(t)) ||
        BEAUTY_KEYWORDS.test(product.product_name || product.name || '') ||
        BEAUTY_KEYWORDS.test((product.categories || []).join(' '));

    // Ensure required objects exist for UI calculations
    if (!product.nutriments) product.nutriments = {};
    if (!product.allergens) product.allergens = [];
    if (!product.categories) product.categories = [];
    if (!safety.issues) safety.issues = [];

    // Phase 4: Portion Toggle - Serving size helpers
    // Default portion sizes by product category
    const DEFAULT_PORTIONS = {
        'crisps': 30, 'chips': 30, 'snacks': 30, 'crackers': 30,
        'biscuits': 30, 'cookies': 30, 'wafers': 30,
        'chocolate': 25, 'confectionery': 25, 'candy': 25, 'sweets': 25,
        'sauces': 15, 'ketchup': 15, 'mayonnaise': 15, 'dressing': 15, 'condiments': 15,
        'almond butter': 15, 'peanut butter': 15, 'nut butter': 15, 'cashew butter': 15,
        'spreads': 20, 'jam': 20, 'honey': 20, 'nutella': 15, 'tahini': 15,
        'butter': 10, 'margarine': 10,
        'beverages': 250, 'drinks': 250, 'juice': 200, 'soda': 330, 'water': 250,
        'milk': 200, 'yogurt': 125, 'yoghurt': 125,
        'cereal': 40, 'muesli': 50, 'oats': 40, 'granola': 45,
        'bread': 40, 'bakery': 50,
        'pasta': 80, 'noodles': 80, 'rice': 75,
        'cheese': 30, 'cream cheese': 30,
        'ice cream': 70, 'frozen dessert': 70,
        'nuts': 30, 'trail mix': 30, 'dried fruit': 30,
        'soup': 250, 'broth': 250,
        'pizza': 150, 'ready meal': 300, 'frozen meal': 300,
        'oil': 10, 'cooking oil': 10, 'olive oil': 10,
    };

    const getDefaultPortionSize = () => {
        const categories = (product.categories || []).join(' ').toLowerCase();
        const productName = (product.product_name || product.name || '').toLowerCase();
        const searchText = `${categories} ${productName}`;
        for (const [keyword, size] of Object.entries(DEFAULT_PORTIONS)) {
            if (searchText.includes(keyword)) return size;
        }
        return 30; // Generic fallback: 30g is a common snack portion
    };

    // V5: Detect if product is a drink/beverage
    const isDrink = (() => {
        const cats = (product.categories || []).join(' ').toLowerCase();
        const name = (product.product_name || product.name || '').toLowerCase();
        const text = `${cats} ${name}`;
        return ['beverage', 'drink', 'juice', 'soda', 'water', 'milk', 'coffee', 'tea', 'energy drink', 'smoothie', 'lemonade', 'cola'].some(k => text.includes(k));
    })();
    const portionUnit = isDrink ? 'ml' : 'g';

    const getServingSize = () => {
        const servingSize = product.serving_size || product.servingSize;
        if (servingSize) {
            // V5: Parse both g and ml from serving strings like "30g" or "330ml" or "1 cup (240ml)"
            const matchG = servingSize.match(/(\d+(?:\.\d+)?)\s*g/i);
            if (matchG) return { size: parseFloat(matchG[1]), isDefault: false, unit: 'g' };
            const matchMl = servingSize.match(/(\d+(?:\.\d+)?)\s*ml/i);
            if (matchMl) return { size: parseFloat(matchMl[1]), isDefault: false, unit: 'ml' };
        }
        // Use category-based default
        return { size: getDefaultPortionSize(), isDefault: true, unit: portionUnit };
    };

    const servingSizeData = getServingSize();
    const servingSize = servingSizeData.size;
    const isDefaultServing = servingSizeData.isDefault;
    const servingUnit = servingSizeData.unit || portionUnit;
    // Show portion toggle for ALL food products (User requested fix for 100g bias)
    const hasServingSize = !isBeautyProduct;

    // Calculate value per serving
    const getPortionValue = (valuePer100g) => {
        if (!showPerServing || !servingSize) return valuePer100g;
        return (valuePer100g * servingSize) / 100;
    };

    // Get display label for current portion mode
    const baseUnit = isDrink ? '100ml' : '100g';
    const portionLabel = showPerServing && servingSize
        ? `per ${servingSize}${servingUnit} serving`
        : `per ${baseUnit}`;

    const getSafetyConfig = () => {
        switch (safety.safety) {
            case SAFETY_LEVELS.SAFE:
                return { color: colors.chart1, icon: CheckCircle, label: 'Good', description: 'Matches all family health preferences' };
            case SAFETY_LEVELS.CAUTION:
                return { color: colors.chart2, icon: AlertCircle, label: 'Caution', description: 'Some concerns to be aware of' };
            case SAFETY_LEVELS.AVOID:
                return { color: colors.chart3, icon: AlertTriangle, label: 'Avoid', description: 'Not recommended for your profile' };
            case SAFETY_LEVELS.CRITICAL:
                return { color: colors.destructive, icon: ShieldAlert, label: 'Unsafe', description: 'Serious health risks detected' };
            default:
                return { color: colors.chart1, icon: CheckCircle, label: 'Good', description: 'Good to consume' };
        }
    };

    const safetyConfig = getSafetyConfig();
    const SafetyIcon = safetyConfig.icon;

    const getCategory = () => {
        // Check if it's a beauty product first
        if (isBeautyProduct) {
            // Use product subtype if available (SKINCARE, HAIRCARE, etc.)
            if (product.productSubtype && product.productSubtype !== 'OTHER') {
                return product.productSubtype.charAt(0) + product.productSubtype.slice(1).toLowerCase().replace('_', ' ');
            }
            return 'Beauty Product';
        }
        // Food product
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
            title: 'Ingredient Composition',
            subtitle: product.ingredientsText
                ? `${product.ingredientsText.split(',').length} total ingredients`
                : 'No ingredients data available',
        },
        {
            icon: Droplets,
            iconColor: (product.nutriments?.sugars || 0) > 12.5 ? colors.chart3 : (product.nutriments?.sugars || 0) > 4.5 ? colors.chart2 : colors.chart1,
            title: 'Added Sugars',
            subtitle: (() => {
                const sugarValue = getPortionValue(product.nutriments?.sugars || 0);
                const threshold1 = showPerServing ? 12.5 * (servingSize || 100) / 100 : 12.5;
                const threshold2 = showPerServing ? 4.5 * (servingSize || 100) / 100 : 4.5;
                if (sugarValue > threshold1) return `High (${sugarValue.toFixed(1)}g ${portionLabel})`;
                if (sugarValue > threshold2) return `Moderate (${sugarValue.toFixed(1)}g ${portionLabel})`;
                return `Low (${sugarValue.toFixed(1)}g ${portionLabel})`;
            })(),
        },
        {
            icon: Shield,
            iconColor: (safety.fragranceAllergenCount || product.allergens?.length || 0) > 0 ? colors.chart2 : colors.chart1,
            title: 'Allergen Status',
            subtitle: isBeautyProduct
                ? (safety.fragranceAllergenCount > 0
                    ? `${safety.fragranceAllergenCount} fragrance allergen(s) detected`
                    : 'No fragrance allergens detected')
                : (product.allergens?.length > 0
                    ? `Contains ${product.allergens.length} allergen(s)`
                    : 'No major allergens detected'),
        },
    ];

    // NOVA Processing Level for food products
    const getNovaDisplay = () => {
        const novaGroup = safety.novaGroup?.group || product.novaGroup;
        if (!novaGroup || isBeautyProduct) return null;

        const novaLabels = {
            1: { label: 'Unprocessed', color: colors.chart1, icon: 'apple' },
            2: { label: 'Processed culinary', color: '#85BB2F', icon: 'chef' },
            3: { label: 'Processed food', color: colors.chart2, icon: 'package' },
            4: { label: 'Ultra-processed', color: colors.chart3, icon: 'factory' },
        };
        return novaLabels[novaGroup] || null;
    };
    const novaDisplay = getNovaDisplay();

    // Consumption frequency guidance — anchored to safety level to prevent contradictions
    const getConsumptionGuidance = () => {
        if (isBeautyProduct) return null;

        const safetyLevel = safety.safety;
        const nutriGrade = safety.nutriScore?.grade?.toUpperCase() || nutriScoreInfo.grade;
        const novaGroup = safety.novaGroup?.group || product.novaGroup;

        // Safety level is the primary anchor — NEVER contradict the verdict
        if (safetyLevel === SAFETY_LEVELS.AVOID || safetyLevel === SAFETY_LEVELS.CRITICAL) {
            return { text: 'Not recommended for your profile', color: colors.chart3 };
        }
        if (safetyLevel === SAFETY_LEVELS.CAUTION || novaGroup >= 4) {
            return { text: 'Best as an occasional treat', color: colors.chart2 };
        }
        // Only SAFE products get positive guidance
        if (nutriGrade === 'A' || nutriGrade === 'B') {
            return { text: 'Suitable for regular consumption', color: colors.chart1 };
        } else if (nutriGrade === 'C') {
            return { text: 'Moderate consumption recommended', color: colors.chart2 };
        } else if (nutriGrade === 'D' || nutriGrade === 'E') {
            return { text: 'Occasional consumption only', color: colors.chart3 };
        }
        return null;
    };
    const consumptionGuidance = getConsumptionGuidance();

    // Fat Quality Breakdown - Phase 3
    const getFatQuality = () => {
        if (isBeautyProduct) return null;

        const totalFat = product.nutriments?.fat || product.nutriments?.fat_100g || 0;
        const saturatedFat = product.nutriments?.['saturated-fat'] || product.nutriments?.['saturated-fat_100g'] || 0;
        const transFat = product.nutriments?.['trans-fat'] || product.nutriments?.['trans-fat_100g'] || 0;

        if (totalFat <= 0) return null;

        const unsaturatedFat = Math.max(0, totalFat - saturatedFat - transFat);
        const saturatedRatio = (saturatedFat / totalFat) * 100;

        let quality = 'good';
        let label = 'Healthy fat profile';
        let color = colors.chart1;

        if (transFat > 0.5) {
            quality = 'bad';
            label = 'Contains trans fats';
            color = colors.chart3;
        } else if (saturatedRatio > 60) {
            quality = 'caution';
            label = 'High in saturated fat';
            color = colors.chart2;
        } else if (saturatedRatio > 35) {
            quality = 'mixed';
            label = 'Mixed fat profile';
            color = colors.chart2;
        }

        return {
            totalFat: totalFat.toFixed(1),
            saturatedFat: saturatedFat.toFixed(1),
            unsaturatedFat: unsaturatedFat.toFixed(1),
            transFat: transFat > 0 ? transFat.toFixed(1) : null,
            quality,
            label,
            color,
            saturatedPercent: Math.round(saturatedRatio),
            unsaturatedPercent: Math.round(100 - saturatedRatio - (transFat / totalFat * 100 || 0)),
        };
    };
    const fatQuality = getFatQuality();

    // Phase 4: Environmental Impact helper — V4: uses real OFF data when available
    const getEnvironmentalImpact = () => {
        if (isBeautyProduct) return null;

        // Get Eco-Score if available (must be valid grade A-E)
        const rawEcoScore = product.ecoScore?.toUpperCase() || product.eco_score?.toUpperCase() || null;
        const validGrades = ['A', 'B', 'C', 'D', 'E'];
        const ecoScore = validGrades.includes(rawEcoScore) ? rawEcoScore : null;
        const ecoScoreColors = {
            'A': '#038141', 'B': '#85BB2F', 'C': '#FECB02', 'D': '#EE8100', 'E': '#E63E11'
        };

        // V4: Try real carbon footprint data from OFF first, then estimate
        let carbonEstimate = null;
        let carbonLevel = 'low';
        const realCarbon = product.carbonFootprint;

        if (realCarbon && realCarbon > 0) {
            // Real data from Agribalyse / OFF ecoscore_data
            carbonEstimate = `${realCarbon.toFixed(1)} kg CO₂/kg`;
            carbonLevel = realCarbon > 8 ? 'high' : realCarbon > 3 ? 'medium' : 'low';
        } else {
            // Fallback: estimate based on category
            const category = product.categories?.[0]?.toLowerCase() || '';
            if (category.includes('meat') || category.includes('beef')) {
                carbonEstimate = '10-30 kg CO₂/kg';
                carbonLevel = 'high';
            } else if (category.includes('dairy') || category.includes('cheese')) {
                carbonEstimate = '5-15 kg CO₂/kg';
                carbonLevel = 'medium';
            } else if (category.includes('vegetable') || category.includes('fruit')) {
                carbonEstimate = '0.5-2 kg CO₂/kg';
                carbonLevel = 'low';
            } else if (category.includes('grain') || category.includes('bread')) {
                carbonEstimate = '1-3 kg CO₂/kg';
                carbonLevel = 'low';
            } else if (category.includes('beverage') || category.includes('drink')) {
                carbonEstimate = '0.5-1.5 kg CO₂/L';
                carbonLevel = 'low';
            } else if (category.includes('snack') || category.includes('biscuit') || category.includes('chocolate')) {
                carbonEstimate = '2-6 kg CO₂/kg';
                carbonLevel = 'medium';
            } else {
                carbonEstimate = '2-5 kg CO₂/kg';
                carbonLevel = 'medium';
            }
        }

        // V4: Use real packaging_tags from OFF data
        const packTags = product.packaging_tags || [];
        const packText = (product.packaging || '').toLowerCase();
        const hasPlastic = packTags.some(p => p.includes('plastic')) || packText.includes('plastic');
        const isRecyclable = packTags.some(p => p.includes('recyclable')) || packText.includes('recyclable');
        const hasGlass = packTags.some(p => p.includes('glass')) || packText.includes('glass');
        const hasCardboard = packTags.some(p => p.includes('cardboard') || p.includes('paper')) || packText.includes('cardboard');

        // V4: Check sustainability labels
        const labels = product.labels_tags || [];
        const isOrganic = labels.some(l => l.includes('organic') || l.includes('bio'));
        const isFairTrade = labels.some(l => l.includes('fair-trade') || l.includes('fairtrade'));
        const isRainforest = labels.some(l => l.includes('rainforest'));

        // Eco-Score description
        const ecoScoreDescriptions = {
            'A': 'Very low environmental impact',
            'B': 'Low environmental impact',
            'C': 'Moderate environmental impact',
            'D': 'High environmental impact',
            'E': 'Very high environmental impact',
        };

        return {
            ecoScore,
            ecoScoreColor: ecoScoreColors[ecoScore] || colors.mutedForeground,
            ecoScoreDescription: ecoScoreDescriptions[ecoScore] || null,
            carbonEstimate,
            carbonLevel,
            carbonColor: carbonLevel === 'high' ? colors.chart3 : carbonLevel === 'medium' ? colors.chart2 : colors.chart1,
            carbonDescription: carbonLevel === 'high' ? 'Significant carbon footprint — consider plant-based alternatives' :
                carbonLevel === 'medium' ? 'Moderate carbon footprint' : 'Low carbon footprint — good choice',
            hasPlastic,
            isRecyclable,
            hasGlass,
            hasCardboard,
            isOrganic,
            isFairTrade,
            isRainforest,
            hasRealCarbonData: !!realCarbon,
        };
    };
    const envImpact = getEnvironmentalImpact();

    // Beauty Safety Analysis card data (replaces Nutri-Score for beauty products)
    const getBeautySafetyAnalysis = () => {
        if (!isBeautyProduct) return null;
        const ingredientCount = product.ingredientsText ? product.ingredientsText.split(',').length : 0;
        const ingredientSafety = Math.round(safety.safeScore || 70);
        const allergenRisk = (safety.fragranceAllergenCount || 0) > 3 ? 'High' :
            (safety.fragranceAllergenCount || 0) > 0 ? 'Moderate' : 'Low';
        const allergenRiskColor = allergenRisk === 'High' ? colors.chart3 :
            allergenRisk === 'Moderate' ? colors.chart2 : colors.chart1;
        const clinicalScore = safety.clinicalEvidence || Math.min(ingredientCount, 15);
        const regulatoryStatus = safety.regulatoryCompliance || 'Compliant';
        return { ingredientSafety, allergenRisk, allergenRiskColor, clinicalScore, ingredientCount, regulatoryStatus };
    };
    const beautySafety = getBeautySafetyAnalysis();

    // Plain-English Verdict - Phase 3 (V4: respects safety level to avoid contradictions)
    const getPlainEnglishVerdict = () => {
        const score = Math.round(safety.safeScore || 50);
        const issueCount = safety.issues?.length || 0;
        const productName = product.name || 'This product';
        const topConcern = safety.issues?.[0]?.title || '';
        const novaGroup = safety.novaGroup?.group || product.novaGroup;
        const nutriGrade = safety.nutriScore?.grade?.toUpperCase() || nutriScoreInfo.grade;
        const safetyLevel = safety.safety;

        // V4 FIX: Use safety level as PRIMARY anchor to prevent verdict contradicting the safety badge
        // The safety badge (Safe/Caution/Avoid/Unsafe) is the hero — verdict MUST align with it.

        if (isBeautyProduct) {
            if (safetyLevel === SAFETY_LEVELS.CRITICAL || safetyLevel === SAFETY_LEVELS.AVOID) {
                return {
                    verdict: 'Not recommended for your profile',
                    detail: topConcern
                        ? `${productName} contains ${topConcern.toLowerCase()}. Consider safer alternatives.`
                        : 'Contains ingredients that conflict with your profile settings.',
                    emoji: '', color: colors.chart3
                };
            } else if (safetyLevel === SAFETY_LEVELS.CAUTION) {
                return {
                    verdict: 'Use with caution',
                    detail: safety.fragranceAllergenCount > 0
                        ? `Contains ${safety.fragranceAllergenCount} fragrance allergen(s). Patch test before regular use.`
                        : topConcern
                            ? `${topConcern} may not suit sensitive skin. Monitor for irritation.`
                            : 'Minor concerns detected. Suitable for most skin types with care.',
                    emoji: '', color: colors.chart2
                };
            } else {
                return {
                    verdict: score >= 85 ? 'Suitable for daily use' : 'Safe with basic precautions',
                    detail: `${productName} is well-formulated with ${issueCount === 0 ? 'no' : 'minimal'} concerns for your skin profile.`,
                    emoji: '✨', color: colors.chart1
                };
            }
        } else {
            // Food products — safety level is the anchor, nutri data provides detail
            if (safetyLevel === SAFETY_LEVELS.CRITICAL || safetyLevel === SAFETY_LEVELS.AVOID) {
                return {
                    verdict: 'Avoid based on your profile',
                    detail: topConcern
                        ? `${topConcern} detected. Not suitable for your dietary requirements.`
                        : `This product conflicts with your health preferences.${novaGroup >= 4 ? ' Ultra-processed (NOVA 4).' : ''}`,
                    icon: 'alert', color: colors.chart3
                };
            } else if (safetyLevel === SAFETY_LEVELS.CAUTION) {
                // Caution — never say "Enjoy" or "Good for regular consumption"
                const highNutrients = [
                    safety.nutriScore?.breakdown?.negatives?.sodium?.points > 5 ? 'sodium' : '',
                    safety.nutriScore?.breakdown?.negatives?.sugars?.points > 5 ? 'sugars' : '',
                    safety.nutriScore?.breakdown?.negatives?.saturates?.points > 5 ? 'saturated fats' : ''
                ].filter(Boolean);
                return {
                    verdict: 'Consume with awareness',
                    detail: novaGroup >= 4
                        ? `Ultra-processed (NOVA 4). Best as an occasional treat, not a staple.`
                        : highNutrients.length > 0
                            ? `Contains elevated ${highNutrients.join(', ')}. Watch portion sizes.`
                            : topConcern
                                ? `${topConcern}. Moderate your intake.`
                                : 'Some nutritional concerns for your profile. Watch portion sizes.',
                    icon: 'scale', color: colors.chart2
                };
            } else {
                // SAFE — can use positive language
                if (nutriGrade === 'A' || score >= 85) {
                    return {
                        verdict: 'Excellent nutritional choice',
                        detail: `${productName} has high nutritional value${novaGroup <= 2 ? ' with minimal processing' : ''}.`,
                        icon: 'trophy', color: colors.chart1
                    };
                } else {
                    return {
                        verdict: 'Good for regular consumption',
                        detail: `Balanced nutritional profile.${novaGroup >= 3 ? ' Some processing involved.' : ''}`,
                        icon: 'thumbsup', color: colors.chart1
                    };
                }
            }
        }
    };
    const plainVerdict = getPlainEnglishVerdict();

    // V5: Nutri-Score Explanation - "Why D?" under the Nutri-Score badge
    const getNutriScoreExplanation = () => {
        if (isBeautyProduct || !safety.nutriScore) return null;
        const grade = (safety.nutriScore.grade || '').toUpperCase();
        if (!grade) return null;

        const breakdown = safety.nutriScore.breakdown;
        if (!breakdown) return null;

        // Identify worst negatives and best positives
        const negatives = [];
        const positives = [];

        if (breakdown.negatives) {
            if (breakdown.negatives.energy?.points >= 5) negatives.push('energy density');
            if (breakdown.negatives.sugars?.points >= 4) negatives.push('sugar content');
            if (breakdown.negatives.saturates?.points >= 4) negatives.push('saturated fat');
            if (breakdown.negatives.sodium?.points >= 4) negatives.push('sodium');
        }
        if (breakdown.positives) {
            if (breakdown.positives.fiber?.points >= 3) positives.push('fiber');
            if (breakdown.positives.protein?.points >= 3) positives.push('protein');
            if (breakdown.positives.fruitsVegetables?.points >= 3) positives.push('fruits & vegetables');
        }

        if (grade === 'A') return `Excellent balance of nutrients with low negatives.`;
        if (grade === 'B') return `Good nutritional profile${positives.length > 0 ? ` — strong in ${positives.join(' and ')}` : ''}.`;

        const negStr = negatives.length > 0 ? negatives.slice(0, 2).join(' and ') : 'nutritional imbalances';
        const posStr = positives.length > 0 ? positives.join(' and ') : 'some positive components';

        if (grade === 'C') return `${negStr.charAt(0).toUpperCase() + negStr.slice(1)} slightly offset by ${posStr}.`;
        if (grade === 'D' || grade === 'E') return `High ${negStr} outweigh ${posStr}.`;

        return null;
    };
    const nutriScoreExplanation = getNutriScoreExplanation();

    // V5: "Why Not 100?" — Score blockers for beauty products
    const getWhyNotPerfect = () => {
        const score = Math.round(safety.safeScore || 50);
        if (score >= 95) return []; // Near-perfect, skip

        const blockers = [];

        if (isBeautyProduct) {
            if (safety.fragranceAllergenCount > 0) {
                blockers.push(`Contains ${safety.fragranceAllergenCount} EU-regulated fragrance allergen(s)`);
            }
            if (safety.issues?.length > 0) {
                const uniqueIssues = [...new Set(safety.issues.map(i => i.title))].slice(0, 2);
                uniqueIssues.forEach(issue => blockers.push(issue));
            }
            if ((safety.clinicalEvidence || 0) < 10) {
                blockers.push('Limited long-term clinical data for some ingredients');
            }
            if (safety.hasParabens) blockers.push('Contains parabens (preservative)');
            if (safety.hasSulfates) blockers.push('Contains sulfates (surfactant)');
        } else {
            // Food products
            const novaGroup = safety.novaGroup?.group || product.novaGroup;
            if (novaGroup >= 4) blockers.push('Ultra-processed food (NOVA 4)');
            if (safety.nutriScore?.breakdown?.negatives?.sodium?.points >= 5) {
                blockers.push('High sodium content');
            }
            if (safety.nutriScore?.breakdown?.negatives?.sugars?.points >= 5) {
                blockers.push('High sugar content');
            }
            if (safety.nutriScore?.breakdown?.negatives?.saturates?.points >= 5) {
                blockers.push('High saturated fat');
            }
            if (safety.issues?.length > 0) {
                const topIssue = safety.issues[0]?.title;
                if (topIssue && !blockers.includes(topIssue)) blockers.push(topIssue);
            }
        }

        return blockers.slice(0, 4); // Max 4 blockers
    };
    const scoreBlockers = getWhyNotPerfect();
    // Phase 4: "Who should limit this" Advice
    const getLimitationAdvice = () => {
        if (isBeautyProduct) return [];

        const advice = [];
        const sugars = product.nutriments?.sugars || 0;
        const sodium = (product.nutriments?.sodium || 0) * 1000; // mg
        const caffeine = product.nutriments?.caffeine || 0;
        const score = safety.nutriScore?.rawScore || 0;

        // High Sugar
        if (sugars > 22.5) { // Red zone
            advice.push({ group: 'Children < 4', reason: 'High sugar content' });
            advice.push({ group: 'Diabetics', reason: 'High glycemic impact' });
        } else if (sugars > 10) {
            advice.push({ group: 'Infants', reason: 'Avoid added sugars' });
        }

        // High Sodium
        if (sodium > 600) { // High
            advice.push({ group: 'Hypertension', reason: 'High sodium' });
            advice.push({ group: 'Toddlers', reason: 'Exceeds daily recommended intake' });
        }

        // Caffeine
        if (caffeine > 0) {
            advice.push({ group: 'Children', reason: 'Contains caffeine' });
            advice.push({ group: 'Pregnant Women', reason: 'Limit caffeine intake' });
        }

        // Additives - check specific ones (simplified)
        const additives = (product.additives_tags || []).join(' ');
        if (additives.includes('e102') || additives.includes('e110') || additives.includes('e129')) {
            advice.push({ group: 'Sensitive Children', reason: 'May affect attention/activity' });
        }

        return advice;
    };
    const limitationAdvice = getLimitationAdvice();

    const handleSaveToFavorites = async () => {
        if (!user?.id || !productId) {
            console.warn('[ProductSummary] Cannot save favorite - missing user or product ID');
            return;
        }

        try {
            if (isFavorite) {
                await removeFromFavorites(user.id, productId);
                setIsFavorite(false);
                console.log('[ProductSummary] Removed from favorites');
            } else {
                await addToFavorites(user.id, productId);
                setIsFavorite(true);
                console.log('[ProductSummary] Added to favorites');
            }
        } catch (error) {
            console.error('[ProductSummary] Favorites error:', error);
        }
    };

    const handleShare = async () => {
        try {
            const message = `${product.name} - Safety Analysis\n\nRating: ${safetyConfig.label} (${safety.safeScore}/100)\nBrand: ${product.brand || 'Unknown'}\n\n${safetyConfig.description}\n\nAnalyzed with GoodFor`;
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
                <View style={styles.headerButtonShadow}>
                    <Pressable style={styles.headerButton} onPress={() => { hapticLight(); router.back(); }}>
                        <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
                            <ArrowLeft size={24} color={colors.foreground} />
                        </BlurView>
                    </Pressable>
                </View>
                <Text style={styles.headerTitle}>Analysis Result</Text>
                <View style={styles.headerButtonShadow}>
                    <Pressable style={styles.headerButton} onPress={() => { hapticLight(); handleShare(); }}>
                        <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
                            <Share2 size={20} color={colors.foreground} />
                        </BlurView>
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Phase 5: Product Recall Alert */}
                {productRecall && !recallDismissed && (
                    <RecallAlert
                        recall={productRecall}
                        onDismiss={() => setRecallDismissed(true)}
                    />
                )}

                {/* Phase 4: Profile Switcher (Moved to top) */}
                {profile && (
                    <Pressable
                        style={styles.profileSwitcher}
                        onPress={() => setShowProfilePicker(true)}
                    >
                        <View style={styles.profileSwitcherLeft}>
                            <View style={[styles.avatar, { backgroundColor: selectedMember === 'FAMILY_OVERVIEW' ? colors.chart1 : selectedMember ? colors.accent : colors.primary }]}>
                                {selectedMember === 'FAMILY_OVERVIEW' ? (
                                    <Users size={18} color={colors.primaryForeground} />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {viewingProfile.name?.[0] || '?'}
                                    </Text>
                                )}
                            </View>
                            <View>
                                <Text style={styles.profileSwitcherLabel}>Viewing safety for:</Text>
                                <Text style={styles.profileSwitcherName}>
                                    {selectedMember === 'FAMILY_OVERVIEW' ? 'Family Overview' : viewingProfile.name}
                                    {selectedMember !== 'FAMILY_OVERVIEW' && (
                                        <Text style={styles.profileSwitcherAge}>
                                            {' '}({viewingProfile.age_group === 'infant' ? 'Infant' : viewingProfile.age_group === 'child' ? 'Child' : 'Adult'})
                                        </Text>
                                    )}
                                </Text>
                            </View>
                        </View>
                        {familyMembers.length > 0 && (
                            <View style={styles.switcherChevron}>
                                <ChevronDown size={20} color={colors.mutedForeground} />
                            </View>
                        )}
                    </Pressable>
                )}

                {/* V5: Spacer between profile selector and analysis */}
                <View style={{ height: 12 }} />

                {/* Main Card */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.mainCard}>
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
                                <Box size={32} color={colors.mutedForeground} />
                            </View>
                        )}
                    </View>

                    {/* Score Badges - Moved to top per client request */}
                    <View style={[styles.badgeRow, { justifyContent: 'center', marginBottom: 16, marginTop: 12 }]}>
                        {!isBeautyProduct && nutriScoreInfo.grade && (
                            <TouchableOpacity
                                style={[styles.nutriBadge, { backgroundColor: `${nutriScoreInfo.color}15`, borderColor: nutriScoreInfo.color }]}
                                onPress={() => { hapticMedium(); setShowNutriScoreInfo(true); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.nutriGrade, { color: nutriScoreInfo.color }]}>{nutriScoreInfo.grade}</Text>
                                <Text style={styles.nutriLabel}>Nutri-Score</Text>
                                <Info size={14} color={nutriScoreInfo.color} style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        )}
                        {isBeautyProduct && beautySafety && (
                            <View style={[styles.nutriBadge, { backgroundColor: `${safetyConfig.color}15`, borderColor: safetyConfig.color }]}>
                                <Text style={[styles.nutriGrade, { color: safetyConfig.color }]}>{Math.round(safety.safeScore || 0)}</Text>
                                <Text style={styles.nutriLabel}>Safety</Text>
                            </View>
                        )}
                        <View style={[styles.scoreBadge, { backgroundColor: `${safetyConfig.color}15`, borderColor: safetyConfig.color }]}>
                            <Text style={[styles.scoreValue, { color: safetyConfig.color }]}>{Math.round(safety.safeScore || 0)}</Text>
                            <Text style={styles.scoreLabel}>/100</Text>
                        </View>
                    </View>

                    {/* Confetti celebration for high scores */}
                    {Math.round(safety.safeScore || 0) >= 85 && (
                        <View style={{ position: 'absolute', top: 20, alignSelf: 'center', zIndex: 10, pointerEvents: 'none' }}>
                            <ConfettiBurst size={260} />
                        </View>
                    )}

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

                    {/* Plain-English Verdict - Phase 3 */}
                    <View style={[styles.verdictCard, { backgroundColor: `${plainVerdict.color}08`, borderColor: `${plainVerdict.color}25` }]}>
                        <Text style={styles.verdictEmoji}>{plainVerdict.emoji}</Text>
                        <View style={styles.verdictContent}>
                            <Text style={[styles.verdictTitle, { color: plainVerdict.color }]}>{plainVerdict.verdict}</Text>
                            <Text style={styles.verdictDetail}>{plainVerdict.detail}</Text>
                        </View>
                    </View>

                    {/* V5: "Why not 100?" - Score blockers */}
                    {scoreBlockers.length > 0 && (
                        <View style={[styles.verdictCard, { backgroundColor: `${colors.chart2}08`, borderColor: `${colors.chart2}20`, flexDirection: 'column', alignItems: 'flex-start' }]}>
                            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.foreground, marginBottom: 8 }}>
                                Why not a perfect score?
                            </Text>
                            {scoreBlockers.map((blocker, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, gap: 6, width: '100%' }}>
                                    <Text style={{ fontSize: 12, color: colors.chart2, marginTop: 1 }}>•</Text>
                                    <Text style={{ fontSize: 12.5, color: colors.mutedForeground, fontFamily: fonts.sans, flex: 1, lineHeight: 17 }}>{blocker}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* V5: Portion Toggle — ABOVE Nutri-Score per client request */}
                    {hasServingSize && (
                        <View style={[styles.portionToggleContainer, { marginTop: 12 }]}>
                            <Pressable
                                style={[styles.portionToggleOption, !showPerServing && styles.portionToggleActive]}
                                onPress={() => { hapticLight(); setShowPerServing(false); }}
                            >
                                <Text style={[styles.portionToggleText, !showPerServing && styles.portionToggleTextActive]}>
                                    Per {baseUnit}
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.portionToggleOption, showPerServing && styles.portionToggleActive]}
                                onPress={() => { hapticLight(); setShowPerServing(true); }}
                            >
                                <Text style={[styles.portionToggleText, showPerServing && styles.portionToggleTextActive]}>
                                    {isDefaultServing ? `~ ${servingSize}${servingUnit} typical` : `Per Serving (${servingSize}${servingUnit})`}
                                </Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Environmental Badge + Analysis Button */}
                    <View style={styles.bottomSection}>
                        <View style={styles.envBadge}>
                            <Leaf size={14} color={colors.mutedForeground} />
                            <Text style={styles.envBadgeText}>Environmental info available</Text>
                        </View>
                        <Pressable
                            style={styles.analysisButton}
                            onPress={() => router.push({ pathname: '/safety-details', params: { productData } })}
                        >
                            <Text style={styles.analysisButtonText}>Detailed Score Analysis</Text>
                        </Pressable>

                        {/* Phase 4: Who should limit this */}
                        {limitationAdvice.length > 0 && (
                            <View style={styles.limitCard}>
                                <View style={styles.limitHeader}>
                                    <AlertTriangle size={16} color={colors.chart3} />
                                    <Text style={styles.limitTitle}>Who should limit this?</Text>
                                </View>
                                <View style={styles.limitList}>
                                    {limitationAdvice.map((item, i) => (
                                        <Text key={i} style={styles.limitItem}>
                                            <Text style={styles.limitGroup}>{item.group}: </Text>
                                            {item.reason}
                                        </Text>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* NOVA Processing Level */}
                        {novaDisplay && (
                            <Pressable
                                style={[styles.novaBadge, { backgroundColor: `${novaDisplay.color}15`, borderColor: novaDisplay.color }]}
                                onPress={() => { hapticMedium(); setShowNovaTooltip(true); }}
                            >
                                {novaDisplay.icon === 'apple' && <Apple size={18} color={novaDisplay.color} />}
                                {novaDisplay.icon === 'chef' && <ChefHat size={18} color={novaDisplay.color} />}
                                {novaDisplay.icon === 'package' && <Package size={18} color={novaDisplay.color} />}
                                {novaDisplay.icon === 'factory' && <Factory size={18} color={novaDisplay.color} />}
                                <View style={styles.novaContent}>
                                    <Text style={[styles.novaLabel, { color: novaDisplay.color }]}>NOVA {safety.novaGroup?.group || product.novaGroup}</Text>
                                    <Text style={styles.novaText}>{novaDisplay.label}</Text>
                                </View>
                                <Info size={14} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
                            </Pressable>
                        )}

                        {/* Consumption Guidance */}
                        {consumptionGuidance && (
                            <View style={[styles.guidanceBadge, { backgroundColor: `${consumptionGuidance.color}10` }]}>
                                <Clock size={16} color={consumptionGuidance.color} />
                                <Text style={[styles.guidanceText, { color: consumptionGuidance.color }]}>{consumptionGuidance.text}</Text>
                            </View>
                        )}



                        {/* Fat Quality Breakdown - Phase 3 */}
                        {fatQuality && (
                            <View style={[styles.fatQualityCard, { backgroundColor: `${fatQuality.color}08`, borderColor: `${fatQuality.color}25` }]}>
                                <View style={styles.fatQualityHeader}>
                                    <Leaf size={20} color={colors.chart1} />
                                    <View style={styles.fatQualityInfo}>
                                        <Text style={[styles.fatQualityLabel, { color: fatQuality.color }]}>{fatQuality.label}</Text>
                                        <Text style={styles.fatQualityTotal}>{showPerServing && servingSize ? `${getPortionValue(fatQuality.totalFat).toFixed(1)}g total fat ${portionLabel}` : `${fatQuality.totalFat}g total fat per 100g`}</Text>
                                    </View>
                                </View>
                                <View style={styles.fatQualityBar}>
                                    <View style={[styles.fatQualityBarSegment, { flex: fatQuality.unsaturatedPercent, backgroundColor: colors.chart1 }]} />
                                    <View style={[styles.fatQualityBarSegment, { flex: fatQuality.saturatedPercent, backgroundColor: colors.chart2 }]} />
                                    {fatQuality.transFat && (
                                        <View style={[styles.fatQualityBarSegment, { flex: 100 - fatQuality.saturatedPercent - fatQuality.unsaturatedPercent, backgroundColor: colors.chart3 }]} />
                                    )}
                                </View>
                                <View style={styles.fatQualityLegend}>
                                    <Text style={styles.fatQualityLegendItem}>
                                        <Text style={{ color: colors.chart1 }}>●</Text> Unsaturated {getPortionValue(fatQuality.unsaturatedFat).toFixed(1)}g {portionLabel}
                                    </Text>
                                    <Text style={styles.fatQualityLegendItem}>
                                        <Text style={{ color: colors.chart2 }}>●</Text> Saturated {getPortionValue(fatQuality.saturatedFat).toFixed(1)}g {portionLabel}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Phase 4: Environmental Impact */}
                {envImpact && (
                    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.envImpactCard}>
                        <View style={styles.envImpactHeader}>
                            <Globe size={20} color={colors.chart1} />
                            <Text style={styles.envImpactTitle}>Environmental Impact</Text>
                            <Pressable onPress={() => setShowEnvTooltip(true)} style={{ marginLeft: 'auto' }}>
                                <Info size={16} color={colors.mutedForeground} />
                            </Pressable>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginHorizontal: -spacing[4] }}
                            contentContainerStyle={styles.envImpactGrid}
                        >
                            {/* Eco-Score */}
                            {envImpact.ecoScore && (
                                <View style={styles.envImpactItem}>
                                    <View style={[styles.ecoScoreBadge, { backgroundColor: `${envImpact.ecoScoreColor}20`, borderColor: envImpact.ecoScoreColor }]}>
                                        <Text style={[styles.ecoScoreLetter, { color: envImpact.ecoScoreColor }]}>
                                            {envImpact.ecoScore || '?'}
                                        </Text>
                                    </View>
                                    <Text style={styles.envImpactLabel}>Eco-Score</Text>
                                    {envImpact.ecoScoreDescription && (
                                        <Text style={styles.envImpactDescription}>{envImpact.ecoScoreDescription}</Text>
                                    )}
                                </View>
                            )}

                            {/* Carbon Footprint */}
                            <View style={styles.envImpactItem}>
                                <View style={[styles.carbonBadge, { backgroundColor: `${envImpact.carbonColor}15` }]}>
                                    <Sprout size={16} color={envImpact.carbonColor} />
                                    <Text style={[styles.carbonText, { color: envImpact.carbonColor }]}>
                                        {envImpact.carbonLevel.charAt(0).toUpperCase() + envImpact.carbonLevel.slice(1)}
                                    </Text>
                                </View>
                                <Text style={styles.envImpactLabel}>Carbon</Text>
                                <Text style={styles.envImpactSubLabel}>{envImpact.carbonEstimate}</Text>
                                {envImpact.carbonDescription && (
                                    <Text style={styles.envImpactDescription}>{envImpact.carbonDescription}</Text>
                                )}
                            </View>

                            {/* Packaging */}
                            <View style={styles.envImpactItem}>
                                <View style={styles.packagingIcons}>
                                    {envImpact.hasPlastic && (
                                        <View style={[styles.packagingBadge, { backgroundColor: `${colors.chart2}15` }]}>
                                            <Package size={14} color={colors.chart2} />
                                        </View>
                                    )}
                                    {envImpact.hasGlass && (
                                        <View style={[styles.packagingBadge, { backgroundColor: `${colors.chart1}15` }]}>
                                            <Package size={14} color={colors.chart1} />
                                        </View>
                                    )}
                                    {envImpact.isRecyclable && (
                                        <View style={[styles.packagingBadge, { backgroundColor: `${colors.chart1}15` }]}>
                                            <Recycle size={14} color={colors.chart1} />
                                        </View>
                                    )}
                                    {!envImpact.hasPlastic && !envImpact.isRecyclable && !envImpact.hasGlass && (
                                        <View style={[styles.packagingBadge, { backgroundColor: `${colors.muted}` }]}>
                                            <Box size={14} color={colors.mutedForeground} />
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.envImpactLabel}>Packaging</Text>
                                <Text style={styles.envImpactSubLabel}>
                                    {envImpact.isRecyclable ? 'Recyclable' :
                                        envImpact.hasGlass ? 'Glass' :
                                            envImpact.hasCardboard ? 'Cardboard' :
                                                envImpact.hasPlastic ? 'Contains plastic' : 'Data not available'}
                                </Text>
                            </View>
                        </ScrollView>

                        {/* V4: Sustainability Labels */}
                        {(envImpact.isOrganic || envImpact.isFairTrade || envImpact.isRainforest) && (
                            <View style={styles.sustainabilityRow}>
                                {envImpact.isOrganic && (
                                    <View style={[styles.sustainBadge, { backgroundColor: '#0381411A', borderColor: '#038141' }]}>
                                        <Leaf size={12} color="#038141" />
                                        <Text style={[styles.sustainBadgeText, { color: '#038141' }]}>Organic</Text>
                                    </View>
                                )}
                                {envImpact.isFairTrade && (
                                    <View style={[styles.sustainBadge, { backgroundColor: '#1565C01A', borderColor: '#1565C0' }]}>
                                        <Award size={12} color="#1565C0" />
                                        <Text style={[styles.sustainBadgeText, { color: '#1565C0' }]}>Fair Trade</Text>
                                    </View>
                                )}
                                {envImpact.isRainforest && (
                                    <View style={[styles.sustainBadge, { backgroundColor: '#2E7D321A', borderColor: '#2E7D32' }]}>
                                        <Sprout size={12} color="#2E7D32" />
                                        <Text style={[styles.sustainBadgeText, { color: '#2E7D32' }]}>Rainforest Alliance</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </Animated.View>
                )}



                {/* V4: Family Overview Card */}
                {selectedMember === 'FAMILY_OVERVIEW' && familyMembers.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.familyOverviewCard}>
                        <View style={styles.familyOverviewHeader}>
                            <Users size={18} color={colors.chart1} />
                            <Text style={styles.familyOverviewTitle}>Family Safety Summary</Text>
                        </View>
                        {/* Main profile */}
                        <View style={styles.familyMemberRow}>
                            <View style={[styles.familyMemberDot, { backgroundColor: safetyConfig.color }]} />
                            <Text style={styles.familyMemberName}>{profile?.full_name || 'You'}</Text>
                            <Text style={styles.familyMemberAge}>{profile?.age_group === 'infant' ? 'Infant' : profile?.age_group === 'child' ? 'Child' : 'Adult'}</Text>
                            <Text style={[styles.familyMemberScore, { color: safetyConfig.color }]}>{Math.round(safety.safeScore || 0)}/100</Text>
                        </View>
                        {/* Family members — recompute safety per member */}
                        {familyMembers.map((member) => {
                            const memberAge = member.age_group;
                            const isInfant = memberAge === 'infant';
                            const isChild = memberAge === 'child';
                            // Compute age in months for this member
                            const memberAgeYears = member.age_years || (isInfant ? 1 : isChild ? 8 : 30);
                            const memberAgeMonths = yearsToMonths(memberAgeYears);
                            // Build member-specific preferences
                            const memberPrefs = {
                                allergies: member.allergies || [],
                                dietaryRestrictions: member.dietary_restrictions || [],
                            };
                            // Re-run full safety analysis for this member
                            const memberSafety = analyzeProductSafety(product, memberAgeMonths, memberPrefs);
                            const memberScore = Math.round(memberSafety.safeScore || 0);
                            const hasConflict = memberSafety.hasPersonalAllergenMatch;
                            const memberColor = memberScore >= 70 ? colors.chart1 : memberScore >= 40 ? colors.chart2 : colors.chart3;
                            return (
                                <View key={member.id} style={styles.familyMemberRow}>
                                    <View style={[styles.familyMemberDot, { backgroundColor: memberColor }]} />
                                    <Text style={styles.familyMemberName}>{member.name}</Text>
                                    <Text style={styles.familyMemberAge}>{isInfant ? 'Infant' : isChild ? 'Child' : 'Adult'}</Text>
                                    <Text style={[styles.familyMemberScore, { color: memberColor }]}>{memberScore}/100</Text>
                                    {hasConflict && <AlertTriangle size={14} color={colors.chart3} />}
                                </View>
                            );
                        })}
                    </Animated.View>
                )}

                {/* Ingredient Breakdown */}
                <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
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
                    {(product.ingredientsText || product.ingredients) && (() => {
                        const ingredientsText = product.ingredientsText || 
                            (Array.isArray(product.ingredients) ? product.ingredients.map(i => i.text || i.id || i).join(', ') : product.ingredients);
                        if (!ingredientsText || ingredientsText.trim() === '') return null;
                        
                        return (
                            <View style={styles.ingredientsListCard}>
                                <Text style={styles.ingredientsListTitle}>Complete Ingredients</Text>
                                <Text style={styles.ingredientsListText}>{ingredientsText}</Text>
                            </View>
                        );
                    })()}

                    {/* AI Ingredient Summary */}
                    {(product.ingredientsText || product.ingredients) && (() => {
                        const ingredientsText = product.ingredientsText || 
                            (Array.isArray(product.ingredients) ? product.ingredients.map(i => i.text || i.id || i).join(', ') : product.ingredients);
                        if (!ingredientsText || ingredientsText.trim() === '') return null;
                        
                        return (
                            <View style={styles.aiSummaryCard}>
                                <Text style={styles.aiSummaryTitle}>AI Ingredient Analysis</Text>
                                <Text style={styles.aiSummaryText}>
                                    {ingredientsText.split(',').length} ingredients detected.
                                    {safety.issues?.length > 0 ? ` ${safety.issues.length} concern(s): ${safety.issues.map(i => i.title).join(', ')}.` : ' No major concerns.'}
                                    {product.allergens?.length > 0 ? ` Contains: ${product.allergens.map(a => a.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}.` : ''}
                                </Text>
                            </View>
                        );
                    })()}

                    {/* Nutri-Score Breakdown - FOOD ONLY */}
                    {!isBeautyProduct && safety.nutriScore && (
                        <View style={styles.nutriScoreCard}>
                            <View style={styles.nutriScoreHeader}>
                                <Text style={styles.nutriScoreTitle}>Nutri-Score Analysis</Text>
                                <View style={[styles.nutriScoreGradeBadge, { backgroundColor: safety.nutriScore.gradeColor }]}>
                                    <Text style={styles.nutriScoreGradeText}>{safety.nutriScore.grade}</Text>
                                </View>
                            </View>

                            {/* V5: "Why [grade]?" explanation */}
                            {nutriScoreExplanation && (
                                <Text style={{ fontSize: 12.5, color: colors.mutedForeground, fontFamily: fonts.sans, marginTop: 4, marginBottom: 8, lineHeight: 17 }}>
                                    Why {safety.nutriScore.grade}? {nutriScoreExplanation}
                                </Text>
                            )}

                            {/* Positives */}
                            <View style={styles.nutriScoreSection}>
                                <Text style={styles.nutriScoreSectionTitle}>Positives</Text>
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
                                                {getPortionValue(safety.nutriScore.breakdown.positives.fiber.value).toFixed(1)}g
                                            </Text>
                                            <Text style={styles.nutriScoreUnit}>{portionLabel}</Text>
                                            <View style={styles.nutriScorePoints}>
                                                <Text style={styles.nutriScorePointsText}>+{safety.nutriScore.breakdown.positives.fiber.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Protein</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {getPortionValue(safety.nutriScore.breakdown.positives.protein.value).toFixed(1)}g
                                            </Text>
                                            <Text style={styles.nutriScoreUnit}>{portionLabel}</Text>
                                            <View style={styles.nutriScorePoints}>
                                                <Text style={styles.nutriScorePointsText}>+{safety.nutriScore.breakdown.positives.protein.points}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>

                            {/* Negatives */}
                            <View style={styles.nutriScoreSection}>
                                <Text style={styles.nutriScoreSectionTitle}>Negatives</Text>
                                {safety.nutriScore.breakdown?.negatives && (
                                    <>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Energy</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {Math.round(getPortionValue(safety.nutriScore.breakdown.negatives.energy.value))}kcal
                                            </Text>
                                            <Text style={styles.nutriScoreUnit}>{portionLabel}</Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.energy.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Sugar</Text>
                                            <View style={styles.nutriScoreBar}>
                                                <View style={[styles.nutriScoreBarFill, {
                                                    width: `${Math.min(100, (getPortionValue(safety.nutriScore.breakdown.negatives.sugars.value) / (showPerServing && servingSize ? 45 * servingSize / 100 : 45)) * 100)}%`,
                                                    backgroundColor: safety.nutriScore.breakdown.negatives.sugars.points > 5 ? colors.destructive : colors.chart2
                                                }]} />
                                            </View>
                                            <Text style={styles.nutriScoreValue}>
                                                {getPortionValue(safety.nutriScore.breakdown.negatives.sugars.value).toFixed(1)}g
                                            </Text>
                                            <Text style={styles.nutriScoreUnit}>{portionLabel}</Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.sugars.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Saturated Fat</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {getPortionValue(safety.nutriScore.breakdown.negatives.saturates.value).toFixed(1)}g
                                            </Text>
                                            <Text style={styles.nutriScoreUnit}>{portionLabel}</Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.saturates.points}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.nutriScoreRow}>
                                            <Text style={styles.nutriScoreLabel}>Sodium</Text>
                                            <Text style={styles.nutriScoreValue}>
                                                {Math.round(getPortionValue(safety.nutriScore.breakdown.negatives.sodium.value))}mg
                                            </Text>
                                            <Text style={styles.nutriScoreUnit}>{portionLabel}</Text>
                                            <View style={[styles.nutriScorePoints, styles.nutriScorePointsNegative]}>
                                                <Text style={styles.nutriScorePointsText}>-{safety.nutriScore.breakdown.negatives.sodium.points}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    {/* V4: Who Should Limit This? */}
                    {!isBeautyProduct && (() => {
                        const warnings = [];
                        const n = product.nutriments || {};
                        // High sodium (n.sodium is in grams per 100g; 0.4g = 400mg)
                        if ((n.sodium || 0) > 0.4 || (n.salt || 0) > 1) {
                            const sodiumMg = Math.round(getPortionValue((n.sodium || (n.salt || 0) * 0.4) * 1000));
                            warnings.push({ icon: '🧂', text: 'People with high blood pressure (sodium)', detail: `${sodiumMg}mg sodium ${portionLabel}` });
                        }
                        // High sugar
                        if ((n.sugars || 0) > 12.5) {
                            const sugarVal = getPortionValue(n.sugars).toFixed(1);
                            warnings.push({ icon: '🍬', text: 'People managing diabetes or blood sugar', detail: `${sugarVal}g sugar ${portionLabel}` });
                        }
                        // High calories
                        if ((n.energy_kcal || n['energy-kcal'] || 0) > 400) {
                            const kcalVal = Math.round(getPortionValue(n.energy_kcal || n['energy-kcal']));
                            warnings.push({ icon: '🔥', text: 'People on low-calorie diets', detail: `${kcalVal} kcal ${portionLabel}` });
                        }
                        // High saturated fat
                        if ((n['saturated-fat'] || n.saturated_fat || 0) > 5) {
                            const satFatVal = getPortionValue(n['saturated-fat'] || n.saturated_fat).toFixed(1);
                            warnings.push({ icon: '🫀', text: 'People watching cholesterol levels', detail: `${satFatVal}g sat. fat ${portionLabel}` });
                        }
                        // Ultra-processed
                        if ((product.nova_group || product.novaGroup) >= 4) {
                            warnings.push({ icon: '🏭', text: 'People avoiding ultra-processed foods (NOVA 4)', detail: 'Frequent consumption not recommended' });
                        }
                        // High frequency concern
                        if (warnings.length >= 2) {
                            warnings.push({ icon: '📅', text: 'Not recommended for daily consumption', detail: 'Multiple nutritional concerns' });
                        }
                        if (warnings.length === 0) return null;
                        return (
                            <View style={styles.limitCard}>
                                <View style={styles.limitHeader}>
                                    <AlertTriangle size={18} color={colors.chart2} />
                                    <Text style={styles.limitTitle}>Who Should Limit This</Text>
                                </View>
                                {warnings.map((w, i) => (
                                    <View key={i} style={styles.limitRow}>
                                        <Text style={styles.limitEmoji}>{w.icon}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.limitText}>{w.text}</Text>
                                            <Text style={styles.limitDetail}>{w.detail}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        );
                    })()}

                    {/* Beauty Safety Analysis - BEAUTY ONLY (replaces Nutri-Score) */}
                    {isBeautyProduct && beautySafety && (
                        <View style={styles.nutriScoreCard}>
                            <View style={styles.nutriScoreHeader}>
                                <Text style={styles.nutriScoreTitle}>Safety Analysis</Text>
                                <View style={[styles.nutriScoreGradeBadge, { backgroundColor: safetyConfig.color }]}>
                                    <Text style={styles.nutriScoreGradeText}>{Math.round(safety.safeScore || 0)}</Text>
                                </View>
                            </View>

                            {/* Ingredient Safety */}
                            <View style={styles.beautySafetyRow}>
                                <View style={styles.beautySafetyLabel}>
                                    <Shield size={16} color={colors.chart1} />
                                    <Text style={styles.beautySafetyText}>Ingredient Safety</Text>
                                </View>
                                <View style={styles.beautySafetyBar}>
                                    <View style={[styles.beautySafetyBarFill, {
                                        width: `${beautySafety.ingredientSafety}%`,
                                        backgroundColor: beautySafety.ingredientSafety >= 70 ? colors.chart1 : beautySafety.ingredientSafety >= 50 ? colors.chart2 : colors.chart3
                                    }]} />
                                </View>
                                <Text style={styles.beautySafetyValue}>{beautySafety.ingredientSafety}/100</Text>
                            </View>

                            {/* Allergen Risk */}
                            <View style={styles.beautySafetyRow}>
                                <View style={styles.beautySafetyLabel}>
                                    <AlertCircle size={16} color={beautySafety.allergenRiskColor} />
                                    <Text style={styles.beautySafetyText}>Allergen Risk</Text>
                                </View>
                                <View style={[styles.beautySafetyBadge, { backgroundColor: `${beautySafety.allergenRiskColor}15` }]}>
                                    <Text style={[styles.beautySafetyBadgeText, { color: beautySafety.allergenRiskColor }]}>
                                        {beautySafety.allergenRisk}
                                    </Text>
                                </View>
                            </View>

                            {/* Clinical Evidence */}
                            <View style={styles.beautySafetyRow}>
                                <View style={styles.beautySafetyLabel}>
                                    <BarChart3 size={16} color={colors.primary} />
                                    <Text style={styles.beautySafetyText}>Clinical Evidence</Text>
                                </View>
                                <Text style={styles.beautySafetyValue}>{beautySafety.clinicalScore}/{beautySafety.ingredientCount} studied</Text>
                            </View>
                            <Text style={{ fontSize: 11, color: colors.mutedForeground, opacity: 0.7, fontFamily: fonts.sans, marginLeft: 32, marginTop: -4, marginBottom: 8, lineHeight: 15 }}>
                                Reflects availability of long-term studies — not evidence of harm. Most cosmetic products fall in this range.
                            </Text>
                            {/* Regulatory Status */}
                            <View style={styles.beautySafetyRow}>
                                <View style={styles.beautySafetyLabel}>
                                    <Globe size={16} color={colors.chart1} />
                                    <Text style={styles.beautySafetyText}>Regulatory Status</Text>
                                </View>
                                <View style={[styles.beautySafetyBadge, { backgroundColor: `${colors.chart1}15` }]}>
                                    <Text style={[styles.beautySafetyBadgeText, { color: colors.chart1 }]}>
                                        {beautySafety.regulatoryStatus}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* V6: Sources & Methodology */}
                <AnimatedPressable
                    style={styles.sourcesCard}
                    onPress={() => { hapticLight(); setShowSources(!showSources); }}
                >
                    <View style={styles.sourcesHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Award size={18} color={colors.chart1} />
                            <Text style={styles.sourcesTitle}>Sources & Methodology</Text>
                        </View>
                        <ChevronDown
                            size={18}
                            color={colors.mutedForeground}
                            style={{ transform: [{ rotate: showSources ? '180deg' : '0deg' }] }}
                        />
                    </View>
                    {showSources && (
                        <View style={styles.sourcesContent}>
                            <View style={styles.sourceItem}>
                                <Text style={styles.sourceLabel}>Product Data</Text>
                                <Text style={styles.sourceValue}>Open Food Facts (openfoodfacts.org) — open-source, crowd-sourced database with 3M+ products</Text>
                            </View>
                            <View style={styles.sourceItem}>
                                <Text style={styles.sourceLabel}>Nutritional Scoring</Text>
                                <Text style={styles.sourceValue}>EU Nutri-Score algorithm (Santé Publique France) — scientifically validated A–E grading system</Text>
                            </View>
                            <View style={styles.sourceItem}>
                                <Text style={styles.sourceLabel}>Processing Level</Text>
                                <Text style={styles.sourceValue}>NOVA classification (Monteiro et al.) — University of São Paulo framework for food processing</Text>
                            </View>
                            <View style={styles.sourceItem}>
                                <Text style={styles.sourceLabel}>Environmental Impact</Text>
                                <Text style={styles.sourceValue}>Eco-Score (Agribalyse/ADEME) — lifecycle environmental impact assessment</Text>
                            </View>
                            <View style={styles.sourceItem}>
                                <Text style={styles.sourceLabel}>Safety Analysis</Text>
                                <Text style={styles.sourceValue}>GoodFor's proprietary engine combining age-based safety rules, allergen matching, dietary restriction checking, and additive risk assessment against WHO/EU guidelines</Text>
                            </View>
                            <View style={[styles.sourceItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                                <Text style={styles.sourceLabel}>Score Calculation</Text>
                                <Text style={styles.sourceValue}>Base score from Nutri-Score, with personalised adjustments for allergens, dietary restrictions, health conditions, processing level, and environmental impact</Text>
                            </View>
                        </View>
                    )}
                </AnimatedPressable>

                {/* Save Button */}
                <AnimatedPressable
                    style={[styles.saveButton, isFavorite && styles.saveButtonActive]}
                    onPress={handleSaveToFavorites}
                >
                    <Heart size={20} color={isFavorite ? '#fff' : colors.primaryForeground} fill={isFavorite ? '#fff' : 'none'} />
                    <Text style={styles.saveButtonText}>
                        {isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
                    </Text>
                </AnimatedPressable>

                {/* V7: Add to Basket / Replace in Basket Button */}
                <AnimatedPressable
                    style={styles.basketButton}
                    onPress={async () => {
                        hapticMedium();
                        try {
                            if (!user?.id) {
                                showAlert('Sign In Required', 'Please sign in to use the Smart Basket feature.');
                                return;
                            }
                            const productPayload = {
                                barcode: product?.code || product?.barcode || '',
                                name: product?.product_name || product?.name || 'Unknown',
                                brand: product?.brands || product?.brand || '',
                                imageUrl: product?.image_url || null,
                                safetyScore: safety?.adjustedScore ?? safety?.safeScore ?? 0,
                                safetyLevel: safety?.safety || 'SAFE',
                            };

                            if (replaceItemId && replaceBasketId) {
                                // Replace flow: swap old item for this one
                                await replaceBasketItem(replaceItemId, replaceBasketId, productPayload);
                                hapticSuccess();
                                showAlert('Replaced! ✨', 'Product has been swapped in your basket.', [
                                    { text: 'View Basket', onPress: () => router.push('/basket') },
                                    { text: 'OK' },
                                ]);
                            } else {
                                // Normal add flow
                                const basket = await getOrCreateTodayBasket(user.id);
                                await addProductToBasket(basket.id, productPayload);
                                hapticSuccess();
                                showAlert('Added to Basket! 🛒', 'Product added to your Smart Basket.', [
                                    { text: 'View Basket', onPress: () => router.push('/basket') },
                                    { text: 'OK' },
                                ]);
                            }
                        } catch (e) {
                            console.error('[Basket] Add/Replace error:', e?.message || e);
                            showAlert('Error', e?.message || 'Could not update basket');
                        }
                    }}
                >
                    <ShoppingCart size={20} color={colors.primary} />
                    <Text style={styles.basketButtonText}>
                        {replaceItemId ? 'Replace in Basket' : 'Add to Basket'}
                    </Text>
                </AnimatedPressable>

                {/* Alternatives Link */}
                <Pressable
                    style={styles.alternativesLink}
                    onPress={() => router.push({ pathname: '/alternatives', params: { productData } })}
                >
                    <Text style={styles.alternativesText}>View safer alternatives →</Text>
                </Pressable>
            </ScrollView>

            {/* V4: Floating Ask AI Button */}
            <Pressable
                style={[styles.floatingAiButton, { bottom: insets.bottom + 20 }]}
                onPress={() => {
                    hapticMedium();
                    // Build rich product context for AI
                    const productContext = {
                        name: product.name || product.product_name || 'Unknown Product',
                        brand: product.brand || '',
                        imageUrl: product.imageUrl || product.image_url || null,
                        barcode: product.barcode || product.code || '',
                        category: product.category || '',
                        ingredientsText: product.ingredientsText || '',
                        allergens: product.allergens || [],
                        additives: product.additives || [],
                        safetyScore: Math.round(safety.safeScore || 0),
                        safetyLevel: safety.safety || 'SAFE',
                        issues: (safety.issues || []).map(i => typeof i === 'string' ? i : i.label || i.text || String(i)),
                        isBeautyProduct: !!isBeautyProduct,
                        // Food-specific fields
                        nutriGrade: isBeautyProduct ? null : (safety.nutriScore?.grade || null),
                        novaGroup: isBeautyProduct ? null : (product.novaGroup || product.nova_group || null),
                        nutritionPer100g: isBeautyProduct ? null : (product.nutritionPer100g || null),
                        // Beauty-specific fields
                        pillarScores: isBeautyProduct ? {
                            toxicity: safety.pillarScores?.toxicity ?? null,
                            sensitization: safety.pillarScores?.sensitization ?? null,
                            endocrine: safety.pillarScores?.endocrine ?? null,
                            environment: safety.pillarScores?.environment ?? null,
                        } : null,
                    };
                    router.push({
                        pathname: '/ai-chat',
                        params: { productContext: JSON.stringify(productContext) }
                    });
                }}
            >
                <Sparkles size={20} color={colors.primaryForeground} />
                <Text style={styles.floatingAiButtonText}>Ask Lumi</Text>
            </Pressable>

            {/* Modals */}
            {/* Nutri-Score Info — Bottom Sheet */}
            <Modal visible={showNutriScoreInfo} animationType="slide" transparent={true} onRequestClose={() => setShowNutriScoreInfo(false)}>
                <View style={styles.modalOverlay}>
                    {/* Tap the empty space above the card to dismiss */}
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowNutriScoreInfo(false)} />

                    {/* Card — NOT inside any touchable, so ScrollView works on Android + iOS */}
                    <View style={[styles.profilePickerModal, { paddingBottom: 40, maxHeight: '85%' }]}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[4] }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 20, fontFamily: fonts.heading, color: colors.foreground }}>Nutri-Score</Text>
                                <Text style={{ fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={1}>
                                    {product.name || 'This product'}
                                </Text>
                            </View>
                            <Pressable onPress={() => setShowNutriScoreInfo(false)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                                <X size={18} color={colors.mutedForeground} />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={true} bounces={true} nestedScrollEnabled={true}>
                            {/* A–E Scale */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[5], paddingHorizontal: spacing[1] }}>
                                {[
                                    { g: 'A', c: '#038141', l: 'Excellent' },
                                    { g: 'B', c: '#85BB2F', l: 'Good' },
                                    { g: 'C', c: '#FECB02', l: 'Average' },
                                    { g: 'D', c: '#EE8100', l: 'Poor' },
                                    { g: 'E', c: '#E63E11', l: 'Very Poor' },
                                ].map(item => {
                                    const active = item.g === nutriScoreInfo.grade;
                                    return (
                                        <View key={item.g} style={{ alignItems: 'center', opacity: active ? 1 : 0.4 }}>
                                            <View style={{
                                                width: active ? 44 : 36, height: active ? 44 : 36,
                                                borderRadius: active ? 22 : 18,
                                                backgroundColor: item.c,
                                                alignItems: 'center', justifyContent: 'center',
                                                ...(active ? { shadowColor: item.c, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 } : {}),
                                            }}>
                                                <Text style={{ color: '#fff', fontSize: active ? 20 : 16, fontFamily: fonts.heading }}>{item.g}</Text>
                                            </View>
                                            {active && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.c, marginTop: 6 }} />}
                                            <Text style={{ fontSize: 10, fontFamily: active ? fonts.sansBold : fonts.sans, color: active ? item.c : colors.mutedForeground, marginTop: active ? 4 : 6 }}>
                                                {item.l}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* What this grade means */}
                            <View style={{ backgroundColor: `${nutriScoreInfo.color}10`, borderRadius: radius.lg, padding: spacing[4], marginBottom: spacing[4], borderLeftWidth: 3, borderLeftColor: nutriScoreInfo.color }}>
                                <Text style={{ fontSize: 15, fontFamily: fonts.sansBold, color: colors.foreground, marginBottom: 4 }}>
                                    Grade {nutriScoreInfo.grade} — {
                                        { A: 'Excellent nutritional quality', B: 'Good nutritional quality', C: 'Average nutritional quality', D: 'Poor nutritional quality', E: 'Very poor nutritional quality' }[nutriScoreInfo.grade] || 'Unknown'
                                    }
                                </Text>
                                <Text style={{ fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground, lineHeight: 19 }}>
                                    {
                                        {
                                            A: 'This product is rich in beneficial nutrients like fiber, protein and vitamins, while being low in sugar, salt and calories.',
                                            B: 'A solid choice with good nutritional balance and moderate amounts of nutrients to limit.',
                                            C: 'Average nutritional profile. Contains moderate calories, sugars or saturated fats — balance with healthier options.',
                                            D: 'This product is high in nutrients that should be limited such as sugar, saturated fat or sodium. Consider healthier alternatives.',
                                            E: 'Very high in calories, sugars, saturated fats or sodium and low in beneficial nutrients. Limit consumption.',
                                        }[nutriScoreInfo.grade] || ''
                                    }
                                </Text>
                            </View>

                            {/* Score Breakdown — what contributes to this score */}
                            {safety.nutriScore?.breakdown && (
                                <View style={{ marginBottom: spacing[4] }}>
                                    <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.mutedForeground, letterSpacing: 0.8, marginBottom: spacing[3], textTransform: 'uppercase' }}>
                                        What affects this score
                                    </Text>

                                    <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing[4], borderWidth: 1, borderColor: colors.border }}>
                                        {/* Negative factors */}
                                        {safety.nutriScore.breakdown.negatives && (
                                            <>
                                                <Text style={{ fontSize: 13, fontFamily: fonts.sansBold, color: colors.chart3, marginBottom: spacing[2] }}>Nutrients to limit</Text>
                                                {Object.entries(safety.nutriScore.breakdown.negatives).map(([key, val]) => (
                                                    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: spacing[2] }}>
                                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: val.points >= 6 ? colors.chart3 : val.points > 0 ? colors.chart2 : colors.chart1 }} />
                                                        <Text style={{ flex: 1, fontSize: 13, fontFamily: fonts.sansMedium, color: colors.foreground }}>
                                                            {key === 'saturates' ? 'Saturated fat' : key === 'sodium' ? 'Sodium' : key.charAt(0).toUpperCase() + key.slice(1)}
                                                        </Text>
                                                        <Text style={{ fontSize: 12, fontFamily: fonts.sans, color: colors.mutedForeground, width: 55, textAlign: 'right' }}>
                                                            {val.value}{val.unit || ''}
                                                        </Text>
                                                        <View style={{ width: 50, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                                                            <View style={{ height: '100%', borderRadius: 2, backgroundColor: val.points >= 6 ? colors.chart3 : val.points > 0 ? colors.chart2 : colors.chart1, width: `${Math.min(100, (val.points / (val.max || 10)) * 100)}%` }} />
                                                        </View>
                                                        <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: val.points >= 6 ? colors.chart3 : colors.chart4, width: 28, textAlign: 'right' }}>
                                                            {val.points}/{val.max}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </>
                                        )}

                                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing[3] }} />

                                        {/* Positive factors */}
                                        {safety.nutriScore.breakdown.positives && (
                                            <>
                                                <Text style={{ fontSize: 13, fontFamily: fonts.sansBold, color: colors.chart1, marginBottom: spacing[2] }}>Beneficial nutrients</Text>
                                                {Object.entries(safety.nutriScore.breakdown.positives).map(([key, val]) => (
                                                    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: spacing[2] }}>
                                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: val.points > 0 ? colors.chart1 : colors.border }} />
                                                        <Text style={{ flex: 1, fontSize: 13, fontFamily: fonts.sansMedium, color: colors.foreground }}>
                                                            {key === 'fruitVeg' ? 'Fruit & vegetables' : key.charAt(0).toUpperCase() + key.slice(1)}
                                                        </Text>
                                                        <Text style={{ fontSize: 12, fontFamily: fonts.sans, color: colors.mutedForeground, width: 55, textAlign: 'right' }}>
                                                            {typeof val.value === 'number' ? (val.unit === '%' ? `${val.value}%` : `${val.value.toFixed(1)}${val.unit || 'g'}`) : val.value}
                                                        </Text>
                                                        <View style={{ width: 50, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                                                            <View style={{ height: '100%', borderRadius: 2, backgroundColor: val.points > 0 ? colors.chart1 : colors.border, width: `${Math.min(100, (val.points / (val.max || 5)) * 100)}%` }} />
                                                        </View>
                                                        <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: val.points > 0 ? colors.chart1 : colors.chart4, width: 28, textAlign: 'right' }}>
                                                            {val.points}/{val.max}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* About Nutri-Score */}
                            <View style={{ backgroundColor: `${colors.primary}08`, borderRadius: radius.lg, padding: spacing[4], marginBottom: spacing[4], borderWidth: 1, borderColor: `${colors.primary}12` }}>
                                <Text style={{ fontSize: 13, fontFamily: fonts.sansBold, color: colors.primary, marginBottom: spacing[1] }}>About Nutri-Score</Text>
                                <Text style={{ fontSize: 12, fontFamily: fonts.sans, color: colors.mutedForeground, lineHeight: 18 }}>
                                    Nutri-Score is developed by Santé Publique France and adopted across the EU. It calculates a score based on nutrients per 100g — negative points for energy, sugars, saturated fats and sodium are subtracted, then positive points for fiber, protein and fruit/vegetable content are added. The final score determines the A-to-E grade.
                                </Text>
                            </View>

                            {/* Got it button */}
                            <Pressable
                                style={{ backgroundColor: colors.primary, paddingVertical: spacing[3], borderRadius: radius.xl, alignItems: 'center', marginBottom: spacing[2] }}
                                onPress={() => setShowNutriScoreInfo(false)}
                            >
                                <Text style={{ fontSize: 16, fontFamily: fonts.sansBold, color: colors.primaryForeground }}>Got it</Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <IngredientDetailModal
                visible={showIngredientDetail}
                onClose={() => {
                    setShowIngredientDetail(false);
                    setSelectedIngredient(null);
                }}
                ingredientCode={selectedIngredient}
            />

            {/* V4: NOVA Tooltip Modal */}
            <Modal visible={showNovaTooltip} animationType="fade" transparent={true}>
                <Pressable style={styles.tooltipOverlay} onPress={() => setShowNovaTooltip(false)}>
                    <View style={styles.tooltipCard}>
                        <Text style={styles.tooltipTitle}>NOVA Food Classification</Text>
                        <Text style={styles.tooltipDesc}>NOVA classifies foods into 4 groups based on processing level:</Text>
                        <View style={styles.tooltipList}>
                            <View style={styles.tooltipItem}>
                                <View style={[styles.tooltipDot, { backgroundColor: colors.chart1 }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tooltipItemTitle}>Group 1 – Unprocessed</Text>
                                    <Text style={styles.tooltipItemDesc}>Fresh fruits, vegetables, eggs, milk, meat</Text>
                                </View>
                            </View>
                            <View style={styles.tooltipItem}>
                                <View style={[styles.tooltipDot, { backgroundColor: '#8BC34A' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tooltipItemTitle}>Group 2 – Culinary Ingredients</Text>
                                    <Text style={styles.tooltipItemDesc}>Oils, butter, sugar, salt used in cooking</Text>
                                </View>
                            </View>
                            <View style={styles.tooltipItem}>
                                <View style={[styles.tooltipDot, { backgroundColor: colors.chart2 }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tooltipItemTitle}>Group 3 – Processed</Text>
                                    <Text style={styles.tooltipItemDesc}>Canned foods, cheese, bread, cured meats</Text>
                                </View>
                            </View>
                            <View style={styles.tooltipItem}>
                                <View style={[styles.tooltipDot, { backgroundColor: colors.chart3 }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tooltipItemTitle}>Group 4 – Ultra-processed</Text>
                                    <Text style={styles.tooltipItemDesc}>Soft drinks, packaged snacks, instant noodles</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.tooltipFooter}>Lower groups are generally healthier choices.</Text>
                        <Pressable style={styles.tooltipClose} onPress={() => setShowNovaTooltip(false)}>
                            <Text style={styles.tooltipCloseText}>Got it</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {/* V4: Environmental Impact Tooltip Modal */}
            <Modal visible={showEnvTooltip} animationType="fade" transparent={true}>
                <Pressable style={styles.tooltipOverlay} onPress={() => setShowEnvTooltip(false)}>
                    <View style={styles.tooltipCard}>
                        <Text style={styles.tooltipTitle}>Environmental Impact</Text>
                        <Text style={styles.tooltipDesc}>
                            Environmental impact is assessed separately from health safety. A product can be perfectly safe for you but have a higher environmental footprint.
                        </Text>
                        <View style={styles.tooltipList}>
                            <View style={styles.tooltipItem}>
                                <Globe size={16} color={colors.chart1} />
                                <Text style={[styles.tooltipItemDesc, { flex: 1 }]}>Eco-Score rates overall environmental impact (A = best, E = worst)</Text>
                            </View>
                            <View style={styles.tooltipItem}>
                                <Sprout size={16} color={colors.chart2} />
                                <Text style={[styles.tooltipItemDesc, { flex: 1 }]}>Carbon footprint estimates CO₂ per kg of product</Text>
                            </View>
                            <View style={styles.tooltipItem}>
                                <Recycle size={16} color={colors.chart1} />
                                <Text style={[styles.tooltipItemDesc, { flex: 1 }]}>Packaging info shows recyclability and plastic usage</Text>
                            </View>
                        </View>
                        <Pressable style={styles.tooltipClose} onPress={() => setShowEnvTooltip(false)}>
                            <Text style={styles.tooltipCloseText}>Got it</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {/* Phase 4: Profile Picker Modal */}
            <Modal
                visible={showProfilePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProfilePicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowProfilePicker(false)}
                >
                    <View style={[styles.profilePickerModal, { maxHeight: '80%' }]}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                            <Text style={styles.profilePickerTitle}>View Safety For</Text>

                            {/* Main Profile */}
                            <Pressable
                                style={[styles.profilePickerOption, !selectedMember && styles.profilePickerOptionActive]}
                                onPress={() => {
                                    setSelectedMember(null);
                                    setShowProfilePicker(false);
                                }}
                            >
                                <View style={[styles.profilePickerAvatar, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.avatarText}>{profile?.full_name?.[0] || 'Y'}</Text>
                                </View>
                                <View style={styles.profilePickerInfo}>
                                    <Text style={styles.profilePickerName}>{profile?.full_name || 'You'}</Text>
                                    <Text style={styles.profilePickerMeta}>Main Profile</Text>
                                </View>
                                {!selectedMember && (
                                    <CheckCircle size={20} color={colors.primary} />
                                )}
                            </Pressable>

                            {/* Family Members */}
                            {familyMembers.map((member) => (
                                <Pressable
                                    key={member.id}
                                    style={[styles.profilePickerOption, selectedMember?.id === member.id && styles.profilePickerOptionActive]}
                                    onPress={() => {
                                        setSelectedMember(member);
                                        setShowProfilePicker(false);
                                    }}
                                >
                                    <View style={[styles.profilePickerAvatar, { backgroundColor: colors.accent }]}>
                                        <Text style={styles.avatarText}>{member.name?.[0] || '?'}</Text>
                                    </View>
                                    <View style={styles.profilePickerInfo}>
                                        <Text style={styles.profilePickerName}>{member.name}</Text>
                                        <Text style={styles.profilePickerMeta}>
                                            {member.age_group === 'infant' ? 'Infant (0-2)' : member.age_group === 'child' ? 'Child (3-12)' : 'Adult'}
                                        </Text>
                                    </View>
                                    {selectedMember?.id === member.id && (
                                        <CheckCircle size={20} color={colors.primary} />
                                    )}
                                </Pressable>
                            ))}

                            {/* V4: Family Overview Option */}
                            {familyMembers.length > 0 && (
                                <>
                                    <View style={{ height: 1, backgroundColor: `${colors.border}60`, marginVertical: spacing[2] }} />
                                    <Pressable
                                        style={[styles.profilePickerOption, selectedMember === 'FAMILY_OVERVIEW' && styles.profilePickerOptionActive]}
                                        onPress={() => {
                                            setSelectedMember('FAMILY_OVERVIEW');
                                            setShowProfilePicker(false);
                                        }}
                                    >
                                        <View style={[styles.profilePickerAvatar, { backgroundColor: colors.chart1 }]}>
                                            <Users size={18} color={colors.primaryForeground} />
                                        </View>
                                        <View style={styles.profilePickerInfo}>
                                            <Text style={styles.profilePickerName}>Family Overview</Text>
                                            <Text style={styles.profilePickerMeta}>Safety for all members</Text>
                                        </View>
                                        {selectedMember === 'FAMILY_OVERVIEW' && (
                                            <CheckCircle size={20} color={colors.primary} />
                                        )}
                                    </Pressable>
                                </>
                            )}

                            {familyMembers.length === 0 && (
                                <View style={styles.noFamilyMembers}>
                                    <Users size={32} color={colors.mutedForeground} />
                                    <Text style={styles.noFamilyText}>No family members added yet</Text>
                                    <Pressable
                                        style={styles.addFamilyButton}
                                        onPress={() => {
                                            setShowProfilePicker(false);
                                            router.push('/family-members');
                                        }}
                                    >
                                        <Text style={styles.addFamilyButtonText}>Add Family Member</Text>
                                    </Pressable>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    blurLeft: { position: 'absolute', top: '25%', left: -128, width: 256, height: 256, backgroundColor: colors.chart1, opacity: 0.05, borderRadius: 128 },
    blurRight: { position: 'absolute', bottom: '25%', right: -96, width: 192, height: 192, backgroundColor: colors.accent, opacity: 0.3, borderRadius: 96 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[6], paddingBottom: spacing[4], zIndex: 20 },
    headerButtonShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
    headerButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    blurContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
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
    basketButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4], borderRadius: radius['2xl'], borderWidth: 2, borderColor: colors.primary, marginTop: spacing[3] },
    basketButtonText: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.primary },
    alternativesLink: { alignItems: 'center', paddingVertical: spacing[4] },
    alternativesText: { fontSize: 14, fontFamily: fonts.sans.semiBold, color: colors.primary },
    // V6: Sources & Methodology
    sourcesCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: `${colors.chart1}25`,
        padding: spacing[4],
        marginBottom: spacing[4],
    },
    sourcesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sourcesTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.semiBold,
        color: colors.foreground,
    },
    sourcesContent: {
        marginTop: spacing[4],
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}50`,
    },
    sourceItem: {
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}30`,
    },
    sourceLabel: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.chart1,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sourceValue: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    // Beauty Safety Analysis Styles
    beautySafetyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}40`,
    },
    beautySafetyLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        flex: 1,
    },
    beautySafetyText: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    beautySafetyBar: {
        flex: 1,
        height: 6,
        backgroundColor: `${colors.border}40`,
        borderRadius: 3,
        marginHorizontal: spacing[3],
        overflow: 'hidden',
    },
    beautySafetyBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    beautySafetyValue: {
        fontSize: 13,
        fontFamily: fonts.sans.semiBold,
        color: colors.mutedForeground,
        minWidth: 70,
        textAlign: 'right',
    },
    beautySafetyBadge: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius.full,
    },
    beautySafetyBadgeText: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
    },
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
    nutriScoreUnit: {
        fontSize: 10,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        minWidth: 55,
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
    // NOVA Processing Level styles
    novaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[3],
        borderRadius: radius.xl,
        borderWidth: 1,
        marginTop: spacing[3],
        gap: spacing[3],
    },
    novaEmoji: {
        fontSize: 24,
    },
    novaContent: {
        flex: 1,
    },
    novaLabel: {
        fontSize: 13,
        fontFamily: fonts.sans.bold,
    },
    novaText: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    // Consumption Guidance styles
    guidanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[3],
        borderRadius: radius.xl,
        marginTop: spacing[2],
        gap: spacing[2],
    },
    guidanceEmoji: {
        fontSize: 16,
    },
    guidanceText: {
        fontSize: 13,
        fontFamily: fonts.sans.medium,
    },
    // Plain-English Verdict styles
    verdictCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: radius.xl,
        borderWidth: 1,
        marginTop: spacing[4],
        gap: spacing[3],
    },
    verdictEmoji: {
        fontSize: 28,
    },
    verdictContent: {
        flex: 1,
    },
    verdictTitle: {
        fontSize: 15,
        fontFamily: fonts.sans.bold,
        marginBottom: 2,
    },
    verdictDetail: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 16,
    },
    // Fat Quality Breakdown styles
    fatQualityCard: {
        padding: spacing[4],
        borderRadius: radius.xl,
        borderWidth: 1,
        marginTop: spacing[3],
    },
    fatQualityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginBottom: spacing[3],
    },
    fatQualityEmoji: {
        fontSize: 24,
    },
    fatQualityInfo: {
        flex: 1,
    },
    fatQualityLabel: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
    },
    fatQualityTotal: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    fatQualityBar: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: spacing[2],
    },
    fatQualityBarSegment: {
        height: '100%',
    },
    fatQualityLegend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    fatQualityLegendItem: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    // Phase 4: Profile Switcher styles
    profileSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[3],
        marginTop: spacing[4],
        borderWidth: 1,
        borderColor: colors.border,
    },
    profileSwitcherLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    profileSwitcherLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    profileSwitcherName: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    profileSwitcherAge: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    switcherChevron: {
        padding: spacing[1],
    },
    // Profile Picker Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    profilePickerModal: {
        backgroundColor: colors.card,
        borderTopLeftRadius: radius['2xl'],
        borderTopRightRadius: radius['2xl'],
        padding: spacing[6],
        paddingBottom: spacing[8],
    },
    profilePickerTitle: {
        fontSize: 18,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    profilePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: radius.xl,
        marginBottom: spacing[2],
        backgroundColor: colors.muted,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: spacing[3],
    },
    profilePickerOptionActive: {
        backgroundColor: `${colors.primary}10`,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarText: {
        fontSize: 18,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    profilePickerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilePickerInfo: {
        flex: 1,
    },
    profilePickerName: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    profilePickerMeta: { fontSize: 12, fontFamily: fonts.mono, color: colors.mutedForeground },
    noFamilyMembers: { alignItems: 'center', justifyContent: 'center', padding: spacing[8] },
    noFamilyText: { fontSize: 16, fontFamily: fonts.sans.medium, color: colors.mutedForeground, marginVertical: spacing[4] },
    addFamilyButton: { paddingHorizontal: spacing[6], paddingVertical: spacing[3], backgroundColor: colors.primary, borderRadius: radius.full },
    addFamilyButtonText: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.primaryForeground },

    // Limit Card
    limitCard: { marginTop: spacing[4], backgroundColor: '#FEF2F2', padding: spacing[4], borderRadius: radius.xl, borderWidth: 1, borderColor: '#FECACA' },
    limitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
    limitTitle: { fontSize: 14, fontFamily: fonts.sans.bold, color: '#991B1B' },
    limitList: { gap: spacing[1] },
    limitItem: { fontSize: 13, fontFamily: fonts.sans.regular, color: '#7F1D1D' },
    limitGroup: { fontFamily: fonts.sans.bold },
    // Phase 4: Portion Toggle styles
    portionToggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.muted,
        borderRadius: radius.full,
        padding: spacing[1],
        marginTop: spacing[3],
    },
    portionToggleOption: {
        flex: 1,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
        borderRadius: radius.full,
        alignItems: 'center',
    },
    portionToggleActive: {
        backgroundColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    portionToggleText: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    portionToggleTextActive: {
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    // Phase 4: Environmental Impact styles
    envImpactCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[4],
        marginTop: spacing[4],
        borderWidth: 1,
        borderColor: colors.border,
    },
    envImpactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    envImpactEmoji: {
        fontSize: 20,
    },
    envImpactTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    envImpactGrid: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[6],
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[2], // Space for shadow clipping
    },
    envImpactItem: {
        alignItems: 'center',
        gap: spacing[1],
    },
    ecoScoreBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    ecoScoreLetter: {
        fontSize: 20,
        fontFamily: fonts.sans.bold,
    },
    carbonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radius.full,
        gap: spacing[1],
    },
    carbonIcon: {
        fontSize: 14,
    },
    carbonText: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
    },
    envImpactLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    envImpactSubLabel: {
        fontSize: 10,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    envImpactDescription: {
        fontSize: 9,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 2,
        textAlign: 'center',
        opacity: 0.8,
    },
    packagingIcons: {
        flexDirection: 'row',
        gap: spacing[1],
    },
    packagingBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    packagingEmoji: {
        fontSize: 14,
    },
    // V4: Sustainability labels row
    sustainabilityRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
        marginTop: spacing[3],
        paddingTop: spacing[3],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}60`,
    },
    sustainBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius.full,
        borderWidth: 1,
    },
    sustainBadgeText: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
    },
    // V4: Who Should Limit This
    limitCard: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing[4],
        marginTop: spacing[3],
        borderWidth: 1,
        borderColor: `${colors.chart2}30`,
    },
    limitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    limitTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    limitRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        paddingVertical: spacing[2],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}40`,
    },
    limitEmoji: {
        fontSize: 16,
        marginTop: 2,
    },
    limitText: {
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    limitDetail: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    // V4: Family Overview
    familyOverviewCard: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing[4],
        marginHorizontal: spacing[4],
        marginTop: spacing[3],
        borderWidth: 1,
        borderColor: `${colors.chart1}30`,
    },
    familyOverviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    familyOverviewTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    familyMemberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingVertical: spacing[2],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}40`,
    },
    familyMemberDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    familyMemberName: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    familyMemberAge: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginRight: spacing[2],
    },
    familyMemberScore: {
        fontSize: 13,
        fontFamily: fonts.sans.bold,
    },
    // V4: Floating AI Button
    floatingAiButton: {
        position: 'absolute',
        right: spacing[6],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.primary,
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        borderRadius: radius.full,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
    },
    floatingAiButtonText: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    // V4: Tooltip Modals
    tooltipOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[6],
    },
    tooltipCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        width: '100%',
        maxWidth: 380,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    tooltipTitle: {
        fontSize: 20,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    tooltipDesc: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 20,
        marginBottom: spacing[4],
    },
    tooltipList: {
        gap: spacing[3],
        marginBottom: spacing[4],
    },
    tooltipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
    },
    tooltipDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
    },
    tooltipItemTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        marginBottom: 2,
    },
    tooltipItemDesc: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    tooltipFooter: {
        fontSize: 12,
        fontFamily: fonts.sans.medium,
        color: colors.primary,
        fontStyle: 'italic',
        marginBottom: spacing[4],
    },
    tooltipClose: {
        backgroundColor: colors.primary,
        paddingVertical: spacing[3],
        borderRadius: radius.xl,
        alignItems: 'center',
    },
    tooltipCloseText: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
});

