import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
    X,
    QrCode,
    UserPlus,
    ShieldCheck,
    CheckCircle,
    Users,
    ArrowRight,
    Settings,
    Calendar,
    CreditCard
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

export default function Subscription() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isPro, customerInfo, restorePurchases, isLoading } = useRevenueCat();

    // If user is Pro, show the subscribed view
    if (isPro) {
        return <SubscribedView insets={insets} router={router} customerInfo={customerInfo} />;
    }

    // Otherwise show the upgrade view
    return <UpgradeView insets={insets} router={router} />;
}

// Component for subscribed users
function SubscribedView({ insets, router, customerInfo }) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    // Get subscription details from customerInfo
    const activeEntitlement = customerInfo?.entitlements?.active?.['GoodFor Pro'];
    const expirationDate = activeEntitlement?.expirationDate
        ? new Date(activeEntitlement.expirationDate)
        : null;
    const purchaseDate = activeEntitlement?.originalPurchaseDate
        ? new Date(activeEntitlement.originalPurchaseDate)
        : null;

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={{ width: 40 }} />
                <View style={styles.headerCenter} />
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <X size={28} color={colors.mutedForeground} />
                </TouchableOpacity>
            </View>

            {/* Main Content - Scrollable */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.subscribedContent, { paddingBottom: insets.bottom + 220 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Icon */}
                <View style={styles.successIconContainer}>
                    <Animated.View style={[styles.pulseRing2, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={styles.pulseRing1} />
                    <View style={styles.successIcon}>
                        <CheckCircle size={64} color={colors.primary} />
                    </View>
                </View>

                {/* Title */}
                <View style={styles.successTextContainer}>
                    <Text style={styles.successTitle}>You're all set!</Text>
                    <Text style={styles.successSubtitle}>Your PRO plan is now active.</Text>
                </View>

                {/* Plan Card */}
                <View style={styles.planStatusCard}>
                    <View style={styles.planStatusHeader}>
                        <View style={styles.planStatusIcon}>
                            <Users size={24} color={colors.primary} />
                        </View>
                        <View style={styles.planStatusInfo}>
                            <Text style={styles.planStatusLabel}>CURRENT PLAN</Text>
                            <Text style={styles.planStatusName}>GoodFor PRO</Text>
                        </View>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                    </View>
                </View>

                {/* Subscription Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconWrapper}>
                            <Calendar size={18} color={colors.primary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Subscribed on</Text>
                            <Text style={styles.detailValue}>{formatDate(purchaseDate)}</Text>
                        </View>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                        <View style={styles.detailIconWrapper}>
                            <CreditCard size={18} color={colors.primary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Next renewal</Text>
                            <Text style={styles.detailValue}>{formatDate(expirationDate)}</Text>
                        </View>
                    </View>
                </View>

                {/* Features Grid */}
                <View style={styles.featuresGrid}>
                    <View style={styles.featureGridItem}>
                        <QrCode size={22} color={colors.primary} />
                        <Text style={styles.featureGridTitle}>Unlimited Scans</Text>
                        <Text style={styles.featureGridDesc}>Scan any product</Text>
                    </View>
                    <View style={styles.featureGridItem}>
                        <UserPlus size={22} color={colors.primary} />
                        <Text style={styles.featureGridTitle}>5 Family Slots</Text>
                        <Text style={styles.featureGridDesc}>Add your household</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.subscribedFooter, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={styles.startScanningButton}
                    onPress={() => router.replace('/(tabs)/scan')}
                    activeOpacity={0.9}
                >
                    <Text style={styles.startScanningText}>Start scanning</Text>
                    <ArrowRight size={20} color={colors.primaryForeground} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => router.push('/family-profiles')}
                    activeOpacity={0.9}
                >
                    <Settings size={18} color={colors.primary} />
                    <Text style={styles.manageButtonText}>Manage family profiles</Text>
                </TouchableOpacity>

                <Text style={styles.renewalNote}>Subscription automatically renews</Text>
            </View>
        </View>
    );
}

// Component for non-subscribed users (upgrade view)
function UpgradeView({ insets, router }) {
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

    const handleGoPro = () => {
        router.push('/paywall');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blur */}
            <View style={styles.blurTop} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <View style={styles.closeButtonCircle}>
                        <X size={18} color={colors.mutedForeground} />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerLabel}>PREMIUM</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Upgrade for your family</Text>
                </View>

                {/* Features */}
                <View style={styles.featuresSection}>
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <View key={index} style={styles.featureCard}>
                                <View style={styles.featureIcon}>
                                    <Icon size={22} color={colors.primary} />
                                </View>
                                <View style={styles.featureContent}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDescription}>{feature.description}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Annual Plan Card */}
                <View style={styles.planCard}>
                    <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                    <View style={styles.planContent}>
                        <View style={styles.planLeft}>
                            <Text style={styles.planName}>Annual Plan</Text>
                            <Text style={styles.planSubtitle}>Save 40% annually</Text>
                        </View>
                        <View style={styles.planRight}>
                            <Text style={styles.planPrice}>£39.99</Text>
                            <Text style={styles.planPeriod}>/ year</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={styles.proButton}
                    onPress={handleGoPro}
                    activeOpacity={0.9}
                >
                    <Text style={styles.proButtonText}>Go PRO</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.laterButton} onPress={() => router.back()}>
                    <Text style={styles.laterButtonText}>Maybe later</Text>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    Cancel anytime in your subscription settings.
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
        top: -80,
        right: -80,
        width: 200,
        height: 200,
        backgroundColor: colors.accent,
        opacity: 0.5,
        borderRadius: 100,
    },
    blurBottom: {
        position: 'absolute',
        bottom: -80,
        left: -80,
        width: 180,
        height: 180,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 90,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[3],
    },
    closeButton: {
        padding: spacing[1],
    },
    closeButtonCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        letterSpacing: 2,
        color: colors.primary,
    },

    // Subscribed View Styles
    scrollView: {
        flex: 1,
    },
    subscribedContent: {
        alignItems: 'center',
        paddingHorizontal: spacing[5],
        paddingTop: spacing[6],
    },
    successIconContainer: {
        position: 'relative',
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[6],
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    pulseRing1: {
        position: 'absolute',
        width: 125,
        height: 125,
        borderRadius: 62.5,
        backgroundColor: `${colors.accent}50`,
    },
    pulseRing2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: `${colors.accent}25`,
    },
    successTextContainer: {
        alignItems: 'center',
        marginBottom: spacing[6],
    },
    successTitle: {
        fontSize: 28,
        fontFamily: fonts.heading.bold,
        color: colors.primary,
        marginBottom: spacing[2],
    },
    successSubtitle: {
        fontSize: 16,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    planStatusCard: {
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing[4],
    },
    planStatusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    planStatusIcon: {
        width: 48,
        height: 48,
        borderRadius: radius['2xl'],
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    planStatusInfo: {
        flex: 1,
    },
    planStatusLabel: {
        fontSize: 9,
        fontFamily: fonts.sans.bold,
        letterSpacing: 1.5,
        color: `${colors.primary}99`,
        marginBottom: 2,
    },
    planStatusName: {
        fontSize: 17,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    activeBadge: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        backgroundColor: `${colors.chart1}15`,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: `${colors.chart1}30`,
    },
    activeBadgeText: {
        fontSize: 11,
        fontFamily: fonts.sans.bold,
        color: colors.chart1,
    },
    detailsCard: {
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing[4],
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    detailIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: radius.xl,
        backgroundColor: `${colors.accent}60`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    detailValue: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    detailDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing[3],
    },
    featuresGrid: {
        flexDirection: 'row',
        gap: spacing[3],
        width: '100%',
    },
    featureGridItem: {
        flex: 1,
        backgroundColor: `${colors.card}80`,
        borderRadius: radius['2xl'],
        padding: spacing[4],
        borderWidth: 1,
        borderColor: `${colors.border}60`,
    },
    featureGridTitle: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        marginTop: spacing[2],
    },
    featureGridDesc: {
        fontSize: 10,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    subscribedFooter: {
        paddingHorizontal: spacing[5],
        paddingTop: spacing[4],
        backgroundColor: colors.background,
    },
    startScanningButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
    },
    startScanningText: {
        fontSize: 17,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.secondary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
        marginTop: spacing[3],
    },
    manageButtonText: {
        fontSize: 15,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
    },
    renewalNote: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        letterSpacing: 1,
        color: `${colors.mutedForeground}80`,
        textAlign: 'center',
        textTransform: 'uppercase',
        marginTop: spacing[4],
    },

    // Upgrade View Styles
    mainContent: {
        flex: 1,
        paddingHorizontal: spacing[5],
    },
    titleSection: {
        alignItems: 'center',
        marginTop: spacing[4],
        marginBottom: spacing[6],
    },
    title: {
        fontSize: 26,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        textAlign: 'center',
    },
    featuresSection: {
        gap: spacing[3],
        marginBottom: spacing[6],
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[4],
        backgroundColor: `${colors.accent}60`,
        borderRadius: radius['2xl'],
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    planCard: {
        backgroundColor: colors.primary,
        borderRadius: radius['2xl'],
        padding: spacing[5],
        position: 'relative',
        overflow: 'hidden',
    },
    bestValueBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: colors.chart1,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1] + 2,
        borderBottomLeftRadius: radius.xl,
    },
    bestValueText: {
        fontSize: 9,
        fontFamily: fonts.sans.bold,
        color: '#fff',
        letterSpacing: 0.5,
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
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: `${colors.primaryForeground}B3`,
        marginTop: 2,
    },
    planRight: {
        alignItems: 'flex-end',
    },
    planPrice: {
        fontSize: 22,
        fontFamily: fonts.heading.bold,
        color: colors.primaryForeground,
    },
    planPeriod: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: `${colors.primaryForeground}B3`,
    },
    footer: {
        paddingHorizontal: spacing[5],
        paddingTop: spacing[4],
        backgroundColor: colors.background,
    },
    proButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
        alignItems: 'center',
    },
    proButtonText: {
        fontSize: 17,
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
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: `${colors.mutedForeground}99`,
        textAlign: 'center',
        marginTop: spacing[2],
        paddingHorizontal: spacing[4],
        lineHeight: 16,
    },
});
