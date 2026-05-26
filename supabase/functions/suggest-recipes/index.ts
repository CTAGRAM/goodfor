import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAiKey = Deno.env.get("EXPO_PUBLIC_OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, scannedProductName } = await req.json();

    if (!userId) {
      throw new Error("Missing userId");
    }
    if (!openAiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's pantry items
    const { data: pantryItems, error: pantryError } = await supabase
      .from('pantry_items')
      .select('name, quantity, unit')
      .eq('user_id', userId);

    if (pantryError) throw pantryError;

    let promptContext = `The user has these ingredients in their pantry:
${pantryItems.map(i => `- ${i.name} ${i.quantity ? `(${i.quantity} ${i.unit || ''})` : ''}`).join('\n')}`;

    if (scannedProductName) {
      promptContext += `\n\nThe user just scanned or selected: ${scannedProductName}. They want to cook something using this ingredient and ideally other things they already have.`;
    } else {
      promptContext += `\n\nSuggest 3 recipes they can cook primarily using these ingredients.`;
    }

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
            content: `You are a helpful culinary AI. Based on the user's ingredients, suggest 3 recipe ideas.
            Return a JSON object:
            {
              "recipes": [
                {
                  "title": "Recipe Name",
                  "description": "Short appetizing description",
                  "difficulty": "easy|medium|hard",
                  "prep_time_minutes": number,
                  "cook_time_minutes": number,
                  "missing_ingredients": ["list", "of", "things", "they", "need", "to", "buy"]
                }
              ]
            }`
          },
          {
            role: "user",
            content: promptContext,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const suggestionJson = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({ recipes: suggestionJson.recipes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
