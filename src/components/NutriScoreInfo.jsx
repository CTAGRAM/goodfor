import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { X, Info, TrendingUp, TrendingDown } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";

/**
 * NutriScoreInfo - Educational modal explaining what Nutri-Score grades mean
 * 
 * Usage:
 * <NutriScoreInfo 
 *   visible={showInfo} 
 *   onClose={() => setShowInfo(false)}
 *   grade="D"
 *   breakdown={nutriScoreBreakdown}
 * />
 */

const NUTRI_SCORE_INFO = {
    'A': {
        label: 'Excellent Nutritional Quality',
        color: '#038141',
        description: 'This product has excellent nutritional value. It is rich in nutrients beneficial to health such as fiber, protein, fruits, vegetables, and legumes. It is low in calories, saturated fats, sugars, and sodium.',
        recommendation: 'Great choice! Consume freely as part of a balanced diet.',
        examples: 'Vegetables, fruits, whole grains, legumes, fish',
    },
    'B': {
        label: 'Good Nutritional Quality',
        color: '#85BB2F',
        description: 'This product has good nutritional value with a favorable balance. It contains beneficial nutrients and has moderate amounts of elements to limit.',
        recommendation: 'Good option. Include regularly in your diet.',
        examples: 'Dairy products, lean meats, certain cereals',
    },
    'C': {
        label: 'Average Nutritional Quality',
        color: '#FECB02',
        description: 'This product has average nutritional quality. It may contain moderate amounts of calories, sugars, saturated fats, or sodium. Balance with healthier options.',
        recommendation: 'Consume in moderation alongside healthier choices.',
        examples: 'Some processed foods, certain snacks',
    },
    'D': {
        label: 'Poor Nutritional Quality',
        color: '#EE8100',
        description: 'This product has poor nutritional quality. It is high in nutrients that should be limited: calories, saturated fats, sugars, or sodium. It is low in beneficial nutrients.',
        recommendation: 'Consider healthier alternatives. Consume occasionally.',
        examples: 'Sugary drinks, sweets, processed meats',
    },
    'E': {
        label: 'Very Poor Nutritional Quality',
        color: '#E63E11',
        description: 'This product has very poor nutritional quality. It is very high in calories, saturated fats, sugars, or sodium, and very low in beneficial nutrients.',
        recommendation: 'Choose healthier alternatives. Limit consumption significantly.',
        examples: 'Highly processed foods, candy, sugary cereals',
    },
};

export default function NutriScoreInfo({ visible, onClose, grade, breakdown }) {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    if (!grade) return null;

    const info = NUTRI_SCORE_INFO[grade] || NUTRI_SCORE_INFO['C'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <TouchableOpacity
                    style={styles.overlayTouch}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View style={[
                    styles.modal,
                    { transform: [{ scale: scaleAnim }] }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Info size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.headerTitle}>Understanding Nutri-Score</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={22} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Grade Badge */}
                        <View style={styles.gradeSection}>
                            <View style={[styles.gradeBadge, { backgroundColor: info.color }]}>
                                <Text style={styles.gradeText}>{grade}</Text>
                            </View>
                            <Text style={styles.gradeLabel}>{info.label}</Text>
                        </View>

                        {/* Description */}
                        <View style={styles.section}>
                            <Text style={styles.description}>{info.description}</Text>
                        </View>

                        {/* Recommendation */}
                        <View style={[styles.recommendationCard, { borderLeftColor: info.color }]}>
                            <Text style={styles.recommendationText}>{info.recommendation}</Text>
                        </View>

                        {/* Breakdown if available */}
                        {breakdown && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>How it's calculated</Text>
                                <View style={styles.breakdownCard}>
                                    {/* Positive Points */}
                                    {breakdown.positive > 0 && (
                                        <View style={styles.breakdownRow}>
                                            <TrendingUp size={16} color={colors.chart1} />
                                            <Text style={styles.breakdownLabel}>Positive points</Text>
                                            <Text style={[styles.breakdownValue, { color: colors.chart1 }]}>
                                                +{breakdown.positive}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Negative Points */}
                                    {breakdown.negative > 0 && (
                                        <View style={styles.breakdownRow}>
                                            <TrendingDown size={16} color={colors.destructive} />
                                            <Text style={styles.breakdownLabel}>Negative points</Text>
                                            <Text style={[styles.breakdownValue, { color: colors.destructive }]}>
                                                -{breakdown.negative}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.breakdownDivider} />

                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabelBold}>Final Score</Text>
                                        <Text style={styles.breakdownValueBold}>{breakdown.rawScore}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Examples */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Typical products</Text>
                            <Text style={styles.examples}>{info.examples}</Text>
                        </View>

                        {/* All Grades Reference */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nutri-Score scale</Text>
                            <View style={styles.scaleContainer}>
                                {Object.entries(NUTRI_SCORE_INFO).map(([gradeKey, gradeInfo]) => (
                                    <View
                                        key={gradeKey}
                                        style={[
                                            styles.scaleItem,
                                            gradeKey === grade && styles.scaleItemActive
                                        ]}
                                    >
                                        <View style={[styles.scaleBadge, { backgroundColor: gradeInfo.color }]}>
                                            <Text style={styles.scaleGrade}>{gradeKey}</Text>
                                        </View>
                                        <Text style={styles.scaleLabel} numberOfLines={2}>
                                            {gradeInfo.label.replace(' Nutritional Quality', '')}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Source */}
                        <View style={styles.sourceSection}>
                            <Text style={styles.sourceText}>
                                Based on the EU Nutri-Score algorithm{'\n'}
                                Source: Santé Publique France
                            </Text>
                        </View>
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
    },
    overlayTouch: {
        ...StyleSheet.absoluteFillObject,
    },
    modal: {
        backgroundColor: colors.background,
        borderRadius: radius['3xl'],
        width: '100%',
        maxWidth: 440,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        marginRight: spacing[3],
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    closeButton: {
        padding: spacing[1],
    },
    scrollView: {
        flex: 1,
    },
    gradeSection: {
        alignItems: 'center',
        paddingVertical: spacing[6],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    gradeBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[3],
    },
    gradeText: {
        fontSize: 36,
        fontFamily: fonts.heading.bold,
        color: '#fff',
    },
    gradeLabel: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        textAlign: 'center',
    },
    section: {
        padding: spacing[5],
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        marginBottom: spacing[3],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 15,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 22,
    },
    recommendationCard: {
        marginHorizontal: spacing[5],
        marginBottom: spacing[4],
        padding: spacing[4],
        backgroundColor: `${colors.accent}40`,
        borderRadius: radius.xl,
        borderLeftWidth: 4,
    },
    recommendationText: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
        lineHeight: 20,
    },
    breakdownCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border,
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[2],
    },
    breakdownLabel: {
        flex: 1,
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginLeft: spacing[2],
    },
    breakdownLabelBold: {
        flex: 1,
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    breakdownValue: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
    },
    breakdownValueBold: {
        fontSize: 16,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing[2],
    },
    examples: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        fontStyle: 'italic',
    },
    scaleContainer: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    scaleItem: {
        flex: 1,
        alignItems: 'center',
        opacity: 0.6,
    },
    scaleItemActive: {
        opacity: 1,
    },
    scaleBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
    },
    scaleGrade: {
        fontSize: 18,
        fontFamily: fonts.heading.bold,
        color: '#fff',
    },
    scaleLabel: {
        fontSize: 10,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
    sourceSection: {
        padding: spacing[5],
        paddingTop: spacing[2],
    },
    sourceText: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: `${colors.mutedForeground}80`,
        textAlign: 'center',
        lineHeight: 16,
    },
});
