import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ShoppingCart, ChevronRight, TrendingUp } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getBasketHistory, getScoreColor, getStreak } from '@/lib/basketService';

export default function BasketHistory() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const [baskets, setBaskets] = useState([]);
    const [streak, setStreak] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        if (!user?.id) return;
        try {
            const [historyData, streakData] = await Promise.all([
                getBasketHistory(user.id),
                getStreak(user.id),
            ]);
            setBaskets(historyData);
            setStreak(streakData);
        } catch (e) {
            console.error('[BasketHistory] Error:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadHistory();
    }, [user?.id]));

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const renderBasket = ({ item, index }) => {
        const prevScore = index < baskets.length - 1 ? baskets[index + 1]?.score : null;
        const improvement = prevScore !== null ? item.score - prevScore : null;

        return (
            <Pressable
                style={styles.basketCard}
                onPress={() => router.push({ pathname: '/basket', params: { basketId: item.id } })}
            >
                <View style={[styles.basketIcon, { backgroundColor: `${getScoreColor(item.score)}12` }]}>
                    <ShoppingCart size={20} color={getScoreColor(item.score)} />
                </View>
                <View style={styles.basketInfo}>
                    <Text style={styles.basketDate}>{formatDate(item.date)}</Text>
                    <Text style={styles.basketItems}>{item.item_count || 0} items</Text>
                </View>
                <View style={styles.basketRight}>
                    <Text style={[styles.basketScore, { color: getScoreColor(item.score) }]}>
                        {item.score}
                    </Text>
                    {improvement !== null && improvement !== 0 && (
                        <View style={styles.basketChange}>
                            <TrendingUp size={10} color={improvement > 0 ? '#22C55E' : '#EF4444'} />
                            <Text style={[styles.basketChangeText, { color: improvement > 0 ? '#22C55E' : '#EF4444' }]}>
                                {improvement > 0 ? '+' : ''}{improvement}
                            </Text>
                        </View>
                    )}
                </View>
                <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Basket History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Stats */}
            {streak && (
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{streak.total_baskets || 0}</Text>
                        <Text style={styles.statLabel}>Total Shops</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{streak.average_score || 0}</Text>
                        <Text style={styles.statLabel}>Avg Score</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.chart3 }]}>{streak.longest_streak || 0}w</Text>
                        <Text style={styles.statLabel}>Best Streak</Text>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : baskets.length === 0 ? (
                <View style={styles.emptyState}>
                    <ShoppingCart size={48} color={`${colors.mutedForeground}40`} />
                    <Text style={styles.emptyTitle}>No baskets yet</Text>
                    <Text style={styles.emptySub}>Your completed shopping baskets will appear here.</Text>
                </View>
            ) : (
                <FlatList
                    data={baskets}
                    keyExtractor={item => item.id}
                    renderItem={renderBasket}
                    contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: insets.bottom + 20 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing[5], paddingBottom: spacing[3],
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: `${colors.card}CC`, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontFamily: fonts.heading, color: colors.foreground },
    statsRow: {
        flexDirection: 'row', gap: spacing[3], paddingHorizontal: spacing[5], marginBottom: spacing[4],
    },
    statCard: {
        flex: 1, backgroundColor: colors.card, borderRadius: radius.xl,
        padding: spacing[3], alignItems: 'center',
        borderWidth: 1, borderColor: `${colors.border}50`,
    },
    statValue: { fontSize: 20, fontFamily: fonts.heading, color: colors.primary },
    statLabel: { fontSize: 10, fontFamily: fonts.sansMedium, color: colors.mutedForeground, marginTop: 2 },
    basketCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[3],
        backgroundColor: colors.card, borderRadius: radius.xl,
        padding: spacing[4], marginBottom: spacing[3],
        borderWidth: 1, borderColor: `${colors.border}50`,
    },
    basketIcon: {
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    },
    basketInfo: { flex: 1 },
    basketDate: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.foreground },
    basketItems: { fontSize: 12, fontFamily: fonts.sans, color: colors.mutedForeground },
    basketRight: { alignItems: 'flex-end', marginRight: spacing[2] },
    basketScore: { fontSize: 18, fontFamily: fonts.heading },
    basketChange: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    basketChangeText: { fontSize: 10, fontFamily: fonts.sansBold },
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3], padding: spacing[6],
    },
    emptyTitle: { fontSize: 18, fontFamily: fonts.sansBold, color: colors.foreground },
    emptySub: { fontSize: 14, fontFamily: fonts.sans, color: colors.mutedForeground, textAlign: 'center' },
});
