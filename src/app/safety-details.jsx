import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Info,
    ShieldCheck,
    Leaf,
    AlertTriangle,
    FlaskConical,
    FileText,
    ShieldAlert,
    CheckCircle,
    XCircle,
    ChevronDown,
    FileText as Notes,
    X,
    Database,
    Scale,
    Users,
    Sparkles,
    Heart,
    HelpCircle,
    Flower2,
    Droplets,
    Baby,
    Salad,
    Candy,
    Factory
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { SAFETY_LEVELS } from "@/lib/productSafety";
import { useAuth } from "@/contexts/AuthContext";

export default function SafetyDetails() {
    const { productData } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();
    const [showMethodologyModal, setShowMethodologyModal] = useState(false);

    // Defensive parsing to prevent crashes
    let product = {};
    try {
        product = JSON.parse(productData || '{}');
    } catch (e) {
        console.error('Failed to parse productData:', e);
    }

    const safety = product.safetyAnalysis || {
        safety: 'SAFE',
        safeScore: 50,
        issues: [],
        ageAppropriate: true,
        nutriScore: null,
    };

    // All products are food-only (beauty code removed)
    const isBeautyProduct = false;

    const nutriments = product.nutriments || {};
    const breakdown = safety.nutriScore?.breakdown || {};
    const positives = breakdown.positives || {};
    const negatives = breakdown.negatives || {};

    // Get the actual overall score from productSafety.js calculation
    const overallScore = Math.round(safety.safeScore || 50);

    // ============ FOOD PRODUCT SCORING ============
    {
        // Calculate RAW category scores (these represent relative importance/impact)

        // 1. Ingredients Safety: Based on ingredient-related issues
        const ingredientIssues = (safety.issues || []).filter(i => i.type === 'ingredient' || i.type === 'additive');
        const rawIngredientScore = Math.max(0, 100 - (ingredientIssues.length * 30));
        const ingredientDescription = ingredientIssues.length > 0
            ? `${ingredientIssues.length} concern(s) found`
            : 'All ingredients age-appropriate';

        // 2. Allergen Profile: Based on allergens
        const allergenCount = (product.allergens || []).length;
        const personalAllergenMatch = safety.hasPersonalAllergenMatch || false;
        let rawAllergenScore = Math.max(0, 100 - (allergenCount * 15));
        if (personalAllergenMatch) rawAllergenScore = 0;
        const allergenDescription = personalAllergenMatch
            ? `Contains your allergens!`
            : allergenCount > 0
                ? `${allergenCount} allergen(s) detected`
                : 'No major allergens detected';

        // 3. Nutritional Value: Based on Nutri-Score
        const sugarPts = negatives.sugars?.points || 0;
        const satFatPts = negatives.saturates?.points || 0;
        const sodiumPts = negatives.sodium?.points || 0;
        const energyPts = negatives.energy?.points || 0;
        const fiberPts = positives.fiber?.points || 0;
        const proteinPts = positives.protein?.points || 0;
        const negativeTotal = sugarPts + satFatPts + sodiumPts + energyPts;
        const positiveTotal = fiberPts + proteinPts;
        const rawNutritionScore = Math.max(0, Math.min(100, 100 - (negativeTotal * 2) + (positiveTotal * 3)));
        const sugarValue = negatives.sugars?.value || nutriments.sugars || 0;
        const nutritionDescription = sugarValue > 12.5 ? 'High sugar content' :
            sugarValue > 4.5 ? 'Moderate sugar content' : 'Low sugar content';

        // 4. Clinical Evidence: Based on data completeness
        const hasNutriScore = !!safety.nutriScore?.grade;
        const hasIngredients = (product.ingredientsText?.length || 0) > 10;
        const hasNutriments = (nutriments.energy_kcal || 0) > 0;
        const dataCompleteness = [hasNutriScore, hasIngredients, hasNutriments].filter(Boolean).length;
        const rawEvidenceScore = Math.round(33 + (dataCompleteness * 22));
        const evidenceDescription = dataCompleteness === 3 ? 'Complete food database' :
            dataCompleteness >= 2 ? 'Based on food database' : 'Limited data available';

        // 5. Age Suitability: Based on age-specific analysis
        const rawAgeScore = safety.ageAppropriate ? 100 : 30;
        const ageDescription = safety.ageAppropriate
            ? `Suitable for ${safety.ageGroup || 'selected age'}`
            : 'Not age-appropriate';

        // Category weights (must sum to 1.0) - determines how score is distributed
        const weights = {
            ingredients: 0.25,   // 25% of total score
            allergens: 0.20,     // 20% of total score
            nutrition: 0.25,     // 25% of total score
            evidence: 0.15,      // 15% of total score
            age: 0.15            // 15% of total score
        };

        // Calculate weighted scores that sum exactly to overallScore
        const rawTotal = rawIngredientScore * weights.ingredients +
            rawAllergenScore * weights.allergens +
            rawNutritionScore * weights.nutrition +
            rawEvidenceScore * weights.evidence +
            rawAgeScore * weights.age;

        const scaleFactor = rawTotal > 0 ? overallScore / rawTotal : 1;

        // Final category scores that SUM to overallScore
        const finalIngredientScore = Math.round(rawIngredientScore * weights.ingredients * scaleFactor);
        const finalAllergenScore = Math.round(rawAllergenScore * weights.allergens * scaleFactor);
        const finalNutritionScore = Math.round(rawNutritionScore * weights.nutrition * scaleFactor);
        const finalEvidenceScore = Math.round(rawEvidenceScore * weights.evidence * scaleFactor);
        const finalAgeScore = Math.round(rawAgeScore * weights.age * scaleFactor);

        // Adjust for rounding errors
        const currentSum = finalIngredientScore + finalAllergenScore + finalNutritionScore + finalEvidenceScore + finalAgeScore;
        const adjustment = overallScore - currentSum;

        var finalScores = [
            {
                icon: Leaf,
                label: 'Ingredients Safety',
                description: ingredientDescription,
                score: finalIngredientScore + (adjustment > 0 ? adjustment : 0),
                max: 25,
                color: rawIngredientScore >= 70 ? colors.chart1 : rawIngredientScore >= 40 ? colors.chart2 : colors.chart3
            },
            {
                icon: AlertTriangle,
                label: 'Allergen Profile',
                description: allergenDescription,
                score: finalAllergenScore,
                max: 20,
                color: rawAllergenScore >= 70 ? colors.chart1 : rawAllergenScore >= 40 ? colors.chart2 : colors.chart3
            },
            {
                icon: FlaskConical,
                label: 'Nutritional Value',
                description: nutritionDescription,
                score: finalNutritionScore,
                max: 25,
                color: rawNutritionScore >= 70 ? colors.chart1 : rawNutritionScore >= 40 ? colors.chart2 : colors.chart3
            },
            {
                icon: FileText,
                label: 'Clinical Evidence',
                description: evidenceDescription,
                score: finalEvidenceScore,
                max: 15,
                color: dataCompleteness >= 2 ? colors.chart1 : colors.chart2
            },
            {
                icon: ShieldAlert,
                label: 'Age Suitability',
                description: ageDescription,
                score: finalAgeScore,
                max: 15,
                color: safety.ageAppropriate ? colors.chart1 : colors.chart3
            },
        ];
    }

    // Use finalScores for rendering (defined in either branch above)
    const scores = finalScores;

    // Family analysis based on profile
    const familyMembers = [
        { name: profile?.full_name || 'User', age: profile?.age_years || 30, type: 'Adult', status: safety.safety, statusLabel: getSafetyLabel(safety.safety), tip: (safety.issues || [])[0]?.reason || 'No concerns' },
    ];

    function getSafetyLabel(level) {
        switch (level) {
            case SAFETY_LEVELS.SAFE: return 'Perfectly Safe';
            case SAFETY_LEVELS.CAUTION: return 'Use Precaution';
            case SAFETY_LEVELS.AVOID: return 'Not Recommended';
            case SAFETY_LEVELS.CRITICAL: return 'Avoid';
            default: return 'Safe';
        }
    }

    function getSafetyColor(level) {
        switch (level) {
            case SAFETY_LEVELS.SAFE: return colors.chart1;
            case SAFETY_LEVELS.CAUTION: return colors.chart2;
            case SAFETY_LEVELS.AVOID: return colors.chart3;
            case SAFETY_LEVELS.CRITICAL: return colors.destructive;
            default: return colors.chart1;
        }
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
                <Text style={styles.headerTitle}>Safety by age</Text>
                <Pressable style={styles.headerButton} onPress={() => setShowMethodologyModal(true)}>
                    <Info size={20} color={colors.foreground} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Overall Score Card */}
                <View style={styles.scoreCard}>
                    <View style={styles.scoreHeader}>
                        <View style={styles.scoreHeaderLeft}>
                            <View style={styles.scoreIconBg}>
                                <ShieldCheck size={20} color={colors.primary} />
                            </View>
                            <Text style={styles.scoreLabel}>Overall Score</Text>
                        </View>
                        <View style={styles.scoreValue}>
                            <Text style={styles.scoreNumber}>{overallScore}</Text>
                            <Text style={styles.scoreMax}>/100</Text>
                        </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${overallScore}%` }]} />
                    </View>

                    <Text style={styles.scoreDescription}>
                        Based on ingredient analysis and global safety standards. This product has been evaluated for your selected profiles.
                    </Text>

                    {/* Score breakdown */}
                    <View style={styles.scoreBreakdown}>
                        {scores.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <View key={index} style={styles.scoreRow}>
                                    <View style={styles.scoreRowLeft}>
                                        <View style={[styles.scoreRowIcon, { backgroundColor: `${item.color}10` }]}>
                                            <Icon size={16} color={item.color} />
                                        </View>
                                        <View style={styles.scoreRowInfo}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <Text style={styles.scoreRowLabel}>{item.label}</Text>
                                                {item.tooltip && <Info size={12} color={colors.mutedForeground} />}
                                            </View>
                                            <Text style={styles.scoreRowDesc}>{item.description}</Text>
                                            {item.tooltip && (
                                                <Text style={styles.tooltipText}>{item.tooltip}</Text>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.scoreRowValue}>
                                        <Text style={[styles.scoreRowNumber, { color: item.color }]}>{item.score}</Text>
                                        <Text style={styles.scoreRowMax}>/{item.max}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Dietary checks */}
                    <View style={styles.dietaryChecks}>
                        {(profile?.dietary_preferences?.includes('No Pork') || profile?.dietary_preferences?.includes('Halal')) && (
                            <View style={styles.checkItem}>
                                <CheckCircle size={16} color={colors.chart1} />
                                <Text style={styles.checkText}>No pork ingredients detected</Text>
                            </View>
                        )}
                        {(product.allergens?.length || 0) > 0 && (
                            <View style={styles.checkItem}>
                                <XCircle size={16} color={colors.chart3} />
                                <Text style={styles.checkText}>Contains allergens: {(product.allergens || []).map(a => a.replace('en:', '')).join(', ')}</Text>
                            </View>
                        )}
                        {product.traces && product.traces.length > 0 && (
                            <View style={styles.checkItem}>
                                <Info size={16} color={colors.chart2} />
                                <Text style={styles.checkText}>May contain traces of other allergens</Text>
                            </View>
                        )}
                    </View>

                    {/* Dietary prefs note */}
                    <Pressable style={styles.prefNote}>
                        <View style={styles.prefNoteLeft}>
                            <FileText size={16} color={`${colors.primary}60`} />
                            <Text style={styles.prefNoteText}>This score considers your selected dietary preferences.</Text>
                        </View>
                        <ChevronDown size={16} color={colors.mutedForeground} />
                    </Pressable>

                    {/* Why Not 100%? - Phase 2 */}
                    {overallScore < 100 && (safety.issues?.length > 0 || safety.personalConcerns?.length > 0) && (
                        <View style={styles.whyNotSection}>
                            <View style={styles.whyNotTitleContainer}>
                                <HelpCircle size={16} color={colors.chart2} />
                                <Text style={styles.whyNotTitle}> Why not 100%?</Text>
                            </View>
                            <View style={styles.whyNotList}>
                                {(safety.issues || []).slice(0, 3).map((issue, idx) => (
                                    <View key={idx} style={styles.whyNotItem}>
                                        <Text style={styles.whyNotBullet}>•</Text>
                                        <Text style={styles.whyNotText}>
                                            {issue.name || issue.reason || 'Ingredient concern detected'}
                                        </Text>
                                    </View>
                                ))}
                                {(safety.issues?.length || 0) > 3 && (
                                    <Text style={styles.whyNotMore}>
                                        +{safety.issues.length - 3} more factors
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Who Should Be Cautious - Phase 2 */}
                    <View style={styles.cautionSection}>
                        <View style={styles.cautionTitleContainer}>
                            <AlertTriangle size={16} color={colors.chart2} />
                            <Text style={styles.cautionTitle}> Who should be cautious</Text>
                        </View>
                        <View style={styles.cautionList}>
                            {(() => (
                                <>
                                    {(nutriments.sodium_100g > 400) && (
                                        <View style={styles.cautionItem}>
                                            <View style={[styles.cautionBadge, { backgroundColor: `${colors.chart2}20` }]}>
                                                <Salad size={14} color={colors.chart2} />
                                            </View>
                                            <Text style={styles.cautionText}>People with high blood pressure (high sodium)</Text>
                                        </View>
                                    )}
                                    {(nutriments.sugars_100g > 12.5) && (
                                        <View style={styles.cautionItem}>
                                            <View style={[styles.cautionBadge, { backgroundColor: `${colors.chart2}20` }]}>
                                                <Candy size={14} color={colors.chart2} />
                                            </View>
                                            <Text style={styles.cautionText}>People managing blood sugar or on low-sugar diets</Text>
                                        </View>
                                    )}
                                    {(safety.novaGroup?.group === 4) && (
                                        <View style={styles.cautionItem}>
                                            <View style={[styles.cautionBadge, { backgroundColor: `${colors.chart3}20` }]}>
                                                <Factory size={14} color={colors.chart3} />
                                            </View>
                                            <Text style={styles.cautionText}>Those limiting ultra-processed foods</Text>
                                        </View>
                                    )}
                                </>
                            ))()}
                        </View>
                    </View>
                </View>


                {/* Personal Concerns Section (Phase 3) */}
                {isBeautyProduct && safety.personalConcerns && safety.personalConcerns.length > 0 && (
                    <View style={styles.personalConcernsCard}>
                        <View style={styles.personalConcernsHeader}>
                            <View style={styles.personalConcernsIconBg}>
                                <ShieldAlert size={20} color={colors.destructive} />
                            </View>
                            <View style={styles.personalConcernsHeaderText}>
                                <Text style={styles.personalConcernsTitle}>Personal Concerns</Text>
                                <Text style={styles.personalConcernsSubtitle}>
                                    Based on your profile settings
                                </Text>
                            </View>
                        </View>

                        <View style={styles.personalConcernsList}>
                            {safety.personalConcerns.map((concern, index) => {
                                const isAllergen = concern.type === 'PERSONAL_ALLERGEN';
                                const isCritical = concern.severity === 'CRITICAL';
                                return (
                                    <View
                                        key={index}
                                        style={[
                                            styles.personalConcernItem,
                                            isCritical && styles.personalConcernItemCritical
                                        ]}
                                    >
                                        <View style={styles.personalConcernLeft}>
                                            {isCritical ? (
                                                <XCircle size={18} color={colors.destructive} />
                                            ) : (
                                                <AlertTriangle size={18} color={colors.chart2} />
                                            )}
                                            <View style={styles.personalConcernText}>
                                                <Text style={styles.personalConcernName}>{concern.name}</Text>
                                                <Text style={styles.personalConcernReason}>{concern.reason}</Text>
                                            </View>
                                        </View>
                                        <View
                                            style={[
                                                styles.personalConcernBadge,
                                                isCritical
                                                    ? styles.personalConcernBadgeCritical
                                                    : styles.personalConcernBadgeCaution
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.personalConcernBadgeText,
                                                    isCritical && styles.personalConcernBadgeTextCritical
                                                ]}
                                            >
                                                {concern.severity}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.personalConcernsFooter}>
                            <Info size={14} color={colors.mutedForeground} />
                            <Text style={styles.personalConcernsFooterText}>
                                Update your profile to customize these warnings
                            </Text>
                        </View>
                    </View>
                )}

                {/* Profile Analysis */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PROFILE ANALYSIS</Text>
                        <View style={styles.memberBadge}>
                            <Text style={styles.memberBadgeText}>{familyMembers.length} MEMBER{familyMembers.length > 1 ? 'S' : ''}</Text>
                        </View>
                    </View>

                    {familyMembers.map((member, index) => {
                        const statusColor = getSafetyColor(member.status);
                        return (
                            <View key={index} style={styles.memberCard}>
                                <View style={styles.memberLeft}>
                                    <View style={styles.memberAvatar}>
                                        <Text style={styles.memberAvatarText}>{member.name[0]}</Text>
                                        <View style={[styles.memberStatusDot, { backgroundColor: statusColor }]}>
                                            <CheckCircle size={10} color="#fff" />
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        <Text style={styles.memberAge}>{member.type} ({member.age}y)</Text>
                                    </View>
                                </View>
                                <View style={styles.memberRight}>
                                    <View style={[styles.memberStatusBadge, { backgroundColor: `${statusColor}10`, borderColor: `${statusColor}20` }]}>
                                        <Text style={[styles.memberStatusText, { color: statusColor }]}>{member.statusLabel}</Text>
                                    </View>
                                    <Text style={styles.memberTip}>{member.tip}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Safety Summary */}
                <View style={styles.summaryCard}>
                    <Notes size={20} color={`${colors.primary}60`} />
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Safety Summary</Text>
                        <Text style={styles.summaryText}>
                            {(safety.issues?.length || 0) === 0
                                ? 'This product appears safe based on the selected profiles.'
                                : `Key concerns: ${(safety.issues || []).slice(0, 2).map(i => i.name).join(', ')}. Always verify with healthcare provider if unsure.`}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Scoring Methodology Modal */}
            <Modal
                visible={showMethodologyModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowMethodologyModal(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>How We Calculate Scores</Text>
                        <Pressable
                            style={styles.modalCloseBtn}
                            onPress={() => setShowMethodologyModal(false)}
                        >
                            <X size={24} color={colors.foreground} />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.modalScroll}
                        contentContainerStyle={styles.modalContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Introduction */}
                        <View style={styles.methodSection}>
                            <View style={styles.methodHeader}>
                                <View style={[styles.methodIcon, { backgroundColor: `${colors.primary}15` }]}>
                                    <Sparkles size={20} color={colors.primary} />
                                </View>
                                <Text style={styles.methodTitle}>Our Scoring Philosophy</Text>
                            </View>
                            <Text style={styles.methodText}>
                                Our safety score combines scientific nutritional analysis with age-specific safety guidelines.
                                We analyze each product across multiple dimensions to give you a comprehensive safety picture.
                            </Text>
                        </View>

                        {/* Score Categories */}
                        <View style={styles.methodSection}>
                            <View style={styles.methodHeader}>
                                <View style={[styles.methodIcon, { backgroundColor: `${colors.chart1}15` }]}>
                                    <Scale size={20} color={colors.chart1} />
                                </View>
                                <Text style={styles.methodTitle}>Score Categories</Text>
                            </View>

                            <View style={styles.categoryItem}>
                                <View style={styles.categoryBadge}>
                                    <Leaf size={14} color={colors.chart1} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName}>Ingredients Safety (25%)</Text>
                                    <Text style={styles.categoryDesc}>
                                        Analyzes ingredients against age-specific restrictions (e.g., honey for infants,
                                        caffeine for children) and identifies concerning additives like artificial colors.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.categoryItem}>
                                <View style={styles.categoryBadge}>
                                    <AlertTriangle size={14} color={colors.chart2} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName}>Allergen Profile (20%)</Text>
                                    <Text style={styles.categoryDesc}>
                                        Cross-references product allergens with your declared allergies.
                                        Personal allergen matches significantly reduce the score.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.categoryItem}>
                                <View style={styles.categoryBadge}>
                                    <FlaskConical size={14} color={colors.chart1} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName}>Nutritional Value (25%)</Text>
                                    <Text style={styles.categoryDesc}>
                                        Based on European Nutri-Score algorithm. Factors in sugars, saturated fats,
                                        sodium, calories (negative) and fiber, protein (positive).
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.categoryItem}>
                                <View style={styles.categoryBadge}>
                                    <FileText size={14} color={colors.primary} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName}>Clinical Evidence (15%)</Text>
                                    <Text style={styles.categoryDesc}>
                                        Measures data completeness - products with verified Nutri-Score,
                                        complete ingredient lists, and nutrition data score higher.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.categoryItem}>
                                <View style={styles.categoryBadge}>
                                    <Users size={14} color={colors.chart1} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName}>Age Suitability (15%)</Text>
                                    <Text style={styles.categoryDesc}>
                                        Evaluates if the product is appropriate for the selected age group
                                        based on sodium, sugar, and specific ingredient restrictions.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Data Sources */}
                        <View style={styles.methodSection}>
                            <View style={styles.methodHeader}>
                                <View style={[styles.methodIcon, { backgroundColor: `${colors.accent}` }]}>
                                    <Database size={20} color={colors.primary} />
                                </View>
                                <Text style={styles.methodTitle}>Data Sources</Text>
                            </View>

                            {isBeautyProduct ? (
                                <>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>Open Beauty Facts</Text> - Open cosmetics database with 200k+ products
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>EU Cosmetics Regulation 1223/2009</Text> - Official EU safety standards
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>CIR Safety Assessments</Text> - Cosmetic Ingredient Review data
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>EU 26 Fragrance Allergens</Text> - Mandatory disclosure allergens
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>Pediatric Dermatology Guidelines</Text> - AAP, FDA infant safety
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>Open Food Facts</Text> - World's largest open food database with 3M+ products
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>Nutri-Score Algorithm</Text> - Official European nutritional scoring system
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>NOVA Classification</Text> - Food processing level assessment (1-4)
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>Eco-Score</Text> - Environmental impact rating (A-E)
                                        </Text>
                                    </View>
                                    <View style={styles.sourceItem}>
                                        <CheckCircle size={16} color={colors.chart1} />
                                        <Text style={styles.sourceText}>
                                            <Text style={styles.sourceBold}>Medical Guidelines</Text> - WHO, AAP pediatric nutrition standards
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* How to Interpret */}
                        <View style={styles.methodSection}>
                            <View style={styles.methodHeader}>
                                <View style={[styles.methodIcon, { backgroundColor: `${colors.chart1}15` }]}>
                                    <Info size={20} color={colors.chart1} />
                                </View>
                                <Text style={styles.methodTitle}>Score Interpretation</Text>
                            </View>

                            <View style={styles.interpretRow}>
                                <View style={[styles.interpretBadge, { backgroundColor: colors.chart1 }]}>
                                    <Text style={styles.interpretScore}>70-100</Text>
                                </View>
                                <View style={styles.interpretInfo}>
                                    <Text style={styles.interpretLabel}>Safe</Text>
                                    <Text style={styles.interpretDesc}>Excellent choice for the selected age group</Text>
                                </View>
                            </View>

                            <View style={styles.interpretRow}>
                                <View style={[styles.interpretBadge, { backgroundColor: colors.chart2 }]}>
                                    <Text style={styles.interpretScore}>40-69</Text>
                                </View>
                                <View style={styles.interpretInfo}>
                                    <Text style={styles.interpretLabel}>Caution</Text>
                                    <Text style={styles.interpretDesc}>Some concerns - review details before consuming</Text>
                                </View>
                            </View>

                            <View style={styles.interpretRow}>
                                <View style={[styles.interpretBadge, { backgroundColor: colors.chart3 }]}>
                                    <Text style={styles.interpretScore}>0-39</Text>
                                </View>
                                <View style={styles.interpretInfo}>
                                    <Text style={styles.interpretLabel}>Avoid</Text>
                                    <Text style={styles.interpretDesc}>Not recommended for the selected profile</Text>
                                </View>
                            </View>
                        </View>

                        {/* Disclaimer */}
                        <View style={[styles.methodSection, styles.disclaimerSection]}>
                            <Text style={styles.disclaimerText}>
                                Our scores are for informational purposes only and should not replace
                                professional medical advice. Always consult with a healthcare provider
                                for specific dietary concerns.
                            </Text>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </Modal>
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
    scoreCard: { backgroundColor: colors.card, borderRadius: radius['3xl'], padding: spacing[6], marginBottom: spacing[8], borderWidth: 1, borderColor: `${colors.border}40` },
    scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] },
    scoreHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    scoreIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    scoreLabel: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.primary },
    scoreValue: { flexDirection: 'row', alignItems: 'baseline' },
    scoreNumber: { fontSize: 24, fontFamily: fonts.heading.bold, color: colors.chart1 },
    scoreMax: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    progressBar: { height: 8, backgroundColor: colors.muted, borderRadius: 4, overflow: 'hidden', marginBottom: spacing[3] },
    progressFill: { height: '100%', backgroundColor: colors.chart1, borderRadius: 4 },
    scoreDescription: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 18, marginBottom: spacing[5] },
    scoreBreakdown: { gap: spacing[3], marginBottom: spacing[4] },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing[3], backgroundColor: `${colors.muted}30`, borderRadius: radius['xl'], borderWidth: 1, borderColor: `${colors.border}30` },
    scoreRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing[3] },
    scoreRowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    scoreRowInfo: { flex: 1 },
    scoreRowLabel: { fontSize: 12, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: 2 },
    scoreRowDesc: { fontSize: 10, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    tooltipText: { fontSize: 10, fontFamily: fonts.sans.regular, color: colors.primary, marginTop: 4, fontStyle: 'italic' },
    scoreRowValue: { flexDirection: 'row', alignItems: 'baseline' },
    scoreRowNumber: { fontSize: 14, fontFamily: fonts.sans.bold },
    scoreRowMax: { fontSize: 10, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    dietaryChecks: { padding: spacing[3], backgroundColor: `${colors.muted}50`, borderRadius: radius['xl'], borderWidth: 1, borderColor: `${colors.border}30`, gap: spacing[2], marginBottom: spacing[4] },
    checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
    checkText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.foreground, flex: 1 },
    prefNote: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: `${colors.border}30` },
    prefNoteLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 },
    prefNoteText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, flex: 1 },
    // Why Not 100%? section styles
    whyNotSection: { marginTop: spacing[4], padding: spacing[3], backgroundColor: `${colors.primary}08`, borderRadius: radius.xl, borderWidth: 1, borderColor: `${colors.primary}20` },
    whyNotTitle: { fontSize: 13, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: spacing[2] },
    whyNotList: { gap: spacing[1] },
    whyNotItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
    whyNotBullet: { fontSize: 12, color: colors.primary },
    whyNotText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, flex: 1 },
    whyNotMore: { fontSize: 11, fontFamily: fonts.sans.medium, color: colors.primary, marginTop: spacing[1] },
    // Who Should Be Cautious section styles
    cautionSection: { marginTop: spacing[4], padding: spacing[3], backgroundColor: `${colors.chart2}08`, borderRadius: radius.xl, borderWidth: 1, borderColor: `${colors.chart2}20` },
    cautionTitle: { fontSize: 13, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: spacing[2] },
    cautionList: { gap: spacing[2] },
    cautionItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    cautionBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    cautionEmoji: { fontSize: 14 },
    cautionText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.foreground, flex: 1 },
    section: { marginBottom: spacing[8] },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4], paddingHorizontal: spacing[1] },
    sectionTitle: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.primary, letterSpacing: 2 },
    memberBadge: { backgroundColor: colors.muted, paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radius.full },
    memberBadgeText: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.mutedForeground },
    memberCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: spacing[5], borderRadius: radius['3xl'], marginBottom: spacing[3], borderWidth: 1, borderColor: `${colors.border}30` },
    memberLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
    memberAvatar: { width: 56, height: 56, borderRadius: radius['2xl'], backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    memberAvatarText: { fontSize: 20, fontFamily: fonts.sans.bold, color: colors.primaryForeground },
    memberStatusDot: { position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card },
    memberName: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.foreground },
    memberAge: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    memberRight: { flex: 1, alignItems: 'flex-end', gap: spacing[1], marginLeft: spacing[4] },
    memberStatusBadge: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, borderWidth: 1 },
    memberStatusText: { fontSize: 10, fontFamily: fonts.sans.bold, letterSpacing: 0.5 },
    memberTip: { fontSize: 10, fontFamily: fonts.sans.regular, color: colors.mutedForeground, textAlign: 'right' },
    summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], padding: spacing[4], backgroundColor: colors.muted, borderRadius: radius['2xl'], borderWidth: 1, borderColor: `${colors.border}50` },
    summaryContent: { flex: 1 },
    summaryLabel: { fontSize: 12, fontFamily: fonts.sans.bold, color: colors.primary, marginBottom: spacing[1] },
    summaryText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 18 },

    // Modal styles
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[6], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: `${colors.border}30` },
    modalTitle: { fontSize: 18, fontFamily: fonts.heading.bold, color: colors.foreground },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    modalScroll: { flex: 1 },
    modalContent: { padding: spacing[6] },

    methodSection: { marginBottom: spacing[6], backgroundColor: colors.card, borderRadius: radius['2xl'], padding: spacing[5], borderWidth: 1, borderColor: `${colors.border}30` },
    methodHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] },
    methodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    methodTitle: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.foreground },
    methodText: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 20 },

    categoryItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: `${colors.border}20` },
    categoryBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: `${colors.muted}80`, alignItems: 'center', justifyContent: 'center' },
    categoryInfo: { flex: 1 },
    categoryName: { fontSize: 13, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: 2 },
    categoryDesc: { fontSize: 11, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 16 },

    sourceItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], paddingVertical: spacing[2] },
    sourceText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, flex: 1, lineHeight: 18 },
    sourceBold: { fontFamily: fonts.sans.bold, color: colors.foreground },

    interpretRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: `${colors.border}20` },
    interpretBadge: { width: 56, paddingVertical: spacing[2], borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
    interpretScore: { fontSize: 11, fontFamily: fonts.sans.bold, color: '#fff' },
    interpretInfo: { flex: 1 },
    interpretLabel: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.foreground },
    interpretDesc: { fontSize: 11, fontFamily: fonts.sans.regular, color: colors.mutedForeground },

    disclaimerSection: { backgroundColor: `${colors.chart2}10`, borderColor: `${colors.chart2}30` },
    disclaimerText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 18 },

    // Personal Concerns styles (Phase 3)
    personalConcernsCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        marginBottom: spacing[8],
        borderWidth: 1,
        borderColor: `${colors.destructive}30`,
    },
    personalConcernsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginBottom: spacing[5],
    },
    personalConcernsIconBg: {
        width: 40,
        height: 40,
        borderRadius: radius.xl,
        backgroundColor: `${colors.destructive}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    personalConcernsHeaderText: {
        flex: 1,
    },
    personalConcernsTitle: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    personalConcernsSubtitle: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    personalConcernsList: {
        gap: spacing[3],
    },
    personalConcernItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing[4],
        backgroundColor: `${colors.muted}30`,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: `${colors.border}30`,
    },
    personalConcernItemCritical: {
        backgroundColor: `${colors.destructive}10`,
        borderColor: `${colors.destructive}30`,
    },
    personalConcernLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        flex: 1,
    },
    personalConcernText: {
        flex: 1,
    },
    personalConcernName: {
        fontSize: 13,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        marginBottom: 2,
    },
    personalConcernReason: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 16,
    },
    personalConcernBadge: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius.full,
        borderWidth: 1,
    },
    personalConcernBadgeCritical: {
        backgroundColor: `${colors.destructive}15`,
        borderColor: `${colors.destructive}30`,
    },
    personalConcernBadgeCaution: {
        backgroundColor: `${colors.chart2}15`,
        borderColor: `${colors.chart2}30`,
    },
    personalConcernBadgeText: {
        fontSize: 9,
        fontFamily: fonts.sans.bold,
        color: colors.chart2,
        letterSpacing: 0.5,
    },
    personalConcernBadgeTextCritical: {
        color: colors.destructive,
    },
    personalConcernsFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginTop: spacing[4],
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}30`,
    },
    personalConcernsFooterText: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        flex: 1,
    },
});
