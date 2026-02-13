import { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Users,
    ShieldCheck,
    Lock,
    ArrowRight
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

const FIXED_PRICE = "£39.99";

export default function Paywall() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { offerings, isLoading, purchasePackage, isPro } = useRevenueCat();
    const [purchasing, setPurchasing] = useState(false);

    // Handle already subscribed users
    useEffect(() => {
        if (isPro) {
            Alert.alert(
                "Already Subscribed",
                "You already have GoodFor Pro!",
                [{ text: "OK", onPress: () => router.back() }]
            );
        }
    }, [isPro]);

    if (isPro) {
        return null;
    }

    const annualPackage = offerings?.current?.availablePackages?.find(
        pkg => pkg.packageType === "ANNUAL"
    ) || offerings?.current?.availablePackages?.[0];

    const handlePurchase = async () => {
        if (!annualPackage) {
            // More detailed error for debugging
            console.error('[Paywall] No package found. offerings:', {
                hasOfferings: !!offerings,
                current: offerings?.current?.identifier,
                packagesCount: offerings?.current?.availablePackages?.length || 0,
            });
            Alert.alert(
                "Subscription Unavailable",
                "Products are being configured. Please ensure:\n\n1. You have a valid internet connection\n2. The app has been properly installed from the store\n\nIf this persists, contact support."
            );
            return;
        }


        setPurchasing(true);

        try {
            const result = await purchasePackage(annualPackage);

            if (result.success) {
                Alert.alert(
                    "Welcome to PRO!",
                    "You now have access to all premium features. Enjoy unlimited scans and advanced safety alerts!",
                    [{ text: "Get Started", onPress: () => router.replace('/(tabs)') }]
                );
            }
        } catch (error) {
            if (!error.userCancelled) {
                Alert.alert("Purchase Failed", error.message || "Something went wrong. Please try again.");
            }
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={28} color={colors.mutedForeground} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Go PRO</Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            {/* Main content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Plan Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.summaryIcon}>
                            <Users size={28} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.selectedLabel}>SELECTED PLAN</Text>
                            <Text style={styles.planTitle}>PRO Plan</Text>
                        </View>
                    </View>

                    <View style={styles.summaryDetails}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subscription fee</Text>
                            <Text style={styles.summaryValue}>{FIXED_PRICE}</Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.dueTodayRow}>
                            <View>
                                <Text style={styles.dueTodayLabel}>Total</Text>
                                <Text style={styles.dueTodaySubtext}>Billed annually</Text>
                            </View>
                            <Text style={styles.dueTodayPrice}>{FIXED_PRICE}</Text>
                        </View>
                    </View>
                </View>

                {/* Transparent Pricing Notice */}
                <View style={styles.transparentNotice}>
                    <ShieldCheck size={22} color={colors.primary} />
                    <Text style={styles.transparentText}>
                        Transparent pricing. No hidden fees or surprise charges, ever.
                    </Text>
                </View>

                {/* Payment Info */}
                <View style={styles.paymentInfo}>
                    <Text style={styles.paymentInfoText}>
                        Tap "Confirm & continue" to complete your purchase. Payment will be processed securely through your app store account.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
                <TouchableOpacity
                    style={[styles.confirmButton, purchasing && styles.confirmButtonDisabled]}
                    onPress={handlePurchase}
                    disabled={purchasing || isLoading}
                    activeOpacity={0.9}
                >
                    {purchasing ? (
                        <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                        <>
                            <Text style={styles.confirmButtonText}>Confirm & continue</Text>
                            <ArrowRight size={20} color={colors.primaryForeground} />
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.secureRow}>
                    <Lock size={14} color={colors.mutedForeground} />
                    <Text style={styles.secureText}>SECURE ENCRYPTED CHECKOUT</Text>
                </View>
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
        top: -100,
        right: -100,
        width: 220,
        height: 220,
        backgroundColor: colors.accent,
        opacity: 0.4,
        borderRadius: 110,
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[4],
        zIndex: 10,
    },
    backButton: {
        padding: spacing[2],
        marginLeft: -spacing[2],
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[5],
    },
    // Summary Card
    summaryCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[5],
        marginTop: spacing[4],
        marginBottom: spacing[5],
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        paddingBottom: spacing[5],
        marginBottom: spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}60`,
    },
    summaryIcon: {
        width: 56,
        height: 56,
        borderRadius: radius['2xl'],
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedLabel: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        letterSpacing: 1.5,
        color: `${colors.primary}99`,
        marginBottom: 2,
    },
    planTitle: {
        fontSize: 20,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    summaryDetails: {},
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    summaryValue: {
        fontSize: 15,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing[4],
    },
    dueTodayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    dueTodayLabel: {
        fontSize: 17,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    dueTodaySubtext: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    dueTodayPrice: {
        fontSize: 24,
        fontFamily: fonts.heading.bold,
        color: colors.primary,
    },
    // Transparent Notice
    transparentNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
        backgroundColor: `${colors.accent}30`,
        borderRadius: radius['2xl'],
        marginBottom: spacing[5],
        borderWidth: 1,
        borderColor: `${colors.accent}50`,
    },
    transparentText: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
        lineHeight: 18,
    },
    // Payment Info
    paymentInfo: {
        paddingHorizontal: spacing[2],
    },
    paymentInfoText: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 20,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing[5],
        paddingTop: spacing[5],
        backgroundColor: `${colors.background}F0`,
        borderTopWidth: 1,
        borderTopColor: `${colors.border}30`,
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    confirmButtonDisabled: {
        opacity: 0.7,
    },
    confirmButtonText: {
        fontSize: 17,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    secureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        marginTop: spacing[4],
    },
    secureText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        letterSpacing: 1,
        color: `${colors.mutedForeground}99`,
    },
});
