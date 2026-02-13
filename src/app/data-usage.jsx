import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Pressable, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
    ArrowLeft,
    Database,
    Eye,
    Download,
    Trash2,
    ChevronRight,
    X,
    CheckCircle,
    Shield,
    Lock,
    FileText,
    AlertTriangle
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";

export default function DataUsage() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile, user } = useAuth();

    // Modal states
    const [showCollectModal, setShowCollectModal] = useState(false);
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const dataCategories = [
        {
            icon: Eye,
            label: 'What We Collect',
            description: 'Scan history, family profiles, and preferences',
            action: 'View Details',
            onPress: () => setShowCollectModal(true)
        },
        {
            icon: Database,
            label: 'How We Use Your Data',
            description: 'To provide safety analysis and personalized recommendations',
            action: 'Learn More',
            onPress: () => setShowUsageModal(true)
        },
        {
            icon: Download,
            label: 'Export Your Data',
            description: 'Download all your data in JSON format',
            action: 'Download',
            onPress: () => setShowExportModal(true)
        },
        {
            icon: Trash2,
            label: 'Delete Specific Data',
            description: 'Remove scan history or family profiles',
            action: 'Manage',
            destructive: true,
            onPress: () => setShowDeleteModal(true)
        }
    ];

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            // Fetch all user data
            const [scansResult, familyResult, favoritesResult] = await Promise.all([
                supabase.from('scans').select('*').eq('user_id', user.id),
                supabase.from('family_members').select('*').eq('user_id', user.id),
                supabase.from('favorites').select('*').eq('user_id', user.id)
            ]);

            const exportData = {
                profile: {
                    full_name: profile?.full_name,
                    email: profile?.email,
                    age_group: profile?.age_group,
                    allergens: profile?.allergens,
                    dietary_preferences: profile?.dietary_preferences,
                    created_at: profile?.created_at
                },
                scans: scansResult.data || [],
                family_members: familyResult.data || [],
                favorites: favoritesResult.data || [],
                exported_at: new Date().toISOString()
            };

            // Create the JSON file
            const jsonContent = JSON.stringify(exportData, null, 2);
            const fileName = `goodfor_data_export_${new Date().toISOString().split('T')[0]}.json`;
            const fileUri = FileSystem.documentDirectory + fileName;

            // Write file to device
            await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
                encoding: 'utf8'
            });

            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();

            if (isAvailable) {
                // Share the file (allows user to save, send via email, etc.)
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export Your GoodFor Data',
                    UTI: 'public.json'
                });
                setShowExportModal(false);
            } else {
                // Fallback if sharing isn't available
                Alert.alert(
                    'Export Complete',
                    `Your data has been saved to:\n${fileUri}\n\nContains:\n• ${exportData.scans.length} scans\n• ${exportData.family_members.length} family profiles\n• ${exportData.favorites.length} favorites`
                );
                setShowExportModal(false);
            }
        } catch (error) {
            console.error('[DataUsage] Export error:', error);
            Alert.alert('Error', 'Failed to export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteScans = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('scans')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
            Alert.alert('Success', 'All scan history has been deleted.');
            setShowDeleteModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to delete scan history');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurLeft} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Data Usage</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Your Privacy Matters</Text>
                    <Text style={styles.infoText}>
                        GoodFor respects your privacy. We collect only the data necessary to provide you with personalized safety analysis and recommendations.
                    </Text>
                </View>

                {/* Data Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Data Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Account Created</Text>
                        <Text style={styles.summaryValue}>
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Email</Text>
                        <Text style={styles.summaryValue}>{profile?.email || 'N/A'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Data Storage</Text>
                        <Text style={styles.summaryValue}>Encrypted</Text>
                    </View>
                </View>

                {/* Data Categories */}
                <View style={styles.categoriesCard}>
                    {dataCategories.map((category, index) => {
                        const Icon = category.icon;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.categoryItem,
                                    index !== dataCategories.length - 1 && styles.categoryBorder
                                ]}
                                onPress={category.onPress}
                            >
                                <View style={styles.categoryLeft}>
                                    <View style={[
                                        styles.categoryIcon,
                                        category.destructive && { backgroundColor: `${colors.destructive}20` }
                                    ]}>
                                        <Icon
                                            size={24}
                                            color={category.destructive ? colors.destructive : colors.primary}
                                        />
                                    </View>
                                    <View style={styles.categoryInfo}>
                                        <Text style={[
                                            styles.categoryLabel,
                                            category.destructive && { color: colors.destructive }
                                        ]}>
                                            {category.label}
                                        </Text>
                                        <Text style={styles.categoryDescription}>{category.description}</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={colors.mutedForeground} />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        For more information, read our{' '}
                        <Text style={styles.footerLink}>Privacy Policy</Text>
                    </Text>
                </View>
            </ScrollView>

            {/* What We Collect Modal */}
            <Modal
                visible={showCollectModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCollectModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>What We Collect</Text>
                            <Pressable style={styles.modalClose} onPress={() => setShowCollectModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </Pressable>
                        </View>
                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalSection}>
                                <View style={styles.modalIconRow}>
                                    <Eye size={20} color={colors.primary} />
                                    <Text style={styles.modalSectionTitle}>Scan History</Text>
                                </View>
                                <Text style={styles.modalText}>
                                    We store information about products you scan, including barcodes, product names, ingredients, and safety analysis results.
                                </Text>
                            </View>

                            <View style={styles.modalSection}>
                                <View style={styles.modalIconRow}>
                                    <Shield size={20} color={colors.primary} />
                                    <Text style={styles.modalSectionTitle}>Family Profiles</Text>
                                </View>
                                <Text style={styles.modalText}>
                                    Names, age groups, allergens, and dietary preferences for you and family members you add.
                                </Text>
                            </View>

                            <View style={styles.modalSection}>
                                <View style={styles.modalIconRow}>
                                    <Lock size={20} color={colors.primary} />
                                    <Text style={styles.modalSectionTitle}>Preferences</Text>
                                </View>
                                <Text style={styles.modalText}>
                                    Your app settings, display preferences, and notification choices.
                                </Text>
                            </View>

                            <View style={styles.modalNote}>
                                <CheckCircle size={16} color={colors.chart1} />
                                <Text style={styles.modalNoteText}>
                                    All data is encrypted and stored securely. We never sell your data.
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* How We Use Modal */}
            <Modal
                visible={showUsageModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowUsageModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>How We Use Your Data</Text>
                            <Pressable style={styles.modalClose} onPress={() => setShowUsageModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </Pressable>
                        </View>
                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalSection}>
                                <View style={styles.modalIconRow}>
                                    <CheckCircle size={20} color={colors.chart1} />
                                    <Text style={styles.modalSectionTitle}>Safety Analysis</Text>
                                </View>
                                <Text style={styles.modalText}>
                                    We analyze product ingredients against your allergens and dietary restrictions to provide personalized safety scores.
                                </Text>
                            </View>

                            <View style={styles.modalSection}>
                                <View style={styles.modalIconRow}>
                                    <FileText size={20} color={colors.chart1} />
                                    <Text style={styles.modalSectionTitle}>Recommendations</Text>
                                </View>
                                <Text style={styles.modalText}>
                                    Your scan history helps us suggest healthier alternatives that match your preferences.
                                </Text>
                            </View>

                            <View style={styles.modalSection}>
                                <View style={styles.modalIconRow}>
                                    <Database size={20} color={colors.chart1} />
                                    <Text style={styles.modalSectionTitle}>Product Database</Text>
                                </View>
                                <Text style={styles.modalText}>
                                    We use scan data to improve our product database and safety algorithms for all users.
                                </Text>
                            </View>

                            <View style={styles.modalNote}>
                                <Lock size={16} color={colors.primary} />
                                <Text style={styles.modalNoteText}>
                                    We never share your personal data with third parties or use it for advertising.
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Export Data Modal */}
            <Modal
                visible={showExportModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowExportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Export Your Data</Text>
                            <Pressable style={styles.modalClose} onPress={() => setShowExportModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </Pressable>
                        </View>
                        <View style={styles.modalScroll}>
                            <Text style={styles.modalText}>
                                Export all your data in JSON format. This includes:
                            </Text>
                            <View style={styles.exportList}>
                                <Text style={styles.exportListItem}>• Your profile information</Text>
                                <Text style={styles.exportListItem}>• Complete scan history</Text>
                                <Text style={styles.exportListItem}>• Family member profiles</Text>
                                <Text style={styles.exportListItem}>• Saved favorites</Text>
                                <Text style={styles.exportListItem}>• Preferences and settings</Text>
                            </View>

                            <Pressable
                                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                                onPress={handleExportData}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                                ) : (
                                    <>
                                        <Download size={20} color={colors.primaryForeground} />
                                        <Text style={styles.exportButtonText}>Download My Data</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete Data Modal */}
            <Modal
                visible={showDeleteModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Delete Specific Data</Text>
                            <Pressable style={styles.modalClose} onPress={() => setShowDeleteModal(false)}>
                                <X size={24} color={colors.foreground} />
                            </Pressable>
                        </View>
                        <View style={styles.modalScroll}>
                            <View style={styles.deleteWarning}>
                                <AlertTriangle size={24} color={colors.chart2} />
                                <Text style={styles.deleteWarningText}>
                                    These actions cannot be undone. Please be certain.
                                </Text>
                            </View>

                            <Pressable
                                style={styles.deleteOption}
                                onPress={() => {
                                    Alert.alert(
                                        'Delete Scan History',
                                        'Are you sure you want to delete all your scan history? This cannot be undone.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Delete', style: 'destructive', onPress: handleDeleteScans }
                                        ]
                                    );
                                }}
                            >
                                <View style={styles.deleteOptionLeft}>
                                    <Trash2 size={20} color={colors.destructive} />
                                    <View>
                                        <Text style={styles.deleteOptionTitle}>Delete Scan History</Text>
                                        <Text style={styles.deleteOptionDesc}>Remove all product scans</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={colors.mutedForeground} />
                            </Pressable>

                            <Pressable
                                style={styles.deleteOption}
                                onPress={() => router.push('/family-profiles')}
                            >
                                <View style={styles.deleteOptionLeft}>
                                    <Trash2 size={20} color={colors.destructive} />
                                    <View>
                                        <Text style={styles.deleteOptionTitle}>Manage Family Profiles</Text>
                                        <Text style={styles.deleteOptionDesc}>Edit or remove family members</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={colors.mutedForeground} />
                            </Pressable>

                            <Pressable
                                style={[styles.deleteOption, styles.deleteOptionDanger]}
                                onPress={() => router.push('/delete-account')}
                            >
                                <View style={styles.deleteOptionLeft}>
                                    <Trash2 size={20} color="#fff" />
                                    <View>
                                        <Text style={[styles.deleteOptionTitle, { color: '#fff' }]}>Delete Entire Account</Text>
                                        <Text style={[styles.deleteOptionDesc, { color: 'rgba(255,255,255,0.7)' }]}>Remove all data permanently</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: colors.accent,
        opacity: 0.4,
        borderRadius: 128,
    },
    blurLeft: {
        position: 'absolute',
        top: '25%',
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
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
    infoCard: {
        backgroundColor: `${colors.primary}10`,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        marginBottom: spacing[6],
        borderWidth: 1,
        borderColor: `${colors.primary}20`,
    },
    infoTitle: {
        fontSize: 18,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    infoText: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        marginBottom: spacing[6],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 16,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        marginBottom: spacing[4],
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}40`,
    },
    summaryLabel: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
    },
    summaryValue: {
        fontSize: 14,
        fontFamily: fonts.sans.semiBold,
        color: colors.foreground,
    },
    categoriesCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
        marginBottom: spacing[6],
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
    },
    categoryBorder: {
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}40`,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        flex: 1,
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: radius['2xl'],
        backgroundColor: `${colors.accent}80`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryLabel: {
        fontSize: 16,
        fontFamily: fonts.sans.semiBold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    categoryDescription: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
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
    footerLink: {
        color: colors.primary,
        fontFamily: fonts.sans.semiBold,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: radius['3xl'],
        borderTopRightRadius: radius['3xl'],
        maxHeight: '80%',
        paddingBottom: spacing[8],
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing[6],
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}40`,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
    },
    modalClose: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScroll: {
        padding: spacing[6],
    },
    modalSection: {
        marginBottom: spacing[5],
    },
    modalIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginBottom: spacing[2],
    },
    modalSectionTitle: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    modalText: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        lineHeight: 22,
    },
    modalNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        backgroundColor: `${colors.chart1}10`,
        padding: spacing[4],
        borderRadius: radius.xl,
        marginTop: spacing[4],
    },
    modalNoteText: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sans.regular,
        color: colors.chart1,
        lineHeight: 20,
    },
    // Export Modal
    exportList: {
        marginVertical: spacing[4],
        gap: spacing[2],
    },
    exportListItem: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.xl,
        marginTop: spacing[4],
    },
    exportButtonDisabled: {
        opacity: 0.6,
    },
    exportButtonText: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    // Delete Modal
    deleteWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        backgroundColor: `${colors.chart2}15`,
        padding: spacing[4],
        borderRadius: radius.xl,
        marginBottom: spacing[5],
    },
    deleteWarningText: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sans.medium,
        color: colors.chart2,
    },
    deleteOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
        backgroundColor: colors.muted,
        borderRadius: radius.xl,
        marginBottom: spacing[3],
    },
    deleteOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    deleteOptionTitle: {
        fontSize: 15,
        fontFamily: fonts.sans.semiBold,
        color: colors.foreground,
    },
    deleteOptionDesc: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    deleteOptionDanger: {
        backgroundColor: colors.destructive,
    },
});
