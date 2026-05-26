/**
 * Meal Plan Service — AI-powered weekly meal planning
 * 
 * Generates personalized 7-day meal plans based on dietary preferences,
 * pantry items, and health goals. Produces consolidated shopping lists.
 */

import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================
// Meal Plan CRUD
// ============================================================

/**
 * Get user's meal plans
 */
export async function getUserMealPlans(userId) {
    const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('week_start', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get a single meal plan with full details
 */
export async function getMealPlanById(planId) {
    const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('id', planId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Generate a new AI meal plan
 */
export async function generateMealPlan(userId, preferences = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Must be signed in');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-meal-plan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            userId,
            ...preferences,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Meal plan generation failed');
    }

    const data = await response.json();
    return data.mealPlan;
}

/**
 * Save/update a meal plan
 */
export async function saveMealPlan(plan) {
    const { data, error } = await supabase
        .from('meal_plans')
        .upsert(plan)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete a meal plan
 */
export async function deleteMealPlan(planId) {
    const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', planId);

    if (error) throw error;
}

/**
 * Swap a single meal in a plan
 */
export async function swapMeal(planId, dayIndex, mealType, newRecipeId = null) {
    const plan = await getMealPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const days = plan.days || [];
    if (dayIndex >= 0 && dayIndex < days.length) {
        const day = days[dayIndex];
        if (day.meals && day.meals[mealType]) {
            if (newRecipeId) {
                // Replace with specific recipe
                day.meals[mealType].recipe_id = newRecipeId;
            } else {
                // Request AI to suggest a new meal
                // This would call the edge function with context
                day.meals[mealType] = { ...day.meals[mealType], needs_refresh: true };
            }
        }
    }

    return saveMealPlan({ ...plan, days });
}

// ============================================================
// Grocery List from Meal Plan
// ============================================================

/**
 * Generate a consolidated grocery list from a meal plan
 */
export async function generateGroceryListFromPlan(planId, userId) {
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
            mealPlanId: planId,
            deductPantry: true,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Grocery list generation failed');
    }

    const data = await response.json();
    return data.shoppingList;
}
