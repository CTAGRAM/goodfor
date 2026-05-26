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
        const { userId, recipeIds, pantryItemIds = [] } = await req.json();

        if (!userId || !recipeIds || !Array.isArray(recipeIds)) {
            throw new Error('userId and recipeIds array are required');
        }

        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // 1. Fetch ingredients for the requested recipes
        const { data: recipeIngredients, error: ingError } = await supabaseClient
            .from('recipe_ingredients')
            .select('name, quantity, unit, category')
            .in('recipe_id', recipeIds);

        if (ingError) throw ingError;

        // 2. Fetch user's pantry items to exclude
        let pantryNames = new Set<string>();
        if (pantryItemIds.length > 0) {
            const { data: pantry, error: pantryError } = await supabaseClient
                .from('pantry_items')
                .select('name')
                .in('id', pantryItemIds);
                
            if (pantryError) throw pantryError;
            pantryNames = new Set(pantry.map(p => p.name.toLowerCase()));
        } else {
             // If no specific IDs provided, get all user's pantry items
            const { data: pantry, error: pantryError } = await supabaseClient
                .from('pantry_items')
                .select('name')
                .eq('user_id', userId);
                
            if (!pantryError && pantry) {
                pantryNames = new Set(pantry.map(p => p.name.toLowerCase()));
            }
        }

        // 3. Filter ingredients and aggregate
        const neededIngredients = new Map();

        for (const ing of recipeIngredients) {
            // Very simple check to see if we have it in the pantry
            // In a real app we'd use embedding search or LLM matching
            const nameLower = ing.name.toLowerCase();
            const hasInPantry = Array.from(pantryNames).some(p => nameLower.includes(p) || p.includes(nameLower));
            
            if (!hasInPantry) {
                const key = `${nameLower}-${ing.unit || 'none'}`;
                if (neededIngredients.has(key)) {
                    const existing = neededIngredients.get(key);
                    existing.quantity = (existing.quantity || 0) + (ing.quantity || 0);
                } else {
                    neededIngredients.set(key, {
                        name: ing.name,
                        quantity: ing.quantity,
                        unit: ing.unit,
                        category: ing.category || 'other'
                    });
                }
            }
        }

        // 4. Create the shopping list
        const { data: list, error: listError } = await supabaseClient
            .from('shopping_lists')
            .insert({
                user_id: userId,
                name: `List generated from ${recipeIds.length} recipes`,
                recipe_ids: recipeIds,
            })
            .select()
            .single();

        if (listError) throw listError;

        // 5. Add items to list
        const itemsToInsert = Array.from(neededIngredients.values()).map(ing => ({
            list_id: list.id,
            ingredient_name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
            is_bought: false,
            safety_score: null
        }));

        if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabaseClient
                .from('shopping_list_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return new Response(
            JSON.stringify({ success: true, listId: list.id, itemCount: itemsToInsert.length }),
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
