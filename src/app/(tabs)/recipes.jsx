import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import {
  Plus,
  Search,
  BookOpen,
  Clock,
  ChefHat,
  UtensilsCrossed,
  Sparkles,
  Link2,
  Camera,
  ImageIcon,
  ChevronRight,
  Heart,
  Users,
  Leaf,
} from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRecipes } from "@/lib/recipeService";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
  { key: "dessert", label: "Desserts" },
];

export default function RecipesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const fetchRecipes = async () => {
    if (!user) return;
    try {
      const category = activeCategory === "all" ? null : activeCategory;
      const data = await getUserRecipes(user.id, { category });
      setRecipes(data || []);
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration: 400 });
      fetchRecipes();
      return () => {
        opacity.value = 0;
      };
    }, [user, activeCategory])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRecipes();
  };

  const filteredRecipes = recipes;

  // ─── Empty State ───────────────────────────────────────────
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        {/* Decorative illustration */}
        <View style={{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: `${colors.primary}08`,
          alignItems: "center", justifyContent: "center",
          marginBottom: 24,
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: `${colors.primary}12`,
            alignItems: "center", justifyContent: "center",
          }}>
            <ChefHat size={36} color={colors.primary} />
          </View>
        </View>

        <Text style={{
          fontSize: 22, fontFamily: "Rubik_700Bold",
          color: colors.foreground, textAlign: "center", marginBottom: 8,
        }}>
          Start Your Cookbook
        </Text>
        <Text style={{
          fontSize: 14, fontFamily: "Rubik_400Regular",
          color: colors.mutedForeground, textAlign: "center",
          lineHeight: 22, marginBottom: 32,
        }}>
          Save recipes from anywhere — paste a link from{"\n"}
          TikTok, Instagram, or snap a cookbook photo.
        </Text>

        {/* Import options */}
        <View style={{ width: "100%", gap: 12 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/recipe-import")}
            style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: colors.primary,
              paddingVertical: 16, paddingHorizontal: 20,
              borderRadius: 20, gap: 14,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Link2 size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: "Rubik_600SemiBold", color: "#fff" }}>
                Import from URL
              </Text>
              <Text style={{ fontSize: 12, fontFamily: "Rubik_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
                Paste a link from any recipe site
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/recipe-import", params: { mode: "camera" } })}
              style={{
                flex: 1, alignItems: "center",
                backgroundColor: colors.card,
                paddingVertical: 20, paddingHorizontal: 16,
                borderRadius: 20, gap: 10,
                borderWidth: 1, borderColor: `${colors.border}60`,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: `${colors.chart1}12`,
                alignItems: "center", justifyContent: "center",
              }}>
                <Camera size={22} color={colors.chart1} />
              </View>
              <Text style={{ fontSize: 14, fontFamily: "Rubik_600SemiBold", color: colors.foreground }}>
                Scan
              </Text>
              <Text style={{ fontSize: 11, fontFamily: "Rubik_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
                Cookbook page
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/recipe-import", params: { mode: "screenshot" } })}
              style={{
                flex: 1, alignItems: "center",
                backgroundColor: colors.card,
                paddingVertical: 20, paddingHorizontal: 16,
                borderRadius: 20, gap: 10,
                borderWidth: 1, borderColor: `${colors.border}60`,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: `${colors.chart5}15`,
                alignItems: "center", justifyContent: "center",
              }}>
                <ImageIcon size={22} color={colors.chart5} />
              </View>
              <Text style={{ fontSize: 14, fontFamily: "Rubik_600SemiBold", color: colors.foreground }}>
                Screenshot
              </Text>
              <Text style={{ fontSize: 11, fontFamily: "Rubik_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
                Upload photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─── Recipe Card ───────────────────────────────────────────
  const renderRecipeItem = ({ item }) => {
    const totalTime = item.total_time_minutes || (item.cook_time_minutes || 0) + (item.prep_time_minutes || 0);
    const ingredientCount = item.recipe_ingredients?.[0]?.count || item.recipe_ingredients?.length || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/recipe-detail", params: { id: item.id } })}
        style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          marginBottom: 14,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: `${colors.border}40`,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Image */}
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: "100%", height: 180 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: "100%", height: 140,
            backgroundColor: `${colors.accent}60`,
            alignItems: "center", justifyContent: "center",
          }}>
            <UtensilsCrossed size={40} color={`${colors.primary}30`} />
          </View>
        )}

        {/* Health Score Badge */}
        {item.health_score > 0 && (
          <View style={{
            position: "absolute", top: 12, right: 12,
            backgroundColor: "rgba(255,255,255,0.95)",
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 10, flexDirection: "row",
            alignItems: "center", gap: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}>
            <Leaf size={12} color={colors.chart1} />
            <Text style={{
              fontSize: 12, fontFamily: "Rubik_700Bold",
              color: item.health_score >= 70 ? colors.chart1 : item.health_score >= 40 ? colors.chart2 : colors.chart3,
            }}>
              {item.health_score}
            </Text>
          </View>
        )}

        {/* Source platform tag */}
        {item.source_platform && (
          <View style={{
            position: "absolute", top: 12, left: 12,
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 8,
          }}>
            <Text style={{ fontSize: 10, fontFamily: "Rubik_600SemiBold", color: "#fff", textTransform: "capitalize" }}>
              {item.source_platform}
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={{ padding: 16 }}>
          <Text style={{
            fontSize: 17, fontFamily: "Rubik_600SemiBold",
            color: colors.foreground, marginBottom: 8,
          }} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            {totalTime > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Clock size={14} color={colors.mutedForeground} />
                <Text style={{ fontSize: 13, fontFamily: "Rubik_500Medium", color: colors.mutedForeground }}>
                  {totalTime}m
                </Text>
              </View>
            )}
            {ingredientCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <UtensilsCrossed size={14} color={colors.mutedForeground} />
                <Text style={{ fontSize: 13, fontFamily: "Rubik_500Medium", color: colors.mutedForeground }}>
                  {ingredientCount} ingredients
                </Text>
              </View>
            )}
            {item.servings > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Users size={14} color={colors.mutedForeground} />
                <Text style={{ fontSize: 13, fontFamily: "Rubik_500Medium", color: colors.mutedForeground }}>
                  {item.servings}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Header with category pills ────────────────────────────
  const renderHeader = () => (
    <View style={{ marginBottom: 16 }}>
      {/* Category filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        renderItem={({ item }) => {
          const isActive = activeCategory === item.key;
          return (
            <TouchableOpacity
              onPress={() => setActiveCategory(item.key)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: isActive ? colors.primary : colors.card,
                borderWidth: 1,
                borderColor: isActive ? colors.primary : `${colors.border}60`,
              }}
            >
              <Text style={{
                fontSize: 13,
                fontFamily: isActive ? "Rubik_600SemiBold" : "Rubik_500Medium",
                color: isActive ? "#fff" : colors.mutedForeground,
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, animatedStyle]}>
      <StatusBar style="dark" />

      {/* Background blurs */}
      <View style={{
        position: "absolute", top: -100, right: -100,
        width: 200, height: 200, backgroundColor: colors.accent,
        opacity: 0.4, borderRadius: 100,
      }} />
      <View style={{
        position: "absolute", bottom: 100, left: -80,
        width: 160, height: 160, backgroundColor: colors.chart1,
        opacity: 0.04, borderRadius: 80,
      }} />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        paddingHorizontal: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <View>
          <Text style={{
            fontSize: 28, fontFamily: "Rubik_800ExtraBold",
            color: colors.foreground,
          }}>
            My Recipes
          </Text>
          <Text style={{
            fontSize: 13, fontFamily: "Rubik_400Regular",
            color: colors.mutedForeground, marginTop: 2,
          }}>
            {recipes.length > 0 ? `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} saved` : "Your personal cookbook"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={{
              width: 42, height: 42, borderRadius: 21,
              alignItems: "center", justifyContent: "center",
              backgroundColor: colors.card,
              borderWidth: 1, borderColor: `${colors.border}50`,
            }}
          >
            <Search size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/recipe-import")}
            style={{
              width: 42, height: 42, borderRadius: 21,
              alignItems: "center", justifyContent: "center",
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeItem}
        ListHeaderComponent={recipes.length > 0 ? renderHeader : null}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
          ...(filteredRecipes.length === 0 && { flex: 1 }),
        }}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
}
