import { View, Text, Pressable, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Calendar, ChevronRight, CheckCircle, AlertTriangle, AlertCircle, Package, ShoppingCart } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { Badge } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateTodayBasket, addToBasket } from '@/lib/basketService';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

export default function FullScanHistory() {
    const router = useRouter();
    const { user } = useAuth();

    const handleAddToBasket = async (item) => {
        hapticMedium();
        try {
            const basket = await getOrCreateTodayBasket(user?.id);
            await addToBasket(basket.id, {
                barcode: `HIST-${item.id}`,
                name: item.name,
                brand: '',
                imageUrl: null,
                safetyScore: item.safety === 'safe' ? 80 : item.safety === 'caution' ? 50 : 30,
                safetyLevel: item.safety?.toUpperCase() || 'SAFE',
            });
            hapticSuccess();
            Alert.alert('Added!', `${item.name} added to your basket.`, [
                { text: 'View Basket', onPress: () => router.push('/basket') },
                { text: 'OK' },
            ]);
        } catch (e) {
            Alert.alert('Error', 'Could not add to basket');
        }
    };

    const historyData = {
        today: [
            {
                id: 1,
                name: 'Organic Almond Milk',
                time: '10:45 AM',
                user: 'Sarah',
                safety: 'safe',
                safetyLabel: 'GOOD TO CONSUME',
            },
            {
                id: 2,
                name: 'Whole Wheat Pasta',
                time: '09:15 AM',
                user: 'Leo',
                safety: 'safe',
                safetyLabel: 'GOOD TO CONSUME',
            },
        ],
        yesterday: [
            {
                id: 3,
                name: 'Peanut Butter Pretzels',
                time: '06:20 PM',
                user: 'Leo',
                safety: 'allergen',
                safetyLabel: 'CONTAINS ALLERGENS',
            },
            {
                id: 4,
                name: 'Greek Yogurt',
                time: '02:30 PM',
                user: 'Grandma Joy',
                safety: 'caution',
                safetyLabel: 'HIGH SODIUM',
            },
        ],
    };

    const getSafetyColor = (safety) => {
        switch (safety) {
            case 'safe':
                return colors.chart1;
            case 'caution':
                return colors.chart2;
            case 'allergen':
                return colors.chart3;
            default:
                return colors.mutedForeground;
        }
    };

    const getSafetyIcon = (safety) => {
        switch (safety) {
            case 'safe':
                return CheckCircle;
            case 'caution':
                return AlertCircle;
            case 'allergen':
                return AlertTriangle;
            default:
                return Package;
        }
    };

    const renderHistoryItem = (item) => {
        const SafetyIcon = getSafetyIcon(item.safety);
        const safetyColor = getSafetyColor(item.safety);

        return (
            <View key={item.id}>
                <Pressable style={styles.historyItem}>
                    <View style={styles.historyItemContent}>
                        <View style={styles.productIcon}>
                            <Package size={32} color={colors.primary} />
                        </View>
                        <View style={styles.historyItemInfo}>
                            <Text style={styles.productName}>{item.name}</Text>
                            <Text style={styles.productMeta}>
                                {item.time} • {item.user}
                            </Text>
                            <View style={styles.safetyBadgeContainer}>
                                <View style={[styles.safetyBadge, { backgroundColor: `${safetyColor}1A`, borderColor: `${safetyColor}33` }]}>
                                    <SafetyIcon size={12} color={safetyColor} />
                                    <Text style={[styles.safetyBadgeText, { color: safetyColor }]}>
                                        {item.safetyLabel}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <ChevronRight size={20} color={`${colors.mutedForeground}80`} />
                </Pressable>
                {/* V8: Add to Basket */}
                <Pressable style={styles.addBasketBtn} onPress={() => handleAddToBasket(item)}>
                    <ShoppingCart size={14} color={colors.primary} />
                    <Text style={styles.addBasketText}>+ Basket</Text>
                </Pressable>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurLeft} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable style={styles.headerButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Scan History</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable style={styles.iconButton}>
                        <Search size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable style={styles.iconButton}>
                        <Calendar size={20} color={colors.primary} />
                    </Pressable>
                </View>
            </View>

            {/* Filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
                contentContainerStyle={styles.filtersContent}
            >
                <Pressable style={styles.filterButtonActive}>
                    <Text style={styles.filterTextActive}>All Time</Text>
                    <ChevronRight size={16} color={colors.primaryForeground} />
                </Pressable>
                <Pressable style={styles.filterButton}>
                    <Text style={styles.filterText}>All Profiles</Text>
                    <ChevronRight size={16} color={colors.foreground} />
                </Pressable>
                <Pressable style={styles.filterButton}>
                    <Text style={styles.filterText}>Safety: All</Text>
                    <ChevronRight size={16} color={colors.foreground} />
                </Pressable>
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Today Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>TODAY</Text>
                        <View style={styles.divider} />
                    </View>
                    <View style={styles.historyList}>
                        {historyData.today.map(renderHistoryItem)}
                    </View>
                </View>

                {/* Yesterday Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>YESTERDAY</Text>
                        <View style={styles.divider} />
                    </View>
                    <View style={styles.historyList}>
                        {historyData.yesterday.map(renderHistoryItem)}
                    </View>
                </View>

                <View style={{ height: 100 }} />
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: spacing[14],
        paddingBottom: spacing[4],
        paddingHorizontal: spacing[6],
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: fontSizes.xl,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    headerRight: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filtersContainer: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[2],
    },
    filtersContent: {
        gap: spacing[3],
    },
    filterButtonActive: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingVertical: 10,
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    filterTextActive: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansSemiBold,
        color: colors.primaryForeground,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingVertical: 10,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: `${colors.border}80`,
        borderRadius: radius.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    filterText: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[6],
        paddingTop: spacing[4],
    },
    section: {
        marginBottom: spacing[8],
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginBottom: spacing[4],
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: `${colors.border}66`,
    },
    sectionTitle: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.mutedForeground,
        letterSpacing: 1.5,
    },
    historyList: {
        gap: spacing[4],
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[5],
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        borderWidth: 1,
        borderColor: `${colors.border}33`,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    historyItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        flex: 1,
    },
    productIcon: {
        width: 56,
        height: 56,
        borderRadius: radius['2xl'],
        backgroundColor: colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyItemInfo: {
        flex: 1,
    },
    productName: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        lineHeight: fontSizes.base * 1.3,
    },
    productMeta: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: spacing[1],
    },
    safetyBadgeContainer: {
        marginTop: spacing[2],
    },
    safetyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    safetyBadgeText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
    },
    addBasketBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: spacing[4],
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: `${colors.primary}40`,
        backgroundColor: `${colors.primary}08`,
        marginLeft: 'auto',
    },
    addBasketText: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
});
