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
    User,
    Check,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { signUpWithEmail, verifyOtp, resendSignupOtp, signInWithGoogle } from "@/lib/supabaseAuth";
import { useCallback } from "react";
import { useAlert } from "@/contexts/AlertContext";
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function SignUp() {
    const { showAlert } = useAlert();


    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(true);
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");





    const handleSignUp = async () => {
        const trimmedEmail = email.trim();
        const trimmedFullName = fullName.trim();
        const trimmedPassword = password; // Password should not be trimmed usually, but just in case, sticking to raw unless necessary. Actually spaces are valid in passwords.

        if (!trimmedFullName || !trimmedEmail || !trimmedPassword) {
            showAlert("Error", "Please fill in all fields");
            return;
        }

        if (!agreedToTerms) {
            showAlert("Error", "Please agree to the Terms of Service and Privacy Policy");
            return;
        }

        if (trimmedPassword.length < 8) {
            showAlert("Error", "Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const nameParts = trimmedFullName.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || undefined;

            const ageGroup = await AsyncStorage.getItem('onboarding_user_age_group');
            const gender = await AsyncStorage.getItem('onboarding_user_gender');
            const processed = await AsyncStorage.getItem('onboarding_processed_knowledge');
            const habit = await AsyncStorage.getItem('onboarding_ingredient_habit');
            const diet = await AsyncStorage.getItem('onboarding_diet_preference');
            const concerns = await AsyncStorage.getItem('onboarding_health_concerns');
            const referral = await AsyncStorage.getItem('onboarding_referral_source');
            const infoPrefs = await AsyncStorage.getItem('onboarding_info_preferences');

            const data = await signUpWithEmail(trimmedEmail, trimmedPassword, {
                full_name: trimmedFullName,
                first_name: firstName,
                last_name: lastName,
                ...(ageGroup && { user_age_group: ageGroup }),
                ...(gender && { user_gender: gender }),
                ...(processed && { processed_knowledge: processed }),
                ...(habit && { ingredient_habit: habit }),
                ...(diet && { diet_preference: diet }),
                ...(concerns && { health_concerns: concerns }),
                ...(referral && { referral_source: referral }),
                ...(infoPrefs && { info_preferences: infoPrefs }),
            });

            if (data.user && !data.session) {
                // Email confirmation required - OTP sent
                setPendingVerification(true);
                showAlert(
                    "Check your email",
                    "We sent you a 6-digit verification code. Please check your email and enter the code below."
                );
            } else if (data.session) {
                // User is logged in directly (email confirmation disabled)
                // Route to subscription offer first for conversion optimization
                router.replace("/onboarding/subscription-offer");
            }
        } catch (err) {
            showAlert("Sign Up Failed", err.message || "An error occurred");
            console.error("Sign up error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!code) {
            showAlert("Error", "Please enter the verification code");
            return;
        }

        setLoading(true);

        try {
            // Use 'signup' type for signup verification OTP
            const data = await verifyOtp(email, code, 'signup');

            if (data.session) {
                // Route to subscription offer for conversion optimization
                router.replace("/onboarding/subscription-offer");
            } else {
                showAlert("Error", "Verification incomplete. Please try again.");
            }
        } catch (err) {
            showAlert("Verification Failed", err.message || "Invalid code");
            console.error("Verify error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        try {
            await resendSignupOtp(email);
            showAlert("Success", "Verification code has been resent to your email.");
        } catch (err) {
            showAlert("Error", err.message || "Failed to resend verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = useCallback(async () => {
        try {
            setLoading(true);
            console.log('[SignUp] Starting Google OAuth flow...');

            const { session, error } = await signInWithGoogle();

            if (error) {
                throw error;
            }

            if (session) {
                console.log('[SignUp] ✅ Google sign-up successful — AuthContext will handle navigation');
                // DO NOT navigate manually here.
                // AuthContext's navigation effect will redirect appropriately
                // (to edit-profile if new user, or to home if returning user).
            }
        } catch (err) {
            console.error('[SignUp] ❌ Google OAuth error:', err);
            const errorMessage = err?.message || "An error occurred during Google sign up";
            showAlert("Google Sign Up Failed", errorMessage);
            setLoading(false);
        }
    }, []);

    if (pendingVerification) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <StatusBar style="dark" />

                <View style={styles.blurTopRight} />
                <View style={styles.blurBottomLeft} />

                <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setPendingVerification(false)}
                    >
                        <ArrowLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + 40 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Verify your{"\n"}email</Text>
                        <Text style={styles.subtitle}>
                            We sent a verification code to {email}. Please enter it below.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Verification Code</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={code}
                                    onChangeText={setCode}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
                    <TouchableOpacity
                        style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                        onPress={handleVerifyEmail}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                        ) : (
                            <>
                                <Text style={styles.signUpButtonText}>Verify Email</Text>
                                <View style={styles.signUpButtonIcon}>
                                    <ArrowRight size={20} color={colors.primaryForeground} />
                                </View>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
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
                    { paddingBottom: insets.bottom + 40 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Create{"\n"}Account</Text>
                    <Text style={styles.subtitle}>
                        Join our community and start your journey to a better you today.
                    </Text>
                </View>

                {/* Google Sign Up */}
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignUp}
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

                {/* V7: Email only — SMS/WhatsApp removed per client request */}
                <View style={styles.form}>
                    {/* Full Name Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputIcon}>
                                <User size={20} color={colors.mutedForeground} />
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="John Doe"
                                placeholderTextColor={colors.mutedForeground}
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                                autoComplete="name"
                            />
                        </View>
                    </View>

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
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputIcon}>
                                <Lock size={20} color={colors.mutedForeground} />
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Create a password"
                                placeholderTextColor={colors.mutedForeground}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="new-password"
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

                    {/* Terms Agreement */}
                    <TouchableOpacity
                        style={styles.termsRow}
                        onPress={() => setAgreedToTerms(!agreedToTerms)}
                    >
                        <View style={[
                            styles.checkbox,
                            agreedToTerms && styles.checkboxChecked
                        ]}>
                            {agreedToTerms && (
                                <Check size={16} color={colors.primary} strokeWidth={3} />
                            )}
                        </View>
                        <Text style={styles.termsText}>
                            I agree to the{" "}
                            <Text style={styles.termsLink}>Terms of Service</Text>
                            {" "}and{" "}
                            <Text style={styles.termsLink}>Privacy Policy</Text>.
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={[
                            styles.signUpButton,
                            loading && styles.signUpButtonDisabled,
                        ]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                        ) : (
                            <>
                                <Text style={styles.signUpButtonText}>Sign Up</Text>
                                <View style={styles.signUpButtonIcon}>
                                    <ArrowRight size={20} color={colors.primaryForeground} />
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.switchAuthButton}
                        onPress={() => router.push("/sign-in")}
                    >
                        <Text style={styles.switchAuthText}>
                            Already have an account? <Text style={styles.switchAuthLink}>Sign In</Text>
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
        gap: 20,
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

    // Terms
    termsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: colors.input,
        borderWidth: 1,
        borderColor: `${colors.border}99`,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: `${colors.accent}80`,
        borderColor: colors.primary,
    },
    termsText: {
        flex: 1,
        fontSize: 12,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    termsLink: {
        fontFamily: fonts.sans.bold,
        color: colors.primary,
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
    signUpButton: {
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
    signUpButtonDisabled: {
        opacity: 0.6,
    },
    signUpButtonText: {
        flex: 1,
        fontSize: 18,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
        textAlign: "center",
        paddingLeft: 52,
    },
    signUpButtonIcon: {
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
    // Phone/WhatsApp Auth Styles
    authTabs: {
        flexDirection: "row",
        backgroundColor: colors.input,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    authTab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
    },
    authTabActive: {
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    authTabText: {
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
    },
    authTabTextActive: {
        color: colors.foreground,
        fontFamily: fonts.sans.bold,
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
    whatsappButton: {
        backgroundColor: '#25D366',
    },
});
