import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Clock,
  Sparkles,
  Shield,
  ImageIcon,
  UtensilsCrossed,
  ChevronRight,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/theme';
import { useAlert } from '@/contexts/AlertContext';

export default function FridgeScanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async (mode = 'fridge') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Camera Permission Required',
          'Please allow camera access to scan your fridge.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        router.push({
          pathname: '/fridge-results',
          params: {
            imageBase64: result.assets[0].base64,
            mimeType: 'image/jpeg',
            mode,
          },
        });
      }
    } catch (err) {
      console.error('[FridgeScanner] Camera error:', err);
      showAlert('Error', 'Failed to open camera. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromGallery = async (mode = 'fridge') => {
    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        router.push({
          pathname: '/fridge-results',
          params: {
            imageBase64: result.assets[0].base64,
            mimeType: 'image/jpeg',
            mode,
          },
        });
      }
    } catch (err) {
      console.error('[FridgeScanner] Gallery error:', err);
      showAlert('Error', 'Failed to open gallery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          }}
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
          Fridge & Meal Scanner
        </Text>

        <TouchableOpacity
          onPress={() => {
            showAlert('Coming Soon', 'Scan history will be available in a future update.');
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          }}
        >
          <Clock size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Text */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'Rubik_800ExtraBold',
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            See what you can make
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Rubik_400Regular',
              color: colors.mutedForeground,
              textAlign: 'center',
              lineHeight: 21,
              paddingHorizontal: 16,
            }}
          >
            Snap a photo of your fridge or meal.{'\n'}We'll find ingredients, recipe ideas{'\n'}and missing items.
          </Text>
        </View>

        {/* Info Banner */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: `${colors.accent}90`,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: `${colors.primary}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color={colors.primary} />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: 'Rubik_500Medium',
              color: colors.foreground,
              lineHeight: 19,
            }}
          >
            We'll also suggest missing items to add to your basket. All suggestions are personalised for your dietary preferences, health goals and family.
          </Text>
        </View>

        {/* Camera Preview Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleTakePhoto('fridge')}
          disabled={loading}
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            marginBottom: 20,
            height: 280,
            backgroundColor: colors.primary,
            position: 'relative',
          }}
        >
          {/* Gradient overlay pattern */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: `${colors.primary}E6`,
              zIndex: 1,
            }}
          />
          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: `${colors.chart1}20`,
              zIndex: 2,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -20,
              left: -20,
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: `${colors.accent}15`,
              zIndex: 2,
            }}
          />

          {/* Content */}
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
              padding: 24,
            }}
          >
            {loading ? (
              <ActivityIndicator size="large" color={colors.primaryForeground} />
            ) : (
              <>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.25)',
                  }}
                >
                  <Camera size={32} color={colors.primaryForeground} />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'Rubik_700Bold',
                    color: colors.primaryForeground,
                    marginBottom: 6,
                  }}
                >
                  Tap to take a photo
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Rubik_400Regular',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Make sure everything is clearly visible
                </Text>
              </>
            )}
          </View>

          {/* Corner brackets */}
          <View style={{ position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderColor: 'rgba(255,255,255,0.4)', borderTopLeftRadius: 8, zIndex: 4 }} />
          <View style={{ position: 'absolute', top: 20, right: 20, width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.4)', borderTopRightRadius: 8, zIndex: 4 }} />
          <View style={{ position: 'absolute', bottom: 20, left: 20, width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: 'rgba(255,255,255,0.4)', borderBottomLeftRadius: 8, zIndex: 4 }} />
          <View style={{ position: 'absolute', bottom: 20, right: 20, width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.4)', borderBottomRightRadius: 8, zIndex: 4 }} />
        </TouchableOpacity>

        {/* Two Option Cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {/* Fridge Photo Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleTakePhoto('fridge')}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: `${colors.border}60`,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: `${colors.primary}10`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <ImageIcon size={24} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 15, fontFamily: 'Rubik_700Bold', color: colors.foreground, marginBottom: 4 }}>
              Fridge Photo
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, textAlign: 'center' }}>
              See what you can cook
            </Text>
          </TouchableOpacity>

          {/* Meal Photo Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleTakePhoto('meal')}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: `${colors.border}60`,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: `${colors.primary}10`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <UtensilsCrossed size={24} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 15, fontFamily: 'Rubik_700Bold', color: colors.foreground, marginBottom: 4 }}>
              Meal Photo
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground, textAlign: 'center' }}>
              Get recipe ideas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gallery Option */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePickFromGallery('fridge')}
          disabled={loading}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: `${colors.border}60`,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: `${colors.primary}10`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
                Choose from Gallery
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Rubik_400Regular', color: colors.mutedForeground }}>
                Upload an existing photo
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Privacy Notice */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 8,
            paddingVertical: 12,
          }}
        >
          <Shield size={16} color={colors.chart1} />
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              fontFamily: 'Rubik_400Regular',
              color: colors.mutedForeground,
              lineHeight: 18,
            }}
          >
            Your photos are private and secure. We only use your photos to generate insights.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
