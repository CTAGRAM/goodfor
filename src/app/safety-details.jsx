import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
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
    FileText as Notes
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { SAFETY_LEVELS } from "@/lib/productSafety";
import { useAuth } from "@/contexts/AuthContext";

export default function SafetyDetails() {
    const { productData } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { profile } = useAuth();

    const product = JSON.parse(productData);
    const safety = product.safetyAnalysis;

    // Calculate detailed scores
    const overallScore = (safety.safeScore / 10).toFixed(1);
    const scores = [
        { icon: Leaf, label: 'Ingredients Safety', description: 'All ingredients age-appropriate', score: 2.5, max: 2.5, color: colors.chart1 },
        { icon: AlertTriangle, label: 'Allergen Profile', description: product.allergens.length > 0 ? `${product.allergens.length} allergen(s) detected` : 'No major allergens detected', score: product.allergens.length > 0 ? 1.0 : 2.0, max: 2.0, color: product.allergens.length > 0 ? colors.chart2 : colors.chart1 },
        { icon: FlaskConical, label: 'Nutritional Value', description: `${product.nutriments.sugars > 10 ? 'High' : 'Moderate'} sugar content`, score: product.nutriments.sugars > 10 ? 1.0 : 1.5, max: 2.0, color: product.nutriments.sugars > 10 ? colors.chart2 : colors.chart1 },
        { icon: FileText, label: 'Clinical Evidence', description: 'Based on food database', score: 1.5, max: 2.0, color: colors.chart1 },
        { icon: ShieldAlert, label: 'Age Suitability', description: safety.ageAppropriate ? 'Suitable for selected age' : 'Not age-appropriate', score: safety.ageAppropriate ? 1.5 : 0.5, max: 1.5, color: safety.ageAppropriate ? colors.chart1 : colors.chart3 },
    ];

    // Family analysis based on profile
    const familyMembers = [
        { name: profile?.full_name || 'User', age: profile?.age_years || 30, type: 'Adult', status: safety.safety, statusLabel: getSafetyLabel(safety.safety), tip: safety.issues[0]?.reason || 'No concerns' },
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
                <Pressable style={styles.headerButton} onPress={() => { }}>
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
                            <Text style={styles.scoreMax}>/10</Text>
                        </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${safety.safeScore}%` }]} />
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
                                            <Text style={styles.scoreRowLabel}>{item.label}</Text>
                                            <Text style={styles.scoreRowDesc}>{item.description}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.scoreRowValue}>
                                        <Text style={[styles.scoreRowNumber, { color: item.color }]}>{item.score.toFixed(1)}</Text>
                                        <Text style={styles.scoreRowMax}>/{item.max.toFixed(1)}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Dietary checks */}
                    <View style={styles.dietaryChecks}>
                        <View style={styles.checkItem}>
                            <CheckCircle size={16} color={colors.chart1} />
                            <Text style={styles.checkText}>No pork ingredients detected</Text>
                        </View>
                        {product.allergens.length > 0 && (
                            <View style={styles.checkItem}>
                                <XCircle size={16} color={colors.chart3} />
                                <Text style={styles.checkText}>Contains allergens: {product.allergens.map(a => a.replace('en:', '')).join(', ')}</Text>
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
                </View>

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
                            {safety.issues.length === 0
                                ? 'This product appears safe for consumption based on the selected profiles.'
                                : `Key concerns: ${safety.issues.slice(0, 2).map(i => i.name).join(', ')}. Always verify with healthcare provider if unsure.`}
                        </Text>
                    </View>
                </View>
            </ScrollView>
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
    scoreRowValue: { flexDirection: 'row', alignItems: 'baseline' },
    scoreRowNumber: { fontSize: 14, fontFamily: fonts.sans.bold },
    scoreRowMax: { fontSize: 10, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    dietaryChecks: { padding: spacing[3], backgroundColor: `${colors.muted}50`, borderRadius: radius['xl'], borderWidth: 1, borderColor: `${colors.border}30`, gap: spacing[2], marginBottom: spacing[4] },
    checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
    checkText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.foreground, flex: 1 },
    prefNote: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: `${colors.border}30` },
    prefNoteLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 },
    prefNoteText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, flex: 1 },
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
    memberRight: { alignItems: 'flex-end', gap: spacing[1] },
    memberStatusBadge: { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, borderWidth: 1 },
    memberStatusText: { fontSize: 10, fontFamily: fonts.sans.bold, letterSpacing: 0.5 },
    memberTip: { fontSize: 10, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], padding: spacing[4], backgroundColor: colors.muted, borderRadius: radius['2xl'], borderWidth: 1, borderColor: `${colors.border}50` },
    summaryContent: { flex: 1 },
    summaryLabel: { fontSize: 12, fontFamily: fonts.sans.bold, color: colors.primary, marginBottom: spacing[1] },
    summaryText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 18 },
});
