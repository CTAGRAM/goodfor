/**
 * OpenFoodFacts API Client
 * Documentation: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

const BASE_URL = 'https://world.openfoodfacts.org/api/v2';
const USER_AGENT = 'GoodFor/1.0 (contact@goodfor.app)';

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
        await enforceRateLimit();

        const response = await fetch(`${BASE_URL}/product/${barcode}.json`, {
            headers: {
                'User-Agent': USER_AGENT,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if product was found
        if (data.status === 0 || !data.product) {
            return null;
        }

        return parseProduct(data.product);
    } catch (error) {
        console.error('OpenFoodFacts API error:', error);
        throw error;
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
 * Uses multiple search strategies for best results:
 * 1. Category-based search (most effective)
 * 2. Text-based search with simplified terms
 * 3. Brand-based search
 * @param {Object} product - Current product
 * @param {number} count - Number of alternatives to return
 * @returns {Promise<Array>} Array of alternative products
 */
export async function getAlternatives(product, count = 5) {
    try {
        const allAlternatives = [];
        const seenBarcodes = new Set([product.barcode]);

        // Strategy 1: Category-based search (MOST EFFECTIVE)
        if (product.categories && product.categories.length > 0) {
            const categoryTag = product.categories[0]; // e.g., "en:beverages"
            console.log('[Alternatives] Strategy 1: Category search:', categoryTag);

            try {
                await enforceRateLimit();
                // Use category endpoint which is more reliable than text search
                const categoryUrl = `https://world.openfoodfacts.org/category/${categoryTag}.json?page_size=${count * 4}&fields=code,product_name,brands,image_url,nutriscore_grade,nova_group,additives_tags,allergens_tags,nutriments,categories_tags`;

                const response = await fetch(categoryUrl, {
                    headers: { 'User-Agent': USER_AGENT },
                });

                if (response.ok) {
                    const data = await response.json();
                    const products = (data.products || [])
                        .filter(p => !seenBarcodes.has(p.code) && p.product_name)
                        .filter(p => ['a', 'b', 'c'].includes(p.nutriscore_grade)) // Include A, B, C grades
                        .sort((a, b) => {
                            // Sort by nutriscore (a > b > c)
                            const gradeOrder = { 'a': 0, 'b': 1, 'c': 2 };
                            return (gradeOrder[a.nutriscore_grade] || 3) - (gradeOrder[b.nutriscore_grade] || 3);
                        });

                    products.slice(0, count).forEach(p => {
                        seenBarcodes.add(p.code);
                        allAlternatives.push(parseProduct(p));
                    });
                    console.log('[Alternatives] Category search found:', products.length, 'products');
                }
            } catch (e) {
                console.log('[Alternatives] Category search error:', e.message);
            }
        }

        // Return if we have enough
        if (allAlternatives.length >= count) {
            return allAlternatives.slice(0, count);
        }

        // Strategy 2: Text search with simplified category name
        const searchTerms = [];

        // Extract clean category name
        if (product.categories && product.categories.length > 0) {
            const cleanCategory = product.categories[0]
                .replace('en:', '')
                .replace(/-/g, ' ')
                .split(' ')
                .filter(w => w.length > 2)
                .slice(0, 2)
                .join(' ');
            if (cleanCategory && cleanCategory.length > 3) {
                searchTerms.push(cleanCategory);
            }
        }

        // Add product type keywords
        if (product.name && product.name !== 'Unknown Product') {
            const nameWords = product.name
                .toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 3 && !['with', 'and', 'the', 'for'].includes(w));
            if (nameWords.length > 0) {
                searchTerms.push(nameWords[0]);
            }
        }

        // Try each search term
        for (const searchTerm of searchTerms) {
            if (allAlternatives.length >= count) break;

            console.log('[Alternatives] Strategy 2: Text search:', searchTerm);
            await enforceRateLimit();

            const params = new URLSearchParams({
                search_terms: searchTerm,
                nutrition_grades_tags: 'a,b,c', // Expand to include C grade for more results
                page_size: String(count * 3),
                fields: 'code,product_name,brands,image_url,nutriscore_grade,nova_group,additives_tags,allergens_tags,nutriments,categories_tags',
                sort_by: 'unique_scans_n',
            });

            try {
                const response = await fetch(`${BASE_URL}/search?${params}`, {
                    headers: { 'User-Agent': USER_AGENT },
                });

                if (response.ok) {
                    const data = await response.json();
                    const products = (data.products || [])
                        .filter(p => !seenBarcodes.has(p.code) && p.product_name)
                        .sort((a, b) => {
                            const gradeOrder = { 'a': 0, 'b': 1, 'c': 2 };
                            return (gradeOrder[a.nutriscore_grade] || 3) - (gradeOrder[b.nutriscore_grade] || 3);
                        });

                    products.slice(0, count - allAlternatives.length).forEach(p => {
                        seenBarcodes.add(p.code);
                        allAlternatives.push(parseProduct(p));
                    });
                    console.log('[Alternatives] Text search found:', products.length, 'products for:', searchTerm);
                }
            } catch (e) {
                console.log('[Alternatives] Text search error:', e.message);
            }
        }

        // Strategy 3: Generic fallback if still no results
        if (allAlternatives.length === 0) {
            console.log('[Alternatives] Strategy 3: Generic fallback search');
            await enforceRateLimit();

            const params = new URLSearchParams({
                search_terms: 'organic natural',
                nutrition_grades_tags: 'a,b',
                page_size: String(count * 2),
                fields: 'code,product_name,brands,image_url,nutriscore_grade,nova_group,additives_tags,allergens_tags,nutriments,categories_tags',
                sort_by: 'unique_scans_n',
            });

            try {
                const response = await fetch(`${BASE_URL}/search?${params}`, {
                    headers: { 'User-Agent': USER_AGENT },
                });

                if (response.ok) {
                    const data = await response.json();
                    const products = (data.products || [])
                        .filter(p => !seenBarcodes.has(p.code) && p.product_name)
                        .slice(0, count);

                    products.forEach(p => {
                        allAlternatives.push(parseProduct(p));
                    });
                    console.log('[Alternatives] Fallback found:', products.length, 'products');
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
