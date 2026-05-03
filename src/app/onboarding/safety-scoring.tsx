import { View, Text, Pressable, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, XCircle, BarChart3 } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import AnimatedPressable from "@/components/AnimatedPressable";

export default function SafetyScoring() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Decorative Blur Backgrounds */}
            <View style={styles.blurTop} />
            <View style={styles.blurMiddle} />

            {/* Header with back button */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color="#1A1D1C" strokeWidth={1.5} />
                </Pressable>
            </View>

            {/* Content Container */}
            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Illustration and Card Container */}
                <View style={styles.topSection}>

                    {/* Scoring System Card */}
                    <View style={styles.cardWrapper}>
                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>SCORING SYSTEM</Text>
                            <BarChart3 size={20} color="#243628" />
                        </View>

                        {/* White Card */}
                        <View style={styles.card}>
                            {/* Decorative blur inside card */}
                            <View style={styles.cardBlur} />

                            {/* Safe Score */}
                            <Animated.View entering={FadeInDown.delay(100).springify().damping(14)} style={[styles.scoreRow, { marginBottom: 12 }]}>
                                <View style={styles.scoreLeft}>
                                    <View style={[styles.iconCircle, styles.safeIconCircle]}>
                                        <CheckCircle size={20} color="#34A853" fill="#34A853" />
                                    </View>
                                    <View>
                                        <Text style={styles.scoreLabel}>Safe</Text>
                                        <Text style={styles.scoreRange}>80-100 Score range</Text>
                                    </View>
                                </View>
                                <View style={[styles.scoreBadge, styles.safeBadge]}>
                                    <Text style={styles.badgeText}>94</Text>
                                </View>
                            </Animated.View>

                            {/* Use with Caution Score */}
                            <Animated.View entering={FadeInDown.delay(200).springify().damping(14)} style={[styles.scoreRow, { marginBottom: 12 }]}>
                                <View style={styles.scoreLeft}>
                                    <View style={[styles.iconCircle, styles.cautionIconCircle]}>
                                        <AlertTriangle size={20} color="#FBBC04" fill="#FBBC04" />
                                    </View>
                                    <View>
                                        <Text style={styles.scoreLabel}>Use with caution</Text>
                                        <Text style={styles.scoreRange}>40-79 Score range</Text>
                                    </View>
                                </View>
                                <View style={[styles.scoreBadge, styles.cautionBadge]}>
                                    <Text style={styles.badgeText}>52</Text>
                                </View>
                            </Animated.View>

                            {/* Avoid Score */}
                            <Animated.View entering={FadeInDown.delay(300).springify().damping(14)} style={styles.scoreRow}>
                                <View style={styles.scoreLeft}>
                                    <View style={[styles.iconCircle, styles.avoidIconCircle]}>
                                        <XCircle size={20} color="#EA4335" fill="#EA4335" />
                                    </View>
                                    <View>
                                        <Text style={styles.scoreLabel}>Avoid</Text>
                                        <Text style={styles.scoreRange}>0-39 Score range</Text>
                                    </View>
                                </View>
                                <View style={[styles.scoreBadge, styles.avoidBadge]}>
                                    <Text style={styles.badgeText}>28</Text>
                                </View>
                            </Animated.View>
                        </View>
                    </View>
                </View>

                {/* Progress Dots */}
                <View style={styles.dotsContainer}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dotActive} />
                </View>

                {/* Text Content */}
                <Animated.Text entering={FadeInDown.delay(400).springify().damping(14)} style={styles.title}>
                    Transparent{"\n"}safety scores
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(500).springify().damping(14)} style={styles.description}>
                    Our science-backed scores are based on deep ingredient research. Shop with confidence knowing exactly what goes into your body.
                </Animated.Text>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
                <View style={styles.footerContent}>
                    {/* Next Button */}
                    <AnimatedPressable
                        onPress={() => router.push("/onboarding/question-intro")}
                        style={styles.nextButton}
                    >
                        <Text style={styles.nextButtonText}>Next</Text>
                        <View style={styles.arrowContainer}>
                            <ArrowRight size={20} color="#FFF" strokeWidth={1.25} />
                        </View>
                    </AnimatedPressable>

                    {/* Sign In Link */}
                    <Pressable
                        onPress={() => router.push("/sign-in")}
                        style={styles.signInButton}
                    >
                        <Text style={styles.signInText}>
                            Already have an account? Sign in
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F5F3",
    },
    blurTop: {
        position: "absolute",
        top: -128,
        left: 302,
        width: 256,
        height: 256,
        backgroundColor: "rgba(214, 228, 218, 0.3)",
        borderRadius: 128,
    },
    blurMiddle: {
        position: "absolute",
        top: 507,
        left: 334,
        width: 192,
        height: 192,
        backgroundColor: "rgba(52, 168, 83, 0.1)",
        borderRadius: 96,
    },
    header: {
        height: 116,
        paddingHorizontal: 12,
        justifyContent: "flex-end",
        paddingBottom: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: 32,
        justifyContent: "center",
        paddingBottom: 40,
    },
    topSection: {
        marginTop: 40,
        marginBottom: 40,
    },
    illustration: {
        position: "absolute",
        right: 0,
        top: -30,
        width: 180,
        height: 270,
        zIndex: 2,
    },
    cardWrapper: {
        width: "100%",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 12,
        fontFamily: "Rubik_700Bold",
        color: "#243628",
        letterSpacing: 1.2,
        lineHeight: 16,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: "rgba(225, 230, 227, 0.4)",
        position: "relative",
        overflow: "hidden",
    },
    cardBlur: {
        position: "absolute",
        top: -63,
        right: 65,
        width: 128,
        height: 128,
        backgroundColor: "rgba(214, 228, 218, 0.2)",
        borderRadius: 64,
        opacity: 0.5,
    },
    scoreRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F2F5F3",
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 13,
        height: 62,
    },
    scoreLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    safeIconCircle: {
        backgroundColor: "rgba(52, 168, 83, 0.1)",
    },
    cautionIconCircle: {
        backgroundColor: "rgba(251, 188, 4, 0.1)",
    },
    avoidIconCircle: {
        backgroundColor: "rgba(234, 67, 53, 0.1)",
    },
    scoreLabel: {
        fontSize: 14,
        fontFamily: "Rubik_700Bold",
        color: "#1A1D1C",
        lineHeight: 20,
    },
    scoreRange: {
        fontSize: 10,
        fontFamily: "Rubik_500Medium",
        color: "#6C7570",
        lineHeight: 15,
    },
    scoreBadge: {
        borderRadius: 16,
        paddingHorizontal: 10.5,
        paddingVertical: 5.5,
        minWidth: 38,
        alignItems: "center",
        height: 23,
        justifyContent: "center",
    },
    safeBadge: {
        backgroundColor: "#34A853",
    },
    cautionBadge: {
        backgroundColor: "#FBBC04",
    },
    avoidBadge: {
        backgroundColor: "#EA4335",
    },
    badgeText: {
        fontSize: 10,
        fontFamily: "Rubik_700Bold",
        color: "#FFFFFF",
        lineHeight: 15,
    },
    dotsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(108, 117, 112, 0.3)",
    },
    dotActive: {
        width: 24,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#34A853",
    },
    title: {
        fontSize: 28,
        fontFamily: "Rubik_800ExtraBold",
        color: "#1A1D1C",
        lineHeight: 30.8,
        marginTop: 40,
    },
    description: {
        fontSize: 17,
        fontFamily: "Rubik_400Regular",
        color: "#6C7570",
        lineHeight: 27.63,
        marginTop: 5,
    },
    footer: {
        paddingHorizontal: 32,
        paddingTop: 24,
        backgroundColor: "#F2F5F3",
    },
    footerContent: {
        gap: 12,
    },
    nextButton: {
        width: "100%",
        height: 56,
        backgroundColor: "#243628",
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
        position: "relative",
    },
    nextButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: "Rubik_700Bold",
        lineHeight: 24,
    },
    arrowContainer: {
        position: "absolute",
        right: 10,
        width: 36,
        height: 36,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    signInButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    signInText: {
        color: "#6C7570",
        fontSize: 14,
        fontFamily: "Rubik_600SemiBold",
        textAlign: "center",
        lineHeight: 20,
    },
});
