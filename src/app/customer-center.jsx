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
import {
    ArrowLeft,
    RefreshCw,
    Crown,
    Calendar,
    CreditCard,
    CheckCircle,
    Settings
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import { RevenueCatUI } from "react-native-purchases-ui";

export default function CustomerCenter() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { customerInfo, isLoading, isPro, restorePurchases, refreshCustomerInfo } = useRevenueCat();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshCustomerInfo();
        setRefreshing(false);
    };

    const handleRestorePurchases = async () => {
        try {
            await restorePurchases();
        } catch (error) {
            // Error already handled in restorePurchases
        }
    };

    const presentCustomerCenter = async () => {
        try {
            await RevenueCatUI.presentCustomerCenter();
        } catch (error) {
            console.error("Customer Center error:", error);
            Alert.alert("Error", "Could not open Customer Center");
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const activeEntitlement = customerInfo?.entitlements?.active?.['GoodFor Pro'];
    const expirationDate = activeEntitlement?.expirationDate;
    const willRenew = activeEntitlement?.willRenew;
    const productIdentifier = activeEntitlement?.productIdentifier;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Subscription</Text>
                <Pressable
                    style={styles.backButton}
                    onPress={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={20}
                        color={refreshing ? colors.mutedForeground : colors.foreground}
                    />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Card */}
                <View style={[styles.statusCard, isPro && styles.statusCardPro]}>
                    <View style={[styles.statusIconBg, isPro && styles.statusIconBgPro]}>
                        {isPro ? (
                            <Crown size={32} color={colors.chart1} />
                        ) : (
                            <Crown size={32} color={colors.mutedForeground} />
                        )}
                    </View>

                    <Text style={styles.statusTitle}>
                        {isPro ? "GoodFor Pro" : "Free Plan"}
                    </Text>

                    <Text style={styles.statusSubtitle}>
                        {isPro
                            ? "You have access to all premium features"
                            : "Upgrade to unlock unlimited scans"}
                    </Text>

                    {isPro && expirationDate && (
                        <View style={styles.expirationBox}>
                            <Calendar size={16} color={colors.chart1} />
                            <Text style={styles.expirationText}>
                                {willRenew ? "Renews" : "Expires"} on {new Date(expirationDate).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* RevenueCat Customer Center Button */}
                {isPro && (
                    <Pressable style={styles.customerCenterButton} onPress={presentCustomerCenter}>
                        <View style={styles.customerCenterContent}>
                            <View style={styles.customerCenterLeft}>
                                <Settings size={20} color={colors.primary} />
                                <View style={styles.customerCenterText}>
                                    <Text style={styles.customerCenterTitle}>Manage Subscription</Text>
                                    <Text style={styles.customerCenterDesc}>
                                        Update payment, cancel, or view details
                                    </Text>
                                </View>
                            </View>
                            <ArrowLeft
                                size={20}
                                color={colors.mutedForeground}
                                style={{ transform: [{ rotate: '180deg' }] }}
                            />
                        </View>
                    </Pressable>
                )}

                {/* Subscription Details */}
                {isPro && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.detailsTitle}>Subscription Details</Text>

                        <View style={styles.detailRow}>
                            <View style={styles.detailLeft}>
                                <CreditCard size={18} color={colors.mutedForeground} />
                                <Text style={styles.detailLabel}>Plan</Text>
                            </View>
                            <Text style={styles.detailValue}>
                                {productIdentifier?.includes('month') ? 'Monthly' :
                                    productIdentifier?.includes('year') ? 'Yearly' :
                                        productIdentifier?.includes('lifetime') ? 'Lifetime' : 'Premium'}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <View style={styles.detailLeft}>
                                <CheckCircle size={18} color={colors.mutedForeground} />
                                <Text style={styles.detailLabel}>Status</Text>
                            </View>
                            <Text style={[styles.detailValue, styles.detailValueActive]}>
                                Active
                            </Text>
                        </View>
                    </View>
                )}

                {/* Restore Purchases */}
                <Pressable style={styles.restoreButton} onPress={handleRestorePurchases}>
                    <RefreshCw size={20} color={colors.primary} />
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </Pressable>

                {/* Upgrade Button */}
                {!isPro && (
                    <Pressable
                        style={styles.upgradeButton}
                        onPress={() => router.push('/paywall')}
                    >
                        <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                    </Pressable>
                )}

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        Subscriptions are managed through the App Store or Play Store.
                        Changes made here will sync with your store account.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 18, fontFamily: fonts.heading.bold, color: colors.primary },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing[6] },
    statusCard: { backgroundColor: colors.card, borderRadius: radius["3xl"], padding: spacing[8], alignItems: "center", marginBottom: spacing[6], borderWidth: 2, borderColor: colors.border },
    statusCardPro: { borderColor: colors.chart1, backgroundColor: `${colors.chart1}05` },
    statusIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", marginBottom: spacing[4] },
    statusIconBgPro: { backgroundColor: `${colors.chart1}20` },
    statusTitle: { fontSize: 24, fontFamily: fonts.heading.bold, color: colors.foreground, marginBottom: spacing[2] },
    statusSubtitle: { fontSize: 14, fontFamily: fonts.sans.regular, color: colors.mutedForeground, textAlign: "center", marginBottom: spacing[3] },
    expirationBox: { flexDirection: "row", alignItems: "center", gap: spacing[2], backgroundColor: `${colors.chart1}10`, paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, marginTop: spacing[2] },
    expirationText: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.chart1 },
    customerCenterButton: { backgroundColor: colors.card, borderRadius: radius["2xl"], padding: spacing[5], marginBottom: spacing[4], borderWidth: 1, borderColor: colors.border },
    customerCenterContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    customerCenterLeft: { flexDirection: "row", alignItems: "center", gap: spacing[3], flex: 1 },
    customerCenterText: { flex: 1 },
    customerCenterTitle: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: 2 },
    customerCenterDesc: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    detailsCard: { backgroundColor: colors.card, borderRadius: radius["2xl"], padding: spacing[5], marginBottom: spacing[4] },
    detailsTitle: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: spacing[4], textTransform: "uppercase", letterSpacing: 1 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing[3], borderTopWidth: 1, borderTopColor: colors.border },
    detailLeft: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    detailLabel: { fontSize: 14, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    detailValue: { fontSize: 14, fontFamily: fonts.sans.semiBold, color: colors.foreground },
    detailValueActive: { color: colors.chart1 },
    restoreButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing[2], paddingVertical: spacing[4], borderRadius: radius["xl"], borderWidth: 2, borderColor: colors.border, marginBottom: spacing[4] },
    restoreText: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.primary },
    upgradeButton: { backgroundColor: colors.primary, paddingVertical: spacing[4], borderRadius: radius["2xl"], alignItems: "center", marginBottom: spacing[6], shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    upgradeButtonText: { fontSize: 16, fontFamily: fonts.sans.bold, color: colors.primaryForeground },
    infoBox: { backgroundColor: colors.muted, padding: spacing[4], borderRadius: radius["xl"], marginBottom: spacing[4] },
    infoText: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, lineHeight: 18, textAlign: "center" },
});
