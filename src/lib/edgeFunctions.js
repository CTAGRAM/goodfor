// Supabase Edge Functions client
import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Call a Supabase Edge Function
 */
async function callEdgeFunction(functionName, body = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    const headers = {
        'Content-Type': 'application/json',
    };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    try {
        const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Edge Function error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`[EdgeFunction:${functionName}] Error:`, error);
        throw error;
    }
}

/**
 * Get alternatives for a product using Edge Function
 * @param {string} barcode - Product barcode
 * @param {string} category - Product category (optional)
 * @returns {Promise<Array>} Array of alternative products
 */
export async function getAlternativesEdge(barcode, category) {
    console.log('[EdgeFunction] Getting alternatives for:', barcode, category);

    const result = await callEdgeFunction('get-alternatives', {
        barcode,
        category,
    });

    console.log('[EdgeFunction] Alternatives result:', result);

    if (!result.success) {
        throw new Error(result.error || 'Failed to get alternatives');
    }

    return result.data || [];
}

/**
 * Scan a product using Edge Function (with caching)
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object>} Product data
 */
export async function scanProductEdge(barcode) {
    console.log('[EdgeFunction] Scanning product:', barcode);

    const result = await callEdgeFunction('scan-product', {
        barcode,
    });

    console.log('[EdgeFunction] Scan result:', result.source);

    if (!result.success) {
        throw new Error(result.error || 'Failed to scan product');
    }

    return result.data;
}

export default {
    getAlternativesEdge,
    scanProductEdge,
};
