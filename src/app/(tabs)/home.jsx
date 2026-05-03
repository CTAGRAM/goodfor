import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Users,
  User,
  PlusCircle,
  ChevronDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Edit2,
  UserCheck,
  X,
  Bell,
  ChevronRight,
  ShieldCheck,
  ShoppingCart,
  Tag,
  PackageOpen,
} from "lucide-react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";
import { fetchAllRecalls } from "@/lib/recallService";
import { getOrCreateTodayBasket, getStreak, getScoreColor } from '@/lib/basketService';
import { scheduleShoppingReminder, requestNotificationPermission } from '@/lib/notificationService';
import { updateWidgetData } from '@/widgets/widgetSync';
import { StreakFlame } from '@/components/AnimatedEffects';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, activeFamilyMember, switchProfile, loading: profileLoading } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [recentScans, setRecentScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [stats, setStats] = useState({ safe: 0, review: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [recallCount, setRecallCount] = useState(0);
  const [basketData, setBasketData] = useState(null);
  const [streakData, setStreakData] = useState(null);

  useEffect(() => {
    if (profile) {
      loadFamilyMembers();
      loadRecentScans();
      // V5: Load recall alert count
      fetchAllRecalls().then(recalls => setRecallCount(recalls?.length || 0)).catch(() => { });
      // V8: Request permissions and schedule shopping reminders
      requestNotificationPermission().then(granted => {
        if (granted) scheduleShoppingReminder().catch(() => {});
      });
    }
  }, [profile]);

  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration: 400 });
      if (profile) {
        loadFamilyMembers();
        loadRecentScans();
        // V8: Load basket data
        loadBasketData();
      }
      return () => {
        opacity.value = 0;
      };
    }, [profile])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const loadBasketData = async () => {
    try {
      const [basket, streak] = await Promise.all([
        getOrCreateTodayBasket(profile?.id),
        getStreak(profile?.id),
      ]);
      setBasketData(basket);
      setStreakData(streak);
    } catch (e) {
      // Basket tables might not exist yet, fail silently
      console.log('[Home] Basket load error (tables may not exist):', e.message);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      console.log('[Home] Loading family members...');
      // Add timeout to prevent indefinite spinning
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Family load timeout')), 10000)
      );

      const queryPromise = supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) throw error;
      console.log('[Home] Family members loaded:', data?.length);
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('[Home] Error loading family members:', error);
    } finally {
      setLoadingFamily(false);
    }
  };

  const loadRecentScans = async () => {
    try {
      console.log('[Home] Loading recent scans...');
      setLoadingScans(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Scans load timeout')), 10000)
      );

      let query = supabase
        .from('scans')
        .select(`
          *,
          products (
            name,
            brand,
            image_url,
            category
          )
        `)
        .eq('user_id', profile.id);

      // Filter by active family member
      if (activeFamilyMember) {
        query = query.eq('family_member_id', activeFamilyMember.id);
      } else {
        query = query.is('family_member_id', null);
      }

      const { data, error } = await Promise.race([
        query.order('scanned_at', { ascending: false }),
        timeoutPromise
      ]);

      if (error) throw error;

      console.log('[Home] Scans loaded:', data?.length);

      const formatted = (data || []).map(scan => ({
        ...scan,
        product_name: scan.products?.name,
        product_brand: scan.products?.brand,
        product_image: scan.products?.image_url,
      }));

      setRecentScans(formatted.slice(0, 5)); // Top 5 for home

      // Calculate stats
      const safeCount = formatted.filter(s => s.safety_level === 'safe').length;
      const reviewCount = formatted.filter(s => s.safety_level === 'caution' || s.safety_level === 'avoid').length;

      setStats({ safe: safeCount, review: reviewCount });

      // Sync data to home screen widget
      updateWidgetData({
        safeCount,
        reviewCount,
        basketScore: streakData?.current_score || 0,
        recentProducts: formatted.slice(0, 3).map(s => ({
          name: s.product_name || 'Unknown',
          safety: s.safety_level || 'caution',
        })),
      });

    } catch (err) {
      console.error('[Home] Error loading scans:', err);
    } finally {
      setLoadingScans(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const displayProfile = activeFamilyMember ? {
    name: activeFamilyMember.name,
    avatar: activeFamilyMember.avatar_url,
    isFamily: true,
    id: activeFamilyMember.id
  } : {
    name: profile?.full_name || profile?.email?.split('@')[0] || 'User',
    avatar: profile?.avatar_url,
    isFamily: false,
    id: profile?.id
  };

  const handleProfilePress = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleSwitchProfile = async () => {
    setModalVisible(false);
    if (selectedMember) {
      if (activeFamilyMember?.id === selectedMember.id) return; // Already active
      await switchProfile(selectedMember.id);
    }
  };

  const handleEditProfile = () => {
    setModalVisible(false);
    if (selectedMember) {
      console.log('[Home] handleEditProfile selectedMember:', selectedMember);
      // V4 FIX: Route main user to edit-profile, family members to add-family-member
      if (selectedMember.isMain) {
        console.log('[Home] Routing to edit-profile (Main)');
        router.push('/edit-profile');
      } else {
        console.log('[Home] Routing to add-family-member with ID:', selectedMember.id);
        router.push({
          pathname: '/add-family-member',
          params: { memberId: selectedMember.id }
        });
      }
    }
  };

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, animatedStyle]}>
      <StatusBar style="dark" />

      {/* Background blurs */}
      <View
        style={{
          position: "absolute",
          top: -128,
          right: -128,
          width: 256,
          height: 256,
          backgroundColor: colors.accent,
          opacity: 0.4,
          borderRadius: 128,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 200,
          left: -96,
          width: 192,
          height: 192,
          backgroundColor: colors.chart1,
          opacity: 0.05,
          borderRadius: 96,
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Image
          source={{
            uri: "https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/onAkNUUAGm7/ai/GoodFor-1-x16DQfFL43Z.png",
          }}
          style={{ width: 120, height: 32 }}
          resizeMode="contain"
        />
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            onPress={() => displayProfile.isFamily
              ? router.push({ pathname: '/add-family-member', params: { memberId: displayProfile.id } })
              : router.push('/edit-profile')
            }
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: colors.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {displayProfile.avatar ? (
              <Image
                source={{ uri: displayProfile.avatar }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Text style={{ fontSize: 18, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                {getInitials(displayProfile.name)}
              </Text>
            )}
          </TouchableOpacity>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              backgroundColor: colors.chart1,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{ width: 6, height: 6, backgroundColor: colors.card }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedForeground,
              marginBottom: 4,
            }}
          >
            {getGreeting()},
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontFamily: "Rubik_800ExtraBold",
              color: colors.foreground,
            }}
          >
            {displayProfile.name}
          </Text>
        </View>

        {/* V8: Smart Basket Card — with live data (top of hierarchy) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/basket')}
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1.5,
            borderColor: `${colors.primary}20`,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}>
              <ShoppingCart size={20} color={colors.primaryForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Rubik_700Bold', color: colors.foreground }}>
                Smart Basket
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, marginTop: 1 }}>
                {basketData?.basket_items?.length > 0
                  ? `${basketData.basket_items.length} items today`
                  : 'Build your basket & track your score'}
              </Text>
            </View>
            {basketData?.score > 0 ? (
              <View style={{
                backgroundColor: `${getScoreColor(basketData.score)}15`,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 18, fontFamily: 'Rubik_700Bold', color: getScoreColor(basketData.score) }}>
                  {basketData.score}
                </Text>
                <Text style={{ fontSize: 9, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground }}>/100</Text>
              </View>
            ) : (
              <View style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}>
                <Text style={{ fontSize: 11, fontFamily: 'Rubik_600SemiBold', color: '#FFF' }}>
                  Start →
                </Text>
              </View>
            )}
          </View>
          {/* Streak badge */}
          {streakData?.current_streak > 0 && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              marginTop: 10, paddingTop: 10,
              borderTopWidth: 1, borderTopColor: `${colors.border}30`,
            }}>
              <StreakFlame size={22} />
              <Text style={{ fontSize: 12, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
                {streakData.current_streak} week streak
              </Text>
              <Text style={{ fontSize: 11, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground }}>
                • Avg {streakData.average_score}/100
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Active Profiles Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background blur */}
          <View
            style={{
              position: "absolute",
              top: -64,
              right: -64,
              width: 128,
              height: 128,
              backgroundColor: colors.accent,
              opacity: 0.3,
              borderRadius: 64,
            }}
          />

          <View style={{ position: "relative", zIndex: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Rubik_700Bold",
                }}
              >
                Active Profiles
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/add-family-member')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlusCircle size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>

            {loadingFamily ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : familyMembers.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              >
                {/* Main Profile */}
                <TouchableOpacity
                  onPress={() => handleProfilePress({ id: 'main', name: profile?.full_name || 'Main', isMain: true })}
                  style={{ alignItems: "center", gap: 8, minWidth: 80 }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: !activeFamilyMember ? colors.primary : colors.muted,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      borderWidth: !activeFamilyMember ? 3 : 0,
                      borderColor: colors.primary,
                      overflow: 'hidden'
                    }}
                  >
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                        {getInitials(profile?.full_name || profile?.email)}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 12, fontFamily: "Rubik_600SemiBold", color: colors.foreground }}>
                      {profile?.full_name?.split(' ')[0] || 'Me'}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                      Main
                    </Text>
                  </View>
                </TouchableOpacity>

                {familyMembers.map((member) => {
                  const isActive = activeFamilyMember?.id === member.id;
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => handleProfilePress(member)}
                      style={{ alignItems: "center", gap: 8, minWidth: 80 }}
                    >
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: isActive ? colors.primary : colors.muted,
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          borderWidth: isActive ? 3 : 0,
                          borderColor: colors.primary,
                          overflow: 'hidden'
                        }}
                      >
                        {member.avatar_url ? (
                          <Image source={{ uri: member.avatar_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                            {getInitials(member.name)}
                          </Text>
                        )}
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: "Rubik_600SemiBold",
                            color: colors.foreground,
                          }}
                        >
                          {member.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: colors.mutedForeground,
                          }}
                        >
                          {member.age_group || 'Adult'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Add Profile Button */}
                <TouchableOpacity
                  onPress={() => router.push('/add-family-member')}
                  style={{ alignItems: "center", gap: 8, minWidth: 80 }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 2,
                      borderColor: colors.border,
                      borderStyle: "dashed",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.secondary,
                    }}
                  >
                    <PlusCircle size={24} color={colors.mutedForeground} />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                    }}
                  >
                    Add Profile
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              // Empty state
              <TouchableOpacity
                onPress={() => router.push('/add-family-member')}
                style={{ alignItems: 'center', paddingVertical: 20 }}
              >
                <Users size={32} color={colors.mutedForeground} />
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
                  No family profiles yet. Add one to get started!
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recent Scans */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Rubik_700Bold",
                color: colors.foreground,
              }}
            >
              Recent Scans
            </Text>
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Rubik_600SemiBold",
                  color: colors.primary,
                }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {loadingScans ? (
            <ActivityIndicator color={colors.primary} />
          ) : recentScans.length === 0 ? (
            /* Empty state for recent scans */
            <View style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Info size={32} color={colors.mutedForeground} />
              <Text style={{
                fontSize: 14,
                color: colors.mutedForeground,
                marginTop: 12,
                textAlign: 'center',
              }}>
                Scan your first product to see it here
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {recentScans.map((scan) => (
                <TouchableOpacity
                  key={scan.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    padding: 12,
                    borderRadius: 16,
                    gap: 12
                  }}
                  onPress={() => {
                      const products = scan.products || {};
                      const ingredients = products.ingredients || {};
                      const nutritionFacts = products.nutrition_facts || {};
                      const safetyDetails = scan.safety_details || {};
                      
                      const productSummaryData = {
                          barcode: scan.barcode || products.barcode || '',
                          name: products.name || scan.product_name || 'Unknown',
                          brand: products.brand || scan.product_brand || '',
                          imageUrl: products.image_url || scan.product_image || null,
                          ingredientsText: ingredients.text || '',
                          allergens: ingredients.allergens || [],
                          additives: ingredients.additives || [],
                          traces: ingredients.traces || [],
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
                          categories: products.category ? [products.category] : [],
                          safetyAnalysis: {
                              safety: scan.safety_level || 'safe',
                              safeScore: scan.safety_score || 50,
                              issues: safetyDetails.issues || [],
                              ageGroup: safetyDetails.ageGroup,
                              ageAppropriate: safetyDetails.ageAppropriate !== false,
                              nutriScore: safetyDetails.nutriScore || null,
                              hasPersonalAllergenMatch: (safetyDetails.issues || []).some(i => i.type === 'personal_allergen'),
                          },
                          nutriScore: safetyDetails.nutriScore?.grade || null,
                          novaGroup: safetyDetails.novaGroup?.group || null,
                          ecoScore: safetyDetails.ecoScore?.grade || null,
                      };
                      
                      router.push({
                        pathname: '/product-summary',
                        params: { productData: JSON.stringify(productSummaryData) }
                      });
                  }}
                >
                  {/* Column 1: Product Image */}
                  <View style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#f0f0f0' }}>
                    {scan.product_image ? (
                      <Image source={{ uri: scan.product_image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: `${scan.safety_level === 'safe' ? colors.chart1 : colors.mutedForeground}10` }}>
                        <PackageOpen size={24} color={scan.safety_level === 'safe' ? colors.chart1 : colors.mutedForeground} />
                      </View>
                    )}
                  </View>

                  {/* Column 2: Details & Metadata Badges */}
                  <View style={{ flex: 1, paddingHorizontal: 14, justifyContent: 'center' }}>
                    
                    {/* Name */}
                    <Text style={{ fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }} numberOfLines={1}>
                      {scan.product_name || 'Unknown Product'}
                    </Text>
                    
                    {/* Brand & Date */}
                    <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 1 }} numberOfLines={1}>
                      {scan.product_brand ? `${scan.product_brand} • ` : ''}{new Date(scan.scanned_at).toLocaleDateString()}
                    </Text>

                    {/* Inline Badges (Nutri-Score & NOVA) properly nested below text */}
                    {(() => {
                      const sd = scan.safety_details || {};
                      const nutriGrade = sd.nutriScore?.grade || null;
                      const novaGroup = sd.novaGroup?.group || null;
                      if (!nutriGrade && !novaGroup) return null;
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                          {nutriGrade && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={{ fontSize: 9, fontFamily: 'Rubik_700Bold', color: colors.mutedForeground }}>NUTRI</Text>
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
                                        fontFamily: 'Rubik_700Bold',
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
                              <Text style={{ fontSize: 9, fontFamily: 'Rubik_700Bold', color: colors.mutedForeground }}>NOVA</Text>
                              <View style={{
                                width: 14, height: 14, borderRadius: 3,
                                backgroundColor: novaGroup <= 1 ? '#038141' : novaGroup <= 2 ? '#85BB2F' : novaGroup <= 3 ? '#EE8100' : '#E63E11',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Text style={{ fontSize: 9, fontFamily: 'Rubik_700Bold', color: '#FFF' }}>{novaGroup}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })()}

                  </View>

                  {/* Column 3: The Primary Safety Verdict */}
                  {(() => {
                    const safetyColor = scan.safety_level === 'safe' ? colors.chart1 : scan.safety_level === 'caution' ? colors.chart2 : colors.chart3;
                    return (
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                        <View style={{ 
                          flexDirection: 'row', alignItems: 'center', gap: 5,
                          backgroundColor: `${safetyColor}12`,
                          paddingHorizontal: 8, paddingVertical: 4,
                          borderRadius: 8,
                        }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: safetyColor }} />
                          <Text style={{ fontSize: 13, fontFamily: 'Rubik_700Bold', color: safetyColor }}>
                            {scan.safety_score ? `${scan.safety_score} ` : ''}{scan.safety_level === 'safe' ? 'GOOD' : scan.safety_level?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Safety Summary */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Rubik_700Bold",
              marginBottom: 16,
            }}
          >
            Safety Summary
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Safe Products — left card */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                padding: 16,
                backgroundColor: colors.card,
                borderRadius: 16,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${colors.chart1}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={20} color={colors.chart1} />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: "Rubik_700Bold",
                  color: colors.foreground,
                }}
              >
                {stats.safe}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                }}
              >
                Good Products
              </Text>
            </View>

            {/* Warning Products — right card */}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                padding: 16,
                backgroundColor: colors.card,
                borderRadius: 16,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${colors.chart3}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={20} color={colors.chart3} />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: "Rubik_700Bold",
                  color: colors.foreground,
                }}
              >
                {stats.review}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                }}
              >
                Products to Review
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Deals Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/weekly-offers')}
          style={{
            backgroundColor: '#F0FDF4',
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1.5,
            borderColor: '#BBF7D0',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: '#22C55E',
              alignItems: 'center',
              justifyContent: 'center', marginRight: 14,
            }}>
              <Tag size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Rubik_700Bold', color: colors.foreground }}>
                Weekly Deals
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, marginTop: 1 }}>
                Curated offers from top UK supermarkets
              </Text>
            </View>
            <View style={{
              backgroundColor: '#22C55E',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{ fontSize: 11, fontFamily: 'Rubik_600SemiBold', color: '#FFF' }}>
                Browse →
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recall Alerts — bottom of hierarchy per client request */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/alerts')}
          style={{
            backgroundColor: recallCount > 0 ? `${colors.primary}0A` : colors.card,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1.5,
            borderColor: recallCount > 0 ? `${colors.primary}20` : colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: recallCount > 0 ? colors.primary : colors.chart1,
              alignItems: 'center',
              justifyContent: 'center', marginRight: 14,
            }}>
              {recallCount > 0 ? (
                <Bell size={20} color={colors.primaryForeground} />
              ) : (
                <ShieldCheck size={20} color="#FFF" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Rubik_700Bold', color: colors.foreground }}>
                {recallCount > 0
                  ? `${recallCount} Recall ${recallCount === 1 ? 'Alert' : 'Alerts'}`
                  : 'Safety Monitor'
                }
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, marginTop: 1 }}>
                {recallCount > 0
                  ? 'Product safety alerts near you'
                  : 'No active alerts — all clear ✓'
                }
              </Text>
            </View>
            <View style={{
              backgroundColor: recallCount > 0 ? colors.primary : colors.chart1,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{ fontSize: 11, fontFamily: 'Rubik_600SemiBold', color: '#FFF' }}>
                {recallCount > 0 ? 'View →' : 'Check →'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Profile Action Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              width: '80%',
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 10
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.foreground }}>
                {selectedMember?.name || 'Profile Actions'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              {/* Switch Profile Option */}
              <TouchableOpacity
                onPress={handleSwitchProfile}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  backgroundColor: (activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                    ? `${colors.primary}10`
                    : colors.background,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: (activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                    ? colors.primary
                    : colors.border
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: (activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                    ? colors.primary
                    : colors.muted,
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <UserCheck size={20} color={(activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain) ? colors.primaryForeground : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
                    Switch Profile
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {(activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                      ? 'Currently Active'
                      : 'Switch to this profile'}
                  </Text>
                </View>
                {((activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)) && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Edit Profile Option */}
              <TouchableOpacity
                onPress={handleEditProfile}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  backgroundColor: colors.background,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.secondary}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={20} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
                    Edit Profile
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    Update details & settings
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}
