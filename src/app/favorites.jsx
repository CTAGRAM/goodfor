import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import {
    ArrowLeft,
    Heart,
    CheckCircle,
    AlertTriangle,
    XCircle,
    ShoppingCart,
    Package
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { supabase } from '@/lib/supabaseAuth';
import { removeFromFavorites } from '@/lib/productService';
import { getOrCreateTodayBasket, addToBasket, getScoreColor } from '@/lib/basketService';
import { hapticMedium, hapticSuccess, hapticLight } from '@/lib/haptics';

export default function Favorites() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = useAlert();

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFavorites = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    id,
                    created_at,
                    product_id,
                    products (
                        id,
                        barcode,
                        name,
                        brand,
                        image_url,
                        category
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Favorites] Load error:', error);
                return;
            }

            // Also get latest safety scores from scans
            const productIds = (data || []).map(f => f.product_id).filter(Boolean);
            let scansMap = {};

            if (productIds.length > 0) {
                const { data: scans } = await supabase
                    .from('scans')
                    .select('product_id, safety_score, safety_level, scanned_at')
                    .eq('user_id', user.id)
                    .in('product_id', productIds)
                    .order('scanned_at', { ascending: false });

                (scans || []).forEach(s => {
                    if (!scansMap[s.product_id]) {
                        scansMap[s.product_id] = s;
                    }
                });
            }

            const formatted = (data || []).map(fav => {
                const scan = scansMap[fav.product_id] || {};
                return {
                    id: fav.id,
                    productId: fav.product_id,
                    name: fav.products?.name || 'Unknown Product',
                    brand: fav.products?.brand || '',
                    barcode: fav.products?.barcode || '',
                    imageUrl: fav.products?.image_url || null,
                    category: fav.products?.category || '',
                    safetyScore: scan.safety_score || 50,
                    safetyLevel: scan.safety_level || 'safe',
                    scannedAt: scan.scanned_at || fav.created_at,
                };
            });

            setFavorites(formatted);
        } catch (e) {
            console.error('[Favorites] Error:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadFavorites();
    }, [user?.id]));

    const handleAddToBasket = async (item) => {
        hapticMedium();
        try {
            const basket = await getOrCreateTodayBasket(user?.id);
            await addToBasket(basket.id, {
                barcode: item.barcode,
                name: item.name,
                brand: item.brand,
                imageUrl: item.imageUrl,
                safetyScore: item.safetyScore,
                safetyLevel: item.safetyLevel,
            });
            hapticSuccess();
            showAlert('Added! 🛒', `${item.name} added to your basket.`, [
                { text: 'View Basket', onPress: () => router.push('/basket') },
                { text: 'OK' },
            ]);
        } catch (e) {
            showAlert('Error', 'Could not add to basket');
        }
    };

    const handleRemoveFavorite = async (item) => {
        hapticLight();
        try {
            await removeFromFavorites(user.id, item.productId);
            setFavorites(prev => prev.filter(f => f.id !== item.id));
        } catch (e) {
            showAlert('Error', 'Could not remove from favorites');
        }
    };

    const getSafetyInfo = (level) => {
        switch (level?.toLowerCase()) {
            case 'safe':
                return { label: 'Good', Icon: CheckCircle, color: '#22C55E' };
            case 'caution':
                return { label: 'Caution', Icon: AlertTriangle, color: '#F59E0B' };
            case 'avoid':
            case 'critical':
                return { label: 'Avoid', Icon: XCircle, color: '#EF4444' };
            default:
                return { label: 'Good', Icon: CheckCircle, color: '#22C55E' };
        }
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return '1d ago';
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Favorites</Text>
                </View>
                <Text style={styles.headerCount}>{favorites.length} items</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Heart size={48} color={`${colors.mutedForeground}30`} />
                    <Text style={styles.emptyTitle}>No favorites yet</Text>
                    <Text style={styles.emptySub}>
                        Scan products and tap the heart icon{'\n'}to save them here.
                    </Text>
                    <TouchableOpacity
                        style={styles.scanBtn}
                        onPress={() => router.push('/(tabs)/scan')}
                    >
                        <Text style={styles.scanBtnText}>Start Scanning</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.productsGrid}>
                        {favorites.map((item) => {
                            const safety = getSafetyInfo(item.safetyLevel);
                            const scoreColor = getScoreColor(item.safetyScore);

                            return (
                                <View key={item.id} style={styles.productCard}>
                                    {/* Image */}
                                    <View style={styles.imageContainer}>
                                        <View style={styles.imageWrapper}>
                                            {item.imageUrl ? (
                                                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                                            ) : (
                                                <View style={[styles.productImage, styles.placeholderImage]}>
                                                    <Package size={28} color={`${colors.mutedForeground}40`} />
                                                </View>
                                            )}
                                            {/* Heart (filled) */}
                                            <TouchableOpacity
                                                style={styles.heartButton}
                                                onPress={() => handleRemoveFavorite(item)}
                                            >
                                                <Heart size={16} color={colors.destructive} fill={colors.destructive} />
                                            </TouchableOpacity>
                                            {/* Score badge */}
                                            <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
                                                <Text style={styles.scoreBadgeText}>{item.safetyScore}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Product Info */}
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                        {item.brand ? (
                                            <Text style={styles.productBrand} numberOfLines={1}>{item.brand}</Text>
                                        ) : null}
                                        <View style={styles.productMeta}>
                                            <View style={styles.safetyRow}>
                                                <safety.Icon size={12} color={safety.color} strokeWidth={2.5} />
                                                <Text style={[styles.safetyText, { color: safety.color }]}>
                                                    {safety.label}
                                                </Text>
                                            </View>
                                            <Text style={styles.scannedText}>{getTimeAgo(item.scannedAt)}</Text>
                                        </View>
                                    </View>

                                    {/* Add to Basket */}
                                    <TouchableOpacity
                                        style={styles.addBasketBtn}
                                        onPress={() => handleAddToBasket(item)}
                                    >
                                        <ShoppingCart size={14} color={colors.primary} />
                                        <Text style={styles.addBasketText}>Add to Basket</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: `${colors.border}80`,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: fonts.heading,
        color: colors.foreground,
    },
    headerCount: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[8],
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    emptySub: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 20,
    },
    scanBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[6],
        borderRadius: radius.full,
        marginTop: spacing[3],
    },
    scanBtnText: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    productsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        paddingTop: 8,
    },
    productCard: {
        width: "47%",
    },
    imageContainer: {
        aspectRatio: 1,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        padding: 8,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: `${colors.border}33`,
    },
    imageWrapper: {
        flex: 1,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
    },
    productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholderImage: {
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heartButton: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    scoreBadge: {
        position: "absolute",
        bottom: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    scoreBadgeText: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
        color: '#fff',
    },
    productInfo: {
        paddingHorizontal: 4,
    },
    productName: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    productBrand: {
        fontSize: 11,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: 1,
    },
    productMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    safetyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    safetyText: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
    },
    scannedText: {
        fontSize: 10,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    addBasketBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 8,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: `${colors.primary}40`,
        backgroundColor: `${colors.primary}08`,
    },
    addBasketText: {
        fontSize: 11,
        fontFamily: fonts.sansSemiBold,
        color: colors.primary,
    },
});
