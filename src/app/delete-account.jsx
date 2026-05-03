import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    AlertTriangle,
    CheckSquare,
    Square
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";
import { useAlert } from "@/contexts/AlertContext";

export default function DeleteAccount() {
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile } = useAuth();
    const [confirmEmail, setConfirmEmail] = useState('');
    const [confirmations, setConfirmations] = useState({
        understand: false,
        permanent: false,
        noRecover: false
    });

    const consequences = [
        'All your scan history will be permanently deleted',
        'All family profiles and settings will be removed',
        'Your saved favorites and preferences will be lost',
        'AI chat conversations will be deleted',
        'This action cannot be undone'
    ];

    const toggleConfirmation = (key) => {
        setConfirmations(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const allConfirmed = confirmations.understand && confirmations.permanent && confirmations.noRecover;
    const emailMatches = confirmEmail.toLowerCase() === profile?.email?.toLowerCase();
    const canDelete = allConfirmed && emailMatches;

    const handleDeleteAccount = async () => {
        if (!canDelete) return;

        showAlert(
            'Final Confirmation',
            'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Forever',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete user data from database
                            const { error: deleteError } = await supabase
                                .from('profiles')
                                .delete()
                                .eq('id', profile.id);

                            if (deleteError) throw deleteError;

                            // Sign out and redirect
                            await supabase.auth.signOut();
                            router.replace('/sign-in');

                            showAlert('Account Deleted', 'Your account has been permanently deleted.');
                        } catch (error) {
                            showAlert('Error', 'Failed to delete account. Please try again or contact support.');
                            console.error('Delete account error:', error);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delete Account</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Warning Card */}
                <View style={styles.warningCard}>
                    <View style={styles.warningIcon}>
                        <AlertTriangle size={32} color={colors.destructive} />
                    </View>
                    <Text style={styles.warningTitle}>Permanent Action</Text>
                    <Text style={styles.warningText}>
                        Deleting your account is permanent and cannot be undone. Please read carefully before proceeding.
                    </Text>
                </View>

                {/* Consequences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What Will Be Deleted</Text>
                    <View style={styles.consequencesCard}>
                        {consequences.map((consequence, index) => (
                            <View key={index} style={styles.consequenceRow}>
                                <View style={styles.dot} />
                                <Text style={styles.consequenceText}>{consequence}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Confirmations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Confirm Your Understanding</Text>
                    <View style={styles.confirmationsCard}>
                        <TouchableOpacity
                            style={styles.confirmationRow}
                            onPress={() => toggleConfirmation('understand')}
                        >
                            {confirmations.understand ? (
                                <CheckSquare size={24} color={colors.destructive} />
                            ) : (
                                <Square size={24} color={colors.mutedForeground} />
                            )}
                            <Text style={styles.confirmationText}>
                                I understand all my data will be deleted
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.confirmationRow}
                            onPress={() => toggleConfirmation('permanent')}
                        >
                            {confirmations.permanent ? (
                                <CheckSquare size={24} color={colors.destructive} />
                            ) : (
                                <Square size={24} color={colors.mutedForeground} />
                            )}
                            <Text style={styles.confirmationText}>
                                I understand this action is permanent
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.confirmationRow}
                            onPress={() => toggleConfirmation('noRecover')}
                        >
                            {confirmations.noRecover ? (
                                <CheckSquare size={24} color={colors.destructive} />
                            ) : (
                                <Square size={24} color={colors.mutedForeground} />
                            )}
                            <Text style={styles.confirmationText}>
                                I understand I cannot recover my account
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Email Confirmation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Type Your Email to Confirm</Text>
                    <View style={styles.emailCard}>
                        <Text style={styles.emailLabel}>Your email: {profile?.email}</Text>
                        <TextInput
                            style={styles.emailInput}
                            placeholder="Enter your email to confirm"
                            placeholderTextColor={colors.mutedForeground}
                            value={confirmEmail}
                            onChangeText={setConfirmEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                        {confirmEmail && !emailMatches && (
                            <Text style={styles.errorText}>Email doesn't match</Text>
                        )}
                    </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                    style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
                    onPress={handleDeleteAccount}
                    disabled={!canDelete}
                >
                    <Text style={styles.deleteButtonText}>
                        Delete My Account Forever
                    </Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Need help? Contact support before deleting your account.
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
        backgroundColor: colors.destructive,
        opacity: 0.2,
        borderRadius: 128,
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
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[6],
    },
    warningCard: {
        backgroundColor: `${colors.destructive}10`,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        alignItems: 'center',
        marginBottom: spacing[8],
        borderWidth: 2,
        borderColor: `${colors.destructive}30`,
    },
    warningIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${colors.destructive}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[4],
    },
    warningTitle: {
        fontSize: 24,
        fontFamily: fonts.heading.bold,
        color: colors.destructive,
        marginBottom: spacing[2],
    },
    warningText: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: spacing[6],
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        marginBottom: spacing[3],
    },
    consequencesCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[5],
        gap: spacing[3],
    },
    consequenceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.destructive,
        marginTop: 7,
    },
    consequenceText: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
        flex: 1,
        lineHeight: 22,
    },
    confirmationsCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[4],
        gap: spacing[4],
    },
    confirmationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    confirmationText: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
        flex: 1,
    },
    emailCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[5],
    },
    emailLabel: {
        fontSize: 12,
        fontFamily: fonts.sans.semiBold,
        color: colors.mutedForeground,
        marginBottom: spacing[3],
    },
    emailInput: {
        backgroundColor: colors.secondary,
        borderRadius: radius['2xl'],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: 16,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
        borderWidth: 1,
        borderColor: colors.border,
    },
    errorText: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.destructive,
        marginTop: spacing[2],
    },
    deleteButton: {
        backgroundColor: colors.destructive,
        paddingVertical: spacing[4],
        borderRadius: radius['3xl'],
        alignItems: 'center',
        marginTop: spacing[6],
        marginBottom: spacing[4],
    },
    deleteButtonDisabled: {
        opacity: 0.5,
    },
    deleteButtonText: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: '#FFFFFF',
    },
    footer: {
        paddingVertical: spacing[6],
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
});
