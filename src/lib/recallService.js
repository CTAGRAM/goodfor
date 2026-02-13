/**
 * Product Recall Service
 * Phase 5: Health & Product Recall Alerts
 * 
 * Fetches product recalls from FDA API and checks against scanned products.
 * Supports US FDA recalls with caching for performance.
 */

// FDA API base URL
const FDA_API_BASE = 'https://api.fda.gov';

// Cache for recall data (reduces API calls)
let recallCache = {
    food: null,
    drug: null,
    device: null,
    lastFetched: null,
};

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch recent food recalls from FDA
 * @param {number} limit - Number of recalls to fetch
 * @returns {Promise<Array>} Array of recall objects
 */
export const fetchFoodRecalls = async (limit = 100) => {
    // Check cache
    if (recallCache.food && recallCache.lastFetched &&
        (Date.now() - recallCache.lastFetched) < CACHE_DURATION_MS) {
        console.log('[RecallService] Returning cached food recalls');
        return recallCache.food;
    }

    try {
        const response = await fetch(
            `${FDA_API_BASE}/food/enforcement.json?limit=${limit}&sort=report_date:desc`
        );

        if (!response.ok) {
            throw new Error(`FDA API returned ${response.status}`);
        }

        const data = await response.json();
        const recalls = data.results || [];

        // Normalize recall data
        const normalizedRecalls = recalls.map(recall => ({
            id: recall.recall_number,
            type: 'food',
            product: recall.product_description,
            brand: recall.recalling_firm,
            reason: recall.reason_for_recall,
            classification: recall.classification, // Class I, II, or III
            status: recall.status,
            date: recall.report_date,
            distribution: recall.distribution_pattern,
            voluntary: recall.voluntary_mandated === 'Voluntary',
        }));

        // Update cache
        recallCache.food = normalizedRecalls;
        recallCache.lastFetched = Date.now();

        console.log(`[RecallService] Fetched ${normalizedRecalls.length} food recalls`);
        return normalizedRecalls;
    } catch (error) {
        console.error('[RecallService] Error fetching food recalls:', error);
        return recallCache.food || []; // Return cached data if available
    }
};

/**
 * Check if a product matches any active recalls
 * @param {Object} product - The scanned product object
 * @returns {Promise<Object|null>} Matching recall or null
 */
export const checkProductRecall = async (product) => {
    const recalls = await fetchFoodRecalls();

    if (!recalls || recalls.length === 0) {
        return null;
    }

    // Get product identifiers
    const productName = (product.product_name || product.name || '').toLowerCase();
    const brand = (product.brands || product.brand || '').toLowerCase();
    const barcode = product.code || product.barcode || '';

    // Search for matching recalls
    for (const recall of recalls) {
        const recallProduct = (recall.product || '').toLowerCase();
        const recallBrand = (recall.brand || '').toLowerCase();

        // Check for brand match
        if (brand && recallBrand && recallBrand.includes(brand)) {
            // Check for product name similarity
            if (productName && recallProduct.includes(productName.slice(0, 10))) {
                return recall;
            }
        }

        // Check for exact product name match
        if (productName && recallProduct.includes(productName)) {
            return recall;
        }
    }

    return null;
};

/**
 * Get recall severity color based on FDA classification
 * @param {string} classification - FDA classification (Class I, II, III)
 * @returns {Object} Color configuration
 */
export const getRecallSeverity = (classification) => {
    switch (classification) {
        case 'Class I':
            return {
                level: 'dangerous',
                color: '#E63E11',
                label: 'Dangerous',
                description: 'Products that could cause serious health problems or death',
            };
        case 'Class II':
            return {
                level: 'moderate',
                color: '#EE8100',
                label: 'Moderate Risk',
                description: 'Products that might cause temporary or reversible health problems',
            };
        case 'Class III':
            return {
                level: 'low',
                color: '#FECB02',
                label: 'Low Risk',
                description: 'Products unlikely to cause adverse health effects',
            };
        default:
            return {
                level: 'unknown',
                color: '#9CA3AF',
                label: 'Unknown',
                description: 'Risk level not specified',
            };
    }
};

/**
 * Format recall date for display
 * @param {string} dateStr - FDA date string (YYYYMMDD format)
 * @returns {string} Formatted date
 */
export const formatRecallDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return 'Unknown date';

    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);

    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Clear the recall cache (useful for manual refresh)
 */
export const clearRecallCache = () => {
    recallCache = {
        food: null,
        drug: null,
        device: null,
        lastFetched: null,
    };
    console.log('[RecallService] Cache cleared');
};
