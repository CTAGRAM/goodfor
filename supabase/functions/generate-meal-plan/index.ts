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
        const { userId, weekStart } = await req.json();

        if (!userId) {
            throw new Error('userId is required');
        }

        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // Fetch user's saved recipes to pick from
        const { data: recipes, error: recipesError } = await supabaseClient
            .from('recipes')
            .select('*')
            .eq('user_id', userId);

        if (recipesError) throw recipesError;

        // Note: In a production app, we would use OpenAI to intelligently select a balanced week of recipes.
        // For this implementation, we will randomly select recipes if available, or create placeholders.
        
        const mealPlanName = `Week of ${new Date(weekStart || Date.now()).toLocaleDateString()}`;
        
        // 1. Create the meal plan
        const { data: mealPlan, error: planError } = await supabaseClient
            .from('meal_plans')
            .insert({
                user_id: userId,
                name: mealPlanName,
                week_start: weekStart || new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (planError) throw planError;

        // 2. Generate entries
        const days = 7;
        const mealsPerDay = ['breakfast', 'lunch', 'dinner'];
        const entries = [];

        for (let day = 1; day <= days; day++) {
            for (const type of mealsPerDay) {
                // Pick a random recipe
                let recipeId = null;
                let customName = null;
                
                if (recipes && recipes.length > 0) {
                    // Try to pick a category matching the meal type
                    const matchingRecipes = recipes.filter(r => r.category === type);
                    const pool = matchingRecipes.length > 0 ? matchingRecipes : recipes;
                    const randomRecipe = pool[Math.floor(Math.random() * pool.length)];
                    recipeId = randomRecipe.id;
                } else {
                    customName = `Placeholder ${type}`;
                }

                entries.push({
                    meal_plan_id: mealPlan.id,
                    day_of_week: day,
                    meal_type: type,
                    recipe_id: recipeId,
                    custom_meal_name: customName,
                    notes: ''
                });
            }
        }

        const { error: entriesError } = await supabaseClient
            .from('meal_plan_entries')
            .insert(entries);

        if (entriesError) throw entriesError;

        return new Response(
            JSON.stringify({ success: true, mealPlan }),
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
