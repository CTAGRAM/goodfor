import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Trash2, Plus, RefreshCw, ChefHat } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { supabase } from "@/lib/supabaseAuth";
import { updateMealPlanEntry } from "@/lib/recipeService";

export default function MealPlanDay() {
    const { day, dayName, mealPlanId } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchEntries = async () => {
        if (!mealPlanId || !day) return;
        try {
            const { data, error } = await supabase
                .from('meal_plan_entries')
                .select(`
                    *,
                    recipes(id, title, image_url, health_score, cook_time_minutes, prep_time_minutes)
                `)
                .eq('meal_plan_id', mealPlanId)
                .eq('day_of_week', parseInt(day));

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error("Failed to fetch day entries:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchEntries();
        }, [mealPlanId, day])
    );

    const handleClearMeal = async (entryId) => {
        try {
            await updateMealPlanEntry(entryId, null, null);
            fetchEntries();
        } catch (error) {
            Alert.alert("Error", "Failed to clear meal");
        }
    };

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    const renderMealSlot = (type) => {
        const entry = entries.find(e => e.meal_type === type);
        
        return (
            <View key={type} style={styles.mealSlot}>
                <Text style={styles.mealTypeTitle}>{type}</Text>
                
                {entry && (entry.recipe_id || entry.custom_meal_name) ? (
                    <View style={styles.mealCard}>
                        <View style={styles.mealCardContent}>
                            <View style={styles.mealIcon}>
                                <ChefHat size={20} color={colors.primary} />
                            </View>
                            <View style={styles.mealDetails}>
                                <Text style={styles.mealName} numberOfLines={2}>
                                    {entry.recipes?.title || entry.custom_meal_name}
                                </Text>
                                {entry.recipes && (
                                    <Text style={styles.mealMeta}>
                                        Health Score: {entry.recipes.health_score || '--'}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.mealActions}>
                            <Pressable 
                                style={styles.actionBtn}
                                onPress={() => router.push(`/(tabs)/recipes`)} // To swap, user can browse recipes
                            >
                                <RefreshCw size={18} color={colors.primary} />
                            </Pressable>
                            <Pressable 
                                style={styles.actionBtnDestructive}
                                onPress={() => handleClearMeal(entry.id)}
                            >
                                <Trash2 size={18} color={colors.destructive} />
                            </Pressable>
                        </View>
                    </View>
                ) : (
                    <Pressable 
                        style={styles.emptySlot}
                        onPress={() => router.push(`/(tabs)/recipes`)}
                    >
                        <Plus size={20} color={colors.primary} />
                        <Text style={styles.emptySlotText}>Assign Recipe</Text>
                    </Pressable>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerLeft}>
                    <Pressable style={styles.iconButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.foreground} />
                    </Pressable>
                    <Text style={styles.headerTitle}>{dayName || 'Day Details'}</Text>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {mealTypes.map(renderMealSlot)}
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
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        textTransform: 'capitalize',
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    mealSlot: {
        marginBottom: spacing.xl,
    },
    mealTypeTitle: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        textTransform: 'capitalize',
        marginBottom: spacing.sm,
    },
    mealCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    mealCardContent: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center',
    },
    mealIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        backgroundColor: `${colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    mealDetails: {
        flex: 1,
    },
    mealName: {
        fontSize: 16,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: 4,
    },
    mealMeta: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },
    mealActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    actionBtnDestructive: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
    },
    emptySlot: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: `${colors.primary}08`,
        borderWidth: 1,
        borderColor: `${colors.primary}30`,
        borderStyle: 'dashed',
        borderRadius: radius.xl,
        paddingVertical: spacing.xl,
    },
    emptySlotText: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    }
});
