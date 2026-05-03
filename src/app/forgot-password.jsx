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
    
    ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, ArrowRight, CheckCircle } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { supabase, sendOtpToEmail, verifyOtp } from "@/lib/supabaseAuth";
import { fonts, radius } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";

export default function ForgotPassword() {
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false); // Controls view: Email Input vs OTP Input
    const [code, setCode] = useState(""); // OTP Code

    const handleSendCode = async () => {
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            showAlert("Error", "Please enter your email address");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            showAlert("Error", "Please enter a valid email address");
            return;
        }

        setLoading(true);

        try {
            await sendOtpToEmail(trimmedEmail);
            setEmailSent(true);
        } catch (err) {
            console.error("Send OTP error:", err);
            showAlert("Error", err.message || "Failed to send reset code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code || code.length !== 6) {
            showAlert("Error", "Please enter the 6-digit code");
            return;
        }

        setLoading(true);

        try {
            const { session, error } = await verifyOtp(email, code);

            if (error) throw error;

            if (session) {
                // Successfully verified and logged in temporarily
                router.replace('/reset-password');
            } else {
                throw new Error("Verification failed. Please try again.");
            }
        } catch (err) {
            console.error("Verify OTP error:", err);
            showAlert("Error", err.message || "Invalid code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (emailSent) {
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
                        onPress={() => setEmailSent(false)}
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
                        <Text style={styles.title}>Check your{"\n"}email</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to {email}. Enter it below to reset your password.
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
                        style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                        onPress={handleVerifyCode}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={colors.primaryForeground} />
                        ) : (
                            <>
                                <Text style={styles.resetButtonText}>Verify Code</Text>
                                <View style={styles.resetButtonIcon}>
                                    <ArrowRight size={20} color={colors.primaryForeground} />
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backToSignInLink}
                        onPress={handleSendCode}
                        disabled={loading}
                    >
                        <Text style={styles.backToSignInLinkText}>
                            Didn't receive code? <Text style={styles.signInLink}>Resend</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

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
                    { paddingBottom: insets.bottom + 40 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Forgot{"\n"}password?</Text>
                    <Text style={styles.subtitle}>
                        No worries! Enter your email and we'll send you a link to reset your password.
                    </Text>
                </View>

                {/* Form */}
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
                                autoFocus
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
                <TouchableOpacity
                    style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                    onPress={handleSendCode}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.primaryForeground} />
                    ) : (
                        <>
                            <Text style={styles.resetButtonText}>Send Reset Link</Text>
                            <View style={styles.resetButtonIcon}>
                                <ArrowRight size={20} color={colors.primaryForeground} />
                            </View>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backToSignInLink}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backToSignInLinkText}>
                        Remember your password? <Text style={styles.signInLink}>Sign in</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    blurTopRight: {
        position: "absolute",
        top: -150,
        right: -150,
        width: 300,
        height: 300,
        backgroundColor: colors.accent,
        opacity: 0.4,
        borderRadius: 150,
    },
    blurBottomLeft: {
        position: "absolute",
        bottom: -100,
        left: -100,
        width: 200,
        height: 200,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 100,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    titleSection: {
        marginBottom: 40,
    },
    title: {
        fontSize: 42,
        fontFamily: "Rubik_800ExtraBold",
        color: colors.foreground,
        marginBottom: 12,
        lineHeight: 48,
    },
    subtitle: {
        fontSize: 16,
        color: colors.mutedForeground,
        lineHeight: 24,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: "Rubik_600SemiBold",
        color: colors.foreground,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: colors.foreground,
        fontFamily: "Rubik_400Regular",
    },
    footer: {
        paddingHorizontal: 24,
        gap: 16,
    },
    resetButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderRadius: 16,
        height: 56,
        gap: 8,
    },
    resetButtonDisabled: {
        opacity: 0.7,
    },
    resetButtonText: {
        fontSize: 16,
        fontFamily: "Rubik_600SemiBold",
        color: colors.primaryForeground,
    },
    resetButtonIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    backToSignInLink: {
        alignItems: "center",
        paddingVertical: 8,
    },
    backToSignInLinkText: {
        fontSize: 14,
        color: colors.mutedForeground,
    },
    signInLink: {
        color: colors.primary,
        fontFamily: "Rubik_600SemiBold",
    },
    successContainer: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    successIcon: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontFamily: "Rubik_700Bold",
        color: colors.foreground,
        marginBottom: 12,
        textAlign: "center",
    },
    successSubtitle: {
        fontSize: 16,
        color: colors.mutedForeground,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 40,
    },
    backToSignInButton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    backToSignInText: {
        fontSize: 16,
        fontFamily: "Rubik_600SemiBold",
        color: colors.primaryForeground,
    },
});
