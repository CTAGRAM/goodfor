import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Plus, Refrigerator, Search, Clock, Trash2 } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getPantryItems, removePantryItem } from "@/lib/pantryService";
import { useAuth } from "@/contexts/AuthContext";

export default function Pantry() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [pantryItems, setPantryItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchPantry = async () => {
        if (!user) return;
        try {
            const data = await getPantryItems(user.id);
            setPantryItems(data || []);
        } catch (error) {
            console.error("Failed to fetch pantry:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPantry();
        }, [user])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchPantry();
    };

    const handleDelete = async (itemId) => {
        try {
            await removePantryItem(itemId);
            setPantryItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            Alert.alert("Error", "Could not remove item from pantry.");
        }
    };

    const filteredItems = pantryItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group filtered items by category
    const groupedItems = {};
    filteredItems.forEach((item) => {
        const category = item.category || 'other';
        if (!groupedItems[category]) groupedItems[category] = [];
        groupedItems[category].push(item);
    });

    const getDaysUntilExpiry = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const renderEmptyState = () => {
        if (isLoading) return null;
        if (searchQuery) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No items found matching "{searchQuery}"</Text>
                </View>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <Refrigerator size={48} color={`${colors.primary}60`} />
                </View>
                <Text style={styles.emptyTitle}>Your pantry is empty</Text>
                <Text style={styles.emptyText}>
                    Scan barcodes of items you buy, or add them manually to track what you have at home.
                </Text>
                <Pressable 
                    style={styles.actionButton}
                    onPress={() => router.push('/(tabs)/scan')}
                >
                    <Text style={styles.actionButtonText}>Scan Items</Text>
                </Pressable>
            </View>
        );
    };

    const renderCategory = (category, items) => (
        <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.replace('_', ' ')}</Text>
            {items.map((item) => {
                const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
                const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

                return (
                    <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemContent}>
                            <Text style={styles.itemName}>
                                {item.quantity ? `${item.quantity} ` : ''}
                                {item.unit ? `${item.unit} ` : ''}
                                {item.name}
                            </Text>
                            {(isExpiringSoon || isExpired) && (
                                <View style={[
                                    styles.expiryTag, 
                                    isExpired ? styles.expiryTagExpired : styles.expiryTagWarning
                                ]}>
                                    <Clock size={12} color={isExpired ? '#EF4444' : '#F59E0B'} style={{marginRight: 4}} />
                                    <Text style={[
                                        styles.expiryText,
                                        isExpired ? {color: '#EF4444'} : {color: '#F59E0B'}
                                    ]}>
                                        {isExpired ? 'Expired' : `${daysUntilExpiry} days left`}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Pressable 
                            style={styles.deleteButton}
                            onPress={() => handleDelete(item.id)}
                        >
                            <Trash2 size={18} color={colors.mutedForeground} />
                        </Pressable>
                    </View>
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerLeft}>
                    <Pressable style={styles.iconButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>My Pantry</Text>
                </View>
                <Pressable style={[styles.iconButton, { backgroundColor: `${colors.primary}15` }]}>
                    <Plus size={24} color={colors.primary} />
                </Pressable>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={20} color={colors.mutedForeground} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search pantry..."
                        placeholderTextColor={colors.mutedForeground}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : pantryItems.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={Object.entries(groupedItems)}
                    keyExtractor={([category]) => category}
                    renderItem={({ item: [category, items] }) => renderCategory(category, items)}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListHeaderComponent={() => (
                        <Pressable 
                            style={styles.recipeSuggestButton}
                            onPress={() => router.push('/recipe-discover')}
                        >
                            <Text style={styles.recipeSuggestTitle}>What can I cook?</Text>
                            <Text style={styles.recipeSuggestDesc}>Find recipes using your ingredients</Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontSize: 22,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.md,
        height: 46,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        fontFamily: fonts.sans,
        color: colors.foreground,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    actionButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.full,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: fonts.sansBold,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 40,
    },
    recipeSuggestButton: {
        backgroundColor: '#E0F2FE',
        padding: spacing.md,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginBottom: spacing.xl,
        alignItems: 'center',
    },
    recipeSuggestTitle: {
        fontSize: 16,
        fontFamily: fonts.sansBold,
        color: '#0284C7',
    },
    recipeSuggestDesc: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: '#0369A1',
        marginTop: 2,
    },
    categorySection: {
        marginBottom: spacing.lg,
    },
    categoryTitle: {
        fontSize: 16,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.xs,
        textTransform: 'capitalize',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: radius.lg,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: spacing.md,
    },
    itemName: {
        fontSize: 16,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
        flex: 1,
    },
    expiryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginLeft: spacing.sm,
    },
    expiryTagWarning: {
        backgroundColor: '#FEF3C7',
    },
    expiryTagExpired: {
        backgroundColor: '#FEE2E2',
    },
    expiryText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
    },
    deleteButton: {
        padding: spacing.xs,
    }
});
