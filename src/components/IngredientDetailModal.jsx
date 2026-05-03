import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from "react-native";
import { useEffect, useRef } from "react";
import {
    X,
    AlertTriangle,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    FlaskConical,
    Scale,
    Sparkles,
    Baby,
    Droplets,
    Zap,
    Leaf,
    Heart,
    Info,
    BookOpen,
    ShieldAlert,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getIngredientInfo } from "@/data/ingredientDatabase";

/**
 * IngredientDetailModal - Shows detailed information about an ingredient
 * Enhanced with: Function labels, Associated Risks row, Exposure Context, Scientific Sources
 * 
 * Usage:
 * <IngredientDetailModal 
 *   visible={showDetail} 
 *   onClose={() => setShowDetail(false)}
 *   ingredientCode="e102" // or ingredientName="tartrazine"
 * />
 */

const SAFETY_CONFIG = {
    'SAFE': {
        icon: CheckCircle2,
        color: colors.chart1,
        bgColor: `${colors.chart1}15`,
        borderColor: `${colors.chart1}30`,
        label: 'Good'
    },
    'CAUTION': {
        icon: AlertCircle,
        color: '#F59E0B',
        bgColor: '#FEF3C715',
        borderColor: '#FEF3C730',
        label: 'Caution'
    },
    'AVOID': {
        icon: AlertTriangle,
        color: '#EF4444',
        bgColor: '#FEE2E215',
        borderColor: '#FEE2E230',
        label: 'Avoid'
    },
    'CRITICAL': {
        icon: AlertTriangle,
        color: '#DC2626',
        bgColor: '#FEE2E230',
        borderColor: '#FEE2E250',
        label: 'Critical'
    }
};

// Risk type → icon + color mapping for the "Associated Risks" row
const RISK_CONFIG = {
    'Potential endocrine disruptor': { icon: Zap, color: '#8B5CF6', label: 'Endocrine' },
    'Potential allergen': { icon: ShieldAlert, color: '#F59E0B', label: 'Allergen' },
    'Irritant': { icon: Droplets, color: '#EF4444', label: 'Irritant' },
    'Pollutant': { icon: Leaf, color: '#6B7280', label: 'Pollutant' },
};

export default function IngredientDetailModal({ visible, onClose, ingredientCode, ingredientName }) {
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

    // Get ingredient data
    const info = getIngredientInfo(ingredientCode || ingredientName);

    if (!info) return null;

    const safetyConfig = SAFETY_CONFIG[info.safetyLevel] || SAFETY_CONFIG['CAUTION'];
    const SafetyIcon = safetyConfig.icon;

    // Parse multi-paragraph scientific evidence
    const evidenceParagraphs = info.scientificEvidence
        ? info.scientificEvidence.split('\n\n').filter(p => p.trim())
        : [];

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
                        <View style={{ flex: 1 }}>
                            <Text style={styles.expertTag}>EXPERT ANALYSIS</Text>
                            <Text style={styles.headerTitle} numberOfLines={2}>
                                {info.name}
                            </Text>
                            {/* Show E-number if the ingredient code starts with 'e' */}
                            {ingredientCode && /^e\d+/i.test(ingredientCode) && (
                                <View style={styles.eCodeHeaderBadge}>
                                    <Text style={styles.eCodeHeaderText}>{ingredientCode.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={22} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Safety Level Badge / Expert Verdict */}
                        <View style={styles.expertVerdictSection}>
                            <Text style={styles.expertVerdictLabel}>Expert Verdict</Text>
                            <View style={[
                                styles.safetyBadge,
                                {
                                    backgroundColor: safetyConfig.bgColor,
                                    borderColor: safetyConfig.borderColor,
                                }
                            ]}>
                                <SafetyIcon size={20} color={safetyConfig.color} />
                                <Text style={[styles.safetyText, { color: safetyConfig.color }]}>
                                    {safetyConfig.label}
                                </Text>
                            </View>
                        </View>

                        {/* What it actually is (Function) */}
                        {info.function && (
                            <View style={styles.functionSection}>
                                <Text style={styles.functionLabel}>What it actually is</Text>
                                <Text style={styles.functionText}>{info.function}</Text>
                            </View>
                        )}

                        {/* Category (shown only if no function) */}
                        {!info.function && (
                            <View style={styles.categorySection}>
                                <Text style={styles.categoryLabel}>Category</Text>
                                <Text style={styles.categoryValue}>{info.category}</Text>
                            </View>
                        )}

                        {/* Associated Risks Row — NEW */}
                        {info.associatedRisks && info.associatedRisks.length > 0 && (
                            <View style={styles.risksSection}>
                                <Text style={styles.risksSectionLabel}>Associated Risks</Text>
                                <View style={styles.risksRow}>
                                    {info.associatedRisks.map((risk, index) => {
                                        const config = RISK_CONFIG[risk];
                                        if (!config) return null;
                                        const RiskIcon = config.icon;
                                        return (
                                            <View key={index} style={[styles.riskChip, { borderColor: `${config.color}30` }]}>
                                                <RiskIcon size={14} color={config.color} />
                                                <Text style={[styles.riskChipText, { color: config.color }]}>
                                                    {config.label}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* Concerns */}
                        {info.concerns && info.concerns.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <AlertTriangle size={18} color={colors.destructive} />
                                    <Text style={styles.sectionTitle}>Health Concerns</Text>
                                </View>
                                <View style={styles.concernsList}>
                                    {info.concerns.map((concern, index) => (
                                        <View key={index} style={styles.concernItem}>
                                            <View style={styles.concernDot} />
                                            <Text style={styles.concernText}>{concern}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Scientific Evidence — Enhanced with multi-paragraph support */}
                        {evidenceParagraphs.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <FlaskConical size={18} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>The Science</Text>
                                </View>
                                {evidenceParagraphs.map((paragraph, index) => (
                                    <Text key={index} style={[
                                        styles.evidenceText,
                                        index < evidenceParagraphs.length - 1 && { marginBottom: spacing[3] }
                                    ]}>
                                        {paragraph}
                                    </Text>
                                ))}
                            </View>
                        )}

                        {/* Scientific Sources — Enhanced with year + title */}
                        {info.sources && info.sources.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <BookOpen size={18} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>Scientific Sources</Text>
                                </View>
                                <View style={styles.sourcesList}>
                                    {info.sources.map((source, index) => (
                                        <View key={index} style={styles.sourceItem}>
                                            <View style={styles.sourceBullet}>
                                                <Text style={styles.sourceBulletText}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.sourceText}>{source}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Exposure Context — NEW */}
                        {info.exposureContext && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Info size={18} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>Exposure Context</Text>
                                </View>
                                <View style={styles.exposureCard}>
                                    <Text style={styles.exposureText}>{info.exposureContext}</Text>
                                </View>
                            </View>
                        )}

                        {/* Healthier Alternatives */}
                        {info.alternatives && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Sparkles size={18} color={colors.chart1} />
                                    <Text style={styles.sectionTitle}>Alternatives</Text>
                                </View>
                                <Text style={styles.alternativesText}>{info.alternatives}</Text>
                            </View>
                        )}

                        {/* Age-Specific Guidance */}
                        {info.ageRestrictions && Object.keys(info.ageRestrictions).length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Baby size={18} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>Age-Specific Guidance</Text>
                                </View>
                                <View style={styles.ageRestrictionsGrid}>
                                    {Object.entries(info.ageRestrictions).map(([age, level]) => (
                                        <View key={age} style={styles.ageRestrictionItem}>
                                            <Text style={styles.ageLabel}>
                                                {age.charAt(0).toUpperCase() + age.slice(1)}
                                            </Text>
                                            <View style={[
                                                styles.ageLevelBadge,
                                                { backgroundColor: getLevelColor(level) }
                                            ]}>
                                                <Text style={styles.ageLevelText}>{level}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Regulatory Status */}
                        {info.regulatoryStatus && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Scale size={18} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>Regulatory Status</Text>
                                </View>
                                <View style={styles.regulatoryGrid}>
                                    {Object.entries(info.regulatoryStatus).map(([region, status]) => (
                                        <View key={region} style={styles.regulatoryItem}>
                                            <Text style={styles.regionLabel}>{region}</Text>
                                            <Text style={styles.statusText}>{status}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Also Known As */}
                        {info.aliases && info.aliases.length > 0 && (
                            <View style={styles.aliasesSection}>
                                <Text style={styles.aliasesLabel}>Also known as:</Text>
                                <Text style={styles.aliasesText}>
                                    {info.aliases.join(', ')}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

function getLevelColor(level) {
    const colors = {
        'SAFE': '#10B98120',
        'CAUTION': '#F59E0B20',
        'AVOID': '#EF444420',
        'CRITICAL': '#DC262620'
    };
    return colors[level] || colors['CAUTION'];
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
        alignItems: 'flex-start',
        padding: spacing[5],
        paddingBottom: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        paddingRight: spacing[2],
        lineHeight: 28,
    },
    expertTag: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    eCodeHeaderBadge: {
        alignSelf: 'flex-start',
        marginTop: spacing[2],
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    eCodeHeaderText: {
        fontSize: 12,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        letterSpacing: 0.5,
    },
    closeButton: {
        padding: spacing[1],
    },
    scrollView: {
        flex: 1,
    },
    expertVerdictSection: {
        marginHorizontal: spacing[5],
        marginTop: spacing[4],
        marginBottom: spacing[2],
    },
    expertVerdictLabel: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing[2],
    },
    safetyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: spacing[2],
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        borderRadius: radius.lg,
        borderWidth: 1.5,
    },
    safetyText: {
        fontSize: 15,
        fontFamily: fonts.sans.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Function section (What it actually is)
    functionSection: {
        marginHorizontal: spacing[5],
        marginBottom: spacing[4],
        marginTop: spacing[3],
        backgroundColor: `${colors.primary}05`,
        padding: spacing[4],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: `${colors.primary}15`,
    },
    functionLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing[2],
    },
    functionText: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
        lineHeight: 22,
    },
    categorySection: {
        marginHorizontal: spacing[5],
        marginBottom: spacing[4],
        alignItems: 'center',
    },
    categoryLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing[1],
    },
    categoryValue: {
        fontSize: 14,
        fontFamily: fonts.sans.semibold,
        color: colors.foreground,
    },
    // Associated Risks row
    risksSection: {
        marginHorizontal: spacing[5],
        marginBottom: spacing[4],
    },
    risksSectionLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        color: colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing[2],
    },
    risksRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
    },
    riskChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1] + 2,
        borderRadius: radius.full,
        borderWidth: 1,
        backgroundColor: `${colors.accent}40`,
    },
    riskChipText: {
        fontSize: 12,
        fontFamily: fonts.sans.semibold,
    },
    section: {
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[4],
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    concernsList: {
        gap: spacing[2],
    },
    concernItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
    },
    concernDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.destructive,
        marginTop: 7,
    },
    concernText: {
        flex: 1,
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 20,
    },
    evidenceText: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 21,
    },
    // Enhanced sources with numbered bullets
    sourcesList: {
        gap: spacing[2],
    },
    sourceItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
    },
    sourceBullet: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: `${colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    sourceBulletText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
    },
    sourceText: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    // Exposure context card
    exposureCard: {
        backgroundColor: `${colors.primary}08`,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: `${colors.primary}15`,
        padding: spacing[3],
    },
    exposureText: {
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
        lineHeight: 20,
    },
    alternativesText: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.chart1,
        lineHeight: 20,
    },
    ageRestrictionsGrid: {
        gap: spacing[2],
    },
    ageRestrictionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ageLabel: {
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    ageLevelBadge: {
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: radius.sm,
    },
    ageLevelText: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    regulatoryGrid: {
        gap: spacing[2],
    },
    regulatoryItem: {
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    regionLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
        marginBottom: 2,
    },
    statusText: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    aliasesSection: {
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[4],
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    aliasesLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        marginBottom: spacing[1],
    },
    aliasesText: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        fontStyle: 'italic',
    },
});
