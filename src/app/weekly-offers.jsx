import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Linking, RefreshControl, Modal, TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
    ArrowLeft, Tag, ExternalLink, ShoppingCart, Sparkles, Info,
    ChevronDown, Check, RefreshCw,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';

/**
 * Weekly Offers Page
 * Aggregates curated deals from partner supermarkets.
 * Region dropdown + category segmented control — matches Recall Alerts UI.
 */

// ─── Region Options (same pattern as recall alerts) ──────────
const REGION_OPTIONS = [
    { key: 'UK', emoji: '🇬🇧', label: 'United Kingdom' },
    { key: 'US', emoji: '🇺🇸', label: 'United States' },
];

// ─── Category filter tabs ────────────────────────────────────
const CATEGORY_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'Food', label: 'Food' },
    { key: 'Skincare', label: 'Skincare' },
];

// ─── UK Deals ─────────────────────────────────────────────────
const UK_FOOD_OFFERS = [
    {
        id: 'uk-1',
        title: 'Tesco Weekly Offers',
        description: 'Fresh deals on groceries, household essentials and more.',
        category: 'Food',
        discount: 'Up to 50% OFF',
        link: 'https://www.tesco.com/groceries/en-GB/promotions?srsltid=AfmBOoqKWQrAtZ2h3fqoz8vyw4nn3mqRK9oqS3t1JQAewUxH1cWHo7jv',
        badge: '🛒 Tesco',
        region: 'UK',
    },
    {
        id: 'uk-2',
        title: "Sainsbury's Weekly Savings",
        description: "Save on fresh produce, pantry staples and household goods.",
        category: 'Food',
        discount: 'Multi-buy Deals',
        link: 'https://www.sainsburys.co.uk/webapp/wcs/stores/servlet/CategoryDisplay?storeId=10151&langId=44&categoryId=410364&krypto=2ePm4etustmnjzo%2Bzw0BoJOCigAyN7Pkh9Bv%2BDPcUj8Zv56yb%2Bg25K14IvQ4gKWryrssgWpTjfRISzn3BE59m5nQjC3PMLetcGHUWoqYEyXDpb2g7XtMmG%2FKL0N1moOz8VKk%2Fu11uojwy9%2B7TAFYjwp2%2FDo0hTMunMzTgkTRDtKdJ7bAc8hjpnY%2BvKO2ay4plEp%2FeqAp9BdXr04tRdwLmUHEhgm4hVLe%2BxpkbeZ1tSC27cnwuBGyHxcYyfkKjKCxWXgr8e9aS1u7Ozsh2Rxwde4ASWU5u2bL6MKvNzG1WMzKKt0MUtEvbLyzfKnq%2FSaCy4b3dKwCaMHi24ZT1qCJWnnaTDZ%2FEw1LyagFlzkUBrM%3D',
        badge: "🧡 Sainsbury's",
        region: 'UK',
    },
    {
        id: 'uk-3',
        title: 'Waitrose Offers',
        description: 'Premium groceries and organic products at reduced prices.',
        category: 'Food',
        discount: 'Weekly Offers',
        link: 'https://www.waitrose.com/ecom/shop/browse/offers?srsltid=AfmBOorQ0fSlhe7aAUddaS7bMYXCefb5i7_gpM07yBta9E6CUPlzcJbd',
        badge: '🌿 Waitrose',
        region: 'UK',
    },
    {
        id: 'uk-4',
        title: 'Lidl Pick of the Week',
        description: 'Quality products at unbeatable prices, refreshed every week.',
        category: 'Food',
        discount: 'Pick of the Week',
        link: 'https://www.lidl.co.uk/c/pick-of-the-week/a10089584',
        badge: '💛 Lidl',
        region: 'UK',
    },
    {
        id: 'uk-5',
        title: 'Aldi Super 6',
        description: 'Six fresh fruit and veg picks at amazing low prices.',
        category: 'Food',
        discount: 'Super 6 Deals',
        link: 'https://www.aldi.co.uk/super-6',
        badge: '🔵 Aldi',
        region: 'UK',
    },
    {
        id: 'uk-6',
        title: 'Morrisons Promotions',
        description: 'Great value promotions across groceries and household items.',
        category: 'Food',
        discount: 'Weekly Promotions',
        link: 'https://groceries.morrisons.com/promotions?srsltid=AfmBOooQLwBM39Up-sfEeVgN8f_U9LB1s-b_miyIPZXDWX-s9lARSjb-',
        badge: '💚 Morrisons',
        region: 'UK',
    },
    {
        id: 'uk-7',
        title: 'ASDA Special Offers',
        description: 'Everyday low prices rolled back even further on hundreds of products.',
        category: 'Food',
        discount: 'Rollback Prices',
        link: 'https://www.asda.com/groceries/special-offers/all-offers#shop-offers',
        badge: '🟢 ASDA',
        region: 'UK',
    },
    {
        id: 'uk-8',
        title: 'Costco UK Hot Buys',
        description: 'Bulk buying deals with massive savings on premium brands.',
        category: 'Food',
        discount: 'Hot Buys',
        link: 'https://www.costco.co.uk/c/Hot-Buys',
        badge: '🏷️ Costco',
        region: 'UK',
    },
];

const UK_SKINCARE_OFFERS = [
    {
        id: 'uk-s1',
        title: 'Boots Skincare Savings',
        description: 'Dermatologist-approved skincare at great prices.',
        category: 'Skincare',
        discount: '3 for 2',
        link: 'https://www.boots.com/beauty/skincare/skincare-savings',
        badge: '🧴 Boots',
        region: 'UK',
    },
    {
        id: 'uk-s2',
        title: 'Superdrug Skincare Bundles',
        description: 'Bundle deals on top skincare brands and supersize products.',
        category: 'Skincare',
        discount: 'Bundle Savings',
        link: 'https://www.superdrug.com/bundles-supersize/c/bundles?query=:ranking:bundlesCategory:Skin&pageSize=100',
        badge: '💜 Superdrug',
        region: 'UK',
    },
    {
        id: 'uk-s3',
        title: 'ASDA Skin Care Deals',
        description: 'Affordable skincare offers from everyday brands.',
        category: 'Skincare',
        discount: 'Special Offers',
        link: 'https://www.asda.com/groceries/special-offers/all-offers?PRIMARY_TAXONOMY.DEPT_NAME=Skin+Care',
        badge: '🟢 ASDA',
        region: 'UK',
    },
];

// ─── US Deals ─────────────────────────────────────────────────
const US_FOOD_OFFERS = [
    {
        id: 'us-1',
        title: 'Walmart Grocery Deals',
        description: 'Save big on everyday grocery essentials at Walmart.',
        category: 'Food',
        discount: 'Everyday Low Price',
        link: 'https://www.walmart.com/browse/grocery-deals/c2hlbGZfaWQ6MjQ1NTI0NQieie',
        badge: '🔵 Walmart',
        region: 'US',
    },
    {
        id: 'us-2',
        title: 'Target Grocery Deals',
        description: 'Weekly deals on groceries, snacks and pantry staples.',
        category: 'Food',
        discount: 'Weekly Deals',
        link: 'https://www.target.com/c/grocery-deals/-/N-k4uyq',
        badge: '🔴 Target',
        region: 'US',
    },
    {
        id: 'us-3',
        title: 'CVS Weekly Ad',
        description: "This week's best deals on food, health and beauty.",
        category: 'Food',
        discount: 'Weekly Ad',
        link: 'https://www.cvs.com/weeklyad/',
        badge: '❤️ CVS',
        region: 'US',
    },
];

// Merge all
const ALL_OFFERS = [...UK_FOOD_OFFERS, ...UK_SKINCARE_OFFERS, ...US_FOOD_OFFERS];

export default function WeeklyOffers() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [region, setRegion] = useState('UK');
    const [category, setCategory] = useState('all');
    const [showRegionPicker, setShowRegionPicker] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const currentRegionOpt = REGION_OPTIONS.find(r => r.key === region);

    // Filter offers by region + category
    const filteredOffers = ALL_OFFERS.filter(o => {
        if (o.region !== region) return false;
        if (category !== 'all' && o.category !== category) return false;
        return true;
    });

    // Only show Skincare tab for UK (no US skincare offers yet)
    const visibleCategories = CATEGORY_OPTIONS.filter(tab => {
        if (tab.key === 'Skincare' && region === 'US') return false;
        return true;
    });

    const handleRegionChange = (newRegion) => {
        setRegion(newRegion);
        setCategory('all');
        setShowRegionPicker(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Future: reload from API
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleOfferPress = (offer) => {
        if (offer.link) Linking.openURL(offer.link);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* Header — exact same layout as Recall Alerts */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={22} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>Weekly Deals</Text>
                <Pressable style={styles.refreshBtn} onPress={onRefresh}>
                    <RefreshCw size={20} color={colors.primary} />
                </Pressable>
            </View>

            {/* Controls Row — Region Dropdown + Category Segments */}
            <View style={styles.controlsRow}>
                {/* Region Dropdown — same as alerts */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
                    <Pressable
                        style={styles.regionDropdown}
                        onPress={() => setShowRegionPicker(true)}
                    >
                        <Text style={styles.regionEmoji}>{currentRegionOpt?.emoji || '🌍'}</Text>
                        <Text style={styles.regionLabel}>
                            {currentRegionOpt?.key?.toUpperCase() || 'All'}
                        </Text>
                        <ChevronDown size={16} color={colors.mutedForeground} />
                    </Pressable>
                </View>

                {/* Category Segmented Control — same style as severity filter */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View style={styles.segmentedControl}>
                        {visibleCategories.map(opt => (
                            <Pressable
                                key={opt.key}
                                style={[
                                    styles.segment,
                                    category === opt.key && styles.segmentActive,
                                ]}
                                onPress={() => setCategory(opt.key)}
                            >
                                <Text style={[
                                    styles.segmentText,
                                    category === opt.key && styles.segmentTextActive,
                                ]} numberOfLines={1}>
                                    {opt.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Compact Stats Row */}
            <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                    <Text style={styles.statsCount}>{filteredOffers.length}</Text> deals
                </Text>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {filteredOffers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <ShoppingCart size={36} color={`${colors.mutedForeground}50`} />
                        </View>
                        <Text style={styles.emptyTitle}>No Deals Yet</Text>
                        <Text style={styles.emptyText}>
                            No deals available for this filter. Try a different region or category.
                        </Text>
                    </View>
                ) : (
                    filteredOffers.map((offer) => (
                        <Pressable
                            key={offer.id}
                            style={({ pressed }) => [
                                styles.offerCard,
                                pressed && styles.cardPressed,
                            ]}
                            onPress={() => handleOfferPress(offer)}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>{offer.badge}</Text>
                                </View>
                                <View style={styles.discountBadge}>
                                    <Tag size={11} color="#FFFFFF" />
                                    <Text style={styles.discountText}>{offer.discount}</Text>
                                </View>
                            </View>

                            <Text style={styles.offerTitle} numberOfLines={2}>
                                {offer.title}
                            </Text>
                            <Text style={styles.offerDesc} numberOfLines={2}>
                                {offer.description}
                            </Text>

                            <View style={styles.cardFooter}>
                                <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryBadgeText}>{offer.category}</Text>
                                </View>
                                {offer.link && (
                                    <View style={styles.linkRow}>
                                        <Text style={styles.linkText}>View Deal</Text>
                                        <ExternalLink size={11} color={colors.primary} />
                                    </View>
                                )}
                            </View>
                        </Pressable>
                    ))
                )}

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Info size={14} color={`${colors.mutedForeground}80`} />
                    <Text style={styles.disclaimerText}>
                        Deals are subject to in-store and online availability. Prices may vary by location. Pull down to refresh.
                    </Text>
                </View>
            </ScrollView>

            {/* Region Picker Modal — exact same as Recall Alerts */}
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

    // Header — matches Recall Alerts
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

    // Controls Row — matches Recall Alerts
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

    // Segmented Control — matches Recall Alerts
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

    // Stats Row — matches Recall Alerts
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

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing[5],
        gap: spacing[3],
    },

    // Empty State — matches Recall Alerts
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        gap: spacing[3],
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: `${colors.mutedForeground}10`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: fonts.heading,
        color: colors.mutedForeground,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 21,
        paddingHorizontal: spacing[10],
    },

    // Offer Card — matches Recall Card structure
    offerCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing[4],
        borderLeftWidth: 4,
        borderLeftColor: colors.chart1,
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
    badgeContainer: {
        backgroundColor: `${colors.primary}10`,
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.primary },
    discountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.chart1,
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    discountText: { fontSize: 11, fontFamily: fonts.sansBold, color: '#FFFFFF' },
    offerTitle: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: 2,
        lineHeight: 21,
    },
    offerDesc: {
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
    categoryBadge: {
        backgroundColor: `${colors.accent}80`,
        borderRadius: radius.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    categoryBadgeText: { fontSize: 10, fontFamily: fonts.sansSemiBold, color: colors.primary },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    linkText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },

    // Disclaimer
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 14,
        marginTop: spacing[1],
        backgroundColor: `${colors.chart2}08`,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: `${colors.chart2}15`,
    },
    disclaimerText: {
        flex: 1, fontSize: 11, fontFamily: fonts.sans,
        color: `${colors.mutedForeground}99`, lineHeight: 16,
    },

    // Region Picker Modal — exact same as Recall Alerts
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
