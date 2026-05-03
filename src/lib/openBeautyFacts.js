/**
 * OpenBeautyFacts API Client
 * API structure identical to OpenFoodFacts
 * Documentation: https://world.openbeautyfacts.org
 */

const BASE_URL = 'https://world.openbeautyfacts.org/api/v2';
const USER_AGENT = 'GoodFor/1.0 (contact@goodfor.app)';

// Rate limiting: Same as OpenFoodFacts - 100 requests/minute
const RATE_LIMIT_INTERVAL = 600;
let lastRequestTime = 0;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_INTERVAL) {
        await wait(RATE_LIMIT_INTERVAL - timeSinceLastRequest);
    }

    lastRequestTime = Date.now();
}

/**
 * Fetch beauty/cosmetic product by barcode
 * @param {string} barcode - Product barcode (EAN-13, UPC-A, etc.)
 * @returns {Promise<Object>} Product data or null if not found
 */
export async function getBeautyProductByBarcode(barcode) {
    try {
        await enforceRateLimit();

        const response = await fetch(`${BASE_URL}/product/${barcode}.json`, {
            headers: {
                'User-Agent': USER_AGENT,
            },
        });

        // 404 means product not found - return null
        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            console.warn('OpenBeautyFacts API response not ok:', response.status);
            return null;
        }

        const data = await response.json();

        // Check if product was found
        if (data.status === 0 || !data.product) {
            return null;
        }

        return parseBeautyProduct(data.product);
    } catch (error) {
        console.error('OpenBeautyFacts API error:', error);
        // Return null on errors to allow graceful handling
        return null;
    }
}

/**
 * Search beauty products by name
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Array>} Array of products
 */
export async function searchBeautyProducts(query, page = 1) {
    try {
        await enforceRateLimit();

        const params = new URLSearchParams({
            search_terms: query,
            page: page,
            page_size: 20,
            fields: 'code,product_name,brands,image_url,categories_tags',
        });

        const response = await fetch(`${BASE_URL}/search?${params}`, {
            headers: {
                'User-Agent': USER_AGENT,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return (data.products || []).map(parseBeautyProduct);
    } catch (error) {
        console.error('OpenBeautyFacts search error:', error);
        throw error;
    }
}

/**
 * Parse and normalize beauty product data
 * @param {Object} rawProduct - Raw product data from API
 * @returns {Object} Normalized beauty product object
 */
function parseBeautyProduct(rawProduct) {
    // Extract INCI ingredients list
    const ingredientsText = rawProduct.ingredients_text || '';

    // Parse categories to determine product type (skincare, haircare, etc.)
    const categories = rawProduct.categories_tags || [];
    const productSubtype = determineProductSubtype(categories);

    // Extract labels (cruelty-free, vegan, organic, etc.)
    const labels = rawProduct.labels_tags || [];

    return {
        barcode: rawProduct.code,
        name: rawProduct.product_name || rawProduct.product_name_en || 'Unknown Product',
        brand: rawProduct.brands || 'Unknown Brand',
        imageUrl: rawProduct.image_url || rawProduct.image_front_url || null,

        // Cosmetic-specific fields
        ingredientsText: ingredientsText,
        ingredients: parseIngredientsList(ingredientsText),
        allergensFromIngredients: rawProduct.allergens_from_ingredients_tags || [],

        // Classification
        categories: categories,
        productType: 'BEAUTY', // Key differentiator from food
        productSubtype: productSubtype,

        // Labels and certifications
        labels: labels,
        isCrueltyFree: labels.some(l => l.toLowerCase().includes('cruelty-free')),
        isVegan: labels.some(l => l.toLowerCase().includes('vegan')),
        isOrganic: labels.some(l => l.toLowerCase().includes('organic') || l.toLowerCase().includes('bio')),

        // Packaging and environmental
        packaging: rawProduct.packaging_tags || [],

        // Source metadata
        source: 'openbeautyfacts',
        lastUpdated: rawProduct.last_modified_t ? new Date(rawProduct.last_modified_t * 1000) : null,
    };
}

/**
 * Determine cosmetic product subtype from categories
 */
function determineProductSubtype(categories) {
    const categoryStr = categories.join(' ').toLowerCase();

    if (categoryStr.includes('sunscreen') || categoryStr.includes('sun-protection')) {
        return 'SUNSCREEN';
    }
    if (categoryStr.includes('shampoo') || categoryStr.includes('hair')) {
        return 'HAIRCARE';
    }
    if (categoryStr.includes('moisturizer') || categoryStr.includes('cream') || categoryStr.includes('skincare')) {
        return 'SKINCARE';
    }
    if (categoryStr.includes('lipstick') || categoryStr.includes('makeup') || categoryStr.includes('mascara')) {
        return 'MAKEUP';
    }
    if (categoryStr.includes('deodorant') || categoryStr.includes('antiperspirant')) {
        return 'DEODORANT';
    }
    if (categoryStr.includes('soap') || categoryStr.includes('shower') || categoryStr.includes('body-wash')) {
        return 'BODY_WASH';
    }
    if (categoryStr.includes('baby') || categoryStr.includes('infant')) {
        return 'BABY';
    }
    if (categoryStr.includes('perfume') || categoryStr.includes('fragrance') || categoryStr.includes('eau-de')) {
        return 'FRAGRANCE';
    }
    if (categoryStr.includes('toothpaste') || categoryStr.includes('dental') || categoryStr.includes('oral')) {
        return 'ORAL_CARE';
    }

    return 'OTHER';
}

/**
 * Parse INCI ingredients list into array
 */
function parseIngredientsList(ingredientsText) {
    if (!ingredientsText) return [];

    return ingredientsText
        .split(/,(?![^()]*\))/) // Split by comma, preserve parentheses content
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0)
        .map(ing => ({
            raw: ing,
            name: ing.replace(/\d+\.?\d*%/g, '').trim(), // Remove percentages
            normalized: ing.replace(/\d+\.?\d*%/g, '').trim().toUpperCase(),
        }));
}

/**
 * Check if product might be a beauty product based on barcode prefix
 * (Heuristic - not 100% reliable)
 */
export function mightBeBeautyProduct(barcode) {
    if (!barcode) return false;

    // Common beauty product manufacturer prefixes
    const beautyPrefixes = [
        '301', '302', '303', // L'Oréal
        '304', '305',       // Unilever personal care
        '360',              // Johnson & Johnson
        '890', '880',       // Korean cosmetics (K-beauty) / Japanese cosmetics
        '871',              // Netherlands personal care
        '888',              // Thai cosmetics
        '869',              // Turkish cosmetics
        '602',              // Beauty brands (The Ordinary, etc.)
        '309',              // Garnier, L'Oréal Paris
        '400',              // Nivea, Beiersdorf
        '401',              // Dove, Unilever
        '501',              // CeraVe
        '887',              // COSRX, Korean brands
        '884',              // Innisfree, Korean brands
        '883',              // Etude House, Korean brands
    ];

    return beautyPrefixes.some(prefix => barcode.startsWith(prefix));
}
/**
 * Search for alternative beauty products in the same category
 * PRIORITY: Find products in the SAME product type (deodorant → deodorant, not hand cream)
 * @param {Object} product - Current product
 * @param {number} limit - Number of alternatives to return
 * @returns {Promise<Array>} Array of alternative products with scores
 */
export async function getBeautyAlternatives(product, limit = 5) {
    try {
        const allAlternatives = [];
        const seenBarcodes = new Set([product.barcode]);
        const currentBrand = (product.brand || '').toLowerCase().split(' ')[0];
        const targetSubtype = product.productSubtype || determineProductSubtype(product.categories || []);

        console.log('[OpenBeautyFacts] Finding alternatives for:', product.name);
        console.log('[OpenBeautyFacts] Target subtype:', targetSubtype, '| Brand to exclude:', currentBrand);

        // Strategy 1: Search by product subtype (MOST IMPORTANT)
        // This ensures we get deodorants for deodorants, skincare for skincare, etc.
        if (targetSubtype && targetSubtype !== 'OTHER') {
            const subtypeSearchTerm = getSearchTermForSubtype(targetSubtype);
            console.log('[OpenBeautyFacts] Strategy 1 - Subtype search:', subtypeSearchTerm);

            await enforceRateLimit();
            const results = await searchBeautyByTermWithCategoryFilter(
                subtypeSearchTerm,
                seenBarcodes,
                currentBrand,
                targetSubtype,
                limit * 4
            );

            results.forEach(p => {
                if (allAlternatives.length < limit) {
                    seenBarcodes.add(p.barcode);
                    allAlternatives.push(p);
                }
            });
            console.log('[OpenBeautyFacts] Strategy 1 found:', results.length, 'matching products');
        }

        // Strategy 2: Search by category tags if we need more
        if (allAlternatives.length < limit && product.categories?.length > 0) {
            // Find a relevant category tag
            const categoryTag = product.categories.find(c =>
                c.includes('deodorant') || c.includes('skincare') || c.includes('shampoo') ||
                c.includes('cream') || c.includes('soap') || c.includes('lotion')
            ) || product.categories[0];

            const categoryTerm = categoryTag
                .replace(/en:/g, '')
                .replace(/-/g, ' ')
                .split(' ')
                .filter(w => w.length > 2)
                .slice(0, 2)
                .join(' ');

            if (categoryTerm && categoryTerm.length > 2) {
                console.log('[OpenBeautyFacts] Strategy 2 - Category search:', categoryTerm);

                await enforceRateLimit();
                const results = await searchBeautyByTermWithCategoryFilter(
                    categoryTerm,
                    seenBarcodes,
                    currentBrand,
                    targetSubtype,
                    limit * 3
                );

                results.forEach(p => {
                    if (allAlternatives.length < limit) {
                        seenBarcodes.add(p.barcode);
                        allAlternatives.push(p);
                    }
                });
                console.log('[OpenBeautyFacts] Strategy 2 found:', results.length, 'matching products');
            }
        }

        // Strategy 3: Broader search without category filter (last resort)
        if (allAlternatives.length < limit) {
            const broadTerm = getSearchTermForSubtype(targetSubtype) || 'cosmetic';
            console.log('[OpenBeautyFacts] Strategy 3 - Broad search:', broadTerm);

            await enforceRateLimit();
            const results = await searchBeautyByTerm(broadTerm, seenBarcodes, currentBrand, limit * 2);

            results.forEach(p => {
                if (allAlternatives.length < limit) {
                    seenBarcodes.add(p.barcode);
                    allAlternatives.push(p);
                }
            });
            console.log('[OpenBeautyFacts] Strategy 3 found:', results.length, 'products');
        }

        // Sort by safety score and diversify by brand
        const sorted = allAlternatives.sort((a, b) => b.safetyScore - a.safetyScore);
        const diversified = diversifyByBrand(sorted, limit);

        console.log('[OpenBeautyFacts] Total alternatives:', diversified.length);
        return diversified;
    } catch (error) {
        console.error('[OpenBeautyFacts] Alternatives search error:', error);
        return [];
    }
}

/**
 * Get appropriate search term for each product subtype
 */
function getSearchTermForSubtype(subtype) {
    const searchTerms = {
        'DEODORANT': 'deodorant antiperspirant',
        'SKINCARE': 'face cream moisturizer',
        'HAIRCARE': 'shampoo hair',
        'MAKEUP': 'makeup cosmetic',
        'BODY_WASH': 'shower gel body wash',
        'FRAGRANCE': 'perfume eau',
        'ORAL_CARE': 'toothpaste dental',
        'SUNSCREEN': 'sunscreen spf',
        'BABY': 'baby lotion',
        'OTHER': 'cosmetic',
    };
    return searchTerms[subtype] || 'cosmetic';
}

/**
 * Check if a product's categories match the target subtype
 */
function matchesSubtype(productCategories, targetSubtype) {
    if (!targetSubtype || targetSubtype === 'OTHER') return true;

    const categoryStr = (productCategories || []).join(' ').toLowerCase();

    const subtypePatterns = {
        'DEODORANT': ['deodorant', 'antiperspirant', 'deo'],
        'SKINCARE': ['skincare', 'face', 'moisturizer', 'cream', 'serum', 'micellar', 'cleanser'],
        'HAIRCARE': ['shampoo', 'hair', 'conditioner'],
        'MAKEUP': ['makeup', 'lipstick', 'mascara', 'foundation', 'cosmetic'],
        'BODY_WASH': ['body-wash', 'shower', 'soap', 'body wash'],
        'FRAGRANCE': ['perfume', 'fragrance', 'eau-de'],
        'ORAL_CARE': ['toothpaste', 'dental', 'oral', 'mouthwash'],
        'SUNSCREEN': ['sunscreen', 'sun-protection', 'spf'],
        'BABY': ['baby', 'infant'],
    };

    const patterns = subtypePatterns[targetSubtype] || [];
    return patterns.some(pattern => categoryStr.includes(pattern));
}

/**
 * Extract relevant keywords from product name
 */
function extractProductKeywords(name) {
    if (!name) return [];

    const stopWords = ['the', 'for', 'with', 'and', 'de', 'des', 'la', 'le', 'les', 'en', 'ml', 'oz', 'fl'];

    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.includes(w))
        .filter(w => !/^\d+$/.test(w)); // Remove pure numbers
}

/**
 * Search beauty products by term with filtering
 */
async function searchBeautyByTerm(searchTerm, seenBarcodes, excludeBrand, pageSize) {
    try {
        const params = new URLSearchParams({
            search_terms: searchTerm,
            page: 1,
            page_size: pageSize,
            fields: 'code,product_name,brands,image_url,categories_tags,ingredients_text,labels_tags',
        });

        const response = await fetch(`${BASE_URL}/search?${params}`, {
            headers: {
                'User-Agent': USER_AGENT,
            },
        });

        if (!response.ok) {
            console.warn('[OpenBeautyFacts] Search failed:', response.status);
            return [];
        }

        const data = await response.json();
        return (data.products || [])
            .filter(p => !seenBarcodes.has(p.code))
            .filter(p => p.product_name && p.product_name.length > 0)
            // Exclude same brand for diversity
            .filter(p => {
                const brand = (p.brands || '').toLowerCase().split(' ')[0];
                return brand !== excludeBrand;
            })
            .map(p => {
                const parsed = parseBeautyProduct(p);
                return {
                    ...parsed,
                    safetyScore: calculateBeautyAlternativeScore(parsed),
                };
            })
            .sort((a, b) => b.safetyScore - a.safetyScore);
    } catch (error) {
        console.error('[OpenBeautyFacts] Search error:', error);
        return [];
    }
}

/**
 * Search beauty products with category filtering
 * Only returns products that match the target subtype
 */
async function searchBeautyByTermWithCategoryFilter(searchTerm, seenBarcodes, excludeBrand, targetSubtype, pageSize) {
    try {
        const params = new URLSearchParams({
            search_terms: searchTerm,
            page: 1,
            page_size: pageSize,
            fields: 'code,product_name,brands,image_url,categories_tags,ingredients_text,labels_tags',
        });

        const response = await fetch(`${BASE_URL}/search?${params}`, {
            headers: {
                'User-Agent': USER_AGENT,
            },
        });

        if (!response.ok) {
            console.warn('[OpenBeautyFacts] Search failed:', response.status);
            return [];
        }

        const data = await response.json();
        const allProducts = data.products || [];

        console.log('[OpenBeautyFacts] Raw search results:', allProducts.length);

        return allProducts
            .filter(p => !seenBarcodes.has(p.code))
            .filter(p => p.product_name && p.product_name.length > 0)
            // Exclude same brand for diversity
            .filter(p => {
                const brand = (p.brands || '').toLowerCase().split(' ')[0];
                return brand !== excludeBrand;
            })
            // CRITICAL: Filter to only products matching the target subtype
            .filter(p => matchesSubtype(p.categories_tags, targetSubtype))
            .map(p => {
                const parsed = parseBeautyProduct(p);
                return {
                    ...parsed,
                    safetyScore: calculateBeautyAlternativeScore(parsed),
                };
            })
            .sort((a, b) => b.safetyScore - a.safetyScore);
    } catch (error) {
        console.error('[OpenBeautyFacts] Search with filter error:', error);
        return [];
    }
}

/**
 * Diversify results by brand - max 2 per brand
 */
function diversifyByBrand(products, limit) {
    const brandCounts = {};
    const result = [];

    for (const product of products) {
        const brand = (product.brand || 'unknown').toLowerCase().split(' ')[0];
        const count = brandCounts[brand] || 0;

        if (count < 2) {
            result.push(product);
            brandCounts[brand] = count + 1;

            if (result.length >= limit) break;
        }
    }

    return result;
}

/**
 * Calculate a quick safety score for beauty alternatives
 * (Lighter version of full cosmeticSafety analysis)
 */
function calculateBeautyAlternativeScore(product) {
    let score = 80; // Start at 80 (good default)

    const ingredientsText = (product.ingredientsText || '').toLowerCase();

    // Positive indicators
    if (product.isOrganic) score += 5;
    if (product.isVegan) score += 3;
    if (product.isCrueltyFree) score += 3;

    // Negative indicators (simple pattern matching)
    const concerns = [
        { pattern: /formaldehyde/i, penalty: 20 },
        { pattern: /paraben/i, penalty: 10 },
        { pattern: /sodium lauryl sulfate/i, penalty: 5 },
        { pattern: /fragrance|parfum/i, penalty: 5 },
        { pattern: /oxybenzone/i, penalty: 10 },
        { pattern: /retinol|retinoid/i, penalty: 5 },
        { pattern: /phthalate/i, penalty: 15 },
    ];

    for (const concern of concerns) {
        if (concern.pattern.test(ingredientsText)) {
            score -= concern.penalty;
        }
    }

    // Data quality bonus
    if (ingredientsText.length > 50) score += 5;

    return Math.max(30, Math.min(100, score));
}
