import { supabase } from './supabase';

// ============================================================================
// LOYALTY CARDS CRUD
// ============================================================================

export async function getLoyaltyCards(userId) {
  const { data, error } = await supabase
    .from('loyalty_cards')
    .select('*')
    .eq('user_id', userId)
    .order('store_name', { ascending: true });

  return { data: data || [], error };
}

export async function createLoyaltyCard(userId, card) {
  const { data, error } = await supabase
    .from('loyalty_cards')
    .insert([{
      user_id: userId,
      store_name: card.storeName,
      card_image_url: card.cardImageUrl || null,
      card_number: card.cardNumber || null,
      category: card.category || 'shop',
      notes: card.notes || null,
      color: card.color || '#4CAF50',
    }])
    .select()
    .single();

  return { data, error };
}

export async function updateLoyaltyCard(cardId, updates) {
  const payload = {};
  if (updates.storeName !== undefined) payload.store_name = updates.storeName;
  if (updates.cardImageUrl !== undefined) payload.card_image_url = updates.cardImageUrl;
  if (updates.cardNumber !== undefined) payload.card_number = updates.cardNumber;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.color !== undefined) payload.color = updates.color;
  payload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('loyalty_cards')
    .update(payload)
    .eq('id', cardId)
    .select()
    .single();

  return { data, error };
}

export async function deleteLoyaltyCard(cardId) {
  const { error } = await supabase
    .from('loyalty_cards')
    .delete()
    .eq('id', cardId);

  return { error };
}

// ============================================================================
// IMAGE UPLOAD (Uploadcare — same client as useUpload.js)
// ============================================================================

import { UploadClient } from '@uploadcare/upload-client';
const uploadClient = new UploadClient({ publicKey: process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY || 'demopublickey' });

export async function uploadCardImage(imageUri) {
  try {
    const asset = {
      uri: imageUri,
      name: `loyalty_card_${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
    };

    const result = await uploadClient.uploadFile(asset, {
      fileName: asset.name,
      contentType: asset.mimeType,
    });

    if (result?.uuid) {
      return { url: `https://ucarecdn.com/${result.uuid}/`, error: null };
    }

    return { url: null, error: 'Upload failed — no UUID returned' };
  } catch (e) {
    console.error('[LoyaltyCards] Image upload error:', e);
    return { url: null, error: e.message };
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CARD_CATEGORIES = [
  { key: 'grocery', label: 'Grocery', icon: '🛒' },
  { key: 'shop', label: 'Shop', icon: '🛍️' },
  { key: 'cafe', label: 'Cafe', icon: '☕' },
  { key: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { key: 'fuel', label: 'Fuel', icon: '⛽' },
  { key: 'other', label: 'Other', icon: '🏷️' },
];

export const CARD_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#607D8B', // Slate
];
