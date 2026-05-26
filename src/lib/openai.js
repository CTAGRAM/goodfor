// Lumi AI — Secure Edge Function Client with Direct OpenAI Fallback
// Primary: Supabase Edge Function (lumi-chat)
// Fallback: Direct OpenAI API call if edge function fails

import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const FORMATTING_RULES = `
## Response Formatting Rules (CRITICAL — follow exactly):
- Use ## headers to organize your response into clear sections (e.g. ## Key Concerns, ## Verdict)
- You MUST include a "## Nutrition Analysis" section for food products. List nutrients like this exactly: "- **Sugar:** 12g (High)" or "- **Fiber:** 2g (Good)". Use parentheses for status (High/Moderate/Good).
- When listing ingredients or items to watch, use numbered lists with bold names: "1. **Sugar**" then use bullet points under each for details
- Under each ingredient/item, use sub-bullets starting with a label: "- What it is: ...", "- Why it matters: ..."
- Do NOT use emoji — the app renders visual icons automatically
- Do NOT repeat the product name or safety score — the app shows those visually
- Keep each section focused. Use short, scannable sentences
- End with a brief ## Verdict section summarizing your recommendation`;

const SYSTEM_PROMPT = `You are Lumi, GoodFor's friendly and knowledgeable AI health assistant. You help users understand food products, ingredients, nutrition labels, and make healthier choices. You also help with recipes, meal planning, pantry management, and healthy shopping.

Key traits:
- Friendly, clear, and concise
- Evidence-based advice
- Consider user's allergens, dietary preferences, and family members
- When analyzing products, highlight concerns and suggest alternatives
- When helping with recipes, focus on ingredient health and suggest swaps
- Keep responses focused and actionable
${FORMATTING_RULES}`;

/**
 * Build the system prompt with user context
 */
const buildSystemPrompt = (ageGroup, userContext) => {
    let contextParts = [SYSTEM_PROMPT];

    if (ageGroup) {
        contextParts.push(`\nThe user's age group context is: ${ageGroup}. Tailor your advice accordingly.`);
    }

    if (userContext?.allergens?.length > 0) {
        contextParts.push(`\nUser allergens: ${userContext.allergens.join(', ')}. Always flag these!`);
    }

    if (userContext?.dietaryPreferences?.length > 0) {
        contextParts.push(`\nDietary preferences: ${userContext.dietaryPreferences.join(', ')}.`);
    }

    if (userContext?.recentScans?.length > 0) {
        const scanSummary = userContext.recentScans.slice(0, 5).map(s =>
            `${s.product_name} (${s.brand || 'Unknown brand'}) - Score: ${s.safety_score}, Level: ${s.safety_level}`
        ).join('\n');
        contextParts.push(`\nRecent scans:\n${scanSummary}`);
    }

    if (userContext?.userName) {
        contextParts.push(`\nUser's name: ${userContext.userName}`);
    }

    return contextParts.join('\n');
};

/**
 * Try sending via Supabase Edge Function first
 */
const sendViaEdgeFunction = async (messages, ageGroup, userContext, imageData = null) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('You must be signed in to use Lumi');
    }

    const body = {
        messages,
        ageGroup,
        userContext,
    };

    // Attach image data if present
    if (imageData) {
        body.imageBase64 = imageData.base64;
        body.imageMimeType = imageData.mimeType || 'image/jpeg';
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/lumi-chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        let errorMessage = `Edge function error (${response.status})`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            // Ignore JSON parse error
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data?.success) {
        throw new Error(data?.error || 'Failed to get AI response');
    }

    return data.content;
};

/**
 * Direct OpenAI API fallback (text only — images not supported in fallback)
 */
const sendViaOpenAI = async (messages, ageGroup, userContext) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    const systemPrompt = buildSystemPrompt(ageGroup, userContext);

    const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages,
    ];

    console.log('[Lumi] Sending via direct OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        let errorMessage = `OpenAI API error (${response.status})`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
            // Ignore
        }
        console.error('[Lumi] OpenAI error:', errorMessage);
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
};

/**
 * Send a message to Lumi — tries Edge Function first, falls back to direct OpenAI
 * @param {Array} messages - Conversation messages
 * @param {string} ageGroup - User age group
 * @param {Object} userContext - User preferences
 * @param {boolean} _isBeautyProduct - DEPRECATED, kept for backward compat, ignored
 * @param {Object|null} imageData - Optional { base64, mimeType } for image analysis
 */
export const sendMessage = async (messages, ageGroup = 'adult', userContext = {}, _isBeautyProduct = false, imageData = null) => {
    console.log('[Lumi] Sending message, hasImage:', !!imageData);

    // Try Edge Function first
    try {
        const result = await sendViaEdgeFunction(messages, ageGroup, userContext, imageData);
        console.log('[Lumi] Edge function success');
        return result;
    } catch (edgeError) {
        console.warn('[Lumi] Edge function failed, trying direct OpenAI:', edgeError.message);
    }

    // Fallback to direct OpenAI (text only)
    try {
        const result = await sendViaOpenAI(messages, ageGroup, userContext);
        console.log('[Lumi] Direct OpenAI success');
        return result;
    } catch (openaiError) {
        console.error('[Lumi] Direct OpenAI also failed:', openaiError.message);
        throw openaiError;
    }
};
