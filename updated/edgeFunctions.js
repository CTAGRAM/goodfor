// Supabase Edge Functions client
import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Call a Supabase Edge Function with timeout and retry
 * @param {string} functionName - Name of the edge function
 * @param {Object} body - Request body
 * @param {Object} options - Options { retries: number, timeout: number }
 */
async function callEdgeFunction(functionName, body = {}, options = {}) {
    const { retries = 1, timeout = REQUEST_TIMEOUT } = options;
    const { data: { session } } = await supabase.auth.getSession();

    const headers = {
        'Content-Type': 'application/json',
    };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = `Edge Function error: ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    // Ignore JSON parse error
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            lastError = error;
            const isRetryable = error.name === 'AbortError' || error.message.includes('network');

            console.warn(`[EdgeFunction:${functionName}] Attempt ${attempt + 1} failed:`, error.message);

            if (attempt < retries && isRetryable) {
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
                continue;
            }
            break;
        }
    }

    console.error(`[EdgeFunction:${functionName}] All attempts failed:`, lastError);
    throw lastError;
}

/**
 * Get alternatives for a product using Edge Function
 * @param {string} barcode - Product barcode
 * @param {string} category - Product category (optional)
 * @returns {Promise<Array>} Array of alternative products
 */
/**
 * Get alternatives for a product using Edge Function v4
 * @param {Object} product - Full product object from scan
 * @returns {Promise<Array>} Array of alternative products
 */
export async function getAlternativesEdge(product) {
    const { data: { user } } = await supabase.auth.getSession();

    // Extract extracts all necessary fields for the V4 Edge Function
    const requestData = {
        barcode: product.barcode || product.code,
        category: product.category || product.categories?.[0],
        categories_tags: product.categories_tags || product.categories || [],
        safety_score: product.safetyScore || product.safeScore || product.safety_score || 50,
        nutri_score: product.nutriScore || product.nutrition_grades,
        user_id: user?.id,
    };

    console.log('[EdgeFunction] Getting alternatives with data:', {
        barcode: requestData.barcode,
        category: requestData.category,
        safety_score: requestData.safety_score,
        nutri_score: requestData.nutri_score
    });

    const result = await callEdgeFunction('get-alternatives', requestData);

    console.log('[EdgeFunction] Alternatives result:', {
        success: result.success,
        count: result.count,
        source: result.meta?.sources_used
    });

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
