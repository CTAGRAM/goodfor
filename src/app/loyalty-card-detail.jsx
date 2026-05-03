import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, ArrowLeft, Trash2, Pencil, Store, ShoppingCart, Coffee, Pill, Fuel, Tag } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';
import { useAlert } from '@/contexts/AlertContext';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import { deleteLoyaltyCard, CARD_CATEGORIES } from '@/lib/loyaltyCardsService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORY_ICONS = {
  grocery: ShoppingCart, shop: Store, cafe: Coffee,
  pharmacy: Pill, fuel: Fuel, other: Tag,
};

export default function LoyaltyCardDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams();

  const [card, setCard] = useState(null);

  useEffect(() => {
    if (params.card) {
      try {
        setCard(JSON.parse(params.card));
      } catch (e) {
        console.error('[CardDetail] Parse error:', e);
      }
    }
  }, [params.card]);

  const handleDelete = () => {
    hapticMedium();
    showAlert(
      'Delete Card',
      `Remove ${card?.store_name} loyalty card?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await deleteLoyaltyCard(card.id);
            if (!error) {
              hapticSuccess();
              router.back();
            }
          }
        },
      ]
    );
  };

  if (!card) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[card.category] || Tag;
  const categoryLabel = CARD_CATEGORIES.find(c => c.key === card.category)?.label || 'Other';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Back Button */}
      <View style={[styles.closeBtnShadow, { top: insets.top > 0 ? insets.top + 10 : 30 }]}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => { hapticLight(); router.back(); }}
          activeOpacity={0.7}
        >
          <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
            <ArrowLeft size={24} color="#1A1D1C" />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Card Image — Full Width */}
      <View style={styles.imageContainer}>
        {card.card_image_url ? (
          <Image source={{ uri: card.card_image_url }} style={styles.fullImage} />
        ) : (
          <View style={[styles.fullImage, styles.noImage, { backgroundColor: `${card.color || '#4CAF50'}20` }]}>
            <Store size={64} color={card.color || colors.mutedForeground} />
          </View>
        )}
      </View>

      {/* Card Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{card.store_name}</Text>
            <View style={styles.categoryRow}>
              <CategoryIcon size={14} color={card.color || colors.mutedForeground} />
              <Text style={[styles.categoryLabel, { color: card.color || colors.mutedForeground }]}>{categoryLabel}</Text>
            </View>
          </View>
        </View>

        {card.card_number ? (
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumberLabel}>Card Number</Text>
            <Text style={styles.cardNumberValue}>{card.card_number}</Text>
          </View>
        ) : null}

        {card.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesValue}>{card.notes}</Text>
          </View>
        ) : null}

        {/* Hint text */}
        <Text style={styles.hintText}>
          Show this card to the cashier to scan your barcode
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Trash2 size={18} color={colors.destructive} />
            <Text style={styles.deleteBtnText}>Delete Card</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  closeBtnShadow: {
    position: 'absolute', left: 20, zIndex: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  closeBtn: { 
    width: 40, height: 40, borderRadius: 20, 
    overflow: 'hidden', 
  },
  blurContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', 
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  loadingText: { fontSize: 16, fontFamily: fonts.sans, color: '#999' },

  // Image
  imageContainer: {
    width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.5,
    backgroundColor: '#111',
  },
  fullImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  noImage: { alignItems: 'center', justifyContent: 'center' },

  // Info
  infoContainer: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -24, paddingHorizontal: 24, paddingTop: 28,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  storeName: { fontSize: 24, fontFamily: fonts.heading, color: colors.foreground },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  categoryLabel: { fontSize: 14, fontFamily: fonts.sansSemiBold },

  // Card Number
  cardNumberContainer: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: `${colors.border}40`,
  },
  cardNumberLabel: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.mutedForeground, marginBottom: 4, letterSpacing: 1 },
  cardNumberValue: { fontSize: 20, fontFamily: fonts.sansBold, color: colors.foreground, letterSpacing: 2 },

  // Notes
  notesContainer: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: `${colors.border}40`,
  },
  notesLabel: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.mutedForeground, marginBottom: 4, letterSpacing: 1 },
  notesValue: { fontSize: 14, fontFamily: fonts.sans, color: colors.foreground, lineHeight: 20 },

  // Hint
  hintText: {
    fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground,
    textAlign: 'center', marginTop: 8, marginBottom: 20,
  },

  // Actions
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14,
    backgroundColor: `${colors.destructive}10`, borderWidth: 1,
    borderColor: `${colors.destructive}30`,
  },
  deleteBtnText: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.destructive },
});
