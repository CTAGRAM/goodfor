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
import { ArrowLeft, Check, Sparkles, Zap, Crown } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import { RevenueCatUI } from "react-native-purchases-ui";

export default function Paywall() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { offerings, isLoading, purchasePackage, isPro } = useRevenueCat();
    const [purchasing, setPurchasing] = useState(null);

    // If already pro, redirect
    if (isPro) {
        Alert.alert("Already Subscribed", "You already have GoodFor Pro!");
        router.back();
        return null;
    }

    const handlePurchase = async (pkg) => {
        setPurchasing(pkg.identifier);
        const result = await purchasePackage(pkg);
        setPurchasing(null);

        if (result.success) {
            Alert.alert(
                "Success! 🎉",
                "Welcome to GoodFor Pro! Enjoy unlimited scans and premium features.",
                [{ text: "Get Started", onPress: () => router.back() }]
            );
        }
    };

    const presentPaywall = async () => {
        try {
            const paywallResult = await RevenueCatUI.presentPaywall();

            // User made a purchase or dismissed
            if (paywallResult === RevenueCatUI.PAYWALL_RESULT.PURCHASED) {
                Alert.alert("Success!", "Welcome to GoodFor Pro!");
                router.back();
            }
        } catch (error) {
            console.error("Paywall error:", error);
        }
    };

    const currentOffering = offerings?.current;

    if (isLoading || !currentOffering) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading subscriptions...</Text>
            </View>
        );
    }

    // Use RevenueCat's native paywall if available
    if (currentOffering.availablePackages.length > 0) {
        // Show RevenueCat Paywall UI
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.foreground} />
                    </Pressable>
                </View>

                <View style={styles.content}>
                    <Pressable style={styles.nativePaywallButton} onPress={presentPaywall}>
                        <Crown size={24} color={colors.primaryForeground} />
                        <Text style={styles.nativePaywallText}>View Subscription Options</Text>
                    </Pressable>

                    <Text style={styles.orText}>Or choose below:</Text>

                    {/* Custom package list */}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {currentOffering.availablePackages.map((pkg) => {
                            const isPopular = pkg.packageType === "ANNUAL";
                            const isPurchasing = purchasing === pkg.identifier;

                            return (
                                <Pressable
                                    key={pkg.identifier}
                                    style={[
                                        styles.packageCard,
                                        isPopular && styles.packageCardPopular
                                    ]}
                                    onPress={() => handlePurchase(pkg)}
                                    disabled={isPurchasing}
                                >
                                    {isPopular && (
                                        <View style={styles.popularBadge}>
                                            <Sparkles size={12} color="#fff" />
                                            <Text style={styles.popularText}>BEST VALUE</Text>
                                        </View>
                                    )}

                                    <View style={styles.packageContent}>
                                        <View style={styles.packageInfo}>
                                            <Text style={styles.packageTitle}>
                                                {pkg.product.title.replace("(GoodFor)", "").trim()}
                                            </Text>
                                            <Text style={styles.packageDesc}>
                                                {pkg.product.description}
                                            </Text>
                                        </View>

                                        <View style={styles.packagePricing}>
                                            <Text style={styles.packagePrice}>
                                                {pkg.product.priceString}
                                            </Text>
                                            {pkg.packageType !== "LIFETIME" && (
                                                <Text style={styles.packagePeriod}>
                                                    /{pkg.packageType === "ANNUAL" ? "year" : "month"}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {isPurchasing ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <View
                                            style={[
                                                styles.selectButton,
                                                isPopular && styles.selectButtonPopular
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.selectButtonText,
                                                    isPopular && styles.selectButtonTextPopular
                                                ]}
                                            >
                                                Select
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
            </View>

            <View style={styles.noOfferings}>
                <Text style={styles.noOfferingsText}>
                    No subscription options available at this time.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background
    },
    loadingText: {
        marginTop: spacing[4],
        fontSize: 16,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[4]
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center"
    },
    content: { flex: 1, paddingHorizontal: spacing[6] },
    nativePaywallButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing[3],
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius["2xl"],
        marginBottom: spacing[6],
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    nativePaywallText: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground
    },
    orText: {
        textAlign: "center",
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        marginBottom: spacing[4]
    },
    packageCard: {
        backgroundColor: colors.card,
        borderRadius: radius["3xl"],
        padding: spacing[5],
        marginBottom: spacing[4],
        borderWidth: 2,
        borderColor: colors.border
    },
    packageCardPopular: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}05`
    },
    popularBadge: {
        position: "absolute",
        top: -12,
        right: spacing[6],
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.chart1,
        paddingHorizontal: spacing[3],
        paddingVertical: 4,
        borderRadius: radius.full
    },
    popularText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: "#fff",
        letterSpacing: 1
    },
    packageContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing[3]
    },
    packageInfo: { flex: 1 },
    packageTitle: {
        fontSize: 18,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        marginBottom: spacing[1]
    },
    packageDesc: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground
    },
    packagePricing: { alignItems: "flex-end" },
    packagePrice: {
        fontSize: 24,
        fontFamily: fonts.heading.bold,
        color: colors.primary
    },
    packagePeriod: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground
    },
    selectButton: {
        backgroundColor: colors.muted,
        paddingVertical: spacing[3],
        borderRadius: radius["xl"],
        alignItems: "center"
    },
    selectButtonPopular: { backgroundColor: colors.primary },
    selectButtonText: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground
    },
    selectButtonTextPopular: { color: colors.primaryForeground },
    noOfferings: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing[8]
    },
    noOfferingsText: {
        fontSize: 16,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        textAlign: "center"
    }
});
