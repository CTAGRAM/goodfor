import { supabase } from './supabase';

// ============================================================================
// PROFILES
// ============================================================================

export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    return { data, error };
}

export async function updateProfile(userId, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    return { data, error };
}

// ============================================================================
// FAMILY MEMBERS
// ============================================================================

export async function getFamilyMembers(userId) {
    const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    return { data, error };
}

export async function createFamilyMember(userId, member) {
    const { data, error } = await supabase
        .from('family_members')
        .insert([{ user_id: userId, ...member }])
        .select()
        .single();

    return { data, error };
}

export async function updateFamilyMember(memberId, updates) {
    const { data, error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

    return { data, error };
}

export async function deleteFamilyMember(memberId) {
    const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

    return { error };
}

// ============================================================================
// PRODUCTS
// ============================================================================

export async function getProduct(productId) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    return { data, error };
}

export async function getProductByBarcode(barcode) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

    return { data, error };
}

export async function createProduct(product) {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

    return { data, error };
}

// ============================================================================
// SCANS
// ============================================================================

export async function getScans(userId, limit = 50) {
    const { data, error } = await supabase
        .from('scans')
        .select(`
      *,
      product:products(*),
      family_member:family_members(*)
    `)
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false })
        .limit(limit);

    return { data, error };
}

export async function createScan(userId, scan) {
    const { data, error } = await supabase
        .from('scans')
        .insert([{ user_id: userId, ...scan }])
        .select(`
      *,
      product:products(*),
      family_member:family_members(*)
    `)
        .single();

    return { data, error };
}

export async function deleteScan(scanId) {
    const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId);

    return { error };
}

// ============================================================================
// FAVORITES
// ============================================================================

export async function getFavorites(userId) {
    const { data, error } = await supabase
        .from('favorites')
        .select(`
      *,
      product:products(*)
    `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return { data, error };
}

export async function addFavorite(userId, productId) {
    const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, product_id: productId }])
        .select(`
      *,
      product:products(*)
    `)
        .single();

    return { data, error };
}

export async function removeFavorite(userId, productId) {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    return { error };
}

export async function isFavorite(userId, productId) {
    const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

    return { isFavorite: !!data, error };
}

// ============================================================================
// AI CONVERSATIONS
// ============================================================================

export async function getConversations(userId) {
    const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    return { data, error };
}

export async function createConversation(userId, title = 'New Chat') {
    const { data, error } = await supabase
        .from('ai_conversations')
        .insert([{ user_id: userId, title }])
        .select()
        .single();

    return { data, error };
}

export async function getMessages(conversationId) {
    const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    return { data, error };
}

export async function createMessage(conversationId, role, content) {
    const { data, error } = await supabase
        .from('ai_messages')
        .insert([{ conversation_id: conversationId, role, content }])
        .select()
        .single();

    return { data, error };
}

export async function deleteConversation(conversationId) {
    const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

    return { error };
}
