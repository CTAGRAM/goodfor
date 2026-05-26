import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, TextInput, Image, Modal, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BlurView } from 'expo-blur';
import Animated, { FadeInRight, FadeOutRight, LinearTransition, useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
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
  Heart,
  X,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";
import { EmptyBoxAnimation } from '@/components/AnimatedEffects';

export default function History() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, activeFamilyMember, loading: profileLoading } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month, custom
  const [customDate, setCustomDate] = useState(null); // For custom date filter
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [favoriteProductIds, setFavoriteProductIds] = useState(new Set());

  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Use useFocusEffect to reload scans every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration: 400 });
      if (profile) {
        loadScans();
      }
      return () => {
        opacity.value = 0;
      };
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
    if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      if (new Date(scan.scanned_at) < oneMonthAgo) return false;
    }
    if (dateFilter === 'custom' && customDate) {
      const scanDate = new Date(scan.scanned_at).toDateString();
      const filterDate = new Date(customDate).toDateString();
      if (scanDate !== filterDate) return false;
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
        fat: nutritionFacts.fat || 0,
        saturated_fat: nutritionFacts.saturated_fat || nutritionFacts['saturated-fat'] || 0,
        'saturated-fat': nutritionFacts.saturated_fat || nutritionFacts['saturated-fat'] || 0,
        'trans-fat': nutritionFacts.trans_fat || nutritionFacts['trans-fat'] || 0,
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
    <Animated.View style={[styles.container, animatedStyle]}>
      <StatusBar style="dark" />

      {/* Decorative Background Blurs */}
      <View style={styles.blurTopRight} />
      <View style={styles.blurLeft} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Animated.View layout={LinearTransition.springify()} style={styles.headerLeft}>
          <View style={styles.backButtonShadow}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              if (showSearch) {
                setShowSearch(false);
                setSearchQuery("");
              } else {
                router.back();
              }
            }}>
              <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
                <ArrowLeft size={24} color={colors.primary} />
              </BlurView>
            </TouchableOpacity>
          </View>
          {showSearch ? (
            <Animated.View 
              entering={FadeInRight.duration(300)} 
              exiting={FadeOutRight.duration(200)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, height: 40, borderWidth: 1, borderColor: colors.border }}
            >
              <Search size={16} color={colors.mutedForeground} />
              <TextInput
                style={{ flex: 1, height: 40, marginLeft: 8, fontSize: 14, fontFamily: fonts.sans, color: colors.foreground }}
                placeholder="Search scans..."
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            <Animated.Text layout={LinearTransition} style={styles.headerTitle}>Scan History</Animated.Text>
          )}
        </Animated.View>
        {!showSearch && (
          <Animated.View entering={FadeInRight} exiting={FadeOutRight} style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowSearch(true)}>
              <Search size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              if (dateFilter === 'all') setDateFilter('today');
              else if (dateFilter === 'today') setDateFilter('week');
              else if (dateFilter === 'week') setDateFilter('month');
              else if (dateFilter === 'month') {
                setDateFilter('custom');
                setShowDatePicker(true);
              }
              else setDateFilter('all');
            }}>
              <Calendar size={20} color={dateFilter !== 'all' ? colors.chart1 : colors.primary} />
              {dateFilter !== 'all' && (
                <View style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.chart1 }} />
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Active Date Filter Chip */}
      {dateFilter !== 'all' && (
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing[6], paddingBottom: spacing[4] }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: `${colors.chart1}15`,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: `${colors.chart1}30`,
            }}
            onPress={() => setDateFilter('all')}
          >
            <Calendar size={13} color={colors.chart1} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.chart1 }}>
              {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : customDate ? new Date(customDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Custom'}
            </Text>
            <X size={13} color={colors.chart1} />
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : scans.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          {/* Animated panda + empty box */}
          <Image
            source={require('../../../assets/images/panda-peek.png')}
            style={{ width: 100, height: 60, resizeMode: 'contain', marginBottom: -8, zIndex: 1 }}
          />
          <EmptyBoxAnimation size={100} />
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
                      {/* Column 1: Product Image */}
                      <View style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#f0f0f0' }}>
                        {item.product_image ? (
                          <Image source={{ uri: item.product_image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                        ) : (
                          <View style={{ width: '100%', height: '100%', backgroundColor: `${safetyColor}10`, alignItems: 'center', justifyContent: 'center' }}>
                            <PackageOpen size={24} color={safetyColor} />
                          </View>
                        )}
                      </View>

                      {/* Column 2: Details & Metadata Badges */}
                      <View style={{ flex: 1, paddingHorizontal: 14, justifyContent: 'center' }}>
                        
                        {/* Name */}
                        <Text style={[styles.productName, { fontSize: 16 }]} numberOfLines={1}>{item.product_name || 'Unknown Product'}</Text>
                        
                        {/* Brand & Date */}
                        <Text style={[styles.productBrand, { marginTop: 1, fontSize: 13 }]} numberOfLines={1}>
                          {item.product_brand ? `${item.product_brand} • ` : ''}{getRelativeTime(item.scanned_at)}
                          {item.scan_count > 1 ? ` • ${item.scan_count}×` : ''}
                        </Text>

                        {/* Inline Badges (Nutri-Score & NOVA) properly nested below text */}
                        {(() => {
                          const sd = item.safety_details || {};
                          const nutriGrade = sd.nutriScore?.grade || null;
                          const novaGroup = sd.novaGroup?.group || null;
                          if (!nutriGrade && !novaGroup) return null;
                          return (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                              {nutriGrade && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.mutedForeground }}>NUTRI</Text>
                                  <View style={{ flexDirection: 'row', gap: 1 }}>
                                    {['a', 'b', 'c', 'd', 'e'].map(g => {
                                      const gradeColors = { a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63E11' };
                                      const isActive = g === nutriGrade.toLowerCase();
                                      return (
                                        <View key={g} style={{
                                          width: isActive ? 13 : 9,
                                          height: 13,
                                          borderRadius: 2,
                                          backgroundColor: isActive ? gradeColors[g] : `${gradeColors[g]}25`,
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}>
                                          <Text style={{
                                            fontSize: isActive ? 8 : 1,
                                            fontFamily: fonts.sansBold,
                                            color: isActive ? '#FFF' : 'transparent',
                                          }}>{isActive ? g.toUpperCase() : ''}</Text>
                                        </View>
                                      );
                                    })}
                                  </View>
                                </View>
                              )}
                              
                              {novaGroup && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: colors.mutedForeground }}>NOVA</Text>
                                  <View style={{
                                    width: 14, height: 14, borderRadius: 3,
                                    backgroundColor: novaGroup <= 1 ? '#038141' : novaGroup <= 2 ? '#85BB2F' : novaGroup <= 3 ? '#EE8100' : '#E63E11',
                                    alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <Text style={{ fontSize: 9, fontFamily: fonts.sansBold, color: '#FFF' }}>{novaGroup}</Text>
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })()}

                      </View>

                      {/* Column 3: The Primary Safety Verdict */}
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                        {favoriteProductIds.has(item.product_id) && (
                          <Heart size={16} color={colors.chart3} fill={colors.chart3} style={{ marginBottom: 2 }} />
                        )}
                        <View style={{ 
                          flexDirection: 'row', alignItems: 'center', gap: 5,
                          backgroundColor: `${safetyColor}12`,
                          paddingHorizontal: 8, paddingVertical: 4,
                          borderRadius: 8,
                        }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: safetyColor }} />
                          <Text style={{ fontSize: 13, fontFamily: fonts.sansBold, color: safetyColor }}>
                            {item.safety_score ? `${item.safety_score} ` : ''}{item.safety_level === 'safe' ? 'SAFE' : (item.safety_label || item.safety_level?.toUpperCase())}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 20, fontFamily: fonts.heading, color: colors.foreground }}>Pick a Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {(() => {
            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
            const firstDay = new Date(pickerYear, pickerMonth, 1).getDay();
            const days = [];
            for (let i = 0; i < firstDay; i++) days.push(null);
            for (let i = 1; i <= daysInMonth; i++) days.push(i);
            
            const selectedDateStr = customDate ? new Date(customDate).toDateString() : null;
            const todayStr = new Date().toDateString();

            return (
              <View style={{ paddingHorizontal: 20 }}>
                {/* Month Nav */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => {
                    if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); }
                    else setPickerMonth(pickerMonth - 1);
                  }} style={{ padding: 8 }}>
                    <ArrowLeft size={20} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 17, fontFamily: fonts.sansBold, color: colors.foreground }}>{monthNames[pickerMonth]} {pickerYear}</Text>
                  <TouchableOpacity onPress={() => {
                    if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); }
                    else setPickerMonth(pickerMonth + 1);
                  }} style={{ padding: 8 }}>
                    <ChevronRight size={20} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* Day of Week Headers */}
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.mutedForeground }}>{d}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {days.map((day, i) => {
                    if (day === null) return <View key={`empty-${i}`} style={{ width: '14.28%', height: 44 }} />;
                    const thisDate = new Date(pickerYear, pickerMonth, day);
                    const isSelected = thisDate.toDateString() === selectedDateStr;
                    const isToday = thisDate.toDateString() === todayStr;
                    const isFuture = thisDate > new Date();
                    return (
                      <TouchableOpacity
                        key={day}
                        disabled={isFuture}
                        onPress={() => {
                          setCustomDate(thisDate.toISOString());
                          setDateFilter('custom');
                          setShowDatePicker(false);
                        }}
                        style={{
                          width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <View style={{
                          width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isSelected ? colors.primary : isToday ? `${colors.primary}15` : 'transparent',
                        }}>
                          <Text style={{
                            fontSize: 15, fontFamily: isSelected || isToday ? fonts.sansBold : fonts.sans,
                            color: isFuture ? `${colors.mutedForeground}40` : isSelected ? colors.primaryForeground : colors.foreground,
                          }}>{day}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quick presets */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Today', fn: () => { setDateFilter('today'); setShowDatePicker(false); }},
                    { label: 'This Week', fn: () => { setDateFilter('week'); setShowDatePicker(false); }},
                    { label: 'This Month', fn: () => { setDateFilter('month'); setShowDatePicker(false); }},
                    { label: 'All Time', fn: () => { setDateFilter('all'); setShowDatePicker(false); }},
                  ].map(p => (
                    <TouchableOpacity key={p.label} onPress={p.fn} style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                    }}>
                      <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.foreground }}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>
    </Animated.View>
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  backButtonShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius["2xl"],
    overflow: "hidden",
  },
  blurContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)"
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
    alignItems: "flex-start",
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
    fontSize: 15,
    fontFamily: fonts.sans.semiBold,
    color: colors.foreground,
    marginBottom: 1,
  },
  productBrand: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.mutedForeground,
    marginBottom: 3,
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
