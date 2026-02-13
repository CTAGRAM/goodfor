import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Crown,
    QrCode,
    UserPlus,
    ShieldCheck,
    Sparkles,
    Brain,
    Check,
    ArrowRight
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

const PREMIUM_BENEFITS = [
    {
        icon: QrCode,
        title: 'Unlimited scans',
        description: 'Scan any product, anytime'
    },
    {
        icon: Brain,
        title: 'AI-powered insights',
        description: 'Detailed ingredient analysis'
    },
    {
        icon: UserPlus,
        title: 'Family profiles',
        description: 'Up to 5 family members'
    },
    {
        icon: ShieldCheck,
        title: 'Advanced safety alerts',
        description: 'Personalized health warnings'
    },
    {
        icon: Sparkles,
        title: 'Detailed explanations',
        description: 'Why ingredients are flagged'
    }
];

export default function SubscriptionOffer() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { purchasePackage, offerings, isLoading, isPro } = useRevenueCat();
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('annual');

    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Subtle pulsing animation for CTA
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // If already Pro, skip to profile setup
    useEffect(() => {
        if (isPro) {
            router.replace('/onboarding/family-profiles');
        }
    }, [isPro]);

    const handleSubscribe = async () => {
        if (purchasing) return;
        setPurchasing(true);

        try {
            // Get the appropriate package
            const packageToGet = selectedPlan === 'annual'
                ? offerings?.current?.annual
                : offerings?.current?.monthly;

            if (packageToGet) {
                const success = await purchasePackage(packageToGet);
                if (success) {
                    router.replace('/onboarding/family-profiles');
                }
            } else {
                // Fallback to paywall if offerings not loaded
                router.push('/paywall');
            }
        } catch (error) {
            console.error('[SubscriptionOffer] Purchase error:', error);
        } finally {
            setPurchasing(false);
        }
    };

    const handleSkip = () => {
        // Continue with free tier
        router.replace('/onboarding/family-profiles');
    };

    const annualPrice = offerings?.current?.annual?.product?.priceString || '£39.99';
    const monthlyPrice = offerings?.current?.monthly?.product?.priceString || '£4.99';

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background decorations */}
            <View style={styles.blurTopRight} />
            <View style={styles.blurBottomLeft} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.crownBadge}>
                        <Crown size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.headerLabel}>GOODFOR PRO</Text>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Unlock the full{'\n'}GoodFor experience</Text>
                    <Text style={styles.subtitle}>
                        Get unlimited access to all premium features
                    </Text>
                </View>

                {/* Benefits List */}
                <View style={styles.benefitsSection}>
                    {PREMIUM_BENEFITS.map((benefit, index) => {
                        const Icon = benefit.icon;
                        return (
                            <View key={index} style={styles.benefitRow}>
                                <View style={styles.benefitIcon}>
                                    <Icon size={20} color={colors.primary} />
                                </View>
                                <View style={styles.benefitContent}>
                                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                                </View>
                                <View style={styles.checkIcon}>
                                    <Check size={18} color={colors.chart1} strokeWidth={3} />
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Plan Selection */}
                <View style={styles.plansSection}>
                    {/* Annual Plan */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'annual' && styles.planCardSelected
                        ]}
                        onPress={() => setSelectedPlan('annual')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.saveBadge}>
                            <Text style={styles.saveBadgeText}>SAVE 40%</Text>
                        </View>
                        <View style={styles.planRadio}>
                            {selectedPlan === 'annual' && <View style={styles.planRadioInner} />}
                        </View>
                        <View style={styles.planInfo}>
                            <Text style={styles.planName}>Annual</Text>
                            <Text style={styles.planSubtitle}>Best value</Text>
                        </View>
                        <View style={styles.planPricing}>
                            <Text style={styles.planPrice}>{annualPrice}</Text>
                            <Text style={styles.planPeriod}>/year</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Monthly Plan */}
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'monthly' && styles.planCardSelected
                        ]}
                        onPress={() => setSelectedPlan('monthly')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.planRadio}>
                            {selectedPlan === 'monthly' && <View style={styles.planRadioInner} />}
                        </View>
                        <View style={styles.planInfo}>
                            <Text style={styles.planName}>Monthly</Text>
                            <Text style={styles.planSubtitle}>Flexible</Text>
                        </View>
                        <View style={styles.planPricing}>
                            <Text style={styles.planPrice}>{monthlyPrice}</Text>
                            <Text style={styles.planPeriod}>/month</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Free Tier Info */}
                <View style={styles.freeInfo}>
                    <Text style={styles.freeInfoText}>
                        Free tier: 10 scans/month • Basic safety scores
                    </Text>
                </View>
            </ScrollView>

            {/* Fixed Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
                    <TouchableOpacity
                        style={[styles.subscribeButton, purchasing && styles.subscribeButtonLoading]}
                        onPress={handleSubscribe}
                        disabled={purchasing || isLoading}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.subscribeButtonText}>
                            {purchasing ? 'Processing...' : 'Start Pro Subscription'}
                        </Text>
                        {!purchasing && <ArrowRight size={20} color={colors.primaryForeground} />}
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>Continue with free tier</Text>
                </TouchableOpacity>

                <Text style={styles.termsText}>
                    Cancel anytime. Terms & conditions apply.
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
    blurTopRight: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 250,
        height: 250,
        backgroundColor: colors.accent,
        opacity: 0.4,
        borderRadius: 125,
    },
    blurBottomLeft: {
        position: 'absolute',
        bottom: 100,
        left: -80,
        width: 180,
        height: 180,
        backgroundColor: colors.chart1,
        opacity: 0.08,
        borderRadius: 90,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[5],
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    crownBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[3],
    },
    headerLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        letterSpacing: 2,
        color: colors.primary,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: spacing[6],
    },
    title: {
        fontSize: 28,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        textAlign: 'center',
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginTop: spacing[2],
    },
    benefitsSection: {
        gap: spacing[3],
        marginBottom: spacing[6],
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border,
    },
    benefitIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    benefitContent: {
        flex: 1,
        marginLeft: spacing[3],
    },
    benefitTitle: {
        fontSize: 15,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    benefitDescription: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    checkIcon: {
        marginLeft: spacing[2],
    },
    plansSection: {
        gap: spacing[3],
        marginBottom: spacing[4],
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        borderWidth: 2,
        borderColor: colors.border,
        position: 'relative',
        overflow: 'hidden',
    },
    planCardSelected: {
        borderColor: colors.primary,
        backgroundColor: `${colors.accent}40`,
    },
    saveBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.chart1,
        paddingHorizontal: spacing[2],
        paddingVertical: 4,
        borderBottomLeftRadius: radius.lg,
    },
    saveBadgeText: {
        fontSize: 9,
        fontFamily: fonts.sans.bold,
        color: '#fff',
        letterSpacing: 0.5,
    },
    planRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    planRadioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    planSubtitle: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    planPricing: {
        alignItems: 'flex-end',
    },
    planPrice: {
        fontSize: 20,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    planPeriod: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    freeInfo: {
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    freeInfoText: {
        fontSize: 12,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing[5],
        paddingTop: spacing[4],
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    subscribeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
    },
    subscribeButtonLoading: {
        opacity: 0.7,
    },
    subscribeButtonText: {
        fontSize: 17,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    skipButton: {
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 14,
        fontFamily: fonts.sans.semibold,
        color: colors.mutedForeground,
    },
    termsText: {
        fontSize: 10,
        fontFamily: fonts.sans.regular,
        color: `${colors.mutedForeground}80`,
        textAlign: 'center',
    },
});
