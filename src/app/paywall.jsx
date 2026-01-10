import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, QrCode, UserPlus, ShieldCheck } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

export default function Paywall() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { offerings, isLoading, purchasePackage, isPro } = useRevenueCat();
    const [purchasing, setPurchasing] = useState(false);

    // If already pro, redirect
    if (isPro) {
        Alert.alert("Already Subscribed", "You already have GoodFor Pro!");
        router.back();
        return null;
    }

    const handlePurchase = async () => {
        const annualPackage = offerings?.current?.availablePackages?.find(
            pkg => pkg.packageType === "ANNUAL"
        ) || offerings?.current?.availablePackages?.[0];

        if (!annualPackage) {
            Alert.alert("Error", "No subscription package available");
            return;
        }

        setPurchasing(true);
        const result = await purchasePackage(annualPackage);
        setPurchasing(false);

        if (result.success) {
            Alert.alert(
                "Success! 🎉",
                "Welcome to GoodFor Pro! Enjoy unlimited scans and premium features.",
                [{ text: "Get Started", onPress: () => router.back() }]
            );
        }
    };

    const features = [
        {
            icon: QrCode,
            title: "Unlimited scans",
            description: "Scan as many products as you need every day without limits."
        },
        {
            icon: UserPlus,
            title: "5 Family profiles",
            description: "Create individual profiles for each family member's needs."
        },
        {
            icon: ShieldCheck,
            title: "Advanced safety alerts",
            description: "Get instant warnings for specific allergens and harmful additives."
        }
    ];

    const annualPackage = offerings?.current?.availablePackages?.find(
        pkg => pkg.packageType === "ANNUAL"
    );
    const price = annualPackage?.product?.priceString || "£39.99";

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Pressable
                    style={styles.closeButton}
                    onPress={() => router.back()}
                >
                    <X size={28} color={colors.mutedForeground} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.premiumLabel}>PREMIUM</Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Main content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Decorative circle */}
                <View style={styles.decorativeContainer}>
                    <View style={styles.decorativeOuter}>
                        <View style={styles.decorativeInner} />
                    </View>
                </View>

                {/* Title section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Upgrade for your family</Text>
                    <Text style={styles.subtitle}>
                        Protect your loved ones with our most comprehensive safety features.
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <View key={index} style={styles.featureCard}>
                                <View style={styles.featureIcon}>
                                    <Icon size={24} color={colors.primary} />
                                </View>
                                <View style={styles.featureContent}>
                                    <Text style={styles.featureTitle}>{feature.title}</Text>
                                    <Text style={styles.featureDescription}>
                                        {feature.description}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Annual plan card */}
                <Pressable style={styles.planCard} onPress={handlePurchase}>
                    <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                    <View style={styles.planContent}>
                        <View>
                            <Text style={styles.planName}>Annual Plan</Text>
                            <Text style={styles.planSave}>Save 40% annually</Text>
                        </View>
                        <View style={styles.planPricing}>
                            <Text style={styles.planPrice}>{price}</Text>
                            <Text style={styles.planPeriod}>/ year</Text>
                        </View>
                    </View>
                </Pressable>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable
                    style={styles.proButton}
                    onPress={handlePurchase}
                    disabled={purchasing || isLoading}
                >
                    {purchasing ? (
                        <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                        <Text style={styles.proButtonText}>Go PRO</Text>
                    )}
                </Pressable>

                <Pressable
                    style={styles.laterButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.laterButtonText}>Maybe later</Text>
                </Pressable>

                <Text style={styles.disclaimer}>
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
        bottom: 100,
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[4],
        zIndex: 10,
    },
    closeButton: {
        padding: spacing[2],
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    premiumLabel: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
        letterSpacing: 2,
        color: `${colors.primary}99`,
    },
    headerSpacer: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[8],
    },
    decorativeContainer: {
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    decorativeOuter: {
        width: 120,
        height: 120,
        backgroundColor: `${colors.accent}30`,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    decorativeInner: {
        width: 80,
        height: 80,
        backgroundColor: `${colors.accent}50`,
        borderRadius: 40,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    title: {
        fontSize: 26,
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: 15,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        textAlign: 'center',
        paddingHorizontal: spacing[4],
        lineHeight: 22,
    },
    featuresContainer: {
        gap: spacing[4],
        marginBottom: spacing[8],
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[4],
        padding: spacing[4],
        backgroundColor: `${colors.card}80`,
        borderRadius: radius['2xl'],
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.xl,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    planCard: {
        backgroundColor: colors.primary,
        borderRadius: radius['3xl'],
        padding: spacing[5],
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
        paddingVertical: 4,
        borderBottomLeftRadius: radius.xl,
    },
    bestValueText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: '#fff',
        letterSpacing: 0.5,
    },
    planContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    planName: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    planSave: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: `${colors.primaryForeground}B3`,
    },
    planPricing: {
        alignItems: 'flex-end',
    },
    planPrice: {
        fontSize: 22,
        fontFamily: fonts.sansExtraBold,
        color: colors.primaryForeground,
    },
    planPeriod: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: `${colors.primaryForeground}B3`,
    },
    footer: {
        paddingHorizontal: spacing[6],
        paddingTop: spacing[4],
        backgroundColor: `${colors.background}CC`,
    },
    proButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    proButtonText: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    laterButton: {
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    laterButtonText: {
        fontSize: 14,
        fontFamily: fonts.sansSemiBold,
        color: colors.mutedForeground,
    },
    disclaimer: {
        fontSize: 10,
        fontFamily: fonts.sans,
        color: `${colors.mutedForeground}99`,
        textAlign: 'center',
        paddingHorizontal: spacing[8],
        marginTop: spacing[4],
        lineHeight: 14,
    },
});
