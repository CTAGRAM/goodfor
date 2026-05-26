/**
 * Recipe Service — Full lifecycle: import → extract → analyze → store
 * 
 * Handles recipe import from URLs, screenshots, and manual entry.
 * Integrates with AI for ingredient extraction, health scoring, and swap suggestions.
 */

import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================
// Recipe CRUD
// ============================================================

/**
 * Get all recipes for a user
 */
export async function getUserRecipes(userId, { limit = 50, offset = 0, category = null } = {}) {
    let query = supabase
        .from('recipes')
        .select('*, recipe_ingredients(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/**
 * Get a single recipe with full ingredient details
 */
export async function getRecipeById(recipeId) {
    const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*)')
        .eq('id', recipeId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Save a recipe (create or update)
 */
export async function saveRecipe(recipe) {
    const { ingredients, ...recipeData } = recipe;

    // Upsert recipe
    const { data: savedRecipe, error: recipeError } = await supabase
        .from('recipes')
        .upsert(recipeData)
        .select()
        .single();

    if (recipeError) throw recipeError;

    // Save ingredients if provided
    if (ingredients && ingredients.length > 0) {
        // Delete existing ingredients first (for updates)
        await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', savedRecipe.id);

        // Insert new ingredients
        const ingredientRows = ingredients.map((ing, index) => ({
            recipe_id: savedRecipe.id,
            name: ing.name,
            quantity: ing.quantity || null,
            unit: ing.unit || null,
            category: ing.category || 'other',
            is_optional: ing.is_optional || false,
            health_score: ing.health_score || null,
            healthier_swap: ing.healthier_swap || null,
            sort_order: index,
        }));

        const { error: ingError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientRows);

        if (ingError) throw ingError;
    }

    return savedRecipe;
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipeId) {
    // Ingredients cascade delete via FK
    const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

    if (error) throw error;
}

// ============================================================
// Recipe Import (URL / Screenshot)
// ============================================================

/**
 * Import a recipe from a URL (TikTok, Instagram, YouTube, blog, etc.)
 * Uses AI edge function to scrape and extract recipe data
 */
export async function importRecipeFromUrl(url, userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-recipe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            type: 'url',
            url,
            userId,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Import failed (${response.status})`);
    }

    const data = await response.json();
    return data.recipe;
}

/**
 * Import a recipe from a screenshot (base64 image)
 * Uses GPT-4 Vision to extract recipe text, then structures it
 */
export async function importRecipeFromScreenshot(imageBase64, mimeType, userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-recipe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            type: 'screenshot',
            imageBase64,
            imageMimeType: mimeType || 'image/jpeg',
            userId,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Screenshot import failed (${response.status})`);
    }

    const data = await response.json();
    return data.recipe;
}

// ============================================================
// Health Analysis & Swaps
// ============================================================

/**
 * Get healthier ingredient swaps for a recipe
 */
export async function getHealthierSwaps(recipeId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/suggest-swaps`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ recipeId }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Swap suggestions failed');
    }

    const data = await response.json();
    return data.swaps;
}

/**
 * Get recipes that can be cooked with current pantry ingredients
 */
export async function getCookableRecipes(userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/suggest-recipes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to suggest recipes');
    }

    const data = await response.json();
    return data.recipes;
}

// ============================================================
// Shopping List Generation
// ============================================================

/**
 * Generate a shopping list from one or more recipes
 */
export async function generateShoppingList(userId, recipeIds, pantryItemIds = []) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-shopping-list`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            userId,
            recipeIds,
            pantryItemIds,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Shopping list generation failed');
    }

    const data = await response.json();
    return data.shoppingList;
}

/**
 * Get user's shopping lists
 */
export async function getUserShoppingLists(userId) {
    const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Update a shopping list item (toggle checked, etc.)
 */
export async function updateShoppingListItem(listId, itemIndex, updates) {
    // Fetch current list
    const { data: list, error: fetchError } = await supabase
        .from('shopping_lists')
        .select('items')
        .eq('id', listId)
        .single();

    if (fetchError) throw fetchError;

    const items = list.items || [];
    if (itemIndex >= 0 && itemIndex < items.length) {
        items[itemIndex] = { ...items[itemIndex], ...updates };
    }

    const { error } = await supabase
        .from('shopping_lists')
        .update({ items, updated_at: new Date().toISOString() })
        .eq('id', listId);

    if (error) throw error;
}

/**
 * Delete a shopping list
 */
export async function deleteShoppingList(listId) {
    const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);

    if (error) throw error;
}
// ============================================================
// Meal Planning
// ============================================================

/**
 * Generate a 7-day meal plan
 */
export async function generateMealPlan(userId, weekStart = null) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-meal-plan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId, weekStart }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Meal plan generation failed');
    }

    const data = await response.json();
    return data.mealPlan;
}

/**
 * Get user's meal plans
 */
export async function getMealPlans(userId) {
    const { data, error } = await supabase
        .from('meal_plans')
        .select(`
            *,
            entries:meal_plan_entries(
                *,
                recipes(title, image_url, health_score, cook_time_minutes, prep_time_minutes)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Update a meal plan entry (swap recipe)
 */
export async function updateMealPlanEntry(entryId, newRecipeId, customName = null) {
    const { error } = await supabase
        .from('meal_plan_entries')
        .update({
            recipe_id: newRecipeId,
            custom_meal_name: customName
        })
        .eq('id', entryId);

    if (error) throw error;
}
