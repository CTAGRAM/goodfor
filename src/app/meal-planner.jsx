import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Calendar, Plus, ChevronRight, Settings } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getMealPlans, generateMealPlan, generateShoppingList } from "@/lib/recipeService"; 
import { useAuth } from "@/contexts/AuthContext";

export default function MealPlanner() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [mealPlan, setMealPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchMealPlan = async () => {
        if (!user) return;
        try {
            const data = await getMealPlans(user.id);
            setMealPlan(data && data.length > 0 ? data[0] : null);
        } catch (error) {
            console.error("Failed to fetch meal plan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateMealPlan = async () => {
        if (!user) return;
        setIsGenerating(true);
        try {
            await generateMealPlan(user.id);
            await fetchMealPlan();
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to generate meal plan");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateShoppingList = async () => {
        if (!user || !mealPlan) return;
        setIsGenerating(true);
        try {
            // Get all recipe IDs from the meal plan entries
            const recipeIds = mealPlan.entries
                .filter(e => e.recipe_id)
                .map(e => e.recipe_id);
                
            if (recipeIds.length === 0) {
                Alert.alert("No Recipes", "Add some recipes to your meal plan first.");
                return;
            }

            const { listId } = await generateShoppingList(user.id, recipeIds);
            Alert.alert("Success", "Shopping list generated successfully!");
            // Optionally redirect to shopping list: router.push('/shopping-list')
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to generate shopping list");
        } finally {
            setIsGenerating(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMealPlan();
        }, [user])
    );

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Calendar size={48} color={`${colors.primary}60`} />
            </View>
            <Text style={styles.emptyTitle}>No meal plan yet</Text>
            <Text style={styles.emptyText}>
                Plan your meals for the week, generate a single shopping list, and eat healthier.
            </Text>
            <Pressable 
                style={[styles.actionButton, isGenerating && { opacity: 0.7 }]}
                onPress={handleGenerateMealPlan}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.actionButtonText}>Auto-Generate Plan</Text>
                )}
            </Pressable>
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
                    <Text style={styles.headerTitle}>Meal Planner</Text>
                </View>
                <Pressable style={styles.iconButton}>
                    <Settings size={24} color={colors.foreground} />
                </Pressable>
            </View>

            {isLoading ? (
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : !mealPlan ? (
                renderEmptyState()
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.planHeader}>
                        <Text style={styles.planTitle}>This Week's Plan</Text>
                        <Text style={styles.planSubtitle}>{mealPlan.title || 'Weekly Plan'}</Text>
                    </View>

                    <View style={styles.daysList}>
                        {daysOfWeek.map((day, index) => {
                            // Find entries for this day if meal plan is populated
                            const dayEntries = mealPlan?.entries?.filter(e => e.day_of_week === index + 1) || [];
                            
                            return (
                                <View key={day} style={styles.dayCard}>
                                    <View style={styles.dayHeader}>
                                        <Text style={styles.dayTitle}>{day}</Text>
                                        <Pressable 
                                            style={styles.addButton}
                                            onPress={() => router.push({ pathname: '/meal-plan-day', params: { day: index + 1, dayName: day, mealPlanId: mealPlan.id } })}
                                        >
                                            <Plus size={16} color={colors.primary} />
                                        </Pressable>
                                    </View>
                                    
                                    {dayEntries.length === 0 ? (
                                        <Text style={styles.noMealText}>No meals planned</Text>
                                    ) : (
                                        dayEntries.map((entry, idx) => (
                                            <Pressable 
                                                key={idx} 
                                                style={styles.mealRow}
                                                onPress={() => router.push({ pathname: '/meal-plan-day', params: { day: index + 1, dayName: day, mealPlanId: mealPlan.id } })}
                                            >
                                                <Text style={styles.mealType}>{entry.meal_type}</Text>
                                                <Text style={styles.mealName} numberOfLines={1}>
                                                    {entry.recipes?.title || entry.custom_meal_name || 'Unknown Recipe'}
                                                </Text>
                                                <ChevronRight size={16} color={colors.mutedForeground} />
                                            </Pressable>
                                        ))
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            {!isLoading && mealPlan && (
                <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
                    <Pressable 
                        style={[styles.generateListButton, isGenerating && { opacity: 0.7 }]}
                        onPress={handleGenerateShoppingList}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.generateListText}>Generate Shopping List</Text>
                        )}
                    </Pressable>
                </View>
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
    scrollContent: {
        padding: spacing.md,
        paddingBottom: 100, // Space for bottom bar
    },
    planHeader: {
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.xs,
    },
    planTitle: {
        fontSize: 28,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    planSubtitle: {
        fontSize: 16,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: 4,
    },
    daysList: {
        gap: spacing.lg,
    },
    dayCard: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    dayTitle: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noMealText: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        fontStyle: 'italic',
    },
    mealRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    mealType: {
        width: 80,
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: colors.primary,
        textTransform: 'capitalize',
    },
    mealName: {
        flex: 1,
        fontSize: 15,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
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
    generateListButton: {
        height: 50,
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    generateListText: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: '#fff',
    }
});
