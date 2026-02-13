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
    Alert,
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
    Phone,
    Hash,
    MessageCircle
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { signInWithEmail, signInWithGoogle, sendOtpToPhone, verifyPhoneOtp, signUpWithPhoneAfterVerify } from "@/lib/supabaseAuth";
import { sendVerifyOTP, checkVerifyOTP } from "@/lib/twilioWhatsApp";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useCallback } from "react";

export const useWarmUpBrowser = () => {
    useCallback(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
    useWarmUpBrowser();

    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Phase 5: Phone/WhatsApp OTP Authentication state
    const [authMethod, setAuthMethod] = useState('email'); // 'email', 'phone', or 'whatsapp'
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const handleSignIn = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        setLoading(true);
        console.log('[SignIn] Starting sign in for:', trimmedEmail);

        try {
            const data = await signInWithEmail(trimmedEmail, password);
            console.log('[SignIn] Sign in successful, session:', !!data.session);

            if (data.session) {
                router.replace("/(tabs)/home");
            } else {
                setLoading(false);
                Alert.alert("Error", "Sign in failed. Please check your credentials and try again.");
            }
        } catch (err) {
            console.error('[SignIn] Error caught:', err);
            setLoading(false);
            // User-friendly error messages
            let errorMsg = err.message || "An error occurred";
            if (errorMsg.includes('Invalid login')) errorMsg = "Incorrect email or password. Please try again.";
            else if (errorMsg.includes('Email not confirmed')) errorMsg = "Please verify your email first. Check your inbox for a verification code.";
            else if (errorMsg.includes('timeout') || errorMsg.includes('network')) errorMsg = "Connection issue. Please check your internet and try again.";
            Alert.alert("Sign In Failed", errorMsg);
        } finally {
            if (loading) setLoading(false);
        }
    };

    // Phone OTP handlers (Supabase Native via Twilio)
    const handleSendPhoneOtp = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }

        setLoading(true);
        try {
            await sendOtpToPhone(phoneNumber, false); // false = sign-in
            setOtpSent(true);
            Alert.alert("OTP Sent", "Please check your phone for the verification code");
        } catch (err) {
            console.error('[SignIn] SMS OTP error:', err);
            Alert.alert("Error", err.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPhoneOtp = async () => {
        if (!otpCode.trim() || otpCode.length !== 6) {
            Alert.alert("Error", "Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const data = await verifyPhoneOtp(phoneNumber, otpCode);
            if (data.session) {
                router.replace("/(tabs)/home");
            } else {
                Alert.alert("Error", "Verification failed. Please try again.");
            }
        } catch (err) {
            console.error('[SignIn] SMS verification error:', err);
            Alert.alert("Verification Failed", err.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // WhatsApp OTP handlers (Twilio Verify API)
    const handleSendWhatsAppOtp = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert("Error", "Please enter your WhatsApp number");
            return;
        }

        setLoading(true);
        try {
            const result = await sendVerifyOTP(phoneNumber, 'whatsapp');
            if (result.success) {
                setOtpSent(true);
                Alert.alert("OTP Sent", "Please check your WhatsApp for the verification code");
            } else {
                Alert.alert("Error", result.error || "Failed to send WhatsApp OTP");
            }
        } catch (err) {
            console.error('[SignIn] WhatsApp OTP error:', err);
            Alert.alert("Error", err.message || "Failed to send WhatsApp OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyWhatsAppOtp = async () => {
        if (!otpCode.trim() || otpCode.length !== 6) {
            Alert.alert("Error", "Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const result = await checkVerifyOTP(phoneNumber, otpCode);
            if (result.success) {
                // WhatsApp OTP verified - create Supabase user
                console.log('[SignIn] WhatsApp verified, creating Supabase user...');
                await signUpWithPhoneAfterVerify(phoneNumber);
                router.replace("/(tabs)/home");
            } else {
                Alert.alert("Verification Failed", result.error || "Invalid OTP. Please check the code and try again.");
            }
        } catch (err) {
            console.error('[SignIn] WhatsApp verification error:', err);
            Alert.alert("Verification Failed", err.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    // V5: Resend OTP handler
    const handleResendOtp = async () => {
        setLoading(true);
        try {
            if (authMethod === 'whatsapp') {
                const result = await sendVerifyOTP(phoneNumber, 'whatsapp');
                if (result.success) {
                    Alert.alert("Code Resent", "A new verification code has been sent to your WhatsApp.");
                } else {
                    Alert.alert("Error", result.error || "Failed to resend code");
                }
            } else {
                await sendOtpToPhone(phoneNumber, false);
                Alert.alert("Code Resent", "A new verification code has been sent via SMS.");
            }
        } catch (err) {
            console.error('[SignIn] Resend OTP error:', err);
            Alert.alert("Error", err.message || "Failed to resend verification code. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleSignIn = useCallback(async () => {
        try {
            setLoading(true);
            console.log('[SignIn] Starting Google OAuth flow...');

            const { session, error } = await signInWithGoogle();

            if (error) {
                console.error('[SignIn] OAuth returned error:', error.message);
                throw error;
            }

            if (session) {
                console.log('[SignIn] ✅ Session received from WebBrowser, navigating to home');
                router.replace("/(tabs)/home");
            } else {
                // In Expo Go, this is expected - deep link handler will complete the flow
                console.log('[SignIn] ℹ️ No session from WebBrowser - waiting for deep link callback (normal in Expo Go)');

                // Set a 15-second timeout in case deep link handler doesn't complete
                setTimeout(() => {
                    console.warn('[SignIn] ⏱️ OAuth timeout - no callback received after 15 seconds');
                    setLoading(false);
                    Alert.alert(
                        "Sign In Taking Too Long",
                        "The sign-in process is taking longer than expected. This can happen with some network conditions.",
                        [
                            {
                                text: "Try Again",
                                onPress: () => handleGoogleSignIn()
                            },
                            {
                                text: "Cancel",
                                style: "cancel"
                            }
                        ]
                    );
                }, 15000);

                // Keep loading state active so user sees "processing" screen
                // The deep link handler will complete auth and navigate automatically
            }
        } catch (err) {
            console.error('[SignIn] ❌ Google OAuth error:', err);
            const errorMessage = err?.message || "An error occurred during Google sign in";
            Alert.alert("Google Sign In Failed", errorMessage);
            setLoading(false); // Only clear loading on actual error
        }
        // Note: Don't clear loading in finally block - let deep link handler complete the flow
    }, [router]);

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

                {/* Phase 5: Auth Method Tabs */}
                <View style={styles.authTabs}>
                    <TouchableOpacity
                        style={[styles.authTab, authMethod === 'email' && styles.authTabActive]}
                        onPress={() => { setAuthMethod('email'); setOtpSent(false); }}
                    >
                        <Mail size={16} color={authMethod === 'email' ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.authTabText, authMethod === 'email' && styles.authTabTextActive]}>Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.authTab, authMethod === 'phone' && styles.authTabActive]}
                        onPress={() => { setAuthMethod('phone'); setOtpSent(false); }}
                    >
                        <Phone size={16} color={authMethod === 'phone' ? colors.primary : colors.mutedForeground} />
                        <Text style={[styles.authTabText, authMethod === 'phone' && styles.authTabTextActive]}>SMS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.authTab, authMethod === 'whatsapp' && styles.authTabActive]}
                        onPress={() => { setAuthMethod('whatsapp'); setOtpSent(false); }}
                    >
                        <MessageCircle size={16} color={authMethod === 'whatsapp' ? '#25D366' : colors.mutedForeground} />
                        <Text style={[styles.authTabText, authMethod === 'whatsapp' && styles.authTabTextActive]}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {authMethod === 'email' ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            {/* Phone Number Field */}
                            {!otpSent ? (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <View style={styles.inputContainer}>
                                        <View style={styles.inputIcon}>
                                            <Phone size={20} color={colors.mutedForeground} />
                                        </View>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="+91 9876543210"
                                            placeholderTextColor={colors.mutedForeground}
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                            autoComplete="tel"
                                        />
                                    </View>
                                    <Text style={styles.phoneHint}>
                                        Enter your phone number with country code
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.otpSentBanner}>
                                        <Text style={styles.otpSentText}>
                                            {authMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'} OTP sent to {phoneNumber}
                                        </Text>
                                        <TouchableOpacity onPress={() => setOtpSent(false)}>
                                            <Text style={styles.otpChangeText}>Change</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Verification Code</Text>
                                        <View style={styles.inputContainer}>
                                            <View style={styles.inputIcon}>
                                                <Hash size={20} color={colors.mutedForeground} />
                                            </View>
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="123456"
                                                placeholderTextColor={colors.mutedForeground}
                                                value={otpCode}
                                                onChangeText={setOtpCode}
                                                keyboardType="number-pad"
                                                maxLength={6}
                                            />
                                        </View>
                                    </View>
                                </>
                            )}
                        </>
                    )}
                </View>

                {/* Sign In Button - now inside ScrollView */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={[styles.signInButton, loading && styles.signInButtonDisabled, authMethod === 'whatsapp' && styles.whatsappButton]}
                        onPress={
                            authMethod === 'email'
                                ? handleSignIn
                                : authMethod === 'phone'
                                    ? (otpSent ? handleVerifyPhoneOtp : handleSendPhoneOtp)
                                    : (otpSent ? handleVerifyWhatsAppOtp : handleSendWhatsAppOtp)
                        }
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                        ) : (
                            <>
                                <Text style={styles.signInButtonText}>
                                    {authMethod === 'email'
                                        ? 'Sign In'
                                        : authMethod === 'phone'
                                            ? (otpSent ? 'Verify OTP' : 'Send OTP')
                                            : (otpSent ? 'Verify WhatsApp' : 'Send WhatsApp OTP')
                                    }
                                </Text>
                                <View style={styles.signInButtonIcon}>
                                    <ArrowRight size={20} color={colors.primaryForeground} />
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* V5: Resend OTP button */}
                    {authMethod !== 'email' && otpSent && (
                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={handleResendOtp}
                            disabled={loading}
                        >
                            <Text style={styles.resendButtonText}>
                                Didn't receive the code? <Text style={styles.switchAuthLink}>Resend</Text>
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.switchAuthButton}
                        onPress={() => router.push("/sign-up")}
                    >
                        <Text style={styles.switchAuthText}>
                            New here? <Text style={styles.switchAuthLink}>Create an account</Text>
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
