import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Clock, Sparkles, ChefHat, AlertCircle } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getCookableRecipes, saveRecipe } from "@/lib/recipeService";
import { useAuth } from "@/contexts/AuthContext";

export default function RecipeDiscover() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [recipes, setRecipes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchRecipes = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const data = await getCookableRecipes(user.id);
            setRecipes(data || []);
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to load recipe suggestions.");
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRecipes();
        }, [user])
    );

    const handleRecipeClick = async (recipeIdea) => {
        if (isSaving) return;
        try {
            setIsSaving(true);
            // Save a placeholder recipe to the database to view it
            const newRecipe = await saveRecipe({
                user_id: user.id,
                title: recipeIdea.title,
                description: recipeIdea.description,
                prep_time_minutes: recipeIdea.prep_time_minutes,
                cook_time_minutes: recipeIdea.cook_time_minutes,
                difficulty: recipeIdea.difficulty,
                // We don't have full ingredients or instructions from this endpoint yet
            });
            router.push(`/recipe-detail?id=${newRecipe.id}`);
        } catch (error) {
            Alert.alert("Error", "Could not save recipe idea.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderRecipeCard = ({ item }) => {
        const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0);

        return (
            <Pressable 
                style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed
                ]}
                onPress={() => handleRecipeClick(item)}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.difficulty && (
                        <View style={styles.difficultyBadge}>
                            <Text style={styles.difficultyText}>{item.difficulty}</Text>
                        </View>
                    )}
                </View>
                
                <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                </Text>

                <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                        <Clock size={14} color={colors.mutedForeground} />
                        <Text style={styles.metaText}>{totalTime} min</Text>
                    </View>
                </View>

                {item.missing_ingredients && item.missing_ingredients.length > 0 && (
                    <View style={styles.missingSection}>
                        <View style={styles.missingHeader}>
                            <AlertCircle size={14} color="#F59E0B" />
                            <Text style={styles.missingTitle}>Missing Ingredients</Text>
                        </View>
                        <View style={styles.missingList}>
                            {item.missing_ingredients.map((ing, idx) => (
                                <View key={idx} style={styles.missingTag}>
                                    <Text style={styles.missingTagText}>{ing}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable style={styles.iconButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <Text style={styles.headerTitle}>What to Cook</Text>
                <View style={styles.iconButton} />
            </View>

            {isLoading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Analyzing your pantry...</Text>
                </View>
            ) : recipes.length === 0 ? (
                <View style={styles.centerContent}>
                    <ChefHat size={48} color={colors.mutedForeground} style={{ marginBottom: spacing.md }} />
                    <Text style={styles.emptyTitle}>No ideas found</Text>
                    <Text style={styles.emptyText}>Add more ingredients to your pantry to get recipe suggestions.</Text>
                </View>
            ) : (
                <FlatList
                    data={recipes}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderRecipeCard}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <View style={styles.listHeader}>
                            <Sparkles size={20} color={colors.primary} />
                            <Text style={styles.listHeaderText}>AI Suggestions based on your pantry</Text>
                        </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
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
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: 15,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
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
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 40,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
        backgroundColor: `${colors.primary}10`,
        padding: spacing.md,
        borderRadius: radius.lg,
    },
    listHeaderText: {
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    cardTitle: {
        flex: 1,
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        lineHeight: 22,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: radius.sm,
    },
    difficultyText: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
        color: '#4B5563',
        textTransform: 'uppercase',
    },
    cardDescription: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        marginBottom: spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    missingSection: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    missingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: spacing.sm,
    },
    missingTitle: {
        fontSize: 13,
        fontFamily: fonts.sansBold,
        color: '#F59E0B',
    },
    missingList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    missingTag: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.md,
    },
    missingTagText: {
        fontSize: 12,
        fontFamily: fonts.sansMedium,
        color: '#D97706',
    }
});
