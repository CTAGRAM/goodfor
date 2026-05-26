import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors, fonts, spacing } from "@/constants/theme";

export default function PrivacyPolicy() {
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
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Introduction</Text>
                    <Text style={styles.paragraph}>
                        Welcome to GoodFor.app. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. The Data We Collect About You</Text>
                    <Text style={styles.paragraph}>
                        Personal data, or personal information, means any information about an individual from which that person can be identified.
                    </Text>
                    <Text style={styles.paragraph}>
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                    </Text>
                    <Text style={styles.paragraph}>
                        • Identity Data: includes first name, last name, username or similar identifier.
                    </Text>
                    <Text style={styles.paragraph}>
                        • Contact Data: includes email address.
                    </Text>
                    <Text style={styles.paragraph}>
                        • Health/Dietary Data: includes dietary preferences, allergies, and age-group demographics to provide tailored recommendations.
                    </Text>
                    <Text style={styles.paragraph}>
                        • Usage Data: includes information about how you use our app, including scanned products and generated analyses.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. How We Use Your Personal Data</Text>
                    <Text style={styles.paragraph}>
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </Text>
                    <Text style={styles.paragraph}>
                        • Where we need to perform the contract we are about to enter into or have entered into with you (providing the scanning and analysis service).
                    </Text>
                    <Text style={styles.paragraph}>
                        • Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.
                    </Text>
                    <Text style={styles.paragraph}>
                        • Where we need to comply with a legal obligation.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Data Security</Text>
                    <Text style={styles.paragraph}>
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. We use secure databases and encryption to protect your sensitive dietary information.
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
