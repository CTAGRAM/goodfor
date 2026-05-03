import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Leaf, ShieldCheck, Sparkles } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getProductByBarcode, PRODUCT_TYPES } from "@/lib/productRouter";
import { analyzeProductSafety, yearsToMonths } from "@/lib/productSafety";
import { analyzeCosmeticSafety } from "@/lib/cosmeticSafety";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import { useAuth } from "@/contexts/AuthContext";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import { supabase } from "@/lib/supabaseAuth";
import UpgradeModal from "@/components/UpgradeModal";

const FREE_TIER_SCAN_LIMIT = 10;
const SOFT_PROMPT_AT = 5;

// Convert age group label to approximate months for family members
function getAgeMonthsFromGroup(ageGroup) {
    const ageGroupMap = {
        'infant': 6,       // 0-12 months
        'toddler': 24,     // 1-3 years
        'child': 84,       // 4-12 years (7 years avg)
        'teen': 180,       // 13-18 years (15 years avg)
        'adult': 360,      // 18-65 years (30 years avg)
        'elderly': 780,    // 65+ years
    };
    return ageGroupMap[ageGroup?.toLowerCase()] || null;
}

export default function ScanProcessing() {
    const { barcode } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, profile, activeFamilyMember } = useAuth();
    const { isPro } = useRevenueCat();
    const [status, setStatus] = useState('Checking ingredients...');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [scanCount, setScanCount] = useState(0);
    const [upgradeModalType, setUpgradeModalType] = useState('scanLimit');

    // Animations
    const spinAnim = new Animated.Value(0);
    const pulseAnim = new Animated.Value(1);
    const bounce1 = new Animated.Value(0);
    const bounce2 = new Animated.Value(0);

    useEffect(() => {
        // Spin animation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        // Bounce animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounce1, { toValue: -8, duration: 500, useNativeDriver: true }),
                Animated.timing(bounce1, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.delay(300),
                Animated.timing(bounce2, { toValue: -8, duration: 500, useNativeDriver: true }),
                Animated.timing(bounce2, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();

        // Process barcode
        processBarcode();
    }, [barcode]);

    const processBarcode = async () => {
        try {
            // Check scan limit for free tier users
            // isPro from RevenueCat OR is_premium from database (for testing/manual grants)
            const isUserPremium = isPro || profile?.is_premium === true;

            if (!isUserPremium && user?.id) {
                setStatus('Checking usage...');
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { count, error: countError } = await supabase
                    .from('scans')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('scanned_at', startOfMonth.toISOString());

                if (!countError) {
                    const currentCount = count || 0;
                    setScanCount(currentCount);

                    // Hard limit reached
                    if (currentCount >= FREE_TIER_SCAN_LIMIT) {
                        console.log('[ScanProcessing] Free tier limit reached:', currentCount);
                        setUpgradeModalType('scanLimit');
                        setShowUpgradeModal(true);
                        return; // Stop processing
                    }

                    // Soft prompt at 5 scans (show after processing completes)
                    if (currentCount === SOFT_PROMPT_AT) {
                        // Will show soft prompt after scan completes
                        setUpgradeModalType('soft');
                    }
                }
            }

            setStatus('Looking up product...');
            const product = await getProductByBarcode(barcode);

            if (!product) {
                router.replace({
                    pathname: '/scan-error',
                    params: { barcode, error: 'Product not found in database' },
                });
                return;
            }

            setStatus('Analysing safety...');
            // Get age from active family member or profile
            const ageSource = activeFamilyMember || profile;
            const ageMonths = ageSource?.age_years
                ? yearsToMonths(ageSource.age_years)
                : getAgeMonthsFromGroup(ageSource?.age_group) || 360;

            // Get user's personal allergies and dietary restrictions for personalized scoring
            const userPreferences = {
                allergies: activeFamilyMember?.allergies || profile?.allergies || [],
                dietaryRestrictions: activeFamilyMember?.dietary_restrictions || profile?.dietary_preferences || [],
                healthConditions: activeFamilyMember?.health_conditions || profile?.health_conditions || [],
                isPregnant: ageSource?.is_pregnant || false,
                isBreastfeeding: ageSource?.is_breastfeeding || false,
                ageMonths: ageMonths,
                // Phase 3: Cosmetic personalization fields
                skinType: ageSource?.skin_type || 'normal',
                skinConditions: ageSource?.skin_conditions || [],
                cosmeticAllergens: ageSource?.cosmetic_allergens || [],
            };

            console.log('[ScanProcessing] Analyzing with preferences:', {
                ageMonths,
                productType: product.productType,
                allergies: userPreferences.allergies,
                dietary: userPreferences.dietaryRestrictions,
                cosmeticPrefs: {
                    skinType: userPreferences.skinType,
                    skinConditions: userPreferences.skinConditions,
                    cosmeticAllergens: userPreferences.cosmeticAllergens,
                }
            });

            // Route to appropriate safety analysis based on product type
            let safetyAnalysis;
            console.log('[ScanProcessing] Product type check:', product.productType, '===', PRODUCT_TYPES.BEAUTY, '?', product.productType === PRODUCT_TYPES.BEAUTY);

            if (product.productType === PRODUCT_TYPES.BEAUTY) {
                console.log('[ScanProcessing] ✓ Routing to COSMETIC analysis');
                setStatus('Analysing cosmetic safety...');
                safetyAnalysis = analyzeCosmeticSafety(product, userPreferences);
                console.log('[ScanProcessing] Cosmetic analysis result:', {
                    safety: safetyAnalysis.safety,
                    score: safetyAnalysis.safeScore,
                    issuesCount: safetyAnalysis.issues?.length,
                    hasPillars: !!safetyAnalysis.pillars,
                    hasPersonalConcerns: safetyAnalysis.personalConcerns?.length > 0
                });
            } else {
                console.log('[ScanProcessing] → Routing to FOOD analysis');
                // Default to food analysis
                safetyAnalysis = analyzeProductSafety(product, ageMonths, userPreferences);
            }

            setStatus('Saving results...');
            await saveScanToHistory(product, safetyAnalysis);

            // Small delay to ensure database write is committed before navigation
            await new Promise(resolve => setTimeout(resolve, 200));

            hapticSuccess();
            router.replace({
                pathname: '/product-summary',
                params: { productData: JSON.stringify({ ...product, safetyAnalysis }) },
            });
        } catch (error) {
            console.error('Scan error:', error);
            hapticError();
            router.replace({
                pathname: '/scan-error',
                params: { barcode, error: error.message },
            });
        }
    };

    const saveScanToHistory = async (product, safetyAnalysis) => {
        // Use user.id (from auth) as fallback if profile.id is not available
        const userId = profile?.id || user?.id;
        if (!userId) {
            console.warn('[ScanSave] No user ID available, skipping save');
            return;
        }
        try {
            console.log('[ScanSave] Saving scan for user:', userId);

            // Step 1: Upsert product to products table with COMPLETE data
            const { data: productData, error: productError } = await supabase
                .from('products')
                .upsert({
                    barcode: product.barcode,
                    name: product.name,
                    brand: product.brand,
                    category: product.categories?.[0] || 'Food Product',
                    image_url: product.imageUrl,
                    // Store complete ingredients data for history reconstruction
                    ingredients: {
                        text: product.ingredientsText || '',
                        allergens: product.allergens || [],
                        additives: product.additives || [],
                        traces: product.traces || [],
                    },
                    // Store complete nutrition facts
                    nutrition_facts: {
                        energy_kcal: product.nutriments?.energy_kcal || 0,
                        sugars: product.nutriments?.sugars || 0,
                        sodium: product.nutriments?.sodium || 0,
                        salt: product.nutriments?.salt || 0,
                        saturated_fat: product.nutriments?.saturated_fat || 0,
                        proteins: product.nutriments?.proteins || 0,
                        fiber: product.nutriments?.fiber || 0,
                        caffeine: product.nutriments?.caffeine || 0,
                    },
                }, {
                    onConflict: 'barcode',
                    ignoreDuplicates: false,
                })
                .select()
                .single();

            if (productError) {
                console.error('[ScanSave] Product upsert error:', productError);
                return;
            }


            // Check if already scanned recently by THIS user/profile
            let query = supabase
                .from('scans')
                .select('id, scan_count')
                .eq('user_id', userId)
                .eq('product_id', productData.id);

            if (activeFamilyMember) {
                query = query.eq('family_member_id', activeFamilyMember.id);
            } else {
                query = query.is('family_member_id', null);
            }

            const { data: existingScan, error: checkError } = await query.maybeSingle();

            if (checkError) {
                console.error('[ScanSave] Check existing scan error:', checkError);
            }

            // Prepare comprehensive safety_details object for storage
            const safetyDetailsToStore = {
                // Core safety data
                issues: safetyAnalysis.issues || [],
                ageAppropriate: safetyAnalysis.ageAppropriate,
                ageGroup: safetyAnalysis.ageGroup,

                // Enhanced Cosmetic Data (Phase 2/3)
                pillars: safetyAnalysis.pillars,
                personalConcerns: safetyAnalysis.personalConcerns,
                productType: product.productType || 'FOOD', // Store type context

                // Full Nutri-Score data for UI reconstruction
                nutriScore: safetyAnalysis.nutriScore ? {
                    rawScore: safetyAnalysis.nutriScore.rawScore,
                    grade: safetyAnalysis.nutriScore.grade,
                    gradeColor: safetyAnalysis.nutriScore.gradeColor,
                    breakdown: safetyAnalysis.nutriScore.breakdown,
                } : null,
                // Eco-Score and NOVA for environmental info
                ecoScore: safetyAnalysis.ecoScore,
                novaGroup: safetyAnalysis.novaGroup,
                // Personal matches
                hasPersonalAllergenMatch: safetyAnalysis.hasPersonalAllergenMatch,
                matchedAllergens: safetyAnalysis.matchedAllergens,
            };

            if (existingScan) {
                // Update existing scan - increment count and update timestamp
                const { error: updateError } = await supabase
                    .from('scans')
                    .update({
                        scanned_at: new Date().toISOString(),
                        scan_count: (existingScan.scan_count || 1) + 1,
                        safety_score: Math.round(safetyAnalysis.safeScore),
                        safety_level: safetyAnalysis.safety,
                        safety_details: safetyDetailsToStore,
                    })
                    .eq('id', existingScan.id);

                if (updateError) {
                    console.error('[ScanSave] Update scan error:', updateError);
                } else {
                    console.log('[ScanSave] Updated existing scan, count:', (existingScan.scan_count || 1) + 1);
                }
            } else {
                // Insert new scan record
                const { error: scanError } = await supabase
                    .from('scans')
                    .insert({
                        user_id: userId,
                        product_id: productData.id,
                        family_member_id: activeFamilyMember ? activeFamilyMember.id : null,
                        safety_score: Math.round(safetyAnalysis.safeScore),
                        safety_level: safetyAnalysis.safety,
                        category: product.categories?.[0] || 'Food Product',
                        scan_count: 1,
                        safety_details: safetyDetailsToStore,
                    });

                if (scanError) {
                    console.error('[ScanSave] Insert scan error:', scanError);
                } else {
                    console.log('[ScanSave] New scan saved successfully');
                }
            }
        } catch (e) {
            console.error('[ScanSave] Exception:', e);
        }
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurLeft} />
            <View style={styles.blurRight} />

            {/* Content */}
            <View style={styles.content}>
                {/* Animated icon */}
                <View style={styles.iconWrapper}>
                    <View style={styles.pulseRing} />
                    <Animated.View style={[styles.spinRing, { transform: [{ rotate: spin }] }]} />
                    <Animated.View style={[styles.iconBg, { transform: [{ scale: pulseAnim }] }]}>
                        <Leaf size={40} color={colors.chart1} />
                    </Animated.View>

                    {/* Floating dots */}
                    <Animated.View style={[styles.dot1, { transform: [{ translateY: bounce1 }] }]} />
                    <Animated.View style={[styles.dot2, { transform: [{ translateY: bounce2 }] }]} />
                </View>

                {/* Status text */}
                <Text style={styles.title}>{status}</Text>
                <Text style={styles.subtitle}>This usually takes a few seconds</Text>

                {/* Status badge */}
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ANALYSING PRODUCT</Text>
                    <View style={styles.statusDot} />
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 100 }]}>
                <View style={styles.footerContent}>
                    <ShieldCheck size={16} color={colors.mutedForeground} />
                    <Text style={styles.footerText}>VERIFYING AGAINST GLOBAL STANDARDS</Text>
                </View>
            </View>

            {/* Upgrade Modal for scan limits */}
            <UpgradeModal
                visible={showUpgradeModal}
                onClose={() => {
                    setShowUpgradeModal(false);
                    // If it was a hard limit, go back to scan screen
                    if (upgradeModalType === 'scanLimit') {
                        router.back();
                    }
                }}
                trigger={upgradeModalType}
                currentCount={scanCount}
                maxCount={FREE_TIER_SCAN_LIMIT}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    blurLeft: {
        position: 'absolute',
        top: '50%',
        left: -128,
        width: 256,
        height: 256,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 128,
        marginTop: -128,
    },
    blurRight: {
        position: 'absolute',
        bottom: -96,
        right: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.accent,
        opacity: 0.3,
        borderRadius: 96,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[8],
    },
    iconWrapper: {
        position: 'relative',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[12],
    },
    pulseRing: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 2,
        borderColor: `${colors.primary}10`,
    },
    spinRing: {
        position: 'absolute',
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: 'transparent',
        borderTopColor: `${colors.primary}40`,
        borderRightColor: `${colors.primary}40`,
    },
    iconBg: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: `${colors.border}50`,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    dot1: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.accent,
    },
    dot2: {
        position: 'absolute',
        bottom: -4,
        left: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: `${colors.chart1}40`,
    },
    title: {
        fontSize: 24,
        fontFamily: fonts.heading.bold,
        color: colors.primary,
        textAlign: 'center',
        marginBottom: spacing[3],
    },
    subtitle: {
        fontSize: 16,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing[16],
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[2],
        backgroundColor: `${colors.accent}20`,
        borderWidth: 1,
        borderColor: `${colors.accent}30`,
        borderRadius: radius.full,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.chart1,
    },
    statusText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: `${colors.primary}70`,
        letterSpacing: 2,
    },
    footer: {
        alignItems: 'center',
        paddingTop: spacing[10],
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    footerText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: `${colors.mutedForeground}60`,
        letterSpacing: 2,
    },
});
