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
 * Get product by barcode - tries both APIs intelligently
 * 
 * Strategy:
 * 1. Try OpenFoodFacts first (larger database, 3M+ products)
 * 2. If not found, try OpenBeautyFacts
 * 3. Return null if not in either database
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
                return {
                    ...foodProduct,
                    productType: PRODUCT_TYPES.FOOD,
                };
            }
        } else {
            // Default: Try food first (most common use case)
            const foodProduct = await getFoodProduct(cleanBarcode);
            if (foodProduct) {
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
