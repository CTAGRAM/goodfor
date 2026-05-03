import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated, Pressable } from "react-native";
import { useEffect, useRef } from "react";
import { X, Award, CheckCircle, Zap, Droplets, Flame, Wheat, Apple, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";

/**
 * NutriScoreInfo — Premium bottom-sheet modal explaining the product's Nutri-Score
 * Shows actual nutritional values, score breakdown, and what it means for this specific product.
 * Uses app's dark green (#243628) color scheme.
 */

const GRADE_DATA = {
    'A': { label: 'Excellent', emoji: '🌟', color: '#038141', bgColor: '#D1FAE5', verdict: 'This is one of the best nutritional choices you can make.' },
    'B': { label: 'Good', emoji: '👍', color: '#85BB2F', bgColor: '#ECFCCB', verdict: 'A solid choice with good nutritional balance.' },
    'C': { label: 'Average', emoji: '⚖️', color: '#FECB02', bgColor: '#FEF9C3', verdict: 'Average nutritional quality — pair with healthier options.' },
    'D': { label: 'Poor', emoji: '⚠️', color: '#EE8100', bgColor: '#FED7AA', verdict: 'High in nutrients to limit. Consider healthier alternatives.' },
    'E': { label: 'Very Poor', emoji: '🚫', color: '#E63E11', bgColor: '#FECACA', verdict: 'Very low nutritional value. Limit consumption significantly.' },
};

const NUTRIENT_INFO = {
    energy: { label: 'Calories', icon: Flame, unit: 'kcal', explain: 'Energy from food. High intake leads to weight gain.' },
    sugars: { label: 'Sugars', icon: Droplets, unit: 'g', explain: 'Excess sugars are linked to obesity, diabetes and tooth decay.' },
    saturates: { label: 'Saturated Fat', icon: Zap, unit: 'g', explain: 'Raises LDL cholesterol and increases heart disease risk.' },
    sodium: { label: 'Sodium', icon: ShieldCheck, unit: 'mg', explain: 'Excess sodium raises blood pressure and strains kidneys.' },
    fiber: { label: 'Fiber', icon: Wheat, unit: 'g', explain: 'Supports digestion, gut health and keeps you full longer.' },
    protein: { label: 'Protein', icon: TrendingUp, unit: 'g', explain: 'Builds muscle, repairs tissue and supports immune function.' },
    fruitVeg: { label: 'Fruit & Veg', icon: Apple, unit: '%', explain: 'More fruit/veg content means more vitamins and minerals.' },
};

// Daily reference intakes (adults)
const DAILY_REF = {
    energy: 2000,
    sugars: 50,
    saturates: 20,
    sodium: 2400, // mg
    fiber: 25,
    protein: 50,
};

export default function NutriScoreInfo({ visible, onClose, grade, breakdown, productName, nutriments }) {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            slideAnim.setValue(300);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    if (!grade) return null;

    const g = GRADE_DATA[grade] || GRADE_DATA['C'];

    // Compute totals
    const posTotal = breakdown?.positives
        ? Object.values(breakdown.positives).reduce((s, v) => s + (v.points || 0), 0)
        : 0;
    const negTotal = breakdown?.negatives
        ? Object.values(breakdown.negatives).reduce((s, v) => s + (v.points || 0), 0)
        : 0;
    const rawScore = negTotal - posTotal;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />

                <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                    {/* Drag Handle */}
                    <View style={styles.dragHandle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerTitle}>Nutri-Score</Text>
                            <Text style={styles.headerSubtitle} numberOfLines={1}>{productName || 'This product'}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <X size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Grade Scale Bar — A through E */}
                        <View style={styles.scaleBar}>
                            {Object.entries(GRADE_DATA).map(([key, data]) => {
                                const isActive = key === grade;
                                return (
                                    <View key={key} style={[styles.scaleItem, isActive && { transform: [{ scale: 1.15 }] }]}>
                                        <View style={[
                                            styles.scaleCircle,
                                            { backgroundColor: isActive ? data.color : `${data.color}40` },
                                            isActive && { shadowColor: data.color, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
                                        ]}>
                                            <Text style={[styles.scaleLetter, !isActive && { opacity: 0.5 }]}>{key}</Text>
                                        </View>
                                        {isActive && <View style={[styles.scaleIndicator, { backgroundColor: data.color }]} />}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Verdict Card */}
                        <View style={[styles.verdictCard, { backgroundColor: g.bgColor, borderColor: `${g.color}30` }]}>
                            <Text style={styles.verdictEmoji}>{g.emoji}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.verdictGrade, { color: g.color }]}>
                                    Grade {grade} — {g.label}
                                </Text>
                                <Text style={styles.verdictText}>{g.verdict}</Text>
                            </View>
                        </View>

                        {/* YOUR PRODUCT'S NUMBERS — the key informative section */}
                        {nutriments && (
                            <View style={styles.numbersSection}>
                                <Text style={styles.sectionLabel}>THIS PRODUCT'S NUTRITION (per 100g)</Text>
                                <View style={styles.numbersGrid}>
                                    {[
                                        { key: 'energy_kcal', label: 'Calories', value: nutriments.energy_kcal || nutriments['energy-kcal'] || 0, unit: 'kcal', daily: DAILY_REF.energy, color: colors.chart2, icon: Flame },
                                        { key: 'sugars', label: 'Sugars', value: nutriments.sugars || 0, unit: 'g', daily: DAILY_REF.sugars, color: colors.chart3, icon: Droplets },
                                        { key: 'saturated_fat', label: 'Sat. Fat', value: nutriments.saturated_fat || nutriments['saturated-fat'] || 0, unit: 'g', daily: DAILY_REF.saturates, color: colors.chart2, icon: Zap },
                                        { key: 'sodium', label: 'Sodium', value: (nutriments.sodium || 0) * 1000, unit: 'mg', daily: DAILY_REF.sodium, color: colors.chart3, icon: ShieldCheck },
                                        { key: 'fiber', label: 'Fiber', value: nutriments.fiber || 0, unit: 'g', daily: DAILY_REF.fiber, color: colors.chart1, icon: Wheat },
                                        { key: 'proteins', label: 'Protein', value: nutriments.proteins || nutriments.protein || 0, unit: 'g', daily: DAILY_REF.protein, color: colors.chart1, icon: TrendingUp },
                                    ].map(n => {
                                        const pct = Math.min(100, Math.round((n.value / n.daily) * 100));
                                        const barColor = n.color;
                                        const NIcon = n.icon;
                                        return (
                                            <View key={n.key} style={styles.numberRow}>
                                                <View style={[styles.numberIconBox, { backgroundColor: `${barColor}15` }]}>
                                                    <NIcon size={14} color={barColor} />
                                                </View>
                                                <View style={styles.numberInfo}>
                                                    <View style={styles.numberTopRow}>
                                                        <Text style={styles.numberLabel}>{n.label}</Text>
                                                        <Text style={styles.numberValue}>
                                                            {n.unit === 'mg' ? Math.round(n.value) : n.value.toFixed(1)}{n.unit}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.numberBarTrack}>
                                                        <View style={[styles.numberBarFill, {
                                                            width: `${pct}%`,
                                                            backgroundColor: pct > 50 ? (n.key === 'fiber' || n.key === 'proteins' ? colors.chart1 : colors.chart3) : barColor,
                                                        }]} />
                                                    </View>
                                                    <Text style={styles.numberPct}>{pct}% of daily intake</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* Score Breakdown — if available */}
                        {breakdown && (
                            <View style={styles.breakdownSection}>
                                <Text style={styles.sectionLabel}>HOW THE SCORE IS CALCULATED</Text>

                                <View style={styles.breakdownCard}>
                                    {/* Positive Points */}
                                    <View style={styles.bGroupHeader}>
                                        <TrendingUp size={14} color={colors.chart1} />
                                        <Text style={[styles.bGroupTitle, { color: colors.chart1 }]}>Good nutrients</Text>
                                        <View style={[styles.bGroupBadge, { backgroundColor: `${colors.chart1}15` }]}>
                                            <Text style={[styles.bGroupBadgeText, { color: colors.chart1 }]}>+{posTotal}</Text>
                                        </View>
                                    </View>
                                    {breakdown.positives && Object.entries(breakdown.positives).map(([key, val]) => (
                                        <View key={key} style={styles.bRow}>
                                            <Text style={styles.bLabel}>
                                                {key === 'fruitVeg' ? 'Fruits & Veg' : key.charAt(0).toUpperCase() + key.slice(1)}
                                            </Text>
                                            <View style={styles.bBarTrack}>
                                                <View style={[styles.bBarFill, {
                                                    width: `${Math.min(100, (val.points / (val.max || 5)) * 100)}%`,
                                                    backgroundColor: colors.chart1,
                                                }]} />
                                            </View>
                                            <Text style={[styles.bPoints, { color: colors.chart1 }]}>{val.points}</Text>
                                        </View>
                                    ))}

                                    <View style={styles.bDivider} />

                                    {/* Negative Points */}
                                    <View style={styles.bGroupHeader}>
                                        <TrendingDown size={14} color={colors.chart3} />
                                        <Text style={[styles.bGroupTitle, { color: colors.chart3 }]}>Nutrients to limit</Text>
                                        <View style={[styles.bGroupBadge, { backgroundColor: `${colors.chart3}15` }]}>
                                            <Text style={[styles.bGroupBadgeText, { color: colors.chart3 }]}>-{negTotal}</Text>
                                        </View>
                                    </View>
                                    {breakdown.negatives && Object.entries(breakdown.negatives).map(([key, val]) => (
                                        <View key={key} style={styles.bRow}>
                                            <Text style={styles.bLabel}>
                                                {key === 'saturates' ? 'Sat. fat' : key === 'sodium' ? 'Salt' : key.charAt(0).toUpperCase() + key.slice(1)}
                                            </Text>
                                            <View style={styles.bBarTrack}>
                                                <View style={[styles.bBarFill, {
                                                    width: `${Math.min(100, (val.points / (val.max || 10)) * 100)}%`,
                                                    backgroundColor: val.points >= 6 ? colors.chart3 : colors.chart2,
                                                }]} />
                                            </View>
                                            <Text style={[styles.bPoints, { color: val.points >= 6 ? colors.chart3 : colors.chart2 }]}>{val.points}</Text>
                                        </View>
                                    ))}

                                    {/* Final */}
                                    <View style={styles.bFinalRow}>
                                        <Text style={styles.bFinalLabel}>Final Score</Text>
                                        <View style={[styles.bFinalBadge, { backgroundColor: g.color }]}>
                                            <Text style={styles.bFinalScore}>{rawScore}</Text>
                                        </View>
                                        <View style={[styles.bFinalGrade, { backgroundColor: g.color }]}>
                                            <Text style={styles.bFinalGradeText}>{grade}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* What is Nutri-Score */}
                        <View style={styles.explainerBox}>
                            <Award size={18} color={colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.explainerTitle}>What is Nutri-Score?</Text>
                                <Text style={styles.explainerText}>
                                    Nutri-Score is a scientifically validated system developed by Santé Publique France, adopted across the EU.{'\n\n'}
                                    It rates food from <Text style={{ fontFamily: fonts.sansBold, color: '#038141' }}>A</Text> (healthiest) to <Text style={{ fontFamily: fonts.sansBold, color: '#E63E11' }}>E</Text> (least healthy) based on nutritional composition per 100g.{'\n\n'}
                                    <Text style={{ fontFamily: fonts.sansBold, color: colors.foreground }}>Good nutrients</Text> (fiber, protein, fruit-veg content) earn positive points.{'\n'}
                                    <Text style={{ fontFamily: fonts.sansBold, color: colors.foreground }}>Nutrients to limit</Text> (calories, sugars, saturated fat, sodium) earn negative points.{'\n\n'}
                                    The final score is: <Text style={{ fontFamily: fonts.sansMedium }}>negative − positive points</Text>. Lower = better grade.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Done button */}
                    <View style={styles.footer}>
                        <Pressable style={styles.doneBtn} onPress={onClose}>
                            <CheckCircle size={18} color={colors.primaryForeground} />
                            <Text style={styles.doneBtnText}>Got it</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    overlayTouch: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: radius['3xl'],
        borderTopRightRadius: radius['3xl'],
        maxHeight: '88%',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: { flex: 1 },
    headerTitle: {
        fontSize: 20,
        fontFamily: fonts.heading,
        color: colors.foreground,
    },
    headerSubtitle: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
        padding: spacing[5],
        paddingBottom: spacing[2],
        gap: spacing[4],
    },

    // Grade Scale
    scaleBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[2],
    },
    scaleItem: {
        alignItems: 'center',
        flex: 1,
    },
    scaleCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scaleLetter: {
        fontSize: 18,
        fontFamily: fonts.heading,
        color: '#fff',
    },
    scaleIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },

    // Verdict
    verdictCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
        borderRadius: radius.xl,
        borderWidth: 1,
    },
    verdictEmoji: { fontSize: 28 },
    verdictGrade: {
        fontSize: 16,
        fontFamily: fonts.heading,
        marginBottom: 3,
    },
    verdictText: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.foreground,
        lineHeight: 18,
        opacity: 0.8,
    },

    // Numbers Section
    numbersSection: {},
    sectionLabel: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
        color: colors.mutedForeground,
        letterSpacing: 1,
        marginBottom: spacing[3],
    },
    numbersGrid: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[3],
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing[2],
    },
    numberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingVertical: 4,
    },
    numberIconBox: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberInfo: { flex: 1 },
    numberTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    numberLabel: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
    numberValue: {
        fontSize: 13,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    numberBarTrack: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    numberBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    numberPct: {
        fontSize: 10,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: 2,
    },

    // Breakdown
    breakdownSection: {},
    breakdownCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border,
    },
    bGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[2],
    },
    bGroupTitle: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sansBold,
    },
    bGroupBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.full,
    },
    bGroupBadgeText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
    },
    bRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingLeft: spacing[4],
        gap: spacing[2],
    },
    bLabel: {
        width: 70,
        fontSize: 12,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    bBarTrack: {
        flex: 1,
        height: 5,
        backgroundColor: colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    bBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    bPoints: {
        width: 20,
        fontSize: 12,
        fontFamily: fonts.sansBold,
        textAlign: 'right',
    },
    bDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing[3],
    },
    bFinalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing[3],
        marginTop: spacing[2],
        gap: spacing[2],
    },
    bFinalLabel: {
        flex: 1,
        fontSize: 15,
        fontFamily: fonts.heading,
        color: colors.foreground,
    },
    bFinalBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    bFinalScore: {
        fontSize: 14,
        fontFamily: fonts.heading,
        color: '#fff',
    },
    bFinalGrade: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bFinalGradeText: {
        fontSize: 16,
        fontFamily: fonts.heading,
        color: '#fff',
    },

    // Explainer
    explainerBox: {
        flexDirection: 'row',
        gap: spacing[3],
        padding: spacing[4],
        backgroundColor: `${colors.primary}08`,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: `${colors.primary}15`,
    },
    explainerTitle: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.primary,
        marginBottom: spacing[1],
    },
    explainerText: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 18,
    },

    // Footer
    footer: {
        paddingHorizontal: spacing[5],
        paddingTop: spacing[3],
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    doneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: radius.xl,
    },
    doneBtnText: {
        fontSize: 16,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
});
