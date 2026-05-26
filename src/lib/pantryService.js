/**
 * Pantry Service — Track ingredients the user already has
 * 
 * Enables "what can I cook?" functionality and smart shopping list
 * deduplication (don't buy what you already have).
 */

import { supabase } from './supabaseAuth';

// ============================================================
// Pantry CRUD
// ============================================================

/**
 * Get all pantry items for a user
 */
export async function getPantryItems(userId) {
    const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Add an item to the pantry
 */
export async function addPantryItem(userId, item) {
    const { data, error } = await supabase
        .from('pantry_items')
        .insert({
            user_id: userId,
            name: item.name,
            quantity: item.quantity || null,
            unit: item.unit || null,
            category: item.category || 'other',
            expiry_date: item.expiry_date || null,
            barcode: item.barcode || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Add item from a scanned product
 */
export async function addFromScan(userId, product) {
    return addPantryItem(userId, {
        name: product.product_name || product.name,
        category: detectCategory(product),
        barcode: product.barcode || product.code,
    });
}

/**
 * Update a pantry item
 */
export async function updatePantryItem(itemId, updates) {
    const { data, error } = await supabase
        .from('pantry_items')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Remove a pantry item
 */
export async function removePantryItem(itemId) {
    const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', itemId);

    if (error) throw error;
}

/**
 * Bulk add pantry items (e.g., from a shopping list "bought" action)
 */
export async function bulkAddPantryItems(userId, items) {
    const rows = items.map(item => ({
        user_id: userId,
        name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        category: item.category || 'other',
    }));

    const { data, error } = await supabase
        .from('pantry_items')
        .insert(rows)
        .select();

    if (error) throw error;
    return data || [];
}

/**
 * Get pantry items expiring soon (within N days)
 */
export async function getExpiringItems(userId, daysAhead = 3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', futureDate.toISOString())
        .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
}

// ============================================================
// Category Detection
// ============================================================

const CATEGORY_KEYWORDS = {
    produce: ['fruit', 'vegetable', 'salad', 'lettuce', 'tomato', 'onion', 'potato', 'carrot', 'apple', 'banana', 'berry', 'orange', 'lemon', 'avocado', 'pepper', 'cucumber', 'spinach', 'kale', 'broccoli', 'mushroom', 'garlic', 'ginger'],
    dairy: ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'egg', 'curd'],
    meat: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'meat', 'sausage', 'bacon'],
    grains: ['bread', 'rice', 'pasta', 'noodle', 'cereal', 'oats', 'flour', 'wheat', 'tortilla', 'wrap'],
    pantry_staple: ['oil', 'vinegar', 'salt', 'pepper', 'sugar', 'spice', 'sauce', 'ketchup', 'mustard', 'honey', 'syrup', 'canned', 'bean', 'lentil', 'chickpea'],
    frozen: ['frozen', 'ice cream'],
    beverages: ['water', 'juice', 'soda', 'coffee', 'tea', 'drink', 'beverage', 'smoothie'],
    snacks: ['chips', 'crisps', 'nuts', 'chocolate', 'candy', 'cookie', 'biscuit', 'cracker', 'popcorn', 'granola bar'],
};

function detectCategory(product) {
    const name = (product.product_name || product.name || '').toLowerCase();
    const categories = (product.categories || []).join(' ').toLowerCase();
    const searchText = `${name} ${categories}`;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => searchText.includes(kw))) {
            return category;
        }
    }
    return 'other';
}
