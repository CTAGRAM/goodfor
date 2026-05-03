/**
 * Smart Basket Service — CRUD, score engine, streak tracking
 */
import { supabase } from './supabaseAuth';

// ─── BASKET OPERATIONS ─────────────────────────────────────────────────────────

/**
 * Get or create today's active basket for the current user.
 * Handles race conditions and the unique constraint on (user_id, date).
 */
export async function getOrCreateTodayBasket(userId) {
    const today = new Date().toISOString().split('T')[0];

    // Find the current active basket for the user
    const { data: activeBasket, error: findError } = await supabase
        .from('baskets')
        .select('*, basket_items(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (findError) throw findError;

    if (activeBasket) {
        return activeBasket;
    }

    // No active basket exists (e.g. they just finalised one), so create a fresh one
    const { data: newBasket, error: createError } = await supabase
        .from('baskets')
        .insert({
            user_id: userId,
            date: today,
            status: 'active'
        })
        .select('*, basket_items(*)')
        .single();

    if (createError) {
        // Fallback if there is a concurrent creation issue
        if (createError.code === '23505') {
            const { data: reFetched, error: reFetchError } = await supabase
                .from('baskets')
                .select('*, basket_items(*)')
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (reFetchError) throw reFetchError;
            if (reFetched) return reFetched;
        }
        throw createError;
    }
    
    return newBasket;
}

/**
 * Add a product to the active basket
 */
export async function addToBasket(basketId, product) {
    const item = {
        basket_id: basketId,
        product_barcode: product.barcode || product.code || 'UNKNOWN',
        product_name: product.name || product.product_name || 'Unknown Product',
        product_brand: product.brand || '',
        product_image_url: product.imageUrl || product.image_url || null,
        safety_score: Math.round(product.safetyScore ?? product.safety_score ?? 0),
        safety_level: product.safetyLevel ?? product.safety_level ?? 'SAFE',
    };

    const { data, error } = await supabase
        .from('basket_items')
        .insert(item)
        .select()
        .single();

    if (error) throw error;

    // Update basket score and item count
    await recalculateBasketScore(basketId);
    return data;
}

/**
 * Remove an item from the basket
 */
export async function removeFromBasket(itemId, basketId) {
    const { error } = await supabase
        .from('basket_items')
        .delete()
        .eq('id', itemId);

    if (error) throw error;
    await recalculateBasketScore(basketId);
}

/**
 * Recalculate basket aggregate score and color distribution
 */
export async function recalculateBasketScore(basketId) {
    const { data: items, error } = await supabase
        .from('basket_items')
        .select('safety_score, safety_level')
        .eq('basket_id', basketId);

    if (error) throw error;

    const count = items.length;
    if (count === 0) {
        await supabase.from('baskets').update({
            score: 0,
            item_count: 0,
            color_distribution: { good: 0, moderate: 0, improve: 0 },
        }).eq('id', basketId);
        return;
    }

    const totalScore = items.reduce((sum, i) => sum + (i.safety_score || 0), 0);
    const avgScore = Math.round(totalScore / count);

    let good = 0, moderate = 0, improve = 0;
    items.forEach(i => {
        const s = i.safety_score || 0;
        if (s >= 70) good++;
        else if (s >= 40) moderate++;
        else improve++;
    });

    const distribution = {
        good: Math.round((good / count) * 100),
        moderate: Math.round((moderate / count) * 100),
        improve: Math.round((improve / count) * 100),
    };

    await supabase.from('baskets').update({
        score: avgScore,
        item_count: count,
        color_distribution: distribution,
    }).eq('id', basketId);

    return { score: avgScore, count, distribution };
}

/**
 * Finalise the basket — lock it and update streaks
 */
export async function finaliseBasket(basketId, userId) {
    // Lock the basket
    const { data: basket, error } = await supabase
        .from('baskets')
        .update({
            status: 'finalised',
            finalised_at: new Date().toISOString(),
        })
        .eq('id', basketId)
        .select()
        .single();

    if (error) throw error;

    // Update streak
    await updateStreak(userId, basket.date, basket.score);

    return basket;
}

// ─── BASKET HISTORY ─────────────────────────────────────────────────────────────

/**
 * Get basket history for a user
 */
export async function getBasketHistory(userId, limit = 20) {
    const { data, error } = await supabase
        .from('baskets')
        .select('*, basket_items(count)')
        .eq('user_id', userId)
        .eq('status', 'finalised')
        .order('date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Get a specific basket with its items
 */
export async function getBasketDetail(basketId) {
    const { data, error } = await supabase
        .from('baskets')
        .select('*, basket_items(*)')
        .eq('id', basketId)
        .single();

    if (error) throw error;
    return data;
}

// ─── STREAK TRACKING ────────────────────────────────────────────────────────────

/**
 * Update the shopping streak for a user
 */
async function updateStreak(userId, basketDate, basketScore) {
    // Get or create streak record
    const { data: streak, error } = await supabase
        .from('shopping_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;

    const today = new Date(basketDate);
    const lastDate = streak?.last_basket_date ? new Date(streak.last_basket_date) : null;

    // Calculate if streak continues (within 7 days)
    let currentStreak = 1;
    if (lastDate) {
        const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 7 && daysDiff > 0) {
            currentStreak = (streak.current_streak || 0) + 1;
        } else if (daysDiff === 0) {
            currentStreak = streak.current_streak || 1; // Same day, no change
        }
        // daysDiff > 7 = streak broken, reset to 1
    }

    const totalBaskets = (streak?.total_baskets || 0) + 1;
    const runningTotal = (streak?.average_score || 0) * (streak?.total_baskets || 0) + basketScore;
    const averageScore = Math.round(runningTotal / totalBaskets);

    const upsertData = {
        user_id: userId,
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, streak?.longest_streak || 0),
        last_basket_date: basketDate,
        total_baskets: totalBaskets,
        average_score: averageScore,
        updated_at: new Date().toISOString(),
    };

    if (streak) {
        await supabase.from('shopping_streaks').update(upsertData).eq('user_id', userId);
    } else {
        await supabase.from('shopping_streaks').insert(upsertData);
    }

    return upsertData;
}

/**
 * Get the user's streak data
 */
export async function getStreak(userId) {
    const { data, error } = await supabase
        .from('shopping_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data || { current_streak: 0, longest_streak: 0, total_baskets: 0, average_score: 0 };
}

// ─── REPLACE & PREVIOUS BASKET ──────────────────────────────────────────────────

/**
 * Replace a basket item with a new product
 */
export async function replaceBasketItem(itemId, basketId, newProduct) {
    // Remove the old item
    const { error: removeError } = await supabase
        .from('basket_items')
        .delete()
        .eq('id', itemId);

    if (removeError) throw removeError;

    // Add the new product
    const result = await addToBasket(basketId, newProduct);
    return result;
}

/**
 * Get unique products from past baskets (for "Add from Previous").
 * Includes items from all past baskets (active + finalised), excluding today's.
 */
export async function getRecentBasketItems(userId, limit = 30) {
    const { data, error } = await supabase
        .from('basket_items')
        .select('product_barcode, product_name, product_brand, product_image_url, safety_score, safety_level, baskets!inner(user_id, status)')
        .eq('baskets.user_id', userId)
        .eq('baskets.status', 'finalised')
        .order('added_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    // De-duplicate by barcode
    const seen = new Set();
    const unique = [];
    (data || []).forEach(item => {
        if (!seen.has(item.product_barcode)) {
            seen.add(item.product_barcode);
            unique.push({
                barcode: item.product_barcode,
                name: item.product_name,
                brand: item.product_brand,
                imageUrl: item.product_image_url,
                safetyScore: item.safety_score,
                safetyLevel: item.safety_level,
            });
        }
    });
    return unique;
}

// ─── BASKET SCORE HELPERS ───────────────────────────────────────────────────────

/**
 * Get the safety level color for a score
 */
export function getScoreColor(score) {
    if (score >= 70) return '#22C55E'; // green
    if (score >= 40) return '#F59E0B'; // yellow/amber
    return '#EF4444'; // red
}

/**
 * Get the status label for a score
 */
export function getScoreLevel(score) {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Improve';
}

/**
 * Get a Lumi coaching tip based on basket contents
 */
export function getLumiTip(score, distribution, previousScore) {
    if (score === 0) return 'Start adding products to see your basket health score!';

    if (previousScore && score > previousScore) {
        const diff = score - previousScore;
        return `Great improvement! Your score went up by ${diff} points since your last shop. 🎉`;
    }

    if (distribution?.improve > 30) {
        return '💡 Swap one low-scoring item for a healthier option and your score could jump significantly!';
    }

    if (distribution?.good >= 70) {
        return '🌟 Amazing basket! Over 70% of your items are excellent choices. Keep it up!';
    }

    if (score >= 80) {
        return '✨ Your basket is looking super healthy! Well done on making great choices.';
    }

    if (score >= 60) {
        return '👍 Good basket so far! Consider swapping a moderate item for a better option.';
    }

    return '🔍 Try scanning a few more products to see where you can make healthier choices.';
}

/**
 * Add all items from a historical basket to today's active basket
 */
export async function addHistoricalBasketToToday(historicalBasketId, userId) {
    // 1. Fetch the historical basket and its items
    const historicalBasket = await getBasketDetail(historicalBasketId);
    if (!historicalBasket || !historicalBasket.basket_items || historicalBasket.basket_items.length === 0) {
        throw new Error('Historical basket is empty or not found.');
    }

    // 2. Get or create today's active basket
    const todayBasket = await getOrCreateTodayBasket(userId);

    // 3. Prepare items for bulk insert
    const itemsToInsert = historicalBasket.basket_items.map(item => ({
        basket_id: todayBasket.id,
        product_barcode: item.product_barcode,
        product_name: item.product_name,
        product_brand: item.product_brand,
        product_image_url: item.product_image_url,
        safety_score: item.safety_score,
        safety_level: item.safety_level,
    }));

    // 4. Bulk insert items
    const { error: insertError } = await supabase
        .from('basket_items')
        .insert(itemsToInsert);

    if (insertError) throw insertError;

    // 5. Recalculate score for today's basket
    await recalculateBasketScore(todayBasket.id);

    return todayBasket;
}
