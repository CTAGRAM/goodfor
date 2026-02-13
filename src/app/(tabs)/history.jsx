import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  Search,
  Calendar,
  ChevronDown,
  Box,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  PackageOpen,
  Utensils,
  Sparkles,
  Heart
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";

export default function History() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, activeFamilyMember, loading: profileLoading } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week
  const [scanTypeFilter, setScanTypeFilter] = useState("all"); // all, food, beauty
  const [favoriteProductIds, setFavoriteProductIds] = useState(new Set());

  // Use useFocusEffect to reload scans every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (profile) {
        loadScans();
      }
    }, [profile, activeFamilyMember])
  );

  const loadScans = async () => {
    try {
      const userId = profile?.id;
      if (!userId) return;

      setLoading(true);

      // Query ALL product fields and safety_details to fully reconstruct product data
      let query = supabase
        .from('scans')
        .select(`
          *,
          products (
            id,
            barcode,
            name,
            brand,
            image_url,
            category,
            ingredients,
            nutrition_facts
          )
        `)
        .eq('user_id', userId);

      // Filter by active family member
      if (activeFamilyMember) {
        query = query.eq('family_member_id', activeFamilyMember.id);
      } else {
        query = query.is('family_member_id', null);
      }

      const { data, error } = await query.order('scanned_at', { ascending: false });

      if (error) throw error;

      // Also fetch favorites to mark favorited products
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (favoritesData) {
        setFavoriteProductIds(new Set(favoritesData.map(f => f.product_id)));
      }

      // PRESERVE full scan and products data for proper navigation to product-summary
      const formattedScans = data.map(scan => ({
        // Scan fields
        id: scan.id,
        scanned_at: scan.scanned_at,
        scan_count: scan.scan_count,
        safety_score: scan.safety_score,
        safety_level: scan.safety_level,
        safety_details: scan.safety_details, // CRITICAL: Keep full safety_details object
        product_id: scan.product_id,
        user_id: scan.user_id,
        family_member_id: scan.family_member_id,
        category: scan.category,
        // Display-friendly product fields
        product_name: scan.products?.name,
        product_brand: scan.products?.brand,
        product_image: scan.products?.image_url,
        // CRITICAL: Keep full products object for navigation
        products: scan.products,
      }));

      setScans(formattedScans || []);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = scans.filter(scan => {
    const matchesSearch = !searchQuery ||
      (scan.product_name && scan.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (scan.product_brand && scan.product_brand.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      if (new Date(scan.scanned_at).toDateString() !== today) return false;
    }
    if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (new Date(scan.scanned_at) < oneWeekAgo) return false;
    }

    // Type filter - V4 improved beauty detection with false-positive prevention
    if (scanTypeFilter !== 'all') {
      const categoryLower = (scan.category || '').toLowerCase();
      const productNameLower = (scan.products?.name || scan.product_name || '').toLowerCase();

      // Explicit beauty markers (high confidence)
      const isExplicitBeauty = scan.product_type === 'BEAUTY' ||
        scan.safety_details?.productType === 'BEAUTY';

      // Food-specific keywords that override beauty keyword matches
      const foodExclusions = ['ice cream', 'cream cheese', 'sour cream', 'cream of', 'cream soup',
        'cream pie', 'cream puff', 'whipped cream', 'hand soap' /* already food-safe */,
        'bar soap' /* ambiguous */, 'cookie', 'cake', 'cereal', 'snack', 'beverage', 'drink',
        'juice', 'candy', 'chocolate', 'chips', 'bread', 'pasta', 'sauce', 'yogurt'];
      const isFoodByContext = foodExclusions.some(fw => categoryLower.includes(fw) || productNameLower.includes(fw));

      // Beauty keywords - only used when product isn't clearly food
      const beautyKeywords = ['cosmetic', 'beauty', 'skincare', 'haircare', 'fragrance',
        'makeup', 'perfume', 'lotion', 'shampoo', 'conditioner', 'serum', 'moisturizer',
        'sunscreen', 'deodorant', 'lipstick', 'mascara', 'foundation', 'cleanser', 'toner'];
      const hasBeautyKeyword = !isFoodByContext &&
        beautyKeywords.some(kw => categoryLower.includes(kw) || productNameLower.includes(kw));

      const isBeauty = isExplicitBeauty || hasBeautyKeyword;

      if (scanTypeFilter === 'food' && isBeauty) return false;
      if (scanTypeFilter === 'beauty' && !isBeauty) return false;
    }

    return true;
  });

  const handlePressItem = (item) => {
    // Reconstruct product data to match fresh scan structure EXACTLY
    const products = item.products || {};
    const ingredients = products.ingredients || {};
    const nutritionFacts = products.nutrition_facts || {};
    const safetyDetails = item.safety_details || {};

    // Build product object matching OpenFoodFacts parseProduct() structure
    const productSummaryData = {
      // Core product fields - matching fresh scan field names
      barcode: products.barcode || '',
      name: products.name || item.product_name || 'Unknown Product',
      brand: products.brand || item.product_brand || '',
      imageUrl: products.image_url || item.product_image || null,

      // Ingredients data - extracted from JSONB
      ingredientsText: ingredients.text || '',
      allergens: ingredients.allergens || [],
      additives: ingredients.additives || [],
      traces: ingredients.traces || [],

      // Nutrition data - from JSONB nutrition_facts
      nutriments: {
        energy_kcal: nutritionFacts.energy_kcal || 0,
        sugars: nutritionFacts.sugars || 0,
        sodium: nutritionFacts.sodium || 0,
        salt: nutritionFacts.salt || 0,
        saturated_fat: nutritionFacts.saturated_fat || nutritionFacts['saturated-fat'] || 0,
        proteins: nutritionFacts.proteins || 0,
        fiber: nutritionFacts.fiber || 0,
        caffeine: nutritionFacts.caffeine || 0,
      },

      // Categories
      categories: products.category ? [products.category] : [],

      // Safety analysis - reconstructed from stored data
      safetyAnalysis: {
        safety: item.safety_level || 'safe',
        safeScore: item.safety_score || 50,
        issues: safetyDetails.issues || [],
        ageGroup: safetyDetails.ageGroup,
        ageAppropriate: safetyDetails.ageAppropriate !== false,
        // Nutri-Score data if available
        nutriScore: safetyDetails.nutriScore || null,
        // Personal allergen matches
        hasPersonalAllergenMatch: (safetyDetails.issues || []).some(i => i.type === 'personal_allergen'),
      },

      // Scores from OpenFoodFacts (may be null for historical scans)
      nutriScore: safetyDetails.nutriScore?.grade || null,
      novaGroup: safetyDetails.novaGroup?.group || null,
      ecoScore: safetyDetails.ecoScore?.grade || null,
    };

    router.push({
      pathname: '/product-summary',
      params: { productData: JSON.stringify(productSummaryData) }
    });
  };

  // Safe date parsing helper
  const safeDate = (dateString) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const groupScansByDate = (scans) => {
    const grouped = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    scans.forEach(scan => {
      const scanDate = safeDate(scan.scanned_at);
      let label;

      if (scanDate.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (scanDate.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = scanDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }

      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(scan);
    });

    return Object.entries(grouped).map(([section, items]) => ({ section, items }));
  };

  const getSafetyColor = (safety) => {
    switch (safety) {
      case "safe":
        return colors.chart1;
      case "caution":
        return colors.chart2;
      case "avoid":
        return colors.chart3;
      default:
        return colors.chart1;
    }
  };

  const getSafetyIcon = (safety) => {
    switch (safety) {
      case "safe":
        return CheckCircle;
      case "caution":
        return Info;
      case "avoid":
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  // Get relative time string like "Updated recently", "Updated 2 weeks ago"
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = safeDate(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const historyData = groupScansByDate(filteredScans);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Decorative Background Blurs */}
      <View style={styles.blurTopRight} />
      <View style={styles.blurLeft} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          {showSearch ? (
            <TextInput
              style={{ flex: 1, height: 40, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, marginLeft: 12 }}
              placeholder="Search scans..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          ) : (
            <Text style={styles.headerTitle}>Scan History</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchQuery("");
          }}>
            <Search size={20} color={showSearch ? colors.accent : colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => {
            // Cycle date filters: all -> today -> week -> all
            if (dateFilter === 'all') setDateFilter('today');
            else if (dateFilter === 'today') setDateFilter('week');
            else setDateFilter('all');
          }}>
            <Calendar size={20} color={dateFilter !== 'all' ? colors.accent : colors.primary} />
            {dateFilter !== 'all' && (
              <View style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Toggles */}
      <View style={{ flexDirection: 'row', paddingHorizontal: spacing[6], paddingBottom: spacing[4], gap: spacing[3] }}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 10,
            borderRadius: radius.xl,
            backgroundColor: scanTypeFilter === 'food' ? colors.primary : colors.card,
            borderWidth: 1,
            borderColor: scanTypeFilter === 'food' ? colors.primary : `${colors.border}40`,
          }}
          onPress={() => setScanTypeFilter(prev => prev === 'food' ? 'all' : 'food')}
        >
          <Utensils size={16} color={scanTypeFilter === 'food' ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={{
            fontFamily: fonts.sans.bold,
            fontSize: 13,
            color: scanTypeFilter === 'food' ? colors.primaryForeground : colors.mutedForeground
          }}>Food</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 10,
            borderRadius: radius.xl,
            backgroundColor: scanTypeFilter === 'beauty' ? colors.primary : colors.card,
            borderWidth: 1,
            borderColor: scanTypeFilter === 'beauty' ? colors.primary : `${colors.border}40`,
          }}
          onPress={() => setScanTypeFilter(prev => prev === 'beauty' ? 'all' : 'beauty')}
        >
          <Sparkles size={16} color={scanTypeFilter === 'beauty' ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={{
            fontFamily: fonts.sans.bold,
            fontSize: 13,
            color: scanTypeFilter === 'beauty' ? colors.primaryForeground : colors.mutedForeground
          }}>Beauty</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : scans.length === 0 ? (
        // Empty state
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${colors.accent}40`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            <PackageOpen size={40} color={colors.mutedForeground} />
          </View>
          <Text style={{
            fontSize: 24,
            fontFamily: fonts.heading.bold,
            color: colors.foreground,
            marginBottom: 12,
            textAlign: 'center'
          }}>
            No Scans Yet
          </Text>
          <Text style={{
            fontSize: 16,
            color: colors.mutedForeground,
            textAlign: 'center',
            lineHeight: 24
          }}>
            Scan your first product to start tracking your family's safety history
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {historyData.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.section}</Text>
              <View style={styles.sectionContent}>
                {group.items.map((item, itemIndex) => {
                  const SafetyIcon = getSafetyIcon(item.safety_level);
                  const safetyColor = getSafetyColor(item.safety_level);
                  const time = safeDate(item.scanned_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.historyItem,
                        itemIndex !== group.items.length - 1 && styles.historyItemBorder,
                      ]}
                      onPress={() => handlePressItem(item)}
                    >
                      <View style={styles.historyItemLeft}>
                        {/* Adding Product Image to History Item as requested */}
                        <View style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', marginRight: 12, backgroundColor: '#f0f0f0' }}>
                          {item.product_image ? (
                            <Image source={{ uri: item.product_image }} style={{ width: '100%', height: '100%' }} />
                          ) : (
                            <View style={[styles.iconContainer, { width: '100%', height: '100%', backgroundColor: `${safetyColor}20`, borderRadius: 0 }]}>
                              <SafetyIcon size={20} color={safetyColor} />
                            </View>
                          )}
                        </View>

                        <View style={styles.historyItemInfo}>
                          <Text style={styles.productName}>{item.product_name || 'Unknown Product'}</Text>
                          <View style={styles.metaRow}>
                            <Text style={styles.timeText}>{getRelativeTime(item.scanned_at)}</Text>
                            {item.scan_count > 1 && (
                              <Text style={[styles.timeText, { color: colors.primary }]}>
                                {' '}• Scanned {item.scan_count}×
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.historyItemRight}>
                        {/* Favorite indicator */}
                        {favoriteProductIds.has(item.product_id) && (
                          <View style={styles.favoriteBadge}>
                            <Heart size={14} color={colors.chart3} fill={colors.chart3} />
                          </View>
                        )}
                        <View
                          style={[
                            styles.safetyBadge,
                            { backgroundColor: `${safetyColor}20` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.safetyBadgeText,
                              { color: safetyColor },
                            ]}
                          >
                            {item.safety_label || item.safety_level?.toUpperCase()}
                          </Text>
                        </View>
                        <ChevronRight size={20} color={colors.mutedForeground} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: "relative",
    overflow: "hidden",
  },

  blurTopRight: {
    position: "absolute",
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    backgroundColor: colors.accent,
    borderRadius: 128,
    opacity: 0.4,
  },
  blurLeft: {
    position: "absolute",
    top: "25%",
    left: -96,
    width: 192,
    height: 192,
    backgroundColor: colors.chart1,
    borderRadius: 96,
    opacity: 0.05,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius["2xl"],
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: colors.foreground,
  },
  headerRight: {
    flexDirection: "row",
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius["2xl"],
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
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
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionContent: {
    backgroundColor: colors.card,
    borderRadius: radius["3xl"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}40`,
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  historyItemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: fonts.sans.semiBold,
    color: colors.foreground,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  timeText: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.mutedForeground,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.mutedForeground,
  },
  userName: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.mutedForeground,
  },
  historyItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  safetyBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.lg,
  },
  safetyBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sans.bold,
    letterSpacing: 0.5,
  },
  favoriteBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.chart3}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
