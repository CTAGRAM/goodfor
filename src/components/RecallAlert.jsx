/**
 * RecallAlert Component
 * Phase 5: Health & Product Recall Alerts
 * 
 * Displays a prominent alert when a scanned product matches an active recall.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { AlertTriangle, ExternalLink, X } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { getRecallSeverity, formatRecallDate } from '@/lib/recallService';

export default function RecallAlert({ recall, onDismiss }) {
    if (!recall) return null;

    const severity = getRecallSeverity(recall.classification);

    const openFDAPage = () => {
        Linking.openURL('https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts');
    };

    return (
        <View style={[styles.container, { borderColor: severity.color }]}>
            <View style={[styles.header, { backgroundColor: `${severity.color}15` }]}>
                <View style={styles.headerLeft}>
                    <AlertTriangle size={20} color={severity.color} />
                    <Text style={[styles.headerTitle, { color: severity.color }]}>
                        Product Recall - {severity.label}
                    </Text>
                </View>
                {onDismiss && (
                    <Pressable onPress={onDismiss} style={styles.dismissButton}>
                        <X size={18} color={colors.mutedForeground} />
                    </Pressable>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.reason}>{recall.reason}</Text>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brand:</Text>
                    <Text style={styles.detailValue}>{recall.brand || 'Unknown'}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatRecallDate(recall.date)}</Text>
                </View>

                {recall.distribution && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Affected:</Text>
                        <Text style={styles.detailValue} numberOfLines={2}>
                            {recall.distribution}
                        </Text>
                    </View>
                )}

                <Text style={styles.severityDesc}>{severity.description}</Text>

                <Pressable style={styles.learnMoreButton} onPress={openFDAPage}>
                    <Text style={styles.learnMoreText}>Learn more on FDA.gov</Text>
                    <ExternalLink size={14} color={colors.primary} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        borderWidth: 2,
        marginBottom: spacing[4],
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[3],
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    headerTitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
    },
    dismissButton: {
        padding: spacing[1],
    },
    content: {
        padding: spacing[4],
        paddingTop: spacing[2],
    },
    reason: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
        lineHeight: 20,
        marginBottom: spacing[3],
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: spacing[2],
    },
    detailLabel: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
        color: colors.mutedForeground,
        width: 70,
    },
    detailValue: {
        flex: 1,
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.foreground,
    },
    severityDesc: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        fontStyle: 'italic',
        marginTop: spacing[2],
        marginBottom: spacing[3],
    },
    learnMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        paddingVertical: spacing[2],
        backgroundColor: `${colors.primary}10`,
        borderRadius: radius.lg,
    },
    learnMoreText: {
        fontSize: 13,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
    },
});
