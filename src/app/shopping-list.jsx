import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, ShoppingCart, Plus, CheckCircle2, Circle, Trash2, MoreVertical } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getUserShoppingLists, updateShoppingListItem } from "@/lib/recipeService";
import { useAuth } from "@/contexts/AuthContext";

export default function ShoppingList() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [shoppingLists, setShoppingLists] = useState([]);
    const [activeListId, setActiveListId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLists = async () => {
        if (!user) return;
        try {
            const data = await getUserShoppingLists(user.id);
            setShoppingLists(data || []);
            if (data && data.length > 0 && !activeListId) {
                setActiveListId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch shopping lists:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLists();
        }, [user])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchLists();
    };

    const toggleItemStatus = async (itemIndex, currentStatus) => {
        if (!activeListId) return;
        
        // Optimistic update
        const updatedLists = [...shoppingLists];
        const listIndex = updatedLists.findIndex(l => l.id === activeListId);
        if (listIndex === -1) return;
        
        const items = [...updatedLists[listIndex].items];
        items[itemIndex] = { ...items[itemIndex], checked: !currentStatus };
        updatedLists[listIndex].items = items;
        setShoppingLists(updatedLists);

        try {
            await updateShoppingListItem(activeListId, itemIndex, { checked: !currentStatus });
        } catch (error) {
            console.error("Failed to update item status:", error);
            // Revert on failure
            fetchLists();
        }
    };

    const activeList = shoppingLists.find(l => l.id === activeListId);
    
    // Group items by category if available
    const groupedItems = {};
    if (activeList?.items) {
        activeList.items.forEach((item, index) => {
            const category = item.category || 'Other';
            if (!groupedItems[category]) groupedItems[category] = [];
            groupedItems[category].push({ ...item, originalIndex: index });
        });
    }

    const renderEmptyState = () => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <ShoppingCart size={48} color={`${colors.primary}60`} />
                </View>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptyText}>
                    Generate a shopping list from your recipes or weekly meal plan.
                </Text>
                <Pressable 
                    style={styles.actionButton}
                    onPress={() => router.push('/(tabs)/recipes')}
                >
                    <Text style={styles.actionButtonText}>Browse Recipes</Text>
                </Pressable>
            </View>
        );
    };

    const renderCategory = (category, items) => (
        <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((item) => (
                <Pressable 
                    key={item.originalIndex}
                    style={styles.itemRow}
                    onPress={() => toggleItemStatus(item.originalIndex, item.checked)}
                >
                    {item.checked ? (
                        <CheckCircle2 size={24} color={colors.primary} />
                    ) : (
                        <Circle size={24} color={colors.border} />
                    )}
                    <Text style={[
                        styles.itemName,
                        item.checked && styles.itemChecked
                    ]}>
                        {item.quantity ? `${item.quantity} ` : ''}
                        {item.unit ? `${item.unit} ` : ''}
                        {item.name}
                    </Text>
                    {item.recipe_source && (
                        <View style={styles.sourceTag}>
                            <Text style={styles.sourceText} numberOfLines={1}>Recipe</Text>
                        </View>
                    )}
                </Pressable>
            ))}
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
                    <Text style={styles.headerTitle}>Shopping List</Text>
                </View>
                <Pressable style={styles.iconButton}>
                    <MoreVertical size={24} color={colors.foreground} />
                </Pressable>
            </View>

            {isLoading ? (
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : !activeList ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={Object.entries(groupedItems)}
                    keyExtractor={([category]) => category}
                    renderItem={({ item: [category, items] }) => renderCategory(category, items)}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListHeaderComponent={() => (
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>{activeList.title}</Text>
                            <Text style={styles.listCount}>
                                {activeList.items.filter(i => i.checked).length} of {activeList.items.length} items
                            </Text>
                        </View>
                    )}
                />
            )}

            <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
                <Pressable style={styles.primaryButton}>
                    <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Add Item Manually</Text>
                </Pressable>
            </View>
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
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: fonts.sansSemiBold,
        color: colors.foreground,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        paddingBottom: 100, // For bottom bar
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.xs,
    },
    listTitle: {
        fontSize: 24,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    listCount: {
        fontSize: 14,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
        marginBottom: 4,
    },
    categorySection: {
        marginBottom: spacing.xl,
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
    itemName: {
        flex: 1,
        fontSize: 16,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
        marginLeft: spacing.md,
    },
    itemChecked: {
        textDecorationLine: 'line-through',
        color: colors.mutedForeground,
    },
    sourceTag: {
        backgroundColor: `${colors.primary}15`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    sourceText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    primaryButton: {
        flexDirection: 'row',
        height: 50,
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: '#fff',
    }
});
