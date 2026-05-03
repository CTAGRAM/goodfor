/**
 * Gemini Vision Service — Label Photo Analysis
 * Uses Gemini 2.5 Flash Lite to extract ingredients and nutrition from product label photos
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const LABEL_ANALYSIS_PROMPT = `You are a food/cosmetic product label reader. Analyze this product label image and extract ALL available information.

Return a JSON object with EXACTLY this structure (no markdown, no code blocks, just raw JSON):
{
  "name": "product name if visible",
  "brand": "brand name if visible",
  "ingredientsText": "complete comma-separated ingredients list exactly as shown",
  "allergens": ["list", "of", "allergens", "mentioned"],
  "nutritionPer100g": {
    "energy_kcal": 0,
    "sugars": 0,
    "sodium": 0,
    "salt": 0,
    "saturated_fat": 0,
    "proteins": 0,
    "fiber": 0,
    "fat": 0
  },
  "servingSize": "e.g. 30g",
  "categories": ["best guess category"],
  "isBeautyProduct": false,
  "additionalNotes": "any warnings, halal/kosher marks, organic labels etc."
}

Rules:
- Extract ingredients EXACTLY as written on the label
- If nutrition values are per serving, convert to per 100g
- If a field is not visible, use null
- For allergens, include both declared allergens AND "may contain" traces
- Detect if this is a food or beauty/cosmetic product
- Return ONLY valid JSON, no other text`;

/**
 * Analyze a product label photo using Gemini Vision
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} mimeType - Image MIME type (image/jpeg, image/png)
 * @returns {Promise<Object>} Extracted product data
 */
export async function analyzeLabel(imageBase64, mimeType = 'image/jpeg') {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.');
    }

    console.log('[GeminiVision] Analyzing label image...');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: LABEL_ANALYSIS_PROMPT },
                    {
                        inlineData: {
                            mimeType,
                            data: imageBase64,
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048,
            }
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `Gemini API error (${response.status})`;
        console.error('[GeminiVision] API error:', msg);
        throw new Error(msg);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        throw new Error('No response from Gemini. The image may be unclear — try taking a clearer photo.');
    }

    // Parse JSON from response (Gemini sometimes wraps in ```json blocks)
    let cleaned = textContent.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned);
        console.log('[GeminiVision] Successfully parsed label data:', {
            name: parsed.name,
            ingredients: parsed.ingredientsText?.substring(0, 50) + '...',
            hasNutrition: !!parsed.nutritionPer100g,
        });
        return normalizeToProduct(parsed);
    } catch (e) {
        console.error('[GeminiVision] JSON parse failed:', e, '\nRaw:', cleaned.substring(0, 200));
        throw new Error('Could not parse the label. Please try a clearer photo with the ingredients list visible.');
    }
}

/**
 * Normalize Gemini output to match OpenFoodFacts product format
 * so it can be fed directly into analyzeProductSafety()
 */
function normalizeToProduct(geminiData) {
    const nutrition = geminiData.nutritionPer100g || {};

    return {
        barcode: 'PHOTO_SCAN',
        name: geminiData.name || 'Unknown Product',
        brand: geminiData.brand || '',
        imageUrl: null,
        ingredientsText: geminiData.ingredientsText || '',
        allergens: (geminiData.allergens || []).map(a => `en:${a.toLowerCase()}`),
        additives: [],
        traces: [],
        categories: geminiData.categories || ['Food Product'],
        productType: geminiData.isBeautyProduct ? 'BEAUTY' : 'FOOD',
        nutriments: {
            energy_kcal: nutrition.energy_kcal || 0,
            sugars: nutrition.sugars || 0,
            sodium: nutrition.sodium || 0,
            salt: nutrition.salt || 0,
            saturated_fat: nutrition.saturated_fat || 0,
            proteins: nutrition.proteins || 0,
            fiber: nutrition.fiber || 0,
            caffeine: 0,
            fat: nutrition.fat || 0,
        },
        serving_size: geminiData.servingSize || null,
        additionalNotes: geminiData.additionalNotes || null,
        _source: 'gemini_vision',
    };
}

/**
 * Analyze a product image for the AI chat (simpler, returns text description)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - MIME type
 * @param {string} userQuery - User's question about the image
 * @param {Object} userContext - User preferences for personalized analysis
 * @returns {Promise<string>} AI analysis text
 */
export async function analyzeImageForChat(imageBase64, mimeType, userQuery, userContext = {}) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured.');
    }

    const contextParts = [];
    if (userContext.allergens?.length) contextParts.push(`User allergens: ${userContext.allergens.join(', ')}`);
    if (userContext.dietaryPreferences?.length) contextParts.push(`Dietary: ${userContext.dietaryPreferences.join(', ')}`);
    if (userContext.ageGroup) contextParts.push(`Age group: ${userContext.ageGroup}`);

    const prompt = `You are Lumi, GoodFor's AI health assistant. The user sent a photo of a product/label and asks: "${userQuery || 'What can you tell me about this product?'}"

${contextParts.length ? `User profile:\n${contextParts.join('\n')}` : ''}

Analyze the image and provide helpful, actionable advice. Use markdown formatting. Be concise.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: imageBase64 } }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API error (${response.status})`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not analyze this image.';
}
