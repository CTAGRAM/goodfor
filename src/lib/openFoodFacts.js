/**
 * OpenFoodFacts API Client
 * Documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const USER_AGENT = 'GoodFor/1.0 (contact@goodfor.app)';

import { cacheProductOffline, getCachedProductOffline } from './offlineCache';

// V4: Country subdomain mapping for region-filtered results
const COUNTRY_SUBDOMAINS = {
    'US': 'us', 'GB': 'uk', 'UK': 'uk', 'FR': 'fr', 'DE': 'de', 'ES': 'es',
    'IT': 'it', 'NL': 'nl', 'BE': 'be', 'CH': 'ch', 'AT': 'at', 'AU': 'au',
    'CA': 'ca', 'SE': 'se', 'NO': 'no', 'DK': 'dk', 'FI': 'fi', 'PL': 'pl',
    'PT': 'pt', 'BR': 'br', 'MX': 'mx', 'IN': 'in', 'JP': 'jp', 'KR': 'kr',
    'SG': 'sg', 'HK': 'hk', 'AE': 'world', 'SA': 'world', 'ZA': 'za',
};

// Rate limiting: 100 requests/minute for products
const RATE_LIMIT_INTERVAL = 600; // 600ms between requests = 100/minute
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
 * Fetch product by barcode
 * @param {string} barcode - Product barcode (EAN-13, UPC-A, etc.)
 * @returns {Promise<Object>} Product data or null if not found
 */
export async function getProductByBarcode(barcode) {
    try {
        // First check offline cache
        const cachedProduct = await getCachedProductOffline(barcode);
        if (cachedProduct) {
            console.log(`[OpenFoodFacts] Serving ${barcode} from offline cache`);
            return { ...cachedProduct, isOffline: true };
        }

        await enforceRateLimit();

        const response = await fetch(`${BASE_URL}/product/${barcode}.json`, {
            headers: {
                'User-Agent': USER_AGENT,
            },
        });

        // 404 means product not found - return null instead of throwing
        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if product was found
        if (data.status === 0 || !data.product) {
            return null;
        }

        const parsedProduct = parseProduct(data.product);
        
        // Save to offline cache asynchronously
        cacheProductOffline(barcode, parsedProduct);
        
        return parsedProduct;
    } catch (error) {
        console.error('OpenFoodFacts API error:', error);
        // Return null on network errors to allow fallback
        return null;
    }
}

/**
 * Search products by name
 * @param {string} query - Search query
 * @param {number} page - Page number (default: 1)
 * @returns {Promise<Array>} Array of products
 */
export async function searchProducts(query, page = 1) {
    try {
        await enforceRateLimit();

        const params = new URLSearchParams({
            search_terms: query,
            page: page,
            page_size: 20,
            fields: 'code,product_name,brands,image_url,nutriscore_grade',
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
        return data.products || [];
    } catch (error) {
        console.error('OpenFoodFacts search error:', error);
        throw error;
    }
}

/**
 * Parse and normalize product data
 * @param {Object} rawProduct - Raw product data from API
 * @returns {Object} Normalized product object
 */
function parseProduct(rawProduct) {
    // Better name fallback chain
    const productName = rawProduct.product_name
        || rawProduct.generic_name
        || rawProduct.product_name_en
        || (rawProduct.brands ? `${rawProduct.brands} Product` : null)
        || (rawProduct.categories_tags?.[0] ? rawProduct.categories_tags[0].replace('en:', '').replace(/-/g, ' ') : null)
        || `Product ${rawProduct.code}`;

    return {
        barcode: rawProduct.code || '',
        name: productName,
        brand: rawProduct.brands || '',
        imageUrl: rawProduct.image_url || rawProduct.image_front_url || null,

        // Ingredients
        ingredientsText: rawProduct.ingredients_text || '',
        ingredientsList: rawProduct.ingredients || [],

        // Allergens
        allergens: rawProduct.allergens_tags || [],
        traces: rawProduct.traces_tags || [],

        // Additives (E-numbers)
        additives: rawProduct.additives_tags || [],

        // Nutrition data (per 100g)
        nutriments: {
            energy_kcal: rawProduct.nutriments?.['energy-kcal_100g'] || 0,
            sugars: rawProduct.nutriments?.sugars_100g || 0,
            sodium: rawProduct.nutriments?.sodium_100g || 0,
            salt: rawProduct.nutriments?.salt_100g || 0,
            saturated_fat: rawProduct.nutriments?.['saturated-fat_100g'] || 0,
            proteins: rawProduct.nutriments?.proteins_100g || 0,
            fiber: rawProduct.nutriments?.fiber_100g || 0,
            caffeine: rawProduct.nutriments?.caffeine_100g || 0,
        },

        // Scores and grades
        nutriScore: rawProduct.nutrition_grades || null,
        novaGroup: rawProduct.nova_group || null,
        ecoScore: rawProduct.ecoscore_grade || null,

        // V4: Environmental data enrichment
        ecoScoreData: rawProduct.ecoscore_data || null,
        packaging: rawProduct.packaging || null,
        packaging_tags: rawProduct.packaging_tags || [],
        countries_tags: rawProduct.countries_tags || [],
        carbonFootprint: rawProduct.ecoscore_data?.agribalyse?.co2_total
            || rawProduct.carbon_footprint_percent_of_known_ingredients || null,
        labels_tags: rawProduct.labels_tags || [],

        // Categories
        categories: rawProduct.categories_tags || [],

        // Serving size
        servingSize: rawProduct.serving_size || null,

        // Raw data for debugging
        _raw: rawProduct,
    };
}

/**
 * Get allergen-friendly name from tag
 * @param {string} allergenTag - Allergen tag (e.g., "en:milk")
 * @returns {string} Friendly name
 */
export function getAllergenName(allergenTag) {
    const allergenMap = {
        'en:milk': 'Milk',
        'en:eggs': 'Eggs',
        'en:fish': 'Fish',
        'en:shellfish': 'Shellfish',
        'en:tree-nuts': 'Tree Nuts',
        'en:peanuts': 'Peanuts',
        'en:wheat': 'Wheat',
        'en:gluten': 'Gluten',
        'en:soybeans': 'Soy',
        'en:sesame-seeds': 'Sesame',
        'en:celery': 'Celery',
        'en:mustard': 'Mustard',
        'en:sulphur-dioxide-and-sulphites': 'Sulphites',
        'en:lupin': 'Lupin',
        'en:molluscs': 'Molluscs',
    };

    return allergenMap[allergenTag] || allergenTag.replace('en:', '').replace(/-/g, ' ');
}

/**
 * Check if product contains specific allergen
 * @param {Object} product - Parsed product object
 * @param {string} allergen - Allergen to check (e.g., "milk", "nuts")
 * @returns {boolean} True if allergen is present
 */
export function containsAllergen(product, allergen) {
    const allergenLower = allergen.toLowerCase();

    // Check allergens tags
    const hasInAllergens = product.allergens.some(tag =>
        tag.toLowerCase().includes(allergenLower)
    );

    // Check traces
    const hasInTraces = product.traces.some(tag =>
        tag.toLowerCase().includes(allergenLower)
    );

    return hasInAllergens || hasInTraces;
}

/**
 * Get safer alternatives for a product
 * V4: Now supports country and category filtering
 * @param {Object} product - Current product
 * @param {number} count - Number of alternatives to return
 * @param {Object} options - { country: 'US', categoryTags: [...] }
 * @returns {Promise<Array>} Array of alternative products
 */
export async function getAlternatives(product, count = 5, options = {}) {
    try {
        const allAlternatives = [];
        const seenBarcodes = new Set([product.barcode]);

        // V4: Determine country-specific base URL
        const countryCode = options.country || 'US';
        const subdomain = COUNTRY_SUBDOMAINS[countryCode.toUpperCase()] || 'world';
        const countryBaseUrl = `https://${subdomain}.openfoodfacts.org`;
        console.log('[Alternatives] Using country:', countryCode, '→', countryBaseUrl);

        // V4: Get category tags for filtering — use MOST SPECIFIC categories (last tags)
        // to prevent broad matches (e.g. both "biscuits" and "coke" sharing "en:snacks")
        const productCategories = product.categories || options.categoryTags || [];
        const filterCategories = productCategories.length > 3
            ? productCategories.slice(-3)  // last 3 = most specific
            : productCategories;

        // V6: Extract product-type keywords from the product name for relevance checking
        // This helps when the product only has broad categories like "en:plant-based-foods-and-beverages"
        const productNameWords = (product.name || '')
            .toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !['with', 'and', 'the', 'for', 'from', 'pack', 'size', 'premium', 'original', 'classic'].includes(w));

        // V6: Detect if we only have broad/generic categories (1-2 top-level tags)
        const hasOnlyBroadCategories = productCategories.length <= 2;

        // V6: Helper to check category overlap + name relevance
        const hasMatchingCategory = (altCategories, altName) => {
            if (!filterCategories.length) return true; // no filter = pass all

            // Check category overlap
            const categoryMatch = filterCategories.some(cat => altCategories?.includes(cat));

            // If we have specific categories and there's a match, that's good enough
            if (categoryMatch && !hasOnlyBroadCategories) return true;

            // V6: For products with only broad categories, also check name relevance
            // e.g., if product is "Dates", alt should contain "date" in name or categories
            if (hasOnlyBroadCategories && productNameWords.length > 0) {
                const altNameLower = (altName || '').toLowerCase();
                const altCatString = (altCategories || []).join(' ').toLowerCase();
                const nameRelevance = productNameWords.some(word =>
                    altNameLower.includes(word) || altCatString.includes(word)
                );
                // If name has no overlap and only broad category match, reject
                if (!nameRelevance && categoryMatch) return false;
                if (nameRelevance) return true;
            }

            return categoryMatch;
        };

        // Strategy 1: Category-based search (MOST EFFECTIVE)
        // V4 FIX: Use most specific category (last in list) instead of generic (first)
        // e.g. use "en:chocolate-biscuits" instead of "en:snacks"
        if (productCategories.length > 0) {
            // Filter out internal/administrative tags
            const validCategories = productCategories.filter(c => !c.includes(':') || c.startsWith('en:'));
            const categoryTag = validCategories[validCategories.length - 1] || productCategories[0];

            console.log('[Alternatives] Strategy 1: Specific Category search:', categoryTag);

            try {
                await enforceRateLimit();
                // V4: Add country filtering explicitly to query params
                // Note: The subdomain handles most of it, but this reinforces it
                const categoryUrl = `${countryBaseUrl}/category/${categoryTag}.json?page_size=${count * 6}&fields=code,product_name,brands,image_url,nutriscore_grade,nova_group,additives_tags,allergens_tags,nutriments,categories_tags`;

                const response = await fetch(categoryUrl, {
                    headers: { 'User-Agent': USER_AGENT },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('[Alternatives] Category raw results:', data.products?.length || 0);

                    const products = (data.products || [])
                        .filter(p => !seenBarcodes.has(p.code) && p.product_name)
                        // V4: Filter by category overlap (at least 1 shared category)
                        .filter(p => hasMatchingCategory(p.categories_tags, p.product_name))
                        .sort((a, b) => {
                            const gradeOrder = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'unknown': 5 };
                            return (gradeOrder[a.nutriscore_grade] || 5) - (gradeOrder[b.nutriscore_grade] || 5);
                        });

                    products.slice(0, count).forEach(p => {
                        seenBarcodes.add(p.code);
                        allAlternatives.push(parseProduct(p));
                    });
                    console.log('[Alternatives] Category search found:', products.length, 'products, kept:', Math.min(products.length, count));
                } else {
                    console.log('[Alternatives] Category search failed with status:', response.status);
                }
            } catch (e) {
                console.log('[Alternatives] Category search error:', e.message);
            }
        }

        // Return if we have enough
        if (allAlternatives.length >= count) {
            return allAlternatives.slice(0, count);
        }

        // Strategy 2: Text search with product name keywords
        // V7: PRIORITIZE product name keywords FIRST, then category text
        // This ensures 'dates' is searched before 'plant based foods'
        const searchTerms = [];

        // V7: Add product-specific keywords FIRST (most relevant)
        if (product.name && product.name !== 'Unknown Product') {
            const nameWords = product.name
                .toLowerCase()
                .replace(/[^a-z\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !['with', 'and', 'the', 'for', 'from', 'pack', 'size',
                    'premium', 'original', 'classic', 'flavour', 'flavor', 'natural'].includes(w));
            // Use the most descriptive word(s) from the product name
            if (nameWords.length > 0) {
                // Try compound term first (e.g. 'dates crown'), then single words
                const compound = nameWords.slice(0, 2).join(' ');
                searchTerms.push(compound);
                // Add single most descriptive word as fallback
                if (nameWords[0] && !searchTerms.includes(nameWords[0])) {
                    searchTerms.push(nameWords[0]);
                }
            }
        }

        // Then add category-based search terms (secondary)
        if (productCategories.length > 0) {
            const validCategories = productCategories.filter(c => !c.includes(':') || c.startsWith('en:'));
            const bestCategory = validCategories[validCategories.length - 1] || productCategories[productCategories.length - 1];
            const cleanCategory = bestCategory
                .replace('en:', '')
                .replace(/-/g, ' ')
                .split(' ')
                .filter(w => w.length > 2)
                .slice(0, 3)
                .join(' ');
            if (cleanCategory && cleanCategory.length > 3 && !searchTerms.includes(cleanCategory)) {
                searchTerms.push(cleanCategory);
            }
        }

        // Try each search term
        for (const searchTerm of searchTerms) {
            if (allAlternatives.length >= count) break;

            console.log('[Alternatives] Strategy 2: Text search:', searchTerm);
            await enforceRateLimit();

            const params = new URLSearchParams({
                search_terms: searchTerm,
                page_size: String(count * 4),
                fields: 'code,product_name,brands,image_url,nutriscore_grade,nova_group,additives_tags,allergens_tags,nutriments,categories_tags',
                sort_by: 'unique_scans_n',
                cc: countryCode.toLowerCase(), // V4: Filter by country code
            });

            try {
                // V4: Use country-specific API
                const response = await fetch(`${countryBaseUrl}/api/v2/search?${params}`, {
                    headers: { 'User-Agent': USER_AGENT },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('[Alternatives] Text search raw results:', data.products?.length || 0, 'for:', searchTerm);

                    // V7: For text search, DON'T apply strict category filter
                    // The text search term itself provides relevance (e.g. 'dates' → date products)
                    // Strict category filter rejects valid results with non-English names or different category tags
                    const products = (data.products || [])
                        .filter(p => !seenBarcodes.has(p.code) && p.product_name)
                        .sort((a, b) => {
                            const gradeOrder = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'unknown': 5 };
                            return (gradeOrder[a.nutriscore_grade] || 5) - (gradeOrder[b.nutriscore_grade] || 5);
                        });

                    products.slice(0, count - allAlternatives.length).forEach(p => {
                        seenBarcodes.add(p.code);
                        allAlternatives.push(parseProduct(p));
                    });
                    console.log('[Alternatives] Text search found:', products.length, 'products for:', searchTerm);
                } else {
                    console.log('[Alternatives] Text search failed with status:', response.status, 'for:', searchTerm);
                }
            } catch (e) {
                console.log('[Alternatives] Text search error:', e.message);
            }
        }

        // Strategy 3: Product-specific fallback if still no results
        if (allAlternatives.length === 0) {
            // Build a search term from product name/categories instead of generic "organic natural"
            const fallbackTerms = [];

            // Extract meaningful words from product name
            const nameWords = (product.name || '')
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !['with', 'and', 'the', 'for', 'from', 'pack', 'size', 'original', 'classic', 'flavour', 'flavor'].includes(w));
            if (nameWords.length > 0) {
                fallbackTerms.push(nameWords.slice(0, 2).join(' '));
            }

            // Extract clean category name
            if (productCategories.length > 0) {
                const cleanCat = productCategories[productCategories.length - 1] // Most specific category (last one)
                    .replace('en:', '')
                    .replace(/-/g, ' ');
                if (cleanCat.length > 2) fallbackTerms.push(cleanCat);
            }

            // Use first available term, or give up with a readable message
            const fallbackSearch = fallbackTerms[0] || 'healthy snack';
            console.log('[Alternatives] Strategy 3: Product-specific fallback:', fallbackSearch);
            await enforceRateLimit();

            const params = new URLSearchParams({
                search_terms: fallbackSearch,
                nutrition_grades_tags: 'a,b',
                page_size: String(count * 3),
                fields: 'code,product_name,brands,image_url,nutriscore_grade,nova_group,additives_tags,allergens_tags,nutriments,categories_tags',
                sort_by: 'unique_scans_n',
                cc: countryCode.toLowerCase(), // V4: Filter by country
            });

            try {
                // V4: Use country-specific API for fallback too
                const response = await fetch(`${countryBaseUrl}/api/v2/search?${params}`, {
                    headers: { 'User-Agent': USER_AGENT },
                });

                if (response.ok) {
                    const data = await response.json();
                    const products = (data.products || [])
                        .filter(p => !seenBarcodes.has(p.code) && p.product_name)
                        // V7: No strict category filter for fallback — search term provides relevance
                        .slice(0, count);

                    products.forEach(p => {
                        allAlternatives.push(parseProduct(p));
                    });
                    console.log('[Alternatives] Fallback found:', products.length, 'products for:', fallbackSearch);
                }
            } catch (e) {
                console.log('[Alternatives] Fallback search error:', e.message);
            }
        }

        console.log('[Alternatives] Total returning:', allAlternatives.length, 'alternatives');
        return allAlternatives.slice(0, count);
    } catch (error) {
        console.error('[Alternatives] Error:', error.message);
        return [];
    }
}


export default {
    getProductByBarcode,
    searchProducts,
    getAlternatives,
    getAllergenName,
    containsAllergen,
};
