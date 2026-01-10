import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Sparkles,
    Camera,
    QrCode,
    ArrowUp,
    User,
    UserCircle,
    Baby,
    Bot,
    UserCheck
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { sendMessage } from "@/lib/openai";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";

export default function AIChat() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const scrollViewRef = useRef(null);
    const { user, profile } = useAuth();

    const [message, setMessage] = useState("");
    const [selectedAge, setSelectedAge] = useState("adult");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userContext, setUserContext] = useState({});

    const quickPrompts = [
        "Is this safe?",
        "Explain the ingredients",
        "Any better options?",
    ];

    const ageOptions = [
        { id: "adult", label: "Adult", icon: User },
        { id: "child", label: "Child", icon: UserCircle },
        { id: "toddler", label: "Toddler", icon: Baby },
    ];

    // Fetch user context on mount
    useEffect(() => {
        const fetchUserContext = async () => {
            if (!user?.id) return;

            try {
                // Fetch recent scans
                const { data: recentScans } = await supabase
                    .from('scans')
                    .select('product_name, safety_level, safety_score')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // Fetch favorites
                const { data: favorites } = await supabase
                    .from('favorites')
                    .select('product_name')
                    .eq('user_id', user.id)
                    .limit(5);

                // Get allergens from profile
                const allergens = profile?.allergens || [];
                const dietaryPreferences = profile?.dietary_preferences || [];

                setUserContext({
                    allergens,
                    dietaryPreferences,
                    recentScans: recentScans || [],
                    favorites: favorites || [],
                });

                console.log('[AIChat] User context loaded:', {
                    allergens: allergens.length,
                    preferences: dietaryPreferences.length,
                    scans: recentScans?.length || 0,
                    favorites: favorites?.length || 0,
                });
            } catch (error) {
                console.error('[AIChat] Error fetching user context:', error);
            }
        };

        fetchUserContext();
    }, [user?.id, profile]);

    const handleSend = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = { role: "user", content: message.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setMessage("");
        setIsLoading(true);

        try {
            const response = await sendMessage(newMessages, selectedAge, userContext);
            setMessages([...newMessages, { role: "assistant", content: response }]);
        } catch (error) {
            setMessages([
                ...newMessages,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
            ]);
            console.error("AI Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar style="dark" />

            {/* Decorative Background Blurs */}
            <View style={styles.blurTopRight} />
            <View style={styles.blurLeft} />
            <View style={styles.blurBottomRight} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={colors.foreground} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerLabel}>AI Assistant</Text>
                    <Text style={styles.headerTitle}>Goodfor AI</Text>
                </View>

                <View style={styles.aiIconContainer}>
                    <Sparkles size={20} color={colors.primaryForeground} />
                </View>
            </View>

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 ? (
                    /* Help Card - shown when no messages */
                    <View style={styles.helpCard}>
                        <View style={styles.helpIconContainer}>
                            <Sparkles size={28} color={colors.primaryForeground} />
                        </View>
                        <Text style={styles.helpTitle}>How can I help?</Text>
                        <Text style={styles.helpDescription}>
                            I'll analyze ingredients and nutritional data based on who the product is for.
                        </Text>
                    </View>
                ) : (
                    /* Chat Messages */
                    messages.map((msg, index) => (
                        <View
                            key={index}
                            style={[
                                styles.messageContainer,
                                msg.role === "user" ? styles.userMessageContainer : styles.assistantMessageContainer
                            ]}
                        >
                            {msg.role === "assistant" && (
                                <View style={styles.assistantAvatar}>
                                    <Bot size={16} color={colors.primaryForeground} />
                                </View>
                            )}
                            <View
                                style={[
                                    styles.messageBubble,
                                    msg.role === "user" ? styles.userBubble : styles.assistantBubble
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        msg.role === "user" ? styles.userMessageText : styles.assistantMessageText
                                    ]}
                                >
                                    {msg.content}
                                </Text>
                            </View>
                            {msg.role === "user" && (
                                <View style={styles.userAvatar}>
                                    <UserCheck size={16} color={colors.primaryForeground} />
                                </View>
                            )}
                        </View>
                    ))
                )}

                {isLoading && (
                    <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
                        <View style={styles.assistantAvatar}>
                            <Bot size={16} color={colors.primaryForeground} />
                        </View>
                        <View style={[styles.messageBubble, styles.assistantBubble]}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Input Section */}
            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
                {/* Quick Prompts - only show when no messages */}
                {messages.length === 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickPromptsContainer}
                    >
                        {quickPrompts.map((prompt, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickPromptButton}
                                onPress={() => setMessage(prompt)}
                            >
                                <Text style={styles.quickPromptText}>{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Age Selector */}
                <View style={styles.ageSection}>
                    <Text style={styles.ageSectionLabel}>Answer for:</Text>
                    <View style={styles.ageOptionsRow}>
                        {ageOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = selectedAge === option.id;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.ageOption,
                                        isSelected && styles.ageOptionSelected
                                    ]}
                                    onPress={() => setSelectedAge(option.id)}
                                >
                                    <Icon
                                        size={16}
                                        color={isSelected ? colors.primaryForeground : colors.secondaryForeground}
                                    />
                                    <Text style={[
                                        styles.ageOptionText,
                                        isSelected && styles.ageOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Input Field */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Ask anything about products..."
                        placeholderTextColor={colors.mutedForeground}
                        value={message}
                        onChangeText={setMessage}
                        multiline={false}
                        editable={!isLoading}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (message.length > 0 && !isLoading) && styles.sendButtonActive
                        ]}
                        onPress={handleSend}
                        disabled={!message.trim() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                        ) : (
                            <ArrowUp size={20} color={colors.primaryForeground} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
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
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 16,
        zIndex: 10,
        backgroundColor: `${colors.background}CC`,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: `${colors.border}66`,
    },
    headerCenter: {
        alignItems: "center",
    },
    headerLabel: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.mutedForeground,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    headerTitle: {
        fontSize: 14,
        fontFamily: fonts.heading.bold,
        color: colors.primary,
    },
    aiIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    // Scroll View
    scrollView: {
        flex: 1,
        zIndex: 10,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        flexGrow: 1,
    },

    // Help Card
    helpCard: {
        backgroundColor: `${colors.accent}4D`,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.accent,
        marginTop: 32,
    },
    helpIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    helpTitle: {
        fontSize: 18,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        marginBottom: 8,
    },
    helpDescription: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        textAlign: "center",
        lineHeight: 22,
    },

    // Message Styles
    messageContainer: {
        flexDirection: "row",
        marginBottom: 12,
        alignItems: "flex-end",
    },
    userMessageContainer: {
        justifyContent: "flex-end",
    },
    assistantMessageContainer: {
        justifyContent: "flex-start",
    },
    messageBubble: {
        maxWidth: "75%",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: colors.card,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: `${colors.border}40`,
    },
    messageText: {
        fontSize: 15,
        fontFamily: fonts.sans.regular,
        lineHeight: 22,
    },
    userMessageText: {
        color: colors.primaryForeground,
    },
    assistantMessageText: {
        color: colors.foreground,
    },
    assistantAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    userAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },

    // Bottom Section
    bottomSection: {
        backgroundColor: `${colors.background}F2`,
        paddingTop: 16,
        zIndex: 30,
    },

    // Quick Prompts
    quickPromptsContainer: {
        gap: 12,
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    quickPromptButton: {
        backgroundColor: colors.accent,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${colors.border}66`,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    quickPromptText: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.accentForeground,
    },

    // Age Section
    ageSection: {
        paddingHorizontal: 24,
        marginBottom: 8,
    },
    ageSectionLabel: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: colors.mutedForeground,
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 8,
        marginLeft: 4,
    },
    ageOptionsRow: {
        flexDirection: "row",
        gap: 8,
    },
    ageOption: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.secondary,
        borderWidth: 2,
        borderColor: "transparent",
    },
    ageOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    ageOptionText: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.secondaryForeground,
    },
    ageOptionTextSelected: {
        color: colors.primaryForeground,
    },

    // Input Container
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 24,
        marginTop: 8,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: `${colors.border}80`,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    textInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 12,
        fontSize: 15,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.5,
    },
    sendButtonActive: {
        opacity: 1,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
});
