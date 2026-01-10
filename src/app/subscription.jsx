import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    X,
    Sparkles,
    QrCode,
    UserPlus,
    ShieldCheck,
    Check
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";

export default function Subscription() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const features = [
        {
            icon: QrCode,
            title: 'Unlimited scans',
            description: 'Scan as many products as you need every day without limits.'
        },
        {
            icon: UserPlus,
            title: '5 Family profiles',
            description: 'Create individual profiles for each family member\'s needs.'
        },
        {
            icon: ShieldCheck,
            title: 'Advanced safety alerts',
            description: 'Get instant warnings for specific allergens and harmful additives.'
        }
    ];

    const handleStartTrial = () => {
        Alert.alert(
            'Start Free Trial',
            'Start your 7-day free trial and unlock all premium features!',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => router.push('/payment-flow') }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <X size={32} color={colors.mutedForeground} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerLabel}>PREMIUM</Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.iconGlow}>
                        <View style={styles.iconGlowInner} />
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Upgrade for your family</Text>
                    <Text style={styles.subtitle}>
                        Protect your loved ones with our most comprehensive safety features.
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <View key={index} style={styles.featureCard}>
                                <View style={styles.featureIcon}>
                                    <Icon size={24} color={colors.primary} />
                                </View>
                                <View style={styles.featureContent}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDescription}>{feature.description}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Plans */}
                <View style={styles.plansSection}>
                    {/* Annual Plan */}
                    <TouchableOpacity style={styles.annualPlan}>
                        <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>BEST VALUE</Text>
                        </View>
                        <View style={styles.planContent}>
                            <View style={styles.planLeft}>
                                <Text style={styles.planName}>Annual Plan</Text>
                                <Text style={styles.planSubtitle}>Save 40% annually</Text>
                            </View>
                            <View style={styles.planRight}>
                                <Text style={styles.planPrice}>$59.99</Text>
                                <Text style={styles.planPeriod}>/ year</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Monthly Plan */}
                    <TouchableOpacity style={styles.monthlyPlan}>
                        <View style={styles.planContent}>
                            <View style={styles.planLeft}>
                                <Text style={[styles.planName, { color: colors.foreground }]}>Monthly Plan</Text>
                                <Text style={[styles.planSubtitle, { color: colors.mutedForeground }]}>
                                    Flexibility month-to-month
                                </Text>
                            </View>
                            <View style={styles.planRight}>
                                <Text style={[styles.planPrice, { color: colors.foreground }]}>$7.99</Text>
                                <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>/ month</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 48 }]}>
                <View style={styles.footerButtons}>
                    <TouchableOpacity style={styles.startButton} onPress={handleStartTrial}>
                        <Text style={styles.startButtonText}>Start free trial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.laterButton} onPress={() => router.back()}>
                        <Text style={styles.laterButtonText}>Maybe later</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.footerNote}>
                    7-day free trial, then auto-renews. Cancel anytime in your subscription settings.
                </Text>
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
        opacity: 0.4,
        borderRadius: 128,
    },
    blurBottom: {
        position: 'absolute',
        bottom: -96,
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[4],
        zIndex: 10,
    },
    closeButton: {
        padding: spacing[2],
        marginLeft: -spacing[2],
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerLabel: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        letterSpacing: 3,
        color: `${colors.primary}99`,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[6],
    },
    heroSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[8],
    },
    iconGlow: {
        position: 'relative',
        width: 100,
        height: 100,
    },
    iconGlowInner: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: colors.accent,
        opacity: 0.3,
        borderRadius: 50,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    title: {
        fontSize: 24,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        textAlign: 'center',
        paddingHorizontal: spacing[4],
    },
    featuresSection: {
        gap: spacing[4],
        marginBottom: spacing[10],
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[4],
        padding: spacing[4],
        backgroundColor: `${colors.card}80`,
        borderRadius: radius['3xl'],
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: radius['2xl'],
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    featureDescription: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    plansSection: {
        gap: spacing[3],
        marginBottom: spacing[8],
    },
    annualPlan: {
        position: 'relative',
        backgroundColor: colors.primary,
        borderRadius: radius['3xl'],
        padding: spacing[5],
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 2,
        borderColor: colors.primary,
        overflow: 'hidden',
    },
    bestValueBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.chart1,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderBottomLeftRadius: radius['2xl'],
    },
    bestValueText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: colors.background,
        letterSpacing: 1.5,
    },
    planContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    planLeft: {
        flex: 1,
    },
    planName: {
        fontSize: 18,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    planSubtitle: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: `${colors.primaryForeground}B3`,
    },
    planRight: {
        alignItems: 'flex-end',
    },
    planPrice: {
        fontSize: 20,
        fontFamily: fonts.heading.bold,
        color: colors.primaryForeground,
    },
    planPeriod: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: `${colors.primaryForeground}B3`,
    },
    monthlyPlan: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[5],
        borderWidth: 1,
        borderColor: colors.border,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing[6],
        paddingTop: spacing[4],
        backgroundColor: `${colors.background}CC`,
        backdropFilter: 'blur(10px)',
        borderTopWidth: 1,
        borderTopColor: `${colors.border}33`,
    },
    footerButtons: {
        gap: spacing[3],
    },
    startButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    startButtonText: {
        fontSize: 18,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    laterButton: {
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    laterButtonText: {
        fontSize: 14,
        fontFamily: fonts.sans.semiBold,
        color: colors.mutedForeground,
    },
    footerNote: {
        fontSize: 10,
        fontFamily: fonts.sans.regular,
        color: `${colors.mutedForeground}99`,
        textAlign: 'center',
        marginTop: spacing[4],
        paddingHorizontal: spacing[8],
        lineHeight: 16,
    },
});
