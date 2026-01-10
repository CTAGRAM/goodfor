// OpenAI service for AI chat
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are a helpful nutrition and product safety assistant called "Goodfor AI". 
You help users understand food ingredients, nutritional information, and product safety.
You provide personalized advice based on the user's age group (adult, child, or toddler).
Be concise, friendly, and focus on practical health advice.
When analyzing products:
- Highlight potentially harmful ingredients
- Explain what each ingredient does
- Provide safety scores when relevant
- Suggest healthier alternatives when asked
Keep responses brief and easy to understand.`;

export const sendMessage = async (messages, ageGroup = 'adult') => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }

    const ageContext = {
        adult: 'The user is asking about products for an adult.',
        child: 'The user is asking about products for a child (ages 4-12). Be extra cautious about sugar, caffeine, and allergens.',
        toddler: 'The user is asking about products for a toddler (ages 1-3). Be very strict about safety - no honey, no choking hazards, limited sugar and salt.',
    };

    const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + ageContext[ageGroup] },
        ...messages.map(msg => ({
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
                model: 'gpt-4o-mini', // Fastest and most cost-effective GPT-4 model
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 500,
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
export const streamMessage = async (messages, ageGroup = 'adult', onChunk) => {
    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }

    const ageContext = {
        adult: 'The user is asking about products for an adult.',
        child: 'The user is asking about products for a child (ages 4-12). Be extra cautious about sugar, caffeine, and allergens.',
        toddler: 'The user is asking about products for a toddler (ages 1-3). Be very strict about safety - no honey, no choking hazards, limited sugar and salt.',
    };

    const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPT + '\n\n' + ageContext[ageGroup] },
        ...messages.map(msg => ({
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
