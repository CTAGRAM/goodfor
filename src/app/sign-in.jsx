import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabaseAuth";
import { useCallback } from "react";
import { useAlert } from "@/contexts/AlertContext";
import { hapticMedium, hapticSuccess, hapticError } from "@/lib/haptics";



export default function SignIn() {
    const { showAlert } = useAlert();


    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);



    const handleSignIn = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail || !password) {
            showAlert("Error", "Please enter both email and password");
            return;
        }

        setLoading(true);
        console.log('[SignIn] Starting sign in for:', trimmedEmail);

        try {
            const data = await signInWithEmail(trimmedEmail, password);
            console.log('[SignIn] Sign in successful, session:', !!data.session);

            if (data.session) {
                router.replace("/paywall");
            } else {
                setLoading(false);
                showAlert("Error", "Sign in failed. Please check your credentials and try again.");
            }
        } catch (err) {
            console.error('[SignIn] Error caught:', err);
            setLoading(false);
            // User-friendly error messages
            let errorMsg = err.message || "An error occurred";
            if (errorMsg.includes('Invalid login')) errorMsg = "Incorrect email or password. Please try again.";
            else if (errorMsg.includes('Email not confirmed')) errorMsg = "Please verify your email first. Check your inbox for a verification code.";
            else if (errorMsg.includes('timeout') || errorMsg.includes('network')) errorMsg = "Connection issue. Please check your internet and try again.";
            showAlert("Sign In Failed", errorMsg);
        } finally {
            if (loading) setLoading(false);
        }
    };




    const handleGoogleSignIn = useCallback(async () => {
        try {
            setLoading(true);
            hapticMedium();
            console.log('[SignIn] Starting Google OAuth flow...');

            const { session, error } = await signInWithGoogle();

            if (error) {
                console.error('[SignIn] OAuth returned error:', error.message);
                throw error;
            }

            if (session) {
                hapticSuccess();
                console.log('[SignIn] ✅ Google sign-in successful — AuthContext will handle navigation');
                // DO NOT navigate manually here.
                // AuthContext's navigation effect will redirect to home once profile loads.
                // Manual navigation causes a race condition and redirect loop.
            } else {
                // In Expo Go, deep link handler will complete the flow
                console.log('[SignIn] ℹ️ No session from WebBrowser — waiting for deep link callback');
                // Keep loading state — AuthContext will clear it when profile loads
            }
        } catch (err) {
            console.error('[SignIn] ❌ Google OAuth error:', err);
            hapticError();
            const errorMessage = err?.message || "An error occurred during Google sign in";
            showAlert("Google Sign In Failed", errorMessage);
            setLoading(false);
        }
        // Don't clear loading — AuthContext manages auth state and will trigger navigation
    }, []);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <StatusBar style="dark" />

            {/* Decorative Background Blurs */}
            <View style={styles.blurTopRight} />
            <View style={styles.blurBottomLeft} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 60 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Welcome{"\n"}back</Text>
                    <Text style={styles.subtitle}>
                        Sign in to your account and continue your health journey.
                    </Text>
                </View>

                {/* Google Sign In */}
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                >
                    <Image
                        source={{ uri: "https://www.google.com/favicon.ico" }}
                        style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* V5: Simplified — removed SMS/WhatsApp OTP tabs (client request: remove friction) */}
                {/* Only Email + Google remain as auth methods */}

                {/* V5: Email/Password only — no OTP flows */}
                <View style={styles.form}>
                    {/* Email Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputIcon}>
                                <Mail size={20} color={colors.mutedForeground} />
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="name@example.com"
                                placeholderTextColor={colors.mutedForeground}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                        <View style={styles.passwordLabelRow}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                <Text style={styles.forgotText}>Forgot?</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputIcon}>
                                <Lock size={20} color={colors.mutedForeground} />
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="••••••••"
                                placeholderTextColor={colors.mutedForeground}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color={colors.mutedForeground} />
                                ) : (
                                    <Eye size={20} color={colors.mutedForeground} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Sign In Button */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                        ) : (
                            <>
                                <Text style={styles.signInButtonText}>Sign In</Text>
                                <View style={styles.signInButtonIcon}>
                                    <ArrowRight size={20} color={colors.primaryForeground} />
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.switchAuthButton}
                        onPress={() => router.push("/sign-up")}
                    >
                        <Text style={styles.switchAuthText}>
                            New here? <Text style={styles.switchAuthLink}>Create an account</Text>
                        </Text>
                    </TouchableOpacity>

                    {/* V5: Continue as Guest */}
                    <TouchableOpacity
                        style={[styles.switchAuthButton, { marginTop: 4 }]}
                        onPress={() => router.replace("/(tabs)/home")}
                    >
                        <Text style={[styles.switchAuthText, { color: colors.mutedForeground }]}>
                            or <Text style={[styles.switchAuthLink, { color: colors.primary }]}>continue as guest</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        opacity: 0.3,
    },
    blurBottomLeft: {
        position: "absolute",
        bottom: "25%",
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        borderRadius: 96,
        opacity: 0.1,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: -12,
    },

    // Scroll View
    scrollView: {
        flex: 1,
        zIndex: 10,
    },
    scrollContent: {
        paddingHorizontal: 32,
    },

    // Title Section
    titleSection: {
        marginTop: 16,
        marginBottom: 32,
        alignItems: "center",
    },
    title: {
        fontSize: 34,
        fontFamily: fonts.heading.extrabold,
        color: colors.foreground,
        textAlign: "center",
        lineHeight: 38,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 17,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        textAlign: "center",
        marginTop: 12,
        lineHeight: 26,
    },

    // Google Button
    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        height: 64,
        backgroundColor: colors.card,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: `${colors.border}66`,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
        marginBottom: 32,
    },
    googleIcon: {
        width: 24,
        height: 24,
    },
    googleButtonText: {
        fontSize: 17,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },

    // Divider
    divider: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: `${colors.border}99`,
    },
    dividerText: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        textTransform: "uppercase",
        letterSpacing: 1,
    },

    // Form
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: `${colors.foreground}CC`,
        marginLeft: 16,
    },
    passwordLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
    },
    forgotText: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 64,
        backgroundColor: colors.input,
        borderRadius: 24,
        paddingHorizontal: 20,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        height: "100%",
        fontSize: 16,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    eyeButton: {
        padding: 8,
        marginRight: -8,
    },

    // Button section (inside scroll)
    buttonSection: {
        paddingHorizontal: 0,
        paddingTop: 24,
        paddingBottom: 40,
    },
    // Footer (kept for reference but not used)
    footer: {
        paddingHorizontal: 24,
        paddingTop: 32,
        backgroundColor: colors.background,
        zIndex: 20,
    },
    signInButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 64,
        backgroundColor: colors.primary,
        borderRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    signInButtonDisabled: {
        opacity: 0.6,
    },
    signInButtonText: {
        flex: 1,
        fontSize: 18,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
        textAlign: "center",
        paddingLeft: 52,
    },
    signInButtonIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${colors.primaryForeground}1A`,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    switchAuthButton: {
        paddingVertical: 16,
        alignItems: "center",
    },
    switchAuthText: {
        fontSize: 14,
        fontFamily: fonts.sans.semibold,
        color: colors.mutedForeground,
    },
    switchAuthLink: {
        color: colors.primary,
    },
    // V5: Resend OTP button
    resendButton: {
        paddingVertical: 10,
        alignItems: "center",
    },
    resendButtonText: {
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    // Phase 5: Phone Auth styles
    authTabs: {
        flexDirection: "row",
        backgroundColor: colors.muted,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    authTab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
    },
    authTabActive: {
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    authTabText: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
    },
    authTabTextActive: {
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    phoneHint: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 8,
        marginLeft: 16,
    },
    otpSentBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: `${colors.chart1}15`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    otpSentText: {
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    otpChangeText: {
        fontSize: 13,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
    },
    // WhatsApp button style
    whatsappButton: {
        backgroundColor: '#25D366',
    },
});
