import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors, fonts, spacing } from "@/constants/theme";

export default function TermsAndConditions() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurLeft} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Definitions and Interpretation</Text>
                    <Text style={styles.paragraph}>
                        1.1 In these Terms of Service and Conditions (the Terms) for GoodFor.app, the following definitions and rules of interpretation apply unless the context requires otherwise.
                    </Text>
                    <Text style={styles.paragraph}>
                        1.2 Defined terms are capitalised throughout these Terms. The following expressions have the meanings set out below:
                    </Text>
                    <Text style={styles.paragraph}>
                        a) "GoodFor.app" means the mobile application and website operated by The GoodFor Company Ltd, including all features, content, and services provided under the GoodFor brand.
                    </Text>
                    <Text style={styles.paragraph}>
                        b) "The GoodFor Company" means The GoodFor Company Ltd, company number 16922983, registered at 128 City Road, London, United Kingdom, EC1V 2NX.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Acceptance of Terms</Text>
                    <Text style={styles.paragraph}>
                        By downloading, accessing, or using GoodFor.app, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the application.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Service Description</Text>
                    <Text style={styles.paragraph}>
                        GoodFor.app provides tools to scan product barcodes, analyze ingredients, and receive personalized safety recommendations based on your dietary preferences and allergens. Our AI (Lumi) provides guidance but is not a substitute for professional medical advice.
                    </Text>
                </View>
            </ScrollView>
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
    blurLeft: {
        position: 'absolute',
        top: '25%',
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
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: fonts.heading?.bold || fonts.sans?.bold,
        color: colors.foreground,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[6],
        paddingTop: spacing[4],
    },
    lastUpdated: {
        fontSize: 13,
        fontFamily: fonts.sans?.medium,
        color: colors.mutedForeground,
        marginBottom: spacing[6],
    },
    section: {
        marginBottom: spacing[6],
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: fonts.heading?.bold || fonts.sans?.bold,
        color: colors.foreground,
        marginBottom: spacing[3],
    },
    paragraph: {
        fontSize: 14,
        fontFamily: fonts.sans?.regular,
        color: colors.foreground,
        lineHeight: 22,
        marginBottom: spacing[2],
        opacity: 0.8,
    },
});
