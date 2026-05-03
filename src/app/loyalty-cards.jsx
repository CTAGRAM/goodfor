import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Modal, TextInput, Alert, Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft, Plus, CreditCard, Trash2, Camera, ImageIcon, X, Store,
  ShoppingCart, Coffee, Pill, Fuel, Tag
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import {
  getLoyaltyCards, createLoyaltyCard, deleteLoyaltyCard, uploadCardImage,
  CARD_CATEGORIES, CARD_COLORS,
} from '@/lib/loyaltyCardsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 24 * 2 - 16) / 2;

const CATEGORY_ICONS = {
  grocery: ShoppingCart, shop: Store, cafe: Coffee,
  pharmacy: Pill, fuel: Fuel, other: Tag,
};

export default function LoyaltyCards() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add card form state
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('shop');
  const [cardNumber, setCardNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);
  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCards = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await getLoyaltyCards(user.id);
      if (error) console.error('[LoyaltyCards] Load error:', error);
      setCards(data || []);
    } catch (e) {
      console.error('[LoyaltyCards] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadCards();
  }, [user?.id]));

  const resetForm = () => {
    setStoreName('');
    setCategory('shop');
    setCardNumber('');
    setNotes('');
    setSelectedColor(CARD_COLORS[0]);
    setImageUri(null);
  };

  const pickImage = async (fromCamera = false) => {
    hapticLight();
    try {
      let result;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          showAlert('Permission Required', 'Camera access is needed to take a photo of your card.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          showAlert('Permission Required', 'Photo library access is needed to select a card image.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error('[LoyaltyCards] Image pick error:', e);
    }
  };

  const handleSave = async () => {
    if (!storeName.trim()) {
      showAlert('Missing Name', 'Please enter the store name.');
      return;
    }
    if (!imageUri) {
      showAlert('Missing Photo', 'Please take or select a photo of your card.');
      return;
    }

    hapticMedium();
    setSaving(true);

    try {
      // Upload image
      let cardImageUrl = null;
      const { url, error: uploadError } = await uploadCardImage(imageUri);
      if (uploadError) {
        // Fallback: store local URI if upload fails
        console.warn('[LoyaltyCards] Upload failed, storing local URI:', uploadError);
        cardImageUrl = imageUri;
      } else {
        cardImageUrl = url;
      }

      // Create card
      const { data, error } = await createLoyaltyCard(user.id, {
        storeName: storeName.trim(),
        cardImageUrl,
        cardNumber: cardNumber.trim() || null,
        category,
        notes: notes.trim() || null,
        color: selectedColor,
      });

      if (error) {
        showAlert('Error', 'Could not save your card. Please try again.');
        console.error('[LoyaltyCards] Create error:', error);
      } else {
        hapticSuccess();
        resetForm();
        setShowAddModal(false);
        loadCards();
      }
    } catch (e) {
      showAlert('Error', 'Something went wrong. Please try again.');
      console.error('[LoyaltyCards] Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (card) => {
    hapticMedium();
    Alert.alert(
      'Delete Card',
      `Remove ${card.store_name} loyalty card?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const { error } = await deleteLoyaltyCard(card.id);
            if (!error) {
              hapticSuccess();
              setCards(prev => prev.filter(c => c.id !== card.id));
            }
          }
        },
      ]
    );
  };

  const getCategoryIcon = (cat) => CATEGORY_ICONS[cat] || Tag;
  const getCategoryLabel = (cat) => CARD_CATEGORIES.find(c => c.key === cat)?.label || 'Other';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cards</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => { hapticLight(); resetForm(); setShowAddModal(true); }}
        >
          <Plus size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : cards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CreditCard size={48} color={`${colors.mutedForeground}30`} />
          <Text style={styles.emptyTitle}>No loyalty cards yet</Text>
          <Text style={styles.emptySub}>
            Take a photo of your store reward cards{'\n'}to keep them all in one place.
          </Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => { hapticLight(); resetForm(); setShowAddModal(true); }}
          >
            <Text style={styles.addFirstBtnText}>Add Your First Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsGrid}>
            {cards.map((card) => {
              const CategoryIcon = getCategoryIcon(card.category);
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.cardItem, { borderColor: `${card.color || '#4CAF50'}30` }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    hapticLight();
                    router.push({
                      pathname: '/loyalty-card-detail',
                      params: { card: JSON.stringify(card) },
                    });
                  }}
                  onLongPress={() => handleDelete(card)}
                >
                  {/* Card Image */}
                  <View style={styles.cardImageContainer}>
                    {card.card_image_url ? (
                      <Image source={{ uri: card.card_image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={[styles.cardImage, styles.cardPlaceholder, { backgroundColor: `${card.color || '#4CAF50'}15` }]}>
                        <CreditCard size={32} color={card.color || colors.mutedForeground} />
                      </View>
                    )}

                    {/* Category badge */}
                    <View style={[styles.categoryBadge, { backgroundColor: `${card.color || '#4CAF50'}E6` }]}>
                      <CategoryIcon size={10} color="#FFF" />
                      <Text style={styles.categoryText}>{getCategoryLabel(card.category)}</Text>
                    </View>
                  </View>

                  {/* Card Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardStoreName} numberOfLines={1}>{card.store_name}</Text>
                    {card.card_number ? (
                      <Text style={styles.cardNumber} numberOfLines={1}>•••• {card.card_number.slice(-4)}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Add Card Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top + 10 }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Image Capture */}
            <View style={styles.imageSection}>
              {imageUri ? (
                <TouchableOpacity onPress={() => pickImage(true)} activeOpacity={0.8}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <View style={styles.retakeOverlay}>
                    <Camera size={20} color="#FFF" />
                    <Text style={styles.retakeText}>Retake</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.imagePickers}>
                  <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(true)}>
                    <Camera size={28} color={colors.primary} />
                    <Text style={styles.imagePickerText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(false)}>
                    <ImageIcon size={28} color={colors.primary} />
                    <Text style={styles.imagePickerText}>From Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Store Name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Store Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Tesco, Costa, Boots"
                placeholderTextColor={`${colors.mutedForeground}80`}
                value={storeName}
                onChangeText={setStoreName}
                autoCapitalize="words"
              />
            </View>

            {/* Category Selector */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryPills}>
                {CARD_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryPill,
                      category === cat.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => { hapticLight(); setCategory(cat.key); }}
                  >
                    <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                    <Text style={[
                      styles.categoryPillText,
                      category === cat.key && { color: colors.primaryForeground },
                    ]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Card Number (optional) */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Card Number <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 1234 5678 9012"
                placeholderTextColor={`${colors.mutedForeground}80`}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="number-pad"
              />
            </View>

            {/* Notes (optional) */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Notes <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="e.g. Use code SAVE10"
                placeholderTextColor={`${colors.mutedForeground}80`}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            {/* Color Picker */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Accent Color</Text>
              <View style={styles.colorPicker}>
                {CARD_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      selectedColor === c && styles.colorDotSelected,
                    ]}
                    onPress={() => { hapticLight(); setSelectedColor(c); }}
                  />
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.saveButtonText}>Save Card</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${colors.border}80`,
  },
  headerTitle: { fontSize: 20, fontFamily: fonts.heading, color: colors.foreground },
  addButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },

  // Loading & Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[8] },
  emptyTitle: { fontSize: 18, fontFamily: fonts.sansBold, color: colors.foreground },
  emptySub: { fontSize: 14, fontFamily: fonts.sans, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  addFirstBtn: {
    backgroundColor: colors.primary, paddingVertical: spacing[3], paddingHorizontal: spacing[6],
    borderRadius: radius.full, marginTop: spacing[3],
  },
  addFirstBtnText: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.primaryForeground },

  // Cards Grid
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 8 },
  cardItem: {
    width: CARD_WIDTH, borderRadius: 20, backgroundColor: colors.card,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 4, elevation: 2, borderWidth: 1, overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%', aspectRatio: 1.5, backgroundColor: '#F8F8F8', position: 'relative',
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  categoryBadge: {
    position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  categoryText: { fontSize: 10, fontFamily: fonts.sansBold, color: '#FFF' },
  cardInfo: { padding: 12 },
  cardStoreName: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.foreground },
  cardNumber: { fontSize: 12, fontFamily: fonts.sans, color: colors.mutedForeground, marginTop: 2 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16,
  },
  modalTitle: { fontSize: 22, fontFamily: fonts.heading, color: colors.foreground },

  // Image Section
  imageSection: { marginBottom: 24 },
  imagePickers: { flexDirection: 'row', gap: 12 },
  imagePickerBtn: {
    flex: 1, height: 120, borderRadius: 16, borderWidth: 2, borderColor: `${colors.primary}30`,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${colors.primary}06`,
  },
  imagePickerText: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.primary },
  previewImage: { width: '100%', height: 180, borderRadius: 16, resizeMode: 'cover' },
  retakeOverlay: {
    position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center',
    gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  retakeText: { fontSize: 12, fontFamily: fonts.sansBold, color: '#FFF' },

  // Form
  formSection: { marginBottom: 20 },
  formLabel: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.foreground, marginBottom: 8 },
  formInput: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    fontSize: 15, fontFamily: fonts.sans, color: colors.foreground,
    borderWidth: 1, borderColor: `${colors.border}60`,
  },
  categoryPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: `${colors.border}60`,
  },
  categoryPillText: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.foreground },
  colorPicker: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.foreground },

  // Save
  saveButton: {
    backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 8,
  },
  saveButtonText: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.primaryForeground },
});
