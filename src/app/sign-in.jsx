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
    ArrowRight
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabaseAuth";
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

    const handleSignIn = async () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password; // Keeping password as is, just assigned for consistency if needed, but usually raw. Actually, let's just use password directly to rely on user input accuracy for passwords.

        if (!trimmedEmail || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        setLoading(true);

        try {
            const data = await signInWithEmail(trimmedEmail, password);

            if (data.session) {
                router.replace("/(tabs)/home");
            } else {
                Alert.alert("Error", "Sign in failed. Please try again.");
            }
        } catch (err) {
            Alert.alert("Sign In Failed", err.message || "An error occurred");
            console.error("Sign in error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = useCallback(async () => {
        try {
            setLoading(true);
            const { session, error } = await signInWithGoogle();

            if (error) {
                throw error;
            }

            if (session) {
                router.replace("/(tabs)/home");
            } else {
                Alert.alert("Sign In Cancelled", "Google sign-in was cancelled");
            }
        } catch (err) {
            console.error("Google OAuth error:", err);
            const errorMessage = err?.message || "An error occurred during Google sign in";
            Alert.alert("Google Sign In Failed", errorMessage);
        } finally {
            setLoading(false);
        }
    }, [router]);

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
                    { paddingBottom: insets.bottom + 300 }
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
                            />
                        </View>
                    </View>

                    {/* Password Field */}
                    <View style={styles.inputGroup}>
                        <View style={styles.passwordLabelRow}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TouchableOpacity>
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
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
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

    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
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
});
