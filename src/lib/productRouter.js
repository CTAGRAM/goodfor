/**
 * Product Router — Food Only
 * 
 * Simplified router that fetches products from OpenFoodFacts.
 * Beauty/cosmetic routing has been removed.
 */

import { getProductByBarcode as getFoodProduct } from './openFoodFacts';

/**
 * Product type constants
 */
export const PRODUCT_TYPES = {
    FOOD: 'FOOD',
    UNKNOWN: 'UNKNOWN',
};

/**
 * Get product by barcode — food only
 * 
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object|null>} Product object or null
 */
export async function getProductByBarcode(barcode) {
    if (!barcode) {
        return null;
    }

    const cleanBarcode = barcode.replace(/[\s-]/g, '');

    try {
        const foodProduct = await getFoodProduct(cleanBarcode);
        if (foodProduct) {
            return {
                ...foodProduct,
                productType: PRODUCT_TYPES.FOOD,
            };
        }

        return null;
    } catch (error) {
        console.error('Product router error:', error);
        throw error;
    }
}

/**
 * Try only food database (kept for backward compatibility)
 */
export async function getFoodProductByBarcode(barcode) {
    const product = await getFoodProduct(barcode);
    return product ? { ...product, productType: PRODUCT_TYPES.FOOD } : null;
}

/**
 * Detect product type from existing product data
 */
export function detectProductType(product) {
    if (!product) return PRODUCT_TYPES.UNKNOWN;
    if (product.productType) return product.productType;

    // Check for food-specific fields
    if (product.nutriments || product.nutriScore || product.novaGroup) {
        return PRODUCT_TYPES.FOOD;
    }

    return PRODUCT_TYPES.UNKNOWN;
}

/**
 * Check if product is a food product
 */
export function isFoodProduct(product) {
    return detectProductType(product) === PRODUCT_TYPES.FOOD;
}
