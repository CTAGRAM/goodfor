// OpenAI service for AI chat
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const FOOD_SYSTEM_PROMPT = `You are a helpful nutrition and product safety assistant called "Goodfor AI". 
You help users understand food ingredients, nutritional information, and product safety.
You provide personalized advice based on the user's profile, preferences, and past scans.
Be concise, friendly, and focus on practical health advice.
When analyzing products:
- Highlight potentially harmful ingredients
- Explain what each ingredient does
- Provide safety scores when relevant
- Suggest healthier alternatives when asked
- Consider the user's allergens and dietary restrictions
Keep responses brief and easy to understand.`;

const BEAUTY_SYSTEM_PROMPT = `You are a cosmetic safety and skincare expert called "Goodfor AI".
You help users understand beauty product ingredients, safety, and suitability.
You provide personalized advice based on the user's skin type, sensitivities, and age.

RULES:
- NEVER mention food, nutrition, sugar, calories, Nutri-Score, or NOVA group
- Focus on INCI ingredient analysis, not dietary analysis
- Categorise ingredients by function (preservative, emollient, surfactant, active, UV filter, fragrance)
- Explain endocrine disruption, sensitisation, and irritation risks when relevant
- Distinguish between leave-on and rinse-off product exposure
- Reference EU/SCCS and FDA regulatory limits when applicable
- Suggest cleaner or gentler alternatives where appropriate
- Consider the user's age group for ingredient safety (e.g. retinol for children)
- Use clear, non-alarmist language but do not downplay real risks
Keep responses concise and focused on actionable skincare advice.`;

/**
 * Build user context string from profile data
 */
const buildUserContext = (userContext = {}) => {
    const parts = [];

    if (userContext.ageGroup) {
        const ageDescriptions = {
            adult: 'The user is asking about products for an adult.',
            child: 'The user is asking about products for a child (ages 4-12). Be extra cautious about sugar, caffeine, and allergens.',
            toddler: 'The user is asking about products for a toddler (ages 1-3). Be very strict about safety - no honey, no choking hazards, limited sugar and salt.',
            infant: 'The user is asking about products for an infant (under 1 year). Be extremely strict about safety.',
        };
        parts.push(ageDescriptions[userContext.ageGroup] || ageDescriptions.adult);
    }

    if (userContext.allergens?.length) {
        parts.push(`IMPORTANT: The user has the following allergens: ${userContext.allergens.join(', ')}. Always warn about these.`);
    }

    if (userContext.dietaryPreferences?.length) {
        parts.push(`User dietary preferences: ${userContext.dietaryPreferences.join(', ')}`);
    }

    if (userContext.familyMembers?.length) {
        const familyStr = userContext.familyMembers.map(m =>
            `- ${m.name} (${m.age_group}): ${m.dietary_preferences?.join(', ') || 'No specific diet'}`
        ).join('\n');
        parts.push(`Family Members:\n${familyStr}`);
    }

    if (userContext.recentScans?.length) {
        const scanList = userContext.recentScans.slice(0, 5).map(s => {
            const safeInfo = `Safety: ${s.safety_level} (${s.safety_score})`;
            const details = s.ingredients ? `\n  Ingredients: ${s.ingredients.substring(0, 100)}...` : '';
            return `- ${s.brand ? s.brand + ' ' : ''}${s.product_name} (${s.category || 'Product'}) [${safeInfo}]${details}`;
        }).join('\n');
        parts.push(`Recent product scans:\n${scanList}`);
    }

    if (userContext.favorites?.length) {
        const favList = userContext.favorites.slice(0, 3).map(f => f.product_name).join(', ');
        parts.push(`User's favorite products: ${favList}`);
    }

    if (userContext.userName) {
        parts.push(`User Name: ${userContext.userName}`);
    }

    return parts.join('\n\n');
};

/**
 * Build beauty-specific context with pillar scores
 */
const buildBeautyContext = (userContext = {}) => {
    const parts = [];

    if (userContext.ageGroup) {
        const ageDescriptions = {
            adult: 'The user is asking about products for an adult.',
            child: 'The user is asking about products for a child (ages 4-12). Flag retinol, AHAs/BHAs, strong fragrances, essential oils.',
            toddler: 'The user is asking about products for a toddler (ages 1-3). Be very strict — avoid fragrance, parabens, harsh surfactants.',
            infant: 'The user is asking about products for an infant (under 1 year). Only mineral/barrier ingredients are appropriate.',
        };
        parts.push(ageDescriptions[userContext.ageGroup] || ageDescriptions.adult);
    }

    if (userContext.allergens?.length) {
        parts.push(`IMPORTANT: The user has the following sensitivities/allergens: ${userContext.allergens.join(', ')}. Always flag these ingredients.`);
    }

    if (userContext.userName) {
        parts.push(`User Name: ${userContext.userName}`);
    }

    return parts.join('\n\n');
};

export const sendMessage = async (messages, ageGroup = 'adult', userContext = {}, isBeautyProduct = false) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }

    // Build context string
    const contextString = isBeautyProduct
        ? buildBeautyContext({ ageGroup, ...userContext })
        : buildUserContext({ ageGroup, ...userContext });

    const basePrompt = isBeautyProduct ? BEAUTY_SYSTEM_PROMPT : FOOD_SYSTEM_PROMPT;

    console.log('[OpenAI] Context being sent to AI:', contextString, 'isBeauty:', isBeautyProduct);

    // Enhanced system prompt with memory instructions
    const enhancedSystemPrompt = `${basePrompt}

CONVERSATION MEMORY RULES:
- You have access to the full conversation history above.
- Remember what the user has asked about and your previous responses.
- Build on previous context - if the user refers to "it", "that product", or "the one before", use conversation history.
- If the user asks follow-up questions, reference the previous discussion.
- Maintain consistency with previous answers in this conversation.
- If asked "what did we discuss?", summarize the conversation.

CURRENT USER CONTEXT:
${contextString}`;

    // Manage conversation length - keep last 20 messages max to stay within token limits
    // But summarize older messages if needed
    let processedMessages = messages;

    if (messages.length > 20) {
        // Keep first message (often important) and last 15 messages
        const firstMessage = messages[0];
        const recentMessages = messages.slice(-15);

        // Create a summary of middle messages
        const middleMessages = messages.slice(1, -15);
        if (middleMessages.length > 0) {
            const summaryNote = {
                role: 'system',
                content: `[Earlier in this conversation: User asked about ${middleMessages.filter(m => m.role === 'user').length} topics. Key points were discussed. Continuing from recent messages...]`
            };
            processedMessages = [firstMessage, summaryNote, ...recentMessages];
        }
    }

    const formattedMessages = [
        { role: 'system', content: enhancedSystemPrompt },
        ...processedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
    ];

    console.log('[OpenAI] Sending', formattedMessages.length, 'messages to AI');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 800, // Increased for better responses
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get response from AI');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
};

// Stream message for real-time response
export const streamMessage = async (messages, ageGroup = 'adult', onChunk, userContext = {}, isBeautyProduct = false) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }

    // Build context string (same as sendMessage)
    const contextString = isBeautyProduct
        ? buildBeautyContext({ ageGroup, ...userContext })
        : buildUserContext({ ageGroup, ...userContext });

    const basePrompt = isBeautyProduct ? BEAUTY_SYSTEM_PROMPT : FOOD_SYSTEM_PROMPT;

    const enhancedSystemPrompt = `${basePrompt}

CONVERSATION MEMORY RULES:
- You have access to the full conversation history above.
- Remember what the user has asked about and your previous responses.
- Build on previous context - if the user refers to "it", "that product", or "the one before", use conversation history.
- If the user asks follow-up questions, reference the previous discussion.
- Maintain consistency with previous answers in this conversation.

CURRENT USER CONTEXT:
${contextString}`;

    // Manage conversation length
    let processedMessages = messages;
    if (messages.length > 20) {
        const firstMessage = messages[0];
        const recentMessages = messages.slice(-15);
        const middleMessages = messages.slice(1, -15);
        if (middleMessages.length > 0) {
            const summaryNote = {
                role: 'system',
                content: `[Earlier in this conversation: User asked about ${middleMessages.filter(m => m.role === 'user').length} topics. Continuing from recent messages...]`
            };
            processedMessages = [firstMessage, summaryNote, ...recentMessages];
        }
    }

    const formattedMessages = [
        { role: 'system', content: enhancedSystemPrompt },
        ...processedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
        })),
    ];

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 500,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get response from AI');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
                const data = line.replace('data: ', '').trim();
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || '';
                    if (content) {
                        fullContent += content;
                        onChunk(content, fullContent);
                    }
                } catch (e) {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }

        return fullContent;
    } catch (error) {
        console.error('OpenAI streaming error:', error);
        throw error;
    }
};
