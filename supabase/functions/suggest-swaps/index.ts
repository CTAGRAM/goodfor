import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { recipeId } = await req.json();

        if (!recipeId) {
            throw new Error('recipeId is required');
        }

        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // Fetch ingredients
        const { data: ingredients, error: ingError } = await supabaseClient
            .from('recipe_ingredients')
            .select('*')
            .eq('recipe_id', recipeId);

        if (ingError) throw ingError;

        const openAiKey = Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY");
        if (!openAiKey) {
            throw new Error("OpenAI API key not configured");
        }

        let swaps = [];
        if (ingredients && ingredients.length > 0) {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${openAiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    response_format: { type: "json_object" },
                    messages: [
                        {
                            role: "system",
                            content: `You are a healthy nutrition AI assistant. Given a list of recipe ingredients (with their database IDs), analyze them and suggest healthier swaps for ingredients that can be improved (e.g., refined sugar, butter, heavy oils, white flour, high-sodium sauces, processed meats).
                            For each suggestion, return:
                            - original_ingredient_id: the exact ID of the original ingredient
                            - original_name: the name of the original ingredient
                            - suggestion: a healthier alternative (e.g., Stevia, Avocado Oil, Almond Flour)
                            - reason: a concise explanation of why it is healthier
                            - safetyImprovement: an estimate of the improvement score (e.g., between 5 and 30)

                            Return a JSON object structured like this:
                            {
                              "swaps": [
                                {
                                  "original_ingredient_id": "string",
                                  "original_name": "string",
                                  "suggestion": "string",
                                  "reason": "string",
                                  "safetyImprovement": number
                                }
                              ]
                            }
                            Do NOT suggest swaps for naturally healthy ingredients like fresh vegetables, clean proteins, water, or spices.`
                        },
                        {
                            role: "user",
                            content: JSON.stringify({
                                ingredients: ingredients.map(ing => ({
                                    id: ing.id,
                                    name: ing.name,
                                    category: ing.category
                                }))
                            })
                        }
                    ]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            
            const resultJson = JSON.parse(data.choices[0].message.content);
            swaps = resultJson.swaps || [];
        }

        return new Response(
            JSON.stringify({ success: true, swaps }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
