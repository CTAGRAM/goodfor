// Lumi AI — Secure Edge Function Client with Direct OpenAI Fallback
// Primary: Supabase Edge Function (lumi-chat)
// Fallback: Direct OpenAI API call if edge function fails

import { supabase } from './supabaseAuth';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const SYSTEM_PROMPT_FOOD = `You are Lumi, GoodFor's friendly and knowledgeable AI health assistant. You help users understand food products, ingredients, nutrition labels, and make healthier choices.

Key traits:
- Friendly, clear, and concise
- Evidence-based advice
- Consider user's allergens, dietary preferences, and family members
- When analyzing products, highlight concerns and suggest alternatives
- Use emoji sparingly for friendliness
- Format responses with markdown for readability (bold, lists, headers)
- Keep responses focused and actionable`;

const SYSTEM_PROMPT_BEAUTY = `You are Lumi, GoodFor's friendly and knowledgeable AI beauty & skincare assistant. You help users understand cosmetic and beauty product ingredients, safety profiles, and make safer choices.

Key traits:
- Friendly, clear, and concise
- Evidence-based advice on ingredient safety
- Focus on sensitization risks, endocrine disruptors, and environmental impact
- Categorize ingredients by function (preservative, surfactant, active, UV filter, fragrance)
- Suggest gentler alternatives for problematic ingredients
- Use emoji sparingly for friendliness
- Format responses with markdown for readability (bold, lists, headers)
- Keep responses focused and actionable`;

/**
 * Build the system prompt with user context
 */
const buildSystemPrompt = (ageGroup, userContext, isBeauty) => {
    const base = isBeauty ? SYSTEM_PROMPT_BEAUTY : SYSTEM_PROMPT_FOOD;

    let contextParts = [base];

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
const sendViaEdgeFunction = async (messages, ageGroup, userContext, isBeautyProduct) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('You must be signed in to use Lumi');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/lumi-chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            messages,
            ageGroup,
            userContext,
            isBeautyProduct,
        }),
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
 * Direct OpenAI API fallback
 */
const sendViaOpenAI = async (messages, ageGroup, userContext, isBeautyProduct) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.');
    }

    const systemPrompt = buildSystemPrompt(ageGroup, userContext, isBeautyProduct);

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
            max_tokens: 1024,
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
 */
export const sendMessage = async (messages, ageGroup = 'adult', userContext = {}, isBeautyProduct = false) => {
    console.log('[Lumi] Sending message, isBeauty:', isBeautyProduct);

    // Try Edge Function first
    try {
        const result = await sendViaEdgeFunction(messages, ageGroup, userContext, isBeautyProduct);
        console.log('[Lumi] Edge function success');
        return result;
    } catch (edgeError) {
        console.warn('[Lumi] Edge function failed, trying direct OpenAI:', edgeError.message);
    }

    // Fallback to direct OpenAI
    try {
        const result = await sendViaOpenAI(messages, ageGroup, userContext, isBeautyProduct);
        console.log('[Lumi] Direct OpenAI success');
        return result;
    } catch (openaiError) {
        console.error('[Lumi] Direct OpenAI also failed:', openaiError.message);
        throw openaiError;
    }
};
