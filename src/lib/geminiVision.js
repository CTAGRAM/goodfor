/**
 * Gemini Vision Service — Label Photo Analysis
 * Uses Gemini 2.5 Flash Lite to extract ingredients and nutrition from product label photos
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
- Detect if this is a food or beauty/cosmetic product
- Return ONLY valid JSON, no other text`;

import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export async function analyzeLabel(imageBase64, mimeType = 'image/jpeg') {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing in .env');
    }

    console.log('[GeminiVision] Analyzing label via Supabase Edge Function...');

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
        throw new Error('You must be signed in to analyze labels');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-label`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            imageBase64,
            mimeType,
            prompt: LABEL_ANALYSIS_PROMPT,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || `Edge Function error (${response.status})`;
        console.error('[GeminiVision] API error:', msg);
        throw new Error(msg);
    }

    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to analyze label');
    }
    
    const textContent = data.content;

    if (!textContent) {
        throw new Error('No response from AI. The image may be unclear — try taking a clearer photo.');
    }

    // Parse JSON from response
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
 * Analyze a product image for the AI chat via Supabase Edge Function
 * Routes through lumi-chat which uses OpenAI vision (gpt-4o)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - MIME type
 * @param {string} userQuery - User's question about the image
 * @param {Object} userContext - User preferences for personalized analysis
 * @returns {Promise<string>} AI analysis text
 */
export async function analyzeImageForChat(imageBase64, mimeType, userQuery, userContext = {}) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing.');
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('You must be signed in to analyze images');
    }

    console.log('[GeminiVision] Analyzing image via lumi-chat edge function...');

    const messages = [
        { role: 'user', content: userQuery || 'What can you tell me about this product?' }
    ];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/lumi-chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            messages,
            ageGroup: userContext.ageGroup || 'adult',
            userContext,
            isBeautyProduct: false,
            imageBase64,
            imageMimeType: mimeType,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Image analysis error (${response.status})`);
    }

    const data = await response.json();

    if (!data?.success) {
        throw new Error(data?.error || 'Failed to analyze image');
    }

    return data.content;
}
