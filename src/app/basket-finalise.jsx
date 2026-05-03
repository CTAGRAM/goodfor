import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, ArrowRight, TrendingUp, Flame } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { getBasketDetail, getStreak, getScoreColor } from '@/lib/basketService';
import { useAuth } from '@/contexts/AuthContext';

export default function BasketFinalise() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { basketId, score: scoreParam } = useLocalSearchParams();
    const { user } = useAuth();
    const [basket, setBasket] = useState(null);
    const [streak, setStreak] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [b, s] = await Promise.all([
                    getBasketDetail(basketId),
                    getStreak(user?.id),
                ]);
                setBasket(b);
                setStreak(s);
            } catch (e) {
                console.error('[BasketFinalise] Error:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [basketId]);

    const finalScore = basket?.score || parseInt(scoreParam) || 0;
    const itemCount = basket?.basket_items?.length || 0;
    const previousAvg = streak?.average_score || 0;
    const improvement = previousAvg > 0 ? finalScore - previousAvg : 0;

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.content, { paddingTop: insets.top + 40 }]}>

                {/* Success Icon */}
                <View style={styles.successIcon}>
                    <CheckCircle size={64} color={colors.chart1} />
                </View>

                <Text style={styles.title}>Basket Finalised!</Text>
                <Text style={styles.subtitle}>{itemCount} product{itemCount !== 1 ? 's' : ''} saved</Text>

                {/* Score */}
                <View style={[styles.scoreBadge, { backgroundColor: `${getScoreColor(finalScore)}12` }]}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(finalScore) }]}>{finalScore}</Text>
                    <Text style={styles.scoreLabel}>/100</Text>
                </View>

                {/* Improvement */}
                {improvement !== 0 && (
                    <View style={styles.improvementCard}>
                        <TrendingUp size={18} color={improvement > 0 ? '#22C55E' : '#EF4444'} />
                        <Text style={[styles.improvementText, { color: improvement > 0 ? '#22C55E' : '#EF4444' }]}>
                            {improvement > 0 ? '+' : ''}{improvement} {improvement > 0 ? 'improvement' : 'points'} from your average
                        </Text>
                    </View>
                )}

                {/* Streak */}
                {streak && streak.current_streak > 0 && (
                    <View style={styles.streakCard}>
                        <Flame size={20} color="#F59E0B" />
                        <Text style={styles.streakText}>
                            {streak.current_streak} week shopping streak!
                        </Text>
                    </View>
                )}

                {/* Lumi message */}
                <View style={styles.lumiMessage}>
                    <Text style={styles.lumiLabel}>Lumi says:</Text>
                    <Text style={styles.lumiText}>
                        {finalScore >= 80
                            ? "Excellent basket! You're making really smart choices for your health. 🌟"
                            : finalScore >= 60
                                ? "Good effort! Try swapping a couple of items next time for an even better score. 👍"
                                : "There's room to improve — but that's okay! Each shopping trip is a chance to do better. 💪"
                        }
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <Pressable style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
                    <Text style={styles.homeBtnText}>Back to Home</Text>
                    <ArrowRight size={20} color={colors.primaryForeground} />
                </Pressable>
                <Pressable style={styles.historyLink} onPress={() => router.replace('/basket-history')}>
                    <Text style={styles.historyLinkText}>View basket history</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing[6] },
    successIcon: {
        width: 100, height: 100, borderRadius: 50, backgroundColor: `${colors.chart1}15`,
        alignItems: 'center', justifyContent: 'center', marginBottom: spacing[5],
    },
    title: { fontSize: 26, fontFamily: fonts.heading, color: colors.foreground, marginBottom: spacing[2] },
    subtitle: { fontSize: 15, fontFamily: fonts.sans, color: colors.mutedForeground, marginBottom: spacing[6] },
    scoreBadge: {
        flexDirection: 'row', alignItems: 'baseline', gap: 2,
        paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radius.full,
        marginBottom: spacing[5],
    },
    scoreValue: { fontSize: 40, fontFamily: fonts.heading },
    scoreLabel: { fontSize: 18, fontFamily: fonts.sans, color: colors.mutedForeground },
    improvementCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[2],
        paddingHorizontal: spacing[4], paddingVertical: spacing[2],
        backgroundColor: colors.card, borderRadius: radius.full,
        borderWidth: 1, borderColor: colors.border, marginBottom: spacing[4],
    },
    improvementText: { fontSize: 14, fontFamily: fonts.sansSemiBold },
    streakCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[2],
        paddingHorizontal: spacing[4], paddingVertical: spacing[2],
        backgroundColor: `${colors.chart3}10`, borderRadius: radius.full,
        borderWidth: 1, borderColor: `${colors.chart3}20`, marginBottom: spacing[5],
    },
    streakText: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.chart3 },
    lumiMessage: {
        backgroundColor: colors.card, borderRadius: radius['2xl'], padding: spacing[5],
        width: '100%', borderWidth: 1, borderColor: `${colors.chart1}20`,
    },
    lumiLabel: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.chart1, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing[2] },
    lumiText: { fontSize: 15, fontFamily: fonts.sansMedium, color: colors.foreground, lineHeight: 22 },
    footer: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
    homeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[3],
        backgroundColor: colors.primary, paddingVertical: spacing[4], borderRadius: radius.full,
    },
    homeBtnText: { fontSize: 17, fontFamily: fonts.sansBold, color: colors.primaryForeground },
    historyLink: { paddingVertical: spacing[3], alignItems: 'center' },
    historyLinkText: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.mutedForeground },
});
