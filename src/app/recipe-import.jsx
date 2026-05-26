import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import * as ExpoClipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Link as LinkIcon,
  Camera,
  Image as ImageIcon,
  ArrowRight,
  X,
  Clipboard,
  BookOpen,
  ChefHat,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";

import { colors, fonts, spacing, radius, shadows } from "@/constants/theme";
import { importRecipeFromUrl, importRecipeFromScreenshot, saveRecipe } from "@/lib/recipeService";
import { useAuth } from "@/contexts/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─────────────────────────────────────────────
// Quiet source badges
// ─────────────────────────────────────────────
const SOURCES = [
  { label: "TikTok" },
  { label: "Instagram" },
  { label: "YouTube" },
  { label: "Blogs" },
  { label: "Cookbooks" },
];

export default function RecipeImport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [urlFocused, setUrlFocused] = useState(false);

  // ── Loading animation ──────────────────────
  const progress = useSharedValue(0);
  const dotPulse = useSharedValue(0);

  useEffect(() => {
    if (!isProcessing) return;

    progress.value = 0;
    progress.value = withTiming(0.88, {
      duration: 14000,
      easing: Easing.out(Easing.cubic),
    });

    dotPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    const t1 = setTimeout(() => setProcessingStage(1), 3000);
    const t2 = setTimeout(() => setProcessingStage(2), 7000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isProcessing]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dotPulse.value, [0, 1], [0.3, 1]),
  }));

  const STAGE_MESSAGES = [
    "Reading the page",
    "Pulling out ingredients & steps",
    "Building your recipe",
  ];

  // ── Handlers ─────────────────────────────
  const handlePaste = async () => {
    try {
      const text = await ExpoClipboard.getStringAsync();
      if (text && text.startsWith("http")) {
        setUrl(text);
        inputRef.current?.blur();
      } else {
        Alert.alert("Nothing to paste", "Copy a recipe link first.");
      }
    } catch {
      Alert.alert("Couldn't paste", "We weren't able to read your clipboard.");
    }
  };

  const handleUrlImport = async () => {
    if (!url || !url.startsWith("http")) {
      Alert.alert("Not a valid link", "Paste a URL starting with http:// or https://");
      return;
    }
    try {
      setIsProcessing(true);
      setProcessingStage(0);
      const recipeData = await importRecipeFromUrl(url, user?.id);
      const savedRecipe = await saveRecipe(recipeData);
      setIsProcessing(false);
      router.replace({ pathname: "/recipe-detail", params: { id: savedRecipe.id } });
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Import failed", error.message || "We couldn't extract a recipe from that link.");
    }
  };

  const handleImageImport = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Camera access needed", "We need your camera to scan recipes.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Photo access needed", "We need access to your photo library.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          base64: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        setIsProcessing(true);
        setProcessingStage(0);
        const asset = result.assets[0];
        const mimeType = asset.mimeType || (asset.uri.endsWith(".png") ? "image/png" : "image/jpeg");
        const recipeData = await importRecipeFromScreenshot(asset.base64, mimeType, user?.id);
        const savedRecipe = await saveRecipe(recipeData);
        setIsProcessing(false);
        router.replace({ pathname: "/recipe-detail", params: { id: savedRecipe.id } });
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Import failed", error.message || "We couldn't read a recipe from that image.");
    }
  };

  // ═══════════════════════════════════════════
  //  Processing state — calm, editorial feel
  // ═══════════════════════════════════════════
  if (isProcessing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style="dark" />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 48,
          }}
        >
          {/* Small icon */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "center",
              marginBottom: 28,
            }}
          >
            <BookOpen size={22} color="#FFF" />
          </View>

          {/* Stage text */}
          <Text
            style={{
              fontSize: 18,
              fontFamily: fonts.sansBold,
              color: colors.foreground,
              textAlign: "center",
              letterSpacing: -0.3,
              marginBottom: 4,
            }}
          >
            {STAGE_MESSAGES[processingStage] || STAGE_MESSAGES[0]}
            <Animated.Text style={[{ color: colors.mutedForeground }, dotStyle]}>
              {" …"}
            </Animated.Text>
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.sans,
              color: colors.mutedForeground,
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 32,
            }}
          >
            Usually takes about 5–10 seconds
          </Text>

          {/* Progress bar */}
          <View
            style={{
              height: 3,
              backgroundColor: colors.border,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                {
                  height: "100%",
                  backgroundColor: colors.primary,
                  borderRadius: 2,
                },
                progressBarStyle,
              ]}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setIsProcessing(false)}
          style={{
            alignSelf: "center",
            paddingVertical: 14,
            paddingHorizontal: 24,
            marginBottom: insets.bottom + 28,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.sansMedium,
              color: colors.mutedForeground,
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ═══════════════════════════════════════════
  //  Main screen — editorial layout
  // ═══════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 4,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} color={colors.foreground} strokeWidth={2} />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 15,
            fontFamily: fonts.sansSemiBold,
            color: colors.foreground,
            letterSpacing: -0.2,
          }}
        >
          Import recipe
        </Text>

        {/* Spacer for centering */}
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Headline ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(60)}
          style={{ marginTop: 24, marginBottom: 36 }}
        >
          <Text
            style={{
              fontSize: 28,
              fontFamily: fonts.sansBold,
              color: colors.foreground,
              lineHeight: 34,
              letterSpacing: -0.6,
            }}
          >
            Save a recipe{"\n"}from anywhere
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: fonts.sans,
              color: colors.mutedForeground,
              marginTop: 10,
              lineHeight: 22,
            }}
          >
            Paste a link or snap a photo — we'll turn it into{"\n"}
            a recipe card with ingredients and steps.
          </Text>
        </Animated.View>

        {/* ── URL Input ── */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: urlFocused ? colors.primary : colors.border,
              paddingLeft: 14,
              paddingRight: 6,
              height: 52,
            }}
          >
            <LinkIcon
              size={16}
              color={urlFocused ? colors.primary : colors.mutedForeground}
              strokeWidth={2.5}
              style={{ marginRight: 10 }}
            />
            <TextInput
              ref={inputRef}
              style={{
                flex: 1,
                height: "100%",
                fontSize: 15,
                fontFamily: fonts.sansMedium,
                color: colors.foreground,
              }}
              placeholder="Paste a recipe link"
              placeholderTextColor={`${colors.mutedForeground}80`}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={handleUrlImport}
              onFocus={() => setUrlFocused(true)}
              onBlur={() => setUrlFocused(false)}
            />
            {url.length > 0 ? (
              <TouchableOpacity
                onPress={() => setUrl("")}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: `${colors.mutedForeground}10`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 4,
                }}
              >
                <X size={13} color={colors.mutedForeground} strokeWidth={2.5} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handlePaste}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: `${colors.primary}08`,
                  marginLeft: 4,
                }}
              >
                <Clipboard size={12} color={colors.primary} strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.sansSemiBold,
                    color: colors.primary,
                  }}
                >
                  Paste
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Import button */}
          <TouchableOpacity
            onPress={handleUrlImport}
            disabled={!url}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 50,
              borderRadius: 14,
              backgroundColor: url ? colors.primary : colors.border,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: fonts.sansBold,
                color: url ? colors.primaryForeground : colors.mutedForeground,
              }}
            >
              {url ? "Import recipe" : "Paste a link to start"}
            </Text>
            {url ? (
              <ArrowRight size={16} color={colors.primaryForeground} strokeWidth={2.5} />
            ) : null}
          </TouchableOpacity>
        </Animated.View>

        {/* ── Divider ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(240)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 28,
            marginBottom: 24,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text
            style={{
              marginHorizontal: 16,
              fontSize: 12,
              fontFamily: fonts.sansMedium,
              color: colors.mutedForeground,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Or scan
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </Animated.View>

        {/* ── Media cards ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(320)}
          style={{ flexDirection: "row", gap: 12 }}
        >
          {/* Screenshot */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleImageImport(false)}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#FDF6EC",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <ImageIcon size={20} color="#C8922A" strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontFamily: fonts.sansBold,
                color: colors.foreground,
                marginBottom: 3,
              }}
            >
              Screenshot
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sans,
                color: colors.mutedForeground,
                lineHeight: 17,
              }}
            >
              Pick from your library
            </Text>
          </TouchableOpacity>

          {/* Camera */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleImageImport(true)}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: `${colors.chart1}0D`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Camera size={20} color={colors.chart1} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontFamily: fonts.sansBold,
                color: colors.foreground,
                marginBottom: 3,
              }}
            >
              Scan page
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sans,
                color: colors.mutedForeground,
                lineHeight: 17,
              }}
            >
              Cookbook or recipe card
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Works with ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={{ marginTop: 36 }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: fonts.sansMedium,
              color: `${colors.mutedForeground}90`,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Works with
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {SOURCES.map((s) => (
              <View
                key={s.label}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.sansMedium,
                    color: colors.foreground,
                  }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Footer note ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(480)}
          style={{ marginTop: 32, paddingHorizontal: 8 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sans,
              color: `${colors.mutedForeground}70`,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            Recipes are private to your account. We extract{"\n"}
            ingredients, steps, and nutrition automatically.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
