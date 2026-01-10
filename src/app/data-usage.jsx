import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Database,
    Eye,
    Download,
    Trash2,
    ChevronRight
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";

export default function DataUsage() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile } = useAuth();

    const dataCategories = [
        {
            icon: Eye,
            label: 'What We Collect',
            description: 'Scan history, family profiles, and preferences',
            action: 'View Details'
        },
        {
            icon: Database,
            label: 'How We Use Your Data',
            description: 'To provide safety analysis and personalized recommendations',
            action: 'Learn More'
        },
        {
            icon: Download,
            label: 'Export Your Data',
            description: 'Download all your data in JSON format',
            action: 'Download'
        },
        {
            icon: Trash2,
            label: 'Delete Specific Data',
            description: 'Remove scan history or family profiles',
            action: 'Manage',
            destructive: true
        }
    ];

    const handleAction = (label) => {
        if (label === 'Export Your Data') {
            Alert.alert(
                'Export Data',
                'Your data will be prepared and sent to your email address.',
                [{ text: 'OK' }]
            );
        } else {
            Alert.alert('Data Usage', `${label} feature coming soon!`, [{ text: 'OK' }]);
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
                                onPress={() => handleAction(category.label)}
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
});
