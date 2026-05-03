/**
 * Alerts Feed Screen — Brand-matched Recall Alerts
 * 
 * Compact UI with segmented controls, dropdown region picker,
 * and dark green brand colors (#243628).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    Linking,
    Modal,
    TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    AlertTriangle,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    ChevronDown,
    Check,
    Flame,
    Info,
    Shield,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import {
    fetchAllRecalls,
    getUserRegion,
    setUserRegion,
    getRecallSeverity,
    formatRecallDate,
    REGION_OPTIONS,
} from '@/lib/recallService';
import { hapticLight, hapticMedium } from '@/lib/haptics';

export default function AlertsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [recalls, setRecalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [region, setRegion] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [showRegionPicker, setShowRegionPicker] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        const userRegion = await getUserRegion();
        setRegion(userRegion);
        await loadRecalls(userRegion);
    };

    const loadRecalls = async (selectedRegion = region, force = false) => {
        try {
            setLoading(true);
            const data = await fetchAllRecalls(selectedRegion, force);
            setRecalls(data);
        } catch (error) {
            console.error('[Alerts] Error loading recalls:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        hapticLight();
        await loadRecalls(region, true);
        setRefreshing(false);
    }, [region]);

    const handleRegionChange = async (newRegion) => {
        hapticLight();
        setRegion(newRegion);
        setShowRegionPicker(false);
        await setUserRegion(newRegion);
        await loadRecalls(newRegion, true);
    };

    const filteredRecalls = recalls.filter(r => {
        if (severityFilter === 'dangerous') return r.severity === 'dangerous';
        if (severityFilter === 'moderate') return r.severity === 'moderate';
        if (severityFilter === 'low') return r.severity === 'low';
        return true;
    });

    const openRecallURL = (url) => {
        hapticLight();
        if (url) Linking.openURL(url);
    };

    const getSeverityConfig = (severity) => {
        switch (severity) {
            case 'dangerous':
                return { color: '#DC2626', bgColor: '#FEE2E2', label: 'Critical', icon: Flame };
            case 'moderate':
                return { color: '#D97706', bgColor: '#FEF3C7', label: 'Moderate', icon: AlertTriangle };
            case 'low':
                return { color: colors.chart1, bgColor: '#D1FAE5', label: 'Low Risk', icon: Info };
            default:
                return { color: colors.mutedForeground, bgColor: '#F3F4F6', label: 'Info', icon: Shield };
        }
    };

    const getSourceConfig = (source) => {
        switch (source) {
            case 'FDA': return { emoji: '🇺🇸', name: 'US FDA', color: '#1D4ED8' };
            case 'FSA': return { emoji: '🇬🇧', name: 'UK FSA', color: '#7C3AED' };
            case 'RASFF': return { emoji: '🇪🇺', name: 'EU RASFF', color: '#0891B2' };
            default: return { emoji: '📋', name: source, color: colors.primary };
        }
    };

    const currentRegionOpt = REGION_OPTIONS.find(r => r.key === region);
    const dangerousCount = recalls.filter(r => r.severity === 'dangerous').length;
    const moderateCount = recalls.filter(r => r.severity === 'moderate').length;
    const lowCount = recalls.length - dangerousCount - moderateCount;

    const severityOptions = [
        { key: 'all', label: 'All' },
        { key: 'dangerous', label: 'Critical' },
        { key: 'moderate', label: 'Moderate' },
        { key: 'low', label: 'Low Risk' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => { hapticLight(); router.back(); }}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Recall Alerts</Text>
                <Pressable style={styles.refreshBtn} onPress={onRefresh}>
                    <RefreshCw size={20} color={colors.primary} />
                </Pressable>
            </View>

            {/* Region Dropdown + Severity Segments */}
            <View style={styles.controlsRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    {/* Region Dropdown */}
                    <Pressable
                        style={styles.regionDropdown}
                        onPress={() => { hapticLight(); setShowRegionPicker(true); }}
                    >
                        <Text style={styles.regionEmoji}>{currentRegionOpt?.emoji || '🌍'}</Text>
                        <Text style={styles.regionLabel}>
                            {currentRegionOpt?.key === 'all' ? 'All Regions' : currentRegionOpt?.key?.toUpperCase()}
                        </Text>
                        <ChevronDown size={16} color={colors.mutedForeground} />
                    </Pressable>
                </View>

                {/* Severity Segmented Control — full width row below */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View style={styles.segmentedControl}>
                        {severityOptions.map(opt => (
                            <Pressable
                                key={opt.key}
                                style={[
                                    styles.segment,
                                    severityFilter === opt.key && styles.segmentActive,
                                ]}
                                onPress={() => { hapticLight(); setSeverityFilter(opt.key); }}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    severityFilter === opt.key && styles.segmentTextActive,
                                ]} numberOfLines={1}>
                                    {opt.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Compact Stats Row */}
            {!loading && recalls.length > 0 && (
                <View style={styles.statsRow}>
                    <Text style={styles.statsText}>
                        <Text style={styles.statsCount}>{filteredRecalls.length}</Text> alerts
                        {dangerousCount > 0 && (
                            <Text style={{ color: '#DC2626' }}>  •  {dangerousCount} critical</Text>
                        )}
                    </Text>
                </View>
            )}

            {/* Content */}
            {loading && recalls.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <View style={styles.loadingIcon}>
                        <Shield size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.loadingText}>Checking safety databases...</Text>
                    <Text style={styles.loadingSubtext}>FDA • FSA • RASFF</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                >
                    {filteredRecalls.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <ShieldCheck size={36} color={colors.chart1} />
                            </View>
                            <Text style={styles.emptyTitle}>All Clear!</Text>
                            <Text style={styles.emptyText}>
                                No recall alerts found. We'll notify you if something comes up.
                            </Text>
                        </View>
                    ) : (
                        filteredRecalls.map((recall, index) => {
                            const sev = getSeverityConfig(recall.severity);
                            const src = getSourceConfig(recall.source);
                            const SevIcon = sev.icon;

                            return (
                                <Pressable
                                    key={recall.id || index}
                                    style={({ pressed }) => [
                                        styles.recallCard,
                                        { borderLeftColor: sev.color },
                                        pressed && styles.cardPressed,
                                    ]}
                                    onPress={() => openRecallURL(recall.url)}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.severityBadge, { backgroundColor: sev.bgColor }]}>
                                            <SevIcon size={11} color={sev.color} />
                                            <Text style={[styles.severityText, { color: sev.color }]}>
                                                {sev.label}
                                            </Text>
                                        </View>
                                        <View style={[styles.sourceBadge, { backgroundColor: `${src.color}10` }]}>
                                            <Text style={styles.sourceEmoji}>{src.emoji}</Text>
                                            <Text style={[styles.sourceText, { color: src.color }]}>
                                                {src.name}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.productName} numberOfLines={2}>
                                        {recall.product}
                                    </Text>

                                    {recall.brand ? (
                                        <Text style={styles.brandName}>by {recall.brand}</Text>
                                    ) : null}

                                    <Text style={styles.reason} numberOfLines={2}>
                                        {recall.reason}
                                    </Text>

                                    <View style={styles.cardFooter}>
                                        <Text style={styles.dateText}>
                                            {formatRecallDate(recall.dateRaw || recall.date)}
                                        </Text>
                                        <View style={styles.learnMore}>
                                            <Text style={styles.learnMoreText}>Details</Text>
                                            <ExternalLink size={11} color={colors.primary} />
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })
                    )}
                </ScrollView>
            )}

            {/* Region Picker Modal */}
            <Modal
                visible={showRegionPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRegionPicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowRegionPicker(false)}
                >
                    <View style={[styles.pickerCard, { paddingBottom: insets.bottom + 16 }]}>
                        <Text style={styles.pickerTitle}>Select Region</Text>
                        {REGION_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.key}
                                style={[
                                    styles.pickerOption,
                                    region === opt.key && styles.pickerOptionActive,
                                ]}
                                onPress={() => handleRegionChange(opt.key)}
                            >
                                <View style={styles.pickerOptionLeft}>
                                    <Text style={styles.pickerEmoji}>{opt.emoji}</Text>
                                    <Text style={[
                                        styles.pickerLabel,
                                        region === opt.key && styles.pickerLabelActive,
                                    ]}>
                                        {opt.label}
                                    </Text>
                                </View>
                                {region === opt.key && (
                                    <Check size={18} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: fonts.heading,
        color: colors.foreground,
    },
    refreshBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Controls Row
    controlsRow: {
        flexDirection: 'column',
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[3],
        gap: spacing[3],
    },
    regionDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: radius.lg,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    regionEmoji: {
        fontSize: 16,
    },
    regionLabel: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },

    // Segmented Control
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 3,
        borderWidth: 1,
        borderColor: colors.border,
    },
    segment: {
        paddingHorizontal: 16,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: radius.lg - 2,
    },
    segmentActive: {
        backgroundColor: colors.primary,
    },
    segmentText: {
        fontSize: 12,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    segmentTextActive: {
        color: colors.primaryForeground,
        fontFamily: fonts.sansBold,
    },

    // Stats Row
    statsRow: {
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[2],
    },
    statsText: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },
    statsCount: {
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
    },
    loadingIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
    },
    loadingText: {
        fontSize: 16,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
    loadingSubtext: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing[5],
        gap: spacing[3],
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        gap: spacing[3],
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: `${colors.chart1}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: fonts.heading,
        color: colors.chart1,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 21,
        paddingHorizontal: spacing[10],
    },

    // Recall Card
    recallCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[4],
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    cardPressed: {
        opacity: 0.92,
        transform: [{ scale: 0.99 }],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[2],
    },
    severityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
    },
    severityText: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.full,
    },
    sourceEmoji: { fontSize: 12 },
    sourceText: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
    },
    productName: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: 2,
        lineHeight: 21,
    },
    brandName: {
        fontSize: 12,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
        marginBottom: spacing[1],
    },
    reason: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.foreground,
        lineHeight: 18,
        marginBottom: spacing[2],
        opacity: 0.75,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing[2],
    },
    dateText: {
        fontSize: 11,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },
    learnMore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    learnMoreText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },

    // Region Picker Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    pickerCard: {
        backgroundColor: colors.card,
        borderTopLeftRadius: radius['3xl'],
        borderTopRightRadius: radius['3xl'],
        padding: spacing[5],
        paddingTop: spacing[5],
    },
    pickerTitle: {
        fontSize: 18,
        fontFamily: fonts.heading,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: spacing[4],
        borderRadius: radius.lg,
        marginBottom: spacing[1],
    },
    pickerOptionActive: {
        backgroundColor: `${colors.primary}08`,
    },
    pickerOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pickerEmoji: {
        fontSize: 22,
    },
    pickerLabel: {
        fontSize: 16,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
    pickerLabelActive: {
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
});
