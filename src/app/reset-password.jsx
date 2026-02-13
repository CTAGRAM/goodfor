import { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { supabase } from "@/lib/supabaseAuth";

export default function ResetPassword() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Fallback: Listen for USER_UPDATED event in case the promise hangs
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'USER_UPDATED' && loading) {
                console.log('[ResetPassword] USER_UPDATED event received via listener! Forcing success.');
                setLoading(false);
                setSuccess(true);
            }
        });

        return () => subscription.unsubscribe();
    }, [loading]);

    const handleUpdatePassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        if (password.length < 8) {
            Alert.alert("Error", "Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            console.log('[ResetPassword] Attempting to update user password...');

            // Race the update with a timeout so we don't hang forever
            const updatePromise = supabase.auth.updateUser({ password: password });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 15000)
            );

            const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

            console.log('[ResetPassword] updateUser result:', { hasData: !!data, error });

            if (error) throw error;

            console.log('[ResetPassword] Password updated successfully, setting success state');
            setSuccess(true);
        } catch (err) {
            // If it was a timeout but we got the event, the listener would have handled it.
            // But if we are here, log it.
            console.error("[ResetPassword] Update password error:", err);

            // If error is just timeout but event happened (handled by Effect), this might conflict.
            // But usually Alert is fine.
            if (!success) {
                Alert.alert("Error", err.message || "Failed to update password");
            }
        } finally {
            console.log('[ResetPassword] Setting loading to false');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.blurTopRight} />
                <View style={styles.blurBottomLeft} />

                <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
                        {/* If they are resetting from inside app, maybe back isn't right if they were forced here. 
                             But usually this flow is from looged out -> OTP login -> Reset. 
                             So Home is a safe place to go. */}
                        <ArrowLeft size={24} color={colors.foreground} />
                    </TouchableOpacity>
                </View>

                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <CheckCircle size={64} color={colors.chart1} />
                    </View>
                    <Text style={styles.successTitle}>Password Updated!</Text>
                    <Text style={styles.successSubtitle}>
                        Your password has been changed successfully. You can now use your new password to sign in.
                    </Text>

                    <TouchableOpacity
                        style={styles.backToHomeButton}
                        onPress={() => router.replace('/(tabs)/home')}
                    >
                        <Text style={styles.backToHomeText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
                {/* 
                   If they got here via OTP login, they are technically authenticated.
                   Back button could just take them back or formatted as cancel. 
                   We'll leave it as back for now.
                */}
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
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Reset{"\n"}Password</Text>
                    <Text style={styles.subtitle}>
                        Create a new, strong password for your account.
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputIcon}>
                                <Lock size={20} color={colors.mutedForeground} />
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="At least 8 characters"
                                placeholderTextColor={colors.mutedForeground}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
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

                    {/* Confirm Password Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputIcon}>
                                <Lock size={20} color={colors.mutedForeground} />
                            </View>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Confirm new password"
                                placeholderTextColor={colors.mutedForeground}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
                <TouchableOpacity
                    style={[styles.resetButton, loading && styles.resetButtonDisabled]}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={colors.primaryForeground} />
                    ) : (
                        <>
                            <Text style={styles.resetButtonText}>Update Password</Text>
                            <View style={styles.resetButtonIcon}>
                                <ArrowRight size={20} color={colors.primaryForeground} />
                            </View>
                        </>
                    )}
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
        marginTop: 16,
    },
    title: {
        fontSize: 42,
        fontFamily: fonts.heading.extrabold,
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
        fontFamily: fonts.sans.bold,
        color: `${colors.foreground}CC`,
        marginLeft: 16,
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
        fontFamily: fonts.sans.medium,
        height: '100%',
    },
    eyeButton: {
        padding: 8,
        marginRight: -8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
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
        fontFamily: fonts.sans.bold,
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
    successContainer: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -100,
    },
    successIcon: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontFamily: fonts.heading.bold,
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
    backToHomeButton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        paddingHorizontal: 32,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
    },
    backToHomeText: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
});
