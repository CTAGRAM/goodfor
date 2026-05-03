import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, RefreshControl, Image, Modal, FlatList
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft, ShoppingCart, Trash2, RefreshCw, QrCode,
    TrendingUp, Flame, Sparkles, History as HistoryIcon,
    Heart, Plus, X, ArrowRightLeft, ChevronRight, Check
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import {
    getOrCreateTodayBasket, removeFromBasket as removeItem,
    finaliseBasket, getScoreColor, getScoreLevel, getLumiTip, getStreak,
    getRecentBasketItems, addToBasket, replaceBasketItem, getBasketDetail,
    addHistoricalBasketToToday
} from '@/lib/basketService';
import { useAlert } from '@/contexts/AlertContext';
import AnimatedPressable from '@/components/AnimatedPressable';
import { BlurView } from 'expo-blur';

export default function Basket() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const { basketId: routeBasketId } = useLocalSearchParams();
    const isHistorical = !!routeBasketId;

    const [basket, setBasket] = useState(null);
    const [streak, setStreak] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [finalising, setFinalising] = useState(false);
    const [addingHistorical, setAddingHistorical] = useState(false);

    // Previous basket items modal
    const [showPreviousModal, setShowPreviousModal] = useState(false);
    const [previousItems, setPreviousItems] = useState([]);
    const [loadingPrevious, setLoadingPrevious] = useState(false);
    const [addingItemId, setAddingItemId] = useState(null);
    const [addedItemIds, setAddedItemIds] = useState(new Set());

    const loadBasket = async () => {
        if (!user?.id && !isHistorical) return;
        try {
            let basketData;
            if (isHistorical) {
                // Load a specific historical basket (read-only)
                basketData = await getBasketDetail(routeBasketId);
            } else {
                basketData = await getOrCreateTodayBasket(user.id);
            }
            const streakData = user?.id ? await getStreak(user.id) : null;
            setBasket(basketData);
            setStreak(streakData);
        } catch (e) {
            console.error('[Basket] Load error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadBasket();
    }, [user?.id, routeBasketId]));

    const handleRemoveItem = async (itemId) => {
        hapticLight();
        try {
            await removeItem(itemId, basket.id);
            await loadBasket();
        } catch (e) {
            showAlert('Error', 'Could not remove item');
        }
    };

    const handleReplaceItem = (itemId) => {
        hapticMedium();
        // Navigate to scan with replace context
        router.push({
            pathname: '/(tabs)/scan',
            params: { replaceItemId: itemId, basketId: basket.id }
        });
    };

    const handleFinalise = async () => {
        if (!basket?.basket_items?.length) return;
        hapticMedium();
        showAlert(
            'Finish Shopping?',
            `Your basket score is ${basket.score || 0}/100. This will save today's basket.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Finalise',
                    onPress: async () => {
                        setFinalising(true);
                        try {
                            await finaliseBasket(basket.id, user.id);
                            hapticSuccess();
                            router.push({
                                pathname: '/basket-finalise',
                                params: { basketId: basket.id, score: basket.score }
                            });
                        } catch (e) {
                            showAlert('Error', 'Could not finalise basket');
                        } finally {
                            setFinalising(false);
                        }
                    }
                }
            ]
        );
    };

    // Load previous basket items
    const handleShowPrevious = async () => {
        hapticLight();
        setAddedItemIds(new Set());
        setShowPreviousModal(true);
        setLoadingPrevious(true);
        try {
            const items = await getRecentBasketItems(user.id);
            setPreviousItems(items);
        } catch (e) {
            console.error('[Basket] Previous items error:', e);
        } finally {
            setLoadingPrevious(false);
        }
    };

    // Add a previous item to current basket
    const handleAddPreviousItem = async (item) => {
        setAddingItemId(item.barcode);
        try {
            await addToBasket(basket.id, item);
            hapticSuccess();
            await loadBasket();
            setAddedItemIds(prev => new Set(prev).add(item.barcode));
        } catch (e) {
            showAlert('Error', 'Could not add item');
        } finally {
            setAddingItemId(null);
        }
    };

    const handleAddHistoricalBasket = async () => {
        hapticMedium();
        showAlert(
            'Add to Today\'s Basket',
            'This will add all items from this past basket into your current active basket. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Add Items',
                    onPress: async () => {
                        setAddingHistorical(true);
                        try {
                            await addHistoricalBasketToToday(basket.id, user.id);
                            hapticSuccess();
                            showAlert('Success', 'Items added to today\'s basket!');
                            router.replace('/basket');
                        } catch (e) {
                            showAlert('Error', 'Could not add items to today\'s basket');
                        } finally {
                            setAddingHistorical(false);
                        }
                    }
                }
            ]
        );
    };

    const items = basket?.basket_items || [];
    const score = basket?.score || 0;
    const dist = basket?.color_distribution || { good: 0, moderate: 0, improve: 0 };
    const previousScore = streak?.average_score || 0;
    const improvement = previousScore > 0 ? score - previousScore : 0;

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

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerBtnShadow}>
                    <Pressable style={styles.headerBtn} onPress={() => router.back()}>
                        <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
                            <ArrowLeft size={24} color={colors.foreground} />
                        </BlurView>
                    </Pressable>
                </View>
                <Text style={styles.headerTitle}>{isHistorical ? 'Past Basket' : 'Smart Basket'}</Text>
                <View style={styles.headerBtnShadow}>
                    <Pressable style={styles.headerBtn} onPress={() => router.push('/basket-history')}>
                        <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
                            <HistoryIcon size={20} color={colors.primary} />
                        </BlurView>
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBasket(); }} />
                }
            >
                {/* Historical banner */}
                {isHistorical && (
                    <View style={{ backgroundColor: `${colors.chart3}10`, borderRadius: 14, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: `${colors.chart3}20` }}>
                        <HistoryIcon size={16} color={colors.chart3} />
                        <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.foreground, flex: 1 }}>Viewing a past shopping basket (read-only)</Text>
                    </View>
                )}
                {/* Score Card */}
                <View style={styles.scoreCard}>
                    <View style={styles.scoreCircleOuter}>
                        <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
                            <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}</Text>
                            <Text style={styles.scoreLabel}>/100</Text>
                        </View>
                    </View>
                    <Text style={styles.scoreTitle}>Basket Health Score</Text>
                    <Text style={styles.scoreItemCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>

                    {/* Improvement Badge */}
                    {improvement !== 0 && items.length > 0 && (
                        <View style={[styles.improvementBadge, { backgroundColor: improvement > 0 ? '#22C55E15' : '#EF444415' }]}>
                            <TrendingUp size={14} color={improvement > 0 ? '#22C55E' : '#EF4444'} />
                            <Text style={[styles.improvementText, { color: improvement > 0 ? '#22C55E' : '#EF4444' }]}>
                                {improvement > 0 ? '+' : ''}{improvement} from your average
                            </Text>
                        </View>
                    )}

                    {/* Color Distribution */}
                    {items.length > 0 && (
                        <View style={styles.distContainer}>
                            <View style={styles.distBar}>
                                {dist.good > 0 && (
                                    <View style={[styles.distSegment, { flex: dist.good, backgroundColor: '#22C55E' }]} />
                                )}
                                {dist.moderate > 0 && (
                                    <View style={[styles.distSegment, { flex: dist.moderate, backgroundColor: '#F59E0B' }]} />
                                )}
                                {dist.improve > 0 && (
                                    <View style={[styles.distSegment, { flex: dist.improve, backgroundColor: '#EF4444' }]} />
                                )}
                            </View>
                            <View style={styles.distLabels}>
                                <View style={styles.distLabelRow}>
                                    <View style={[styles.distDot, { backgroundColor: '#22C55E' }]} />
                                    <Text style={styles.distText}>{dist.good}% Good</Text>
                                </View>
                                <View style={styles.distLabelRow}>
                                    <View style={[styles.distDot, { backgroundColor: '#F59E0B' }]} />
                                    <Text style={styles.distText}>{dist.moderate}% Moderate</Text>
                                </View>
                                <View style={styles.distLabelRow}>
                                    <View style={[styles.distDot, { backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.distText}>{dist.improve}% Improve</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Streak Badge */}
                {streak && streak.current_streak > 0 && (
                    <View style={styles.streakCard}>
                        <Flame size={20} color="#F59E0B" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.streakTitle}>{streak.current_streak} week streak!</Text>
                            <Text style={styles.streakSub}>Keep shopping healthy to maintain it</Text>
                        </View>
                        <Text style={styles.streakBest}>Best: {streak.longest_streak}w</Text>
                    </View>
                )}

                {/* Lumi Tip */}
                <View style={styles.lumiCard}>
                    <Sparkles size={16} color={colors.chart1} />
                    <Text style={styles.lumiText}>{getLumiTip(score, dist, previousScore)}</Text>
                </View>

                {/* Items List */}
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <ShoppingCart size={48} color={`${colors.mutedForeground}40`} />
                        <Text style={styles.emptyTitle}>Start building your basket</Text>
                        <Text style={styles.emptySub}>
                            Scan products or add items from favourites{'\n'}to see your basket health score.
                        </Text>
                        <Pressable style={styles.scanBtn} onPress={() => router.push('/(tabs)/scan')}>
                            <QrCode size={18} color={colors.primaryForeground} />
                            <Text style={styles.scanBtnText}>Start Scanning</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.itemsList}>
                        <Text style={styles.itemsHeader}>Products in Basket</Text>
                        {items.map((item) => {
                            const itemColor = getScoreColor(item.safety_score);
                            const itemLevel = getScoreLevel(item.safety_score);
                            return (
                                <Animated.View 
                                    key={item.id} 
                                    style={styles.itemCard}
                                    layout={LinearTransition.springify().damping(14)}
                                    entering={FadeInDown}
                                    exiting={FadeOutUp}
                                >
                                    {/* Status colour dot */}
                                    <View style={[styles.statusDot, { backgroundColor: itemColor }]} />

                                    {item.product_image_url ? (
                                        <Image source={{ uri: item.product_image_url }} style={styles.itemImage} />
                                    ) : (
                                        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                                            <ShoppingCart size={18} color={colors.mutedForeground} />
                                        </View>
                                    )}
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                                        {item.product_brand ? (
                                            <Text style={styles.itemBrand} numberOfLines={1}>{item.product_brand}</Text>
                                        ) : null}
                                        <View style={styles.itemStatusRow}>
                                            <Text style={[styles.itemStatusLabel, { color: itemColor }]}>
                                                {itemLevel}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[styles.itemScoreBadge, { backgroundColor: `${itemColor}15` }]}>
                                        <Text style={[styles.itemScoreText, { color: itemColor }]}>
                                            {item.safety_score}
                                        </Text>
                                    </View>
                                    {/* Actions — only for current basket */}
                                    {!isHistorical && (
                                    <View style={styles.itemActions}>
                                        <Pressable
                                            style={styles.itemActionBtn}
                                            onPress={() => handleReplaceItem(item.id)}
                                        >
                                            <ArrowRightLeft size={14} color={colors.chart5} />
                                            <Text style={[styles.itemActionText, { color: colors.chart5 }]}>Replace</Text>
                                        </Pressable>
                                        <Pressable
                                            style={styles.itemActionBtn}
                                            onPress={() => handleRemoveItem(item.id)}
                                        >
                                            <Trash2 size={14} color={colors.destructive} />
                                            <Text style={[styles.itemActionText, { color: colors.destructive }]}>Remove</Text>
                                        </Pressable>
                                    </View>
                                    )}
                                </Animated.View>
                            );
                        })}
                    </View>
                )}

                {/* Quick Add Actions — only for current basket */}
                {!isHistorical && (
                <View style={styles.quickAddSection}>
                    <Text style={styles.quickAddTitle}>Add more items</Text>
                    <View style={styles.quickAddRow}>
                        <Pressable style={styles.quickAddCard} onPress={() => router.push('/(tabs)/scan')}>
                            <QrCode size={20} color={colors.primary} />
                            <Text style={styles.quickAddLabel}>Scan Product</Text>
                        </Pressable>
                        <Pressable style={styles.quickAddCard} onPress={handleShowPrevious}>
                            <HistoryIcon size={20} color={colors.chart3} />
                            <Text style={styles.quickAddLabel}>Previous Shops</Text>
                        </Pressable>
                        <Pressable style={styles.quickAddCard} onPress={() => router.push('/favorites')}>
                            <Heart size={20} color={colors.chart1} />
                            <Text style={styles.quickAddLabel}>Favourites</Text>
                        </Pressable>
                    </View>
                </View>
                )}
            </ScrollView>

            {/* Finalise Footer — only for current basket */}
            {!isHistorical && items.length > 0 && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    <AnimatedPressable
                        style={[styles.finaliseBtn, finalising && { opacity: 0.6 }]}
                        onPress={handleFinalise}
                        disabled={finalising}
                    >
                        {finalising ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.finaliseBtnText}>Finish Shopping</Text>
                                <TrendingUp size={20} color="#fff" />
                            </>
                        )}
                    </AnimatedPressable>
                </View>
            )}

            {/* Historical Footer */}
            {isHistorical && items.length > 0 && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    <Pressable
                        style={[styles.finaliseBtn, { backgroundColor: colors.chart3 }, addingHistorical && { opacity: 0.6 }]}
                        onPress={handleAddHistoricalBasket}
                        disabled={addingHistorical}
                    >
                        {addingHistorical ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.finaliseBtnText}>Add to Today's Basket</Text>
                                <Plus size={20} color="#fff" />
                            </>
                        )}
                    </Pressable>
                </View>
            )}

            {/* Previous Baskets Modal */}
            <Modal
                visible={showPreviousModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPreviousModal(false)}
            >
                <View style={[styles.modalContainer, { paddingTop: insets.top + 10 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Previous Products</Text>
                        <Pressable onPress={() => setShowPreviousModal(false)}>
                            <X size={24} color={colors.foreground} />
                        </Pressable>
                    </View>
                    <Text style={styles.modalSubtitle}>Tap to add items from your past shopping baskets</Text>

                    {loadingPrevious ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : previousItems.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[3] }}>
                            <HistoryIcon size={48} color={`${colors.mutedForeground}40`} />
                            <Text style={styles.emptyTitle}>No previous shopping data</Text>
                            <Text style={styles.emptySub}>Complete your first basket to see items here.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={previousItems}
                            keyExtractor={(item) => item.barcode}
                            contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingHorizontal: spacing[5] }}
                            renderItem={({ item }) => {
                                const prevColor = getScoreColor(item.safetyScore);
                                const isAdding = addingItemId === item.barcode;
                                const isAdded = addedItemIds.has(item.barcode);
                                return (
                                    <Pressable
                                        style={[styles.prevItemCard, isAdded && { opacity: 0.6 }]}
                                        onPress={() => !isAdded && handleAddPreviousItem(item)}
                                        disabled={isAdding || isAdded}
                                    >
                                        {item.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={styles.prevItemImage} />
                                        ) : (
                                            <View style={[styles.prevItemImage, styles.itemImagePlaceholder]}>
                                                <ShoppingCart size={16} color={colors.mutedForeground} />
                                            </View>
                                        )}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.prevItemName} numberOfLines={1}>{item.name}</Text>
                                            {item.brand ? (
                                                <Text style={styles.prevItemBrand} numberOfLines={1}>{item.brand}</Text>
                                            ) : null}
                                        </View>
                                        <View style={[styles.itemScoreBadge, { backgroundColor: `${prevColor}15` }]}>
                                            <Text style={[styles.itemScoreText, { color: prevColor }]}>
                                                {item.safetyScore}
                                            </Text>
                                        </View>
                                        {isAdding ? (
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        ) : isAdded ? (
                                            <Check size={18} color={colors.primary} />
                                        ) : (
                                            <Plus size={18} color={colors.primary} />
                                        )}
                                    </Pressable>
                                );
                            }}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing[5], paddingBottom: spacing[3], zIndex: 10,
    },
    headerBtnShadow: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
    },
    blurContainer: {
        flex: 1, alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
    },
    headerTitle: { fontSize: 18, fontFamily: fonts.heading, color: colors.foreground },
    scroll: { flex: 1, paddingHorizontal: spacing[5] },

    // Score Card
    scoreCard: {
        backgroundColor: colors.card, borderRadius: radius['3xl'], padding: spacing[6],
        alignItems: 'center', marginTop: spacing[3], marginBottom: spacing[4],
        borderWidth: 1, borderColor: colors.border,
    },
    scoreCircleOuter: { marginBottom: spacing[4] },
    scoreCircle: {
        width: 100, height: 100, borderRadius: 50, borderWidth: 4,
        alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background,
    },
    scoreValue: { fontSize: 36, fontFamily: fonts.heading },
    scoreLabel: { fontSize: 14, fontFamily: fonts.sans, color: colors.mutedForeground, marginTop: -4 },
    scoreTitle: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.foreground, marginBottom: 2 },
    scoreItemCount: { fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground },

    // Improvement Badge
    improvementBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2,
        borderRadius: radius.full, marginTop: spacing[3],
    },
    improvementText: { fontSize: 12, fontFamily: fonts.sansSemiBold },

    // Distribution
    distContainer: { marginTop: spacing[5], width: '100%' },
    distBar: {
        flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden',
        backgroundColor: `${colors.border}30`, marginBottom: spacing[3],
    },
    distSegment: { height: '100%' },
    distLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    distLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    distDot: { width: 8, height: 8, borderRadius: 4 },
    distText: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.mutedForeground },

    // Streak
    streakCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[3],
        backgroundColor: `${colors.chart3}10`, borderRadius: radius.xl,
        padding: spacing[4], marginBottom: spacing[3],
        borderWidth: 1, borderColor: `${colors.chart3}20`,
    },
    streakTitle: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.foreground },
    streakSub: { fontSize: 11, fontFamily: fonts.sans, color: colors.mutedForeground },
    streakBest: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.chart3 },

    // Lumi Tip
    lumiCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3],
        backgroundColor: `${colors.chart1}08`, borderRadius: radius.xl,
        padding: spacing[4], marginBottom: spacing[4],
        borderWidth: 1, borderColor: `${colors.chart1}15`,
    },
    lumiText: { flex: 1, fontSize: 13, fontFamily: fonts.sansMedium, color: colors.foreground, lineHeight: 19 },

    // Empty State
    emptyState: {
        alignItems: 'center', paddingVertical: spacing[12], gap: spacing[3],
    },
    emptyTitle: { fontSize: 18, fontFamily: fonts.sansBold, color: colors.foreground },
    emptySub: { fontSize: 14, fontFamily: fonts.sans, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
    scanBtn: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[2],
        backgroundColor: colors.primary, paddingVertical: spacing[3], paddingHorizontal: spacing[6],
        borderRadius: radius.full, marginTop: spacing[3],
    },
    scanBtnText: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.primaryForeground },

    // Items List
    itemsList: { marginBottom: spacing[4] },
    itemsHeader: {
        fontSize: 13, fontFamily: fonts.sansBold, color: colors.mutedForeground,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing[3],
    },
    itemCard: {
        backgroundColor: colors.card, borderRadius: radius.xl,
        padding: spacing[3], marginBottom: spacing[3],
        borderWidth: 1, borderColor: `${colors.border}50`,
    },
    statusDot: {
        position: 'absolute', top: spacing[3], left: spacing[3],
        width: 8, height: 8, borderRadius: 4, zIndex: 1,
    },
    itemImage: {
        width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.accent,
        marginLeft: spacing[3],
    },
    itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    itemInfo: { flex: 1, paddingHorizontal: spacing[3], minHeight: 44, justifyContent: 'center' },
    itemName: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.foreground },
    itemBrand: { fontSize: 11, fontFamily: fonts.sans, color: colors.mutedForeground },
    itemStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    itemStatusLabel: { fontSize: 11, fontFamily: fonts.sansMedium },
    itemScoreBadge: {
        paddingHorizontal: spacing[3], paddingVertical: spacing[1],
        borderRadius: radius.lg, minWidth: 36, alignItems: 'center',
        alignSelf: 'flex-start', marginTop: 2,
    },
    itemScoreText: { fontSize: 14, fontFamily: fonts.sansBold },
    itemActions: {
        flexDirection: 'row', gap: spacing[4], marginTop: spacing[2],
        paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: `${colors.border}30`,
        paddingLeft: spacing[3],
    },
    itemActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing[1] },
    itemActionText: { fontSize: 12, fontFamily: fonts.sansSemiBold },

    // Quick Add Section
    quickAddSection: { marginBottom: spacing[6] },
    quickAddTitle: {
        fontSize: 13, fontFamily: fonts.sansBold, color: colors.mutedForeground,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing[3],
    },
    quickAddRow: { flexDirection: 'row', gap: spacing[3] },
    quickAddCard: {
        flex: 1, backgroundColor: colors.card, borderRadius: radius.xl,
        padding: spacing[4], alignItems: 'center', gap: spacing[2],
        borderWidth: 1, borderColor: `${colors.border}50`,
    },
    quickAddLabel: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.foreground, textAlign: 'center' },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: spacing[5], paddingTop: spacing[4],
        backgroundColor: `${colors.background}F0`, borderTopWidth: 1, borderTopColor: `${colors.border}30`,
    },
    finaliseBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[3],
        backgroundColor: colors.chart1, paddingVertical: spacing[4], borderRadius: radius.full,
        shadowColor: colors.chart1, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
    },
    finaliseBtnText: { fontSize: 17, fontFamily: fonts.sansBold, color: '#fff' },

    // Previous Items Modal
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing[5], paddingBottom: spacing[2],
    },
    modalTitle: { fontSize: 20, fontFamily: fonts.heading, color: colors.foreground },
    modalSubtitle: {
        fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground,
        paddingHorizontal: spacing[5], marginBottom: spacing[4],
    },
    prevItemCard: {
        flexDirection: 'row', alignItems: 'center', gap: spacing[3],
        backgroundColor: colors.card, borderRadius: radius.xl,
        padding: spacing[3], marginBottom: spacing[2],
        borderWidth: 1, borderColor: `${colors.border}50`,
    },
    prevItemImage: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accent },
    prevItemName: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.foreground },
    prevItemBrand: { fontSize: 11, fontFamily: fonts.sans, color: colors.mutedForeground },
});
