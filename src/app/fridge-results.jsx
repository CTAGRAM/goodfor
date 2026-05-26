import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  ShoppingCart,
  Plus,
  ChevronRight,
  UtensilsCrossed,
  Leaf,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { analyzeFridge, saveFridgeScan, addMissingItemsToBasket } from '@/lib/fridgeService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEAL_CARD_WIDTH = 180;

export default function FridgeResults() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { imageBase64, mimeType, mode } = useLocalSearchParams();
  const { profile } = useAuth();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [addingAll, setAddingAll] = useState(false);
  const [addedItems, setAddedItems] = useState({});

  // Loading animation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);
  const loadingTextIndex = useSharedValue(0);

  const [loadingText, setLoadingText] = useState('Analyzing your fridge...');

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.6, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (!loading) return;
    const texts = [
      'Analyzing your fridge...',
      'Identifying ingredients...',
      'Finding recipes...',
      'Calculating nutrition score...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    if (imageBase64) {
      runAnalysis();
    }
  }, [imageBase64]);

  const runAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyzeFridge(imageBase64, mimeType || 'image/jpeg', profile?.id);
      setResults(data);

      // Auto-save scan
      try {
        await saveFridgeScan(profile?.id, { ...data, scan_mode: mode || 'fridge' });
      } catch (saveErr) {
        console.log('[FridgeResults] Failed to save scan (table may not exist):', saveErr.message);
      }
    } catch (err) {
      console.error('[FridgeResults] Analysis error:', err);
      setError(err.message || 'Failed to analyze fridge');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (item, index) => {
    try {
      await addMissingItemsToBasket(profile?.id, [item]);
      setAddedItems(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      showAlert('Error', 'Failed to add item. Please try again.');
    }
  };

  const handleAddAllItems = async () => {
    if (!results?.missing_items?.length) return;
    try {
      setAddingAll(true);
      await addMissingItemsToBasket(profile?.id, results.missing_items);
      const allAdded = {};
      results.missing_items.forEach((_, i) => { allAdded[i] = true; });
      setAddedItems(allAdded);
      showAlert('Added!', 'All missing items have been added to your pantry.');
    } catch (err) {
      showAlert('Error', 'Failed to add items. Please try again.');
    } finally {
      setAddingAll(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return colors.chart1;
    if (score >= 40) return colors.chart2;
    return colors.chart3;
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Great! You can make nutritious meals ✨';
    if (score >= 60) return 'Good variety of ingredients!';
    if (score >= 40) return 'Some healthy options available';
    return 'Consider adding more variety';
  };

  const getMatchColor = (quality) => {
    if (quality?.includes('Excellent')) return colors.chart1;
    if (quality?.includes('High')) return colors.primary;
    return colors.chart2;
  };

  // ── Loading State ──
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="dark" />
        <Animated.View
          style={[
            {
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: `${colors.primary}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
            },
            pulseStyle,
          ]}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.primary}25`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={32} color={colors.primary} />
          </View>
        </Animated.View>
        <Text style={{ fontSize: 18, fontFamily: 'Rubik_700Bold', color: colors.foreground, marginBottom: 8 }}>
          {loadingText}
        </Text>
        <Text style={{ fontSize: 13, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground }}>
          This usually takes 10-15 seconds
        </Text>
      </View>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <StatusBar style="dark" />
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${colors.chart3}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <AlertCircle size={36} color={colors.chart3} />
        </View>
        <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.foreground, marginBottom: 8, textAlign: 'center' }}>
          Analysis Failed
        </Text>
        <Text style={{ fontSize: 14, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, textAlign: 'center', lineHeight: 21, marginBottom: 28 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={runAnalysis}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 9999,
          }}
        >
          <RefreshCw size={18} color={colors.primaryForeground} />
          <Text style={{ fontSize: 15, fontFamily: 'Rubik_600SemiBold', color: colors.primaryForeground }}>
            Try Again
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Rubik_500Medium', color: colors.primary }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Results ──
  const scoreColor = getScoreColor(results?.score || 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.card,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08, shadowRadius: 4,
          }}
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
          Fridge Results
        </Text>
        <TouchableOpacity
          onPress={runAnalysis}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.card,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08, shadowRadius: 4,
          }}
        >
          <RefreshCw size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Score Hero ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginBottom: 12,
            }}
          >
            {/* Score Circle */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                borderWidth: 4,
                borderColor: scoreColor,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${scoreColor}10`,
                shadowColor: scoreColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 24, fontFamily: 'Rubik_800ExtraBold', color: scoreColor }}>
                {results?.score || 0}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: 'Rubik_500Medium', color: colors.mutedForeground, marginTop: -2 }}>
                /100
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontFamily: 'Rubik_700Bold', color: colors.foreground, marginBottom: 4 }}>
                {getScoreMessage(results?.score || 0)}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground }}>
                {results?.ingredients_detected || 0} ingredients detected
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground }}>
                {results?.sub_message || 'High potential for healthy, balanced meals'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Boost Banner ── */}
        {results?.missing_items?.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderRadius: 14,
                padding: 14,
                gap: 10,
                borderWidth: 1,
                borderColor: `${colors.border}50`,
              }}
            >
              <TrendingUp size={18} color={colors.chart1} />
              <Text style={{ flex: 1, fontSize: 13, fontFamily: 'Rubik_500Medium', color: colors.foreground }}>
                Add the missing items to boost your score.
              </Text>
            </View>
          </View>
        )}

        {/* ── Meals Section ── */}
        {results?.meals?.length > 0 && (
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontFamily: 'Rubik_700Bold', color: colors.foreground }}>
                Meals you can make
              </Text>
              <TouchableOpacity>
                <Text style={{ fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: colors.primary }}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              data={results.meals}
              keyExtractor={(_, i) => `meal-${i}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{
                    width: MEAL_CARD_WIDTH,
                    backgroundColor: colors.card,
                    borderRadius: 18,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    borderWidth: 1,
                    borderColor: `${colors.border}40`,
                  }}
                >
                  {/* Image Placeholder */}
                  <View
                    style={{
                      height: 130,
                      backgroundColor: `${colors.primary}08`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <UtensilsCrossed size={32} color={`${colors.primary}40`} />

                    {/* Score Badge */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: getScoreColor(item.score || 70),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: 'Rubik_700Bold', color: '#FFF' }}>
                        {item.score || 0}
                      </Text>
                    </View>

                    {/* Cook Time */}
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Clock size={11} color="#FFF" />
                      <Text style={{ fontSize: 11, fontFamily: 'Rubik_500Medium', color: '#FFF' }}>
                        {item.cook_time_minutes || 20} min
                      </Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={{ padding: 12 }}>
                    <Text
                      style={{ fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: colors.foreground, marginBottom: 6 }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                      {item.match_quality && (
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: getMatchColor(item.match_quality),
                          }}
                        >
                          <Text style={{ fontSize: 10, fontFamily: 'Rubik_600SemiBold', color: getMatchColor(item.match_quality) }}>
                            {item.match_quality}
                          </Text>
                        </View>
                      )}
                      {item.tags?.slice(0, 1).map((tag, ti) => (
                        <Text key={ti} style={{ fontSize: 10, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, marginTop: 2 }}>
                          • {tag}
                        </Text>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Missing Items Section ── */}
        {results?.missing_items?.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <ShoppingCart size={18} color={colors.foreground} />
              <Text style={{ fontSize: 16, fontFamily: 'Rubik_700Bold', color: colors.foreground }}>
                Missing items to make top recipes
              </Text>
            </View>

            {/* Column Headers */}
            <View style={{ flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderColor: `${colors.border}40`, marginBottom: 4 }}>
              <Text style={{ flex: 2, fontSize: 11, fontFamily: 'Rubik_500Medium', color: colors.mutedForeground }}>Item</Text>
              <Text style={{ flex: 2, fontSize: 11, fontFamily: 'Rubik_500Medium', color: colors.mutedForeground }}>Why it's needed</Text>
              <Text style={{ flex: 1.5, fontSize: 11, fontFamily: 'Rubik_500Medium', color: colors.mutedForeground, textAlign: 'right' }}>Impact on score</Text>
              <View style={{ width: 36 }} />
            </View>

            {results.missing_items.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < results.missing_items.length - 1 ? 1 : 0,
                  borderColor: `${colors.border}30`,
                }}
              >
                {/* Item */}
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: `${colors.chart1}12`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Leaf size={16} color={colors.chart1} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground }}>
                      {item.quantity}
                    </Text>
                  </View>
                </View>

                {/* Why Needed */}
                <Text style={{ flex: 2, fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, paddingHorizontal: 4 }} numberOfLines={2}>
                  {item.why_needed}
                </Text>

                {/* Impact */}
                <View style={{ flex: 1.5, alignItems: 'flex-end', paddingRight: 4 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Rubik_700Bold', color: colors.chart1 }}>
                    +{item.impact_points} points
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Rubik_400Regular', color: colors.chart1 }}>
                    {item.impact_label || 'Good for you'}
                  </Text>
                </View>

                {/* Add Button */}
                <TouchableOpacity
                  onPress={() => handleAddItem(item, index)}
                  disabled={addedItems[index]}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: addedItems[index] ? `${colors.chart1}15` : colors.card,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: addedItems[index] ? 0 : 1,
                    borderColor: `${colors.border}60`,
                    marginLeft: 4,
                  }}
                >
                  {addedItems[index] ? (
                    <Check size={16} color={colors.chart1} />
                  ) : (
                    <Plus size={16} color={colors.foreground} />
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {/* Add All Button */}
            <TouchableOpacity
              onPress={handleAddAllItems}
              disabled={addingAll || Object.keys(addedItems).length === results.missing_items.length}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 14,
                marginTop: 8,
              }}
            >
              <ShoppingCart size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: colors.primary }}>
                {addingAll ? 'Adding...' : 'Add all missing items to basket'}
              </Text>
              {!addingAll && <Plus size={16} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Score Boost Card ── */}
        {results?.potential_score > (results?.score || 0) && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderRadius: 18,
                padding: 16,
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                borderWidth: 1,
                borderColor: `${colors.border}40`,
              }}
            >
              {/* Small Score Circle */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 3,
                  borderColor: scoreColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Rubik_800ExtraBold', color: scoreColor }}>
                  {results?.score || 0}
                </Text>
                <Text style={{ fontSize: 7, fontFamily: 'Rubik_500Medium', color: colors.mutedForeground, marginTop: -1 }}>
                  /100
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
                  Add missing items to boost your score
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, marginTop: 2 }}>
                  Potential score: <Text style={{ fontFamily: 'Rubik_700Bold', color: colors.chart1 }}>{results?.potential_score || 0}/100</Text>
                </Text>
              </View>

              <ChevronRight size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Detected Ingredients Summary ── */}
        {results?.ingredients?.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontFamily: 'Rubik_700Bold', color: colors.foreground, marginBottom: 12 }}>
              Detected Ingredients
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {results.ingredients.map((ing, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: `${colors.border}50`,
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: 'Rubik_500Medium', color: colors.foreground }}>
                    {ing.name}
                  </Text>
                  {ing.quantity && (
                    <Text style={{ fontSize: 10, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, marginTop: 1 }}>
                      {ing.quantity}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
