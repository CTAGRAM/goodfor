/**
 * Fridge Scanner Service — Analyze fridge photos with AI
 * 
 * Uses Gemini 2.5 Flash Vision to identify ingredients,
 * suggest recipes, and find missing items.
 */

import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================
// Fridge Analysis
// ============================================================

/**
 * Analyze a fridge/pantry photo with AI
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - MIME type (image/jpeg, etc.)
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeFridge(imageBase64, mimeType, userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-fridge`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            imageBase64,
            mimeType,
            userId,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Fridge analysis failed (${response.status})`);
    }

    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to analyze fridge contents');
    }

    return {
        score: data.score || 0,
        ingredients_detected: data.ingredients_detected || 0,
        message: data.message || 'Analysis complete',
        sub_message: data.sub_message || '',
        ingredients: data.ingredients || [],
        meals: data.meals || [],
        missing_items: data.missing_items || [],
        potential_score: data.potential_score || 0,
    };
}

// ============================================================
// Fridge Scan History
// ============================================================

/**
 * Get past fridge scan results
 */
export async function getFridgeScanHistory(userId) {
    const { data, error } = await supabase
        .from('fridge_scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) throw error;
    return data || [];
}

/**
 * Save a fridge scan result
 */
export async function saveFridgeScan(userId, scanData) {
    const { data, error } = await supabase
        .from('fridge_scans')
        .insert({
            user_id: userId,
            score: scanData.score,
            ingredients_detected: scanData.ingredients_detected,
            ingredients: scanData.ingredients,
            meals: scanData.meals,
            missing_items: scanData.missing_items,
            potential_score: scanData.potential_score,
            scan_mode: scanData.scan_mode || 'fridge',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================================
// Missing Items → Basket
// ============================================================

/**
 * Add missing ingredients to the user's pantry/shopping list
 */
export async function addMissingItemsToBasket(userId, items) {
    const rows = items.map(item => ({
        user_id: userId,
        name: item.name,
        quantity: item.quantity || null,
        unit: null,
        category: item.category || 'other',
    }));

    const { data, error } = await supabase
        .from('pantry_items')
        .insert(rows)
        .select();

    if (error) throw error;
    return data || [];
}
