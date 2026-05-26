import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Users,
  Flame,
  Heart,
  MoreHorizontal,
  Check,
  RefreshCw,
  Calendar,
  Sparkles,
  ArrowRight,
  Leaf,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getRecipeById, getHealthierSwaps } from "@/lib/recipeService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isGeneratingSwaps, setIsGeneratingSwaps] = useState(false);
  const [swapsMap, setSwapsMap] = useState({});

  const fetchRecipe = async () => {
    try {
      const data = await getRecipeById(id);
      setRecipe(data);
    } catch (error) {
      Alert.alert("Error", "Could not load recipe details.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) fetchRecipe();
    }, [id])
  );

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleStep = (index) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleGetSwaps = async () => {
    try {
      setIsGeneratingSwaps(true);
      const newSwaps = await getHealthierSwaps(id);
      
      const map = {};
      newSwaps.forEach(swap => {
        if (swap.original_ingredient_id) {
          map[swap.original_ingredient_id] = swap;
        }
      });
      setSwapsMap(map);

      Alert.alert(
        "Healthier Swaps Found",
        `We found ${newSwaps.length} healthier alternatives for this recipe!`
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to generate swaps.");
    } finally {
      setIsGeneratingSwaps(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <Animated.View entering={FadeIn} style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </Animated.View>
    );
  }

  if (!recipe) return null;

  const totalTime =
    recipe.total_time_minutes ||
    (recipe.cook_time_minutes || 0) + (recipe.prep_time_minutes || 0);
  const ingredients = recipe.recipe_ingredients || [];
  const instructions = recipe.instructions || [];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Image ────────────────────────────────────── */}
        <View style={styles.hero}>
          {recipe.image_url ? (
            <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: "#D6E4DA" }]} />
          )}

          {/* Dark gradient overlay */}
          <View style={styles.heroGradient} />

          {/* Navigation buttons */}
          <View style={[styles.heroNav, { paddingTop: insets.top + 10 }]}>
            <Pressable style={styles.blurBtn} onPress={() => router.back()}>
              <BlurView intensity={40} tint="dark" style={styles.blurBtnInner}>
                <ArrowLeft size={20} color="#fff" />
              </BlurView>
            </Pressable>
            <View style={styles.heroNavRight}>
              <Pressable
                style={styles.blurBtn}
                onPress={() => setIsLiked(!isLiked)}
              >
                <BlurView intensity={40} tint="dark" style={styles.blurBtnInner}>
                  <Heart
                    size={20}
                    color={isLiked ? "#FF6B6B" : "#fff"}
                    fill={isLiked ? "#FF6B6B" : "none"}
                  />
                </BlurView>
              </Pressable>
              <Pressable style={styles.blurBtn}>
                <BlurView intensity={40} tint="dark" style={styles.blurBtnInner}>
                  <MoreHorizontal size={20} color="#fff" />
                </BlurView>
              </Pressable>
            </View>
          </View>

          {/* Meta tags over hero image */}
          <View style={styles.heroTagsRow}>
            {recipe.source_platform && (
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>
                  Imported from{" "}
                  {recipe.source_platform.charAt(0).toUpperCase() +
                    recipe.source_platform.slice(1)}
                </Text>
              </View>
            )}
            {recipe.health_score > 0 && (
              <View
                style={[
                  styles.heroTag,
                  {
                    backgroundColor: "rgba(52, 168, 83, 0.85)",
                    borderColor: "rgba(255,255,255,0.30)",
                  },
                ]}
              >
                <Leaf size={11} color="#fff" />
                <Text style={styles.heroTagText}>
                  Score {recipe.health_score}
                </Text>
              </View>
            )}
          </View>

          {/* Title over hero */}
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>{recipe.title}</Text>
          </View>
        </View>

        {/* ─── Content Sheet ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.sheet}>
          {/* Meta card */}
          <View style={styles.metaCard}>
            <View style={styles.metaCol}>
              <View style={[styles.metaIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Clock size={16} color={colors.primary} />
              </View>
              <Text style={styles.metaVal}>
                {totalTime || "--"}{" "}
                <Text style={styles.metaLbl}>min</Text>
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaCol}>
              <View style={[styles.metaIcon, { backgroundColor: "rgba(251,188,4,0.18)" }]}>
                <Users size={16} color="#B16F00" />
              </View>
              <Text style={styles.metaVal}>
                {recipe.servings || "--"}{" "}
                <Text style={styles.metaLbl}>srv</Text>
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaCol}>
              <View style={[styles.metaIcon, { backgroundColor: `${colors.chart1}14` }]}>
                <Flame size={16} color={colors.chart1} />
              </View>
              <Text style={styles.metaVal}>
                {recipe.nutrition_per_serving?.calories || "--"}{" "}
                <Text style={styles.metaLbl}>kcal</Text>
              </Text>
            </View>
          </View>

          {/* Description */}
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {/* AI Swap Card */}
          <Pressable
            style={({ pressed }) => [
              styles.aiCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleGetSwaps}
            disabled={isGeneratingSwaps}
          >
            <View style={styles.aiCircle}>
              {isGeneratingSwaps ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Sparkles size={20} color="#fff" />
              )}
            </View>
            <View style={styles.aiBody}>
              <Text style={styles.aiTitle}>Make it healthier</Text>
              <Text style={styles.aiSub}>
                Ask AI for ingredient swaps tailored to your family
              </Text>
            </View>
            <View style={styles.aiArrow}>
              <ArrowRight size={16} color={colors.primary} />
            </View>
          </Pressable>

          {/* ─── Ingredients ───────────────────────────────── */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.sectionMeta}>
              {ingredients.length} items
            </Text>
          </View>

          <View style={styles.ingredientsCard}>
            {ingredients.map((item, index) => {
              const isChecked = checkedIngredients.has(index);
              const hasSwap = item.health_score != null && item.health_score < 50;
              const suggestedSwap = swapsMap[item.id];
              return (
                <View key={item.id || index}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleIngredient(index)}
                    style={[
                      styles.ingRow,
                      index === ingredients.length - 1 && !suggestedSwap && styles.ingRowLast,
                    ]}
                  >
                    {/* Checkbox */}
                    <View
                      style={[
                        styles.ingCheck,
                        isChecked && styles.ingCheckChecked,
                      ]}
                    >
                      {isChecked && <Check size={12} color="#fff" />}
                    </View>

                    {/* Text */}
                    <Text
                      style={[
                        styles.ingText,
                        isChecked && styles.ingTextStruck,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ingQty,
                          isChecked && styles.ingTextStruck,
                        ]}
                      >
                        {item.quantity ? `${item.quantity} ` : ""}
                        {item.unit ? `${item.unit} ` : ""}
                      </Text>
                      <Text
                        style={[
                          styles.ingName,
                          isChecked && styles.ingTextStruck,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </Text>

                    {/* Swap badge */}
                    {hasSwap && !suggestedSwap && (
                      <View style={styles.swapBadge}>
                        <RefreshCw size={10} color="#B16F00" />
                        <Text style={styles.swapBadgeText}>Swap</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Swap Suggestion Render */}
                  {suggestedSwap && (
                    <View style={styles.swapSuggestionBox}>
                      <View style={styles.swapSuggestionHeader}>
                        <Sparkles size={14} color="#059669" />
                        <Text style={styles.swapSuggestionTitle}>Suggested Swap</Text>
                      </View>
                      <Text style={styles.swapSuggestionName}>{suggestedSwap.suggestion}</Text>
                      <Text style={styles.swapSuggestionReason}>{suggestedSwap.reason}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* ─── Instructions ──────────────────────────────── */}
          <View style={[styles.sectionHead, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.sectionMeta}>
              {instructions.length} steps
            </Text>
          </View>

          <View style={styles.instructionsList}>
            {instructions.map((step, index) => {
              const isDone = completedSteps.has(index);
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() => toggleStep(index)}
                  style={styles.stepCard}
                >
                  <View
                    style={[
                      styles.stepNum,
                      isDone && styles.stepNumDone,
                    ]}
                  >
                    {isDone ? (
                      <Check size={14} color="#fff" />
                    ) : (
                      <Text style={styles.stepNumText}>{index + 1}</Text>
                    )}
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─────────────────────── */}
      <BlurView
        intensity={80}
        tint="light"
        style={[
          styles.actionBar,
          { paddingBottom: (insets.bottom || 14) + 14 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.actionSecondary,
            pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 },
          ]}
        >
          <Calendar size={22} color={colors.foreground} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.cookNow,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
          ]}
        >
          <Sparkles size={18} color="#fff" />
          <Text style={styles.cookNowText}>Cook now</Text>
        </Pressable>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },

  // ─── Hero ──────────────────────────────────────────────────
  hero: {
    width: "100%",
    height: 380,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    // Simulating gradient with layered views
    borderWidth: 0,
  },
  // We'll use a View with opacity layers instead
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  heroNavRight: {
    flexDirection: "row",
    gap: 10,
  },
  blurBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  blurBtnInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero meta tags
  heroTagsRow: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 90,
    flexDirection: "row",
    gap: 8,
    zIndex: 2,
  },
  heroTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroTagText: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Hero title
  heroTitleWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 44,
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: fonts.heading,
    color: "#fff",
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },

  // ─── Content Sheet ─────────────────────────────────────────
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  // Meta card
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  metaCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  metaDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(225, 230, 227, 0.7)",
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  metaVal: {
    fontSize: 15,
    fontFamily: fonts.sansBold,
    color: colors.foreground,
    lineHeight: 18,
  },
  metaLbl: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: colors.mutedForeground,
  },

  // Description
  description: {
    fontSize: 15,
    fontFamily: fonts.sans,
    color: colors.mutedForeground,
    lineHeight: 24,
    marginBottom: 16,
  },

  // AI Card
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: `${colors.primary}0A`,
    borderWidth: 1,
    borderColor: `${colors.primary}2D`,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
  },
  aiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  aiBody: {
    flex: 1,
    minWidth: 0,
  },
  aiTitle: {
    fontSize: 15,
    fontFamily: fonts.sansBold,
    color: colors.primary,
    lineHeight: 20,
  },
  aiSub: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.mutedForeground,
    marginTop: 2,
    lineHeight: 17,
  },
  aiArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}24`,
    alignItems: "center",
    justifyContent: "center",
  },

  // Section headers
  sectionHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  sectionMeta: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colors.mutedForeground,
  },

  // ─── Ingredients ───────────────────────────────────────────
  ingredientsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  ingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(225, 230, 227, 0.5)",
  },
  ingRowLast: {
    borderBottomWidth: 0,
  },
  ingCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#C8D1CC",
    alignItems: "center",
    justifyContent: "center",
  },
  ingCheckChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ingText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    color: colors.foreground,
    lineHeight: 20,
  },
  ingTextStruck: {
    textDecorationLine: "line-through",
    color: colors.mutedForeground,
  },
  ingQty: {
    fontFamily: fonts.sansBold,
    color: colors.primary,
  },
  ingName: {
    fontFamily: fonts.sansMedium,
    color: colors.foreground,
  },
  swapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.20)",
  },
  swapBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sansBold,
    color: "#B16F00",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  swapSuggestionBox: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  swapSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  swapSuggestionTitle: {
    fontSize: 12,
    fontFamily: fonts.sansBold,
    color: '#059669',
    textTransform: 'uppercase',
  },
  swapSuggestionName: {
    fontSize: 14,
    fontFamily: fonts.sansBold,
    color: '#065F46',
    marginBottom: 2,
  },
  swapSuggestionReason: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: '#047857',
  },

  // ─── Instructions ──────────────────────────────────────────
  instructionsList: {
    gap: 10,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumDone: {
    backgroundColor: colors.chart1,
  },
  stepNumText: {
    fontSize: 13,
    fontFamily: fonts.sansBold,
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.sansMedium,
    color: colors.foreground,
    lineHeight: 24,
  },

  // ─── Bottom Action Bar ─────────────────────────────────────
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(225, 230, 227, 0.6)",
  },
  actionSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(225, 230, 227, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cookNow: {
    flex: 1,
    height: 56,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 6,
  },
  cookNowText: {
    fontSize: 16,
    fontFamily: fonts.sansBold,
    color: "#fff",
  },
});
