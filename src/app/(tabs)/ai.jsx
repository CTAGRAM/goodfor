import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    Sparkles,
    Star,
    AlertTriangle,
    Shield,
    ArrowRight,
    MessageCircle
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";

export default function AI() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const suggestions = [
        {
            id: 1,
            icon: Star,
            text: "Is this snack okay for kids?",
        },
        {
            id: 2,
            icon: AlertTriangle,
            text: "Why was this marked as \"Avoid\"?",
        },
        {
            id: 3,
            icon: Shield,
            text: "Suggest safer alternatives",
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Decorative Background Blurs */}
            <View style={styles.blurTopRight} />
            <View style={styles.blurLeft} />
            <View style={styles.blurBottomRight} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Image
                    source={{ uri: "https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/onAkNUUAGm7/ai/GoodFor-1-x16DQfFL43Z.png" }}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <View style={styles.profileContainer}>
                    <Image
                        source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
                        style={styles.profileImage}
                    />
                    <View style={styles.statusIndicator} />
                </View>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 180 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Intro Section */}
                <View style={styles.introSection}>
                    <View style={styles.aiTag}>
                        <Sparkles size={16} color={colors.primary} />
                        <Text style={styles.aiTagText}>AI Assistant</Text>
                    </View>
                    <Text style={styles.mainTitle}>Ask Goodfor</Text>
                    <Text style={styles.description}>
                        Get simple, explainable answers about food and everyday products — tailored to your family.
                    </Text>
                </View>

                {/* Suggestions Section */}
                <View style={styles.suggestionsSection}>
                    <Text style={styles.sectionTitle}>Try asking</Text>

                    {suggestions.map((item) => {
                        const Icon = item.icon;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.suggestionCard}
                                onPress={() => router.push("/ai-chat")}
                            >
                                <View style={styles.suggestionLeft}>
                                    <View style={styles.suggestionIcon}>
                                        <Icon size={24} color={colors.primary} />
                                    </View>
                                    <Text style={styles.suggestionText}>{item.text}</Text>
                                </View>
                                <ArrowRight size={20} color={colors.mutedForeground} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Start Conversation Button */}
            <View style={[styles.buttonContainer, { bottom: insets.bottom + 100 }]}>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => router.push("/ai-chat")}
                >
                    <MessageCircle size={24} color={colors.primaryForeground} />
                    <Text style={styles.startButtonText}>Start a conversation</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        position: "relative",
        overflow: "hidden",
    },

    // Background Blurs
    blurTopRight: {
        position: "absolute",
        top: -128,
        right: -128,
        width: 256,
        height: 256,
        backgroundColor: colors.accent,
        borderRadius: 128,
        opacity: 0.4,
    },
    blurLeft: {
        position: "absolute",
        top: "25%",
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        borderRadius: 96,
        opacity: 0.05,
    },
    blurBottomRight: {
        position: "absolute",
        bottom: "25%",
        right: -80,
        width: 224,
        height: 224,
        backgroundColor: colors.accent,
        borderRadius: 112,
        opacity: 0.2,
    },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 24,
        paddingBottom: 16,
        zIndex: 10,
    },
    logo: {
        height: 32,
        width: 100,
    },
    profileContainer: {
        position: "relative",
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    statusIndicator: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.chart1,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },

    // Scroll View
    scrollView: {
        flex: 1,
        zIndex: 10,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },

    // Intro Section
    introSection: {
        marginBottom: 32,
        marginTop: 16,
    },
    aiTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: `${colors.accent}80`,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        alignSelf: "flex-start",
        marginBottom: 12,
    },
    aiTagText: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    mainTitle: {
        fontSize: 40,
        fontFamily: fonts.heading.extrabold,
        color: colors.foreground,
        marginBottom: 12,
        lineHeight: 48,
    },
    description: {
        fontSize: 18,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 28,
        maxWidth: "90%",
    },

    // Suggestions Section
    suggestionsSection: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.mutedForeground,
        textTransform: "uppercase",
        letterSpacing: 2,
        marginLeft: 4,
    },
    suggestionCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: `${colors.border}66`,
    },
    suggestionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        flex: 1,
    },
    suggestionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    suggestionText: {
        fontSize: 15,
        fontFamily: fonts.sans.semibold,
        color: colors.foreground,
        flex: 1,
    },

    // Start Button
    buttonContainer: {
        position: "absolute",
        left: 24,
        right: 24,
        zIndex: 20,
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingVertical: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    startButtonText: {
        fontSize: 18,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
});
