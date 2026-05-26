import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FRIDGE_ANALYSIS_PROMPT = `You are a nutritional AI assistant. Analyze this photo of a fridge/pantry/kitchen.

Identify ALL visible food items and ingredients. For each item provide:
- name: specific item name
- quantity: estimated amount (e.g. "2 pieces", "1 bottle", "500ml")
- category: one of produce, dairy, meat, grains, pantry_staple, frozen, beverages, snacks, condiments, other
- health_benefit: one short benefit phrase (e.g. "High in protein", "Rich in vitamins")

Then suggest 3-5 meals that can be made primarily using the detected ingredients. For each meal:
- title: recipe name
- description: one line appetizing description
- score: health match score 0-100
- cook_time_minutes: estimated cooking time
- match_quality: "Excellent match" or "High match" or "Good match"
- tags: 1-2 nutrition/benefit tags like ["Great for you", "High fibre"]
- missing_ingredients: list of items needed but not detected
- servings: number of servings

Also identify 3-6 commonly missing items that would significantly improve meal variety:
- name: item name
- quantity: suggested amount to buy
- why_needed: short explanation (e.g. "Adds calcium & protein")
- impact_points: integer 1-10 representing nutritional impact
- impact_label: "Great for you" or "Good for you"

Calculate an overall nutrition score (0-100) for the fridge contents and a potential_score if missing items were added.

Return ONLY valid JSON with this structure:
{
  "score": number,
  "ingredients_detected": number,
  "message": "summary message like 'Great! You can make nutritious meals'",
  "sub_message": "detail like 'High potential for healthy, balanced meals'",
  "ingredients": [...],
  "meals": [...],
  "missing_items": [...],
  "potential_score": number
}`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { imageBase64, mimeType, userId } = await req.json();

    if (!imageBase64 || !mimeType) {
      throw new Error("Missing required parameters: imageBase64 or mimeType");
    }

    console.log("Processing fridge analysis request for user:", userId);

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: FRIDGE_ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `Gemini API error (${response.status})`;
      throw new Error(msg);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No response from Gemini. The image may be unclear.');
    }

    // Parse JSON from response (handle markdown code blocks)
    let cleaned = textContent.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse failed:", e, "\nRaw:", cleaned.substring(0, 500));
      throw new Error('Failed to parse AI response. Please try again with a clearer photo.');
    }

    console.log("Fridge analysis complete:", {
      score: parsed.score,
      ingredients: parsed.ingredients_detected,
      meals: parsed.meals?.length,
      missing: parsed.missing_items?.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        score: parsed.score || 0,
        ingredients_detected: parsed.ingredients_detected || 0,
        message: parsed.message || 'Analysis complete',
        sub_message: parsed.sub_message || '',
        ingredients: parsed.ingredients || [],
        meals: parsed.meals || [],
        missing_items: parsed.missing_items || [],
        potential_score: parsed.potential_score || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
