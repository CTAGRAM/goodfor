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

        // Note: In production we would use OpenAI or the safety database to find swaps.
        // For this demo implementation we will generate dummy swaps for a few ingredients.
        const swaps = [];
        
        for (const ing of ingredients) {
            const nameLower = ing.name.toLowerCase();
            if (nameLower.includes('sugar') || nameLower.includes('syrup')) {
                swaps.push({
                    original_ingredient_id: ing.id,
                    original_name: ing.name,
                    suggestion: 'Stevia or Monk Fruit Sweetener',
                    reason: 'Zero calories and low glycemic impact.',
                    safetyImprovement: 20
                });
            } else if (nameLower.includes('butter') || nameLower.includes('oil')) {
                swaps.push({
                    original_ingredient_id: ing.id,
                    original_name: ing.name,
                    suggestion: 'Avocado Oil or Ghee',
                    reason: 'Healthier fat profile and higher smoke point.',
                    safetyImprovement: 15
                });
            } else if (nameLower.includes('flour')) {
                swaps.push({
                    original_ingredient_id: ing.id,
                    original_name: ing.name,
                    suggestion: 'Almond Flour or Oat Flour',
                    reason: 'Lower carb and gluten-free alternatives.',
                    safetyImprovement: 10
                });
            }
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
