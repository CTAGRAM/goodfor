/**
 * Product Router
 * 
 * Intelligently routes barcode scans to the appropriate API (Food or Beauty)
 * and unifies the response format for downstream safety analysis.
 */

import { getProductByBarcode as getFoodProduct } from './openFoodFacts';
import { getBeautyProductByBarcode, mightBeBeautyProduct } from './openBeautyFacts';

/**
 * Product type constants
 */
export const PRODUCT_TYPES = {
    FOOD: 'FOOD',
    BEAUTY: 'BEAUTY',
    UNKNOWN: 'UNKNOWN',
};

/**
 * Heuristic: Check if a product fetched from OpenFoodFacts is actually a beauty/cosmetic product.
 * Many beauty products end up in OFF because contributors add them there.
 * We detect this by checking name/categories for beauty keywords AND
 * confirming the product lacks meaningful nutritional data.
 */
function looksLikeBeautyProduct(product) {
    if (!product) return false;

    const name = (product.name || product.product_name || '').toLowerCase();
    const categories = (product.categories || []).join(' ').toLowerCase();
    const searchText = `${name} ${categories}`;

    // Strong beauty keywords — if ANY of these appear, it's almost certainly beauty
    const strongBeautyKeywords = [
        'cleanser', 'moisturizer', 'moisturiser', 'serum', 'toner',
        'shampoo', 'conditioner', 'sunscreen', 'spf', 'lip balm',
        'mascara', 'lipstick', 'foundation', 'concealer', 'primer',
        'deodorant', 'antiperspirant', 'perfume', 'eau de',
        'body wash', 'shower gel', 'face wash', 'face cream',
        'hand cream', 'body lotion', 'night cream', 'eye cream',
        'micellar', 'exfoliant', 'face mask', 'sheet mask',
        'toothpaste', 'mouthwash', 'hair dye', 'hair color',
        'nail polish', 'cuticle', 'aftershave', 'shaving cream',
        'skincare', 'haircare', 'cosmetic', 'beauty',
    ];

    // Moderate beauty keywords — need additional signals
    const moderateBeautyKeywords = [
        'cream', 'lotion', 'gel', 'oil', 'balm', 'spray',
        'foam', 'mask', 'scrub', 'wash', 'soap',
    ];

    const hasStrongKeyword = strongBeautyKeywords.some(kw => searchText.includes(kw));

    if (hasStrongKeyword) {
        console.log('[ProductRouter] Strong beauty keyword detected in:', name);
        return true;
    }

    // For moderate keywords, also check that the product has NO meaningful nutritional data
    const hasModerateKeyword = moderateBeautyKeywords.some(kw => searchText.includes(kw));
    if (hasModerateKeyword) {
        const nutriments = product.nutriments || {};
        const hasNutrition = (
            (nutriments.energy_kcal || nutriments['energy-kcal'] || 0) > 0 ||
            (nutriments.proteins || 0) > 0 ||
            (nutriments.carbohydrates || 0) > 0
        );
        if (!hasNutrition) {
            console.log('[ProductRouter] Moderate beauty keyword + no nutrition data:', name);
            return true;
        }
    }

    return false;
}

/**
 * Get product by barcode - tries both APIs intelligently
 * 
 * Strategy:
 * 1. Try OpenFoodFacts first (larger database, 3M+ products)
 * 2. If product looks like beauty (name/categories), reclassify or re-fetch from OBF
 * 3. If not found, try OpenBeautyFacts
 * 4. Return null if not in either database
 * 
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object|null>} Unified product object or null
 */
export async function getProductByBarcode(barcode) {
    if (!barcode) {
        return null;
    }

    // Clean barcode (remove any whitespace, dashes)
    const cleanBarcode = barcode.replace(/[\s-]/g, '');

    try {
        // Strategy 1: Check if barcode prefix suggests beauty product
        // If so, try beauty first for faster response
        if (mightBeBeautyProduct(cleanBarcode)) {
            const beautyProduct = await getBeautyProductByBarcode(cleanBarcode);
            if (beautyProduct) {
                return {
                    ...beautyProduct,
                    productType: PRODUCT_TYPES.BEAUTY,
                };
            }

            // Fallback to food if beauty didn't find it
            const foodProduct = await getFoodProduct(cleanBarcode);
            if (foodProduct) {
                // Even from food DB, check if it's actually beauty
                if (looksLikeBeautyProduct(foodProduct)) {
                    return {
                        ...foodProduct,
                        productType: PRODUCT_TYPES.BEAUTY,
                    };
                }
                return {
                    ...foodProduct,
                    productType: PRODUCT_TYPES.FOOD,
                };
            }
        } else {
            // Default: Try food first (most common use case)
            const foodProduct = await getFoodProduct(cleanBarcode);
            if (foodProduct) {
                // CRITICAL FIX: Check if this "food" product is actually beauty
                // Many beauty products (gel cleansers, creams, etc.) exist in OpenFoodFacts
                if (looksLikeBeautyProduct(foodProduct)) {
                    console.log('[ProductRouter] Product from OFF looks like beauty, trying OBF for richer data...');
                    // Try to get richer data from OpenBeautyFacts
                    const beautyProduct = await getBeautyProductByBarcode(cleanBarcode);
                    if (beautyProduct) {
                        return {
                            ...beautyProduct,
                            productType: PRODUCT_TYPES.BEAUTY,
                        };
                    }
                    // OBF doesn't have it, but we know it's beauty — return with BEAUTY type
                    return {
                        ...foodProduct,
                        productType: PRODUCT_TYPES.BEAUTY,
                    };
                }

                // If the product doesn't explicitly look like beauty, but it lacks ANY meaningful 
                // OFF data (e.g. empty nutriments, no nutri_score, no categories), it might be 
                // a stub entry for a cosmetic product. Let's try OBF just in case.
                const type = detectProductType(foodProduct);
                if (type === PRODUCT_TYPES.UNKNOWN && Object.keys(foodProduct.nutriments || {}).length === 0) {
                    console.log('[ProductRouter] Product from OFF has NO food data (stub). Checking OBF just in case...');
                    try {
                        const beautyFallback = await getBeautyProductByBarcode(cleanBarcode);
                        if (beautyFallback && (beautyFallback.productSubtype || beautyFallback.ingredients_text)) {
                            console.log('[ProductRouter] Found rich data in OBF for stub OFF product. Classifying as BEAUTY.');
                            return { ...beautyFallback, productType: PRODUCT_TYPES.BEAUTY };
                        }
                    } catch (e) {
                         // ignore and let it fall through to food
                    }
                }

                return {
                    ...foodProduct,
                    productType: PRODUCT_TYPES.FOOD,
                };
            }

            // Fallback to beauty if food didn't find it
            const beautyProduct = await getBeautyProductByBarcode(cleanBarcode);
            if (beautyProduct) {
                return {
                    ...beautyProduct,
                    productType: PRODUCT_TYPES.BEAUTY,
                };
            }
        }

        // Not found in either database
        return null;
    } catch (error) {
        console.error('Product router error:', error);
        throw error;
    }
}

/**
 * Try only food database (for backward compatibility)
 */
export async function getFoodProductByBarcode(barcode) {
    const product = await getFoodProduct(barcode);
    return product ? { ...product, productType: PRODUCT_TYPES.FOOD } : null;
}

/**
 * Try only beauty database
 */
export async function getBeautyOnlyProductByBarcode(barcode) {
    const product = await getBeautyProductByBarcode(barcode);
    return product ? { ...product, productType: PRODUCT_TYPES.BEAUTY } : null;
}

/**
 * Detect product type from existing product data
 * Useful when product was already fetched but type needs to be determined
 */
export function detectProductType(product) {
    if (!product) return PRODUCT_TYPES.UNKNOWN;

    // Already has productType
    if (product.productType) {
        return product.productType;
    }

    // Check for food-specific fields
    if (product.nutriments || product.nutriScore || product.novaGroup) {
        return PRODUCT_TYPES.FOOD;
    }

    // Check for beauty-specific fields
    if (product.productSubtype && ['SKINCARE', 'HAIRCARE', 'MAKEUP', 'SUNSCREEN'].includes(product.productSubtype)) {
        return PRODUCT_TYPES.BEAUTY;
    }

    // Heuristic: Check categories
    const categories = (product.categories || []).join(' ').toLowerCase();

    const foodKeywords = ['food', 'beverage', 'snack', 'cereal', 'dairy', 'meat', 'vegetable', 'fruit'];
    const beautyKeywords = ['cosmetic', 'skincare', 'haircare', 'makeup', 'perfume', 'deodorant', 'shampoo', 'cream', 'lotion'];

    const foodScore = foodKeywords.filter(kw => categories.includes(kw)).length;
    const beautyScore = beautyKeywords.filter(kw => categories.includes(kw)).length;

    if (beautyScore > foodScore) return PRODUCT_TYPES.BEAUTY;
    if (foodScore > beautyScore) return PRODUCT_TYPES.FOOD;

    return PRODUCT_TYPES.UNKNOWN;
}

/**
 * Check if product is a beauty/cosmetic product
 */
export function isBeautyProduct(product) {
    return detectProductType(product) === PRODUCT_TYPES.BEAUTY;
}

/**
 * Check if product is a food product
 */
export function isFoodProduct(product) {
    return detectProductType(product) === PRODUCT_TYPES.FOOD;
}
