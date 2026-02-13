/**
 * Product Service Layer
 * Provides consistent data access patterns for products and scans
 * Handles the data flow from scanning to storage to retrieval
 */

import { supabase } from './supabaseAuth';
import { getProductByBarcode as fetchFromOpenFoodFacts } from './openFoodFacts';
import { analyzeProductSafety, yearsToMonths } from './productSafety';

// Age group to months mapping for family members
const AGE_GROUP_TO_MONTHS = {
    'infant': 6,
    'toddler': 24,
    'child': 84,
    'teen': 180,
    'adult': 360,
    'elderly': 780,
};

/**
 * Get product from OpenFoodFacts and analyze safety
 * @param {string} barcode - Product barcode
 * @param {Object} userProfile - User or family member profile
 * @returns {Promise<Object>} Complete product with safety analysis
 */
export async function getProductWithSafetyAnalysis(barcode, userProfile) {
    console.log('[ProductService] Getting product:', barcode);

    // Fetch from OpenFoodFacts
    const product = await fetchFromOpenFoodFacts(barcode);
    if (!product) {
        throw new Error('Product not found in database');
    }

    // Calculate age in months
    const ageMonths = userProfile?.age_years
        ? yearsToMonths(userProfile.age_years)
        : AGE_GROUP_TO_MONTHS[userProfile?.age_group?.toLowerCase()] || 360;

    // Get user preferences
    const userPreferences = {
        allergies: userProfile?.allergies || [],
        dietaryRestrictions: userProfile?.dietary_restrictions || [],
    };

    // Run safety analysis
    const safetyAnalysis = analyzeProductSafety(product, ageMonths, userPreferences);

    return {
        ...product,
        safetyAnalysis,
    };
}

/**
 * Save scan to database with complete product data
 * @param {Object} product - Parsed product from OpenFoodFacts
 * @param {Object} safetyAnalysis - Safety analysis result
 * @param {string} userId - User ID
 * @param {string|null} familyMemberId - Family member ID (optional)
 * @returns {Promise<Object>} Saved scan record
 */
export async function saveScan(product, safetyAnalysis, userId, familyMemberId = null) {
    if (!userId) {
        console.warn('[ProductService] No user ID, skipping save');
        return null;
    }

    console.log('[ProductService] Saving scan for user:', userId);

    try {
        // Step 1: Upsert product with complete data
        const productRecord = {
            barcode: product.barcode,
            name: product.name,
            brand: product.brand,
            category: product.categories?.[0] || 'Food Product',
            image_url: product.imageUrl,
            ingredients: {
                text: product.ingredientsText || '',
                allergens: product.allergens || [],
                additives: product.additives || [],
                traces: product.traces || [],
            },
            nutrition_facts: {
                energy_kcal: product.nutriments?.energy_kcal || 0,
                sugars: product.nutriments?.sugars || 0,
                sodium: product.nutriments?.sodium || 0,
                salt: product.nutriments?.salt || 0,
                saturated_fat: product.nutriments?.saturated_fat || 0,
                proteins: product.nutriments?.proteins || 0,
                fiber: product.nutriments?.fiber || 0,
                caffeine: product.nutriments?.caffeine || 0,
            },
        };

        const { data: productData, error: productError } = await supabase
            .from('products')
            .upsert(productRecord, {
                onConflict: 'barcode',
                ignoreDuplicates: false,
            })
            .select()
            .single();

        if (productError) {
            console.error('[ProductService] Product upsert error:', productError);
            throw productError;
        }

        // Step 2: Check for existing scan
        let query = supabase
            .from('scans')
            .select('id, scan_count')
            .eq('user_id', userId)
            .eq('product_id', productData.id);

        if (familyMemberId) {
            query = query.eq('family_member_id', familyMemberId);
        } else {
            query = query.is('family_member_id', null);
        }

        const { data: existingScan, error: checkError } = await query.maybeSingle();

        if (checkError) {
            console.error('[ProductService] Check existing scan error:', checkError);
        }

        // Prepare safety details for storage
        const safetyDetailsToStore = {
            issues: safetyAnalysis.issues || [],
            ageAppropriate: safetyAnalysis.ageAppropriate,
            ageGroup: safetyAnalysis.ageGroup,
            nutriScore: safetyAnalysis.nutriScore ? {
                rawScore: safetyAnalysis.nutriScore.rawScore,
                grade: safetyAnalysis.nutriScore.grade,
                gradeColor: safetyAnalysis.nutriScore.gradeColor,
                breakdown: safetyAnalysis.nutriScore.breakdown,
            } : null,
            ecoScore: safetyAnalysis.ecoScore,
            novaGroup: safetyAnalysis.novaGroup,
            hasPersonalAllergenMatch: safetyAnalysis.hasPersonalAllergenMatch,
            matchedAllergens: safetyAnalysis.matchedAllergens,
        };

        // Step 3: Update or insert scan
        if (existingScan) {
            const { data: scanData, error: updateError } = await supabase
                .from('scans')
                .update({
                    scanned_at: new Date().toISOString(),
                    scan_count: (existingScan.scan_count || 1) + 1,
                    safety_score: Math.round(safetyAnalysis.safeScore),
                    safety_level: safetyAnalysis.safety,
                    safety_details: safetyDetailsToStore,
                })
                .eq('id', existingScan.id)
                .select()
                .single();

            if (updateError) {
                console.error('[ProductService] Update scan error:', updateError);
                throw updateError;
            }

            console.log('[ProductService] Updated existing scan, count:', (existingScan.scan_count || 1) + 1);
            return { ...scanData, products: productData };
        } else {
            const { data: scanData, error: insertError } = await supabase
                .from('scans')
                .insert({
                    user_id: userId,
                    product_id: productData.id,
                    family_member_id: familyMemberId,
                    safety_score: Math.round(safetyAnalysis.safeScore),
                    safety_level: safetyAnalysis.safety,
                    category: product.categories?.[0] || 'Food Product',
                    scan_count: 1,
                    safety_details: safetyDetailsToStore,
                })
                .select()
                .single();

            if (insertError) {
                console.error('[ProductService] Insert scan error:', insertError);
                throw insertError;
            }

            console.log('[ProductService] New scan saved successfully');
            return { ...scanData, products: productData };
        }
    } catch (error) {
        console.error('[ProductService] Save exception:', error);
        throw error;
    }
}

/**
 * Get scan history with full product data
 * @param {string} userId - User ID
 * @param {string|null} familyMemberId - Filter by family member (optional)
 * @param {number} limit - Max number of scans to return
 * @returns {Promise<Array>} Array of scans with reconstructed product data
 */
export async function getScanHistory(userId, familyMemberId = null, limit = 50) {
    if (!userId) {
        console.warn('[ProductService] No user ID for history');
        return [];
    }

    let query = supabase
        .from('scans')
        .select(`
            *,
            products (
                id,
                barcode,
                name,
                brand,
                image_url,
                category,
                ingredients,
                nutrition_facts
            )
        `)
        .eq('user_id', userId);

    if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
    }

    const { data, error } = await query
        .order('scanned_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[ProductService] Get history error:', error);
        throw error;
    }

    // Return formatted scans with all data preserved
    return (data || []).map(scan => formatScanForHistory(scan));
}

/**
 * Format a scan record from database to match fresh scan structure
 * Use this when navigating from history to product-summary
 * @param {Object} scan - Raw scan record from database
 * @returns {Object} Formatted product data matching fresh scan structure
 */
export function formatScanForHistory(scan) {
    const products = scan.products || {};
    const ingredients = products.ingredients || {};
    const nutritionFacts = products.nutrition_facts || {};
    const safetyDetails = scan.safety_details || {};

    return {
        // Scan metadata
        scanId: scan.id,
        scanned_at: scan.scanned_at,
        scan_count: scan.scan_count,
        family_member_id: scan.family_member_id,

        // Core product fields - matching fresh scan field names
        barcode: products.barcode || '',
        name: products.name || 'Unknown Product',
        brand: products.brand || '',
        imageUrl: products.image_url || null,

        // Ingredients
        ingredientsText: ingredients.text || '',
        allergens: ingredients.allergens || [],
        additives: ingredients.additives || [],
        traces: ingredients.traces || [],

        // Nutrition
        nutriments: {
            energy_kcal: nutritionFacts.energy_kcal || 0,
            sugars: nutritionFacts.sugars || 0,
            sodium: nutritionFacts.sodium || 0,
            salt: nutritionFacts.salt || 0,
            saturated_fat: nutritionFacts.saturated_fat || 0,
            proteins: nutritionFacts.proteins || 0,
            fiber: nutritionFacts.fiber || 0,
            caffeine: nutritionFacts.caffeine || 0,
        },

        // Categories
        categories: products.category ? [products.category] : [],

        // Safety analysis
        safetyAnalysis: {
            safety: scan.safety_level || 'safe',
            safeScore: scan.safety_score || 50,
            issues: safetyDetails.issues || [],
            ageGroup: safetyDetails.ageGroup,
            ageAppropriate: safetyDetails.ageAppropriate !== false,
            nutriScore: safetyDetails.nutriScore || null,
            ecoScore: safetyDetails.ecoScore || null,
            novaGroup: safetyDetails.novaGroup || null,
            hasPersonalAllergenMatch: safetyDetails.hasPersonalAllergenMatch || false,
            matchedAllergens: safetyDetails.matchedAllergens || [],
        },

        // Scores
        nutriScore: safetyDetails.nutriScore?.grade || null,
        novaGroup: safetyDetails.novaGroup?.group || null,
        ecoScore: safetyDetails.ecoScore?.grade || null,

        // Raw data references
        _raw: {
            scan,
            products,
        },
    };
}

/**
 * Delete a scan from history
 * @param {string} scanId - Scan ID
 * @returns {Promise<boolean>} Success
 */
export async function deleteScan(scanId) {
    const { error } = await supabase
        .from('scans')
        .delete()
        .eq('id', scanId);

    if (error) {
        console.error('[ProductService] Delete scan error:', error);
        throw error;
    }

    return true;
}

/**
 * Check if a product is in user's favorites
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>}
 */
export async function isProductFavorite(userId, productId) {
    const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

    if (error) {
        console.error('[ProductService] Check favorite error:', error);
        return false;
    }

    return !!data;
}

/**
 * Add product to favorites
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Favorite record
 */
export async function addToFavorites(userId, productId) {
    const { data, error } = await supabase
        .from('favorites')
        .insert({
            user_id: userId,
            product_id: productId,
        })
        .select()
        .single();

    if (error) {
        console.error('[ProductService] Add favorite error:', error);
        throw error;
    }

    return data;
}

/**
 * Remove product from favorites
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Success
 */
export async function removeFromFavorites(userId, productId) {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) {
        console.error('[ProductService] Remove favorite error:', error);
        throw error;
    }

    return true;
}

export default {
    getProductWithSafetyAnalysis,
    saveScan,
    getScanHistory,
    formatScanForHistory,
    deleteScan,
    isProductFavorite,
    addToFavorites,
    removeFromFavorites,
};
