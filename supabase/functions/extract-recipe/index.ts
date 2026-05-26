import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RECIPE_SYSTEM_PROMPT = `You are an expert culinary AI for a health-focused food app called GoodFor.
Extract recipe information from the provided content.

Return ONLY valid JSON with this EXACT structure:
{
  "title": "Recipe Title",
  "description": "Short appetizing description (1-2 sentences)",
  "prep_time_minutes": number or null,
  "cook_time_minutes": number or null,
  "servings": number (default 4),
  "category": "breakfast" | "lunch" | "dinner" | "snack" | "dessert",
  "cuisine": "string or null (e.g. italian, indian, mexican, mediterranean)",
  "health_score": number 0-100 (based on overall nutritional balance, ingredient quality, and cooking method),
  "instructions": ["Step 1 text", "Step 2 text", ...],
  "nutrition_per_serving": {
    "calories": number or null,
    "protein": number or null,
    "carbs": number or null,
    "fat": number or null,
    "fiber": number or null
  },
  "ingredients": [
    {
      "name": "ingredient name (e.g. chicken breast)",
      "quantity": number or null,
      "unit": "cups | tbsp | tsp | g | oz | ml | pieces | cloves | null",
      "category": "produce | dairy | meat | seafood | grains | pantry_staple | spice | oil | other",
      "is_optional": false,
      "health_score": number 0-100 (nutrient density, processing level),
      "healthier_swap": "suggestion or null (e.g. 'Greek yogurt' for sour cream)"
    }
  ]
}

Guidelines:
- Estimate nutrition if not provided
- health_score: 80+ for whole foods/lean proteins, 50-79 for moderate items, <50 for highly processed/sugary items
- Always suggest healthier_swap for ingredients with health_score < 60
- Parse quantities from text (e.g. "2 cups of rice" → quantity: 2, unit: "cups", name: "rice")
- If no clear recipe found, create a reasonable interpretation from the content`;

function detectPlatform(url: string): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("facebook.com") || lower.includes("fb.watch") || lower.includes("fb.com")) return "facebook";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("pinterest.com")) return "pinterest";
  if (lower.includes("allrecipes.com")) return "allrecipes";
  if (lower.includes("tasty.co")) return "tasty";
  if (lower.includes("delish.com")) return "delish";
  if (lower.includes("foodnetwork.com")) return "foodnetwork";
  if (lower.includes("epicurious.com")) return "epicurious";
  if (lower.includes("bonappetit.com")) return "bonappetit";
  if (lower.includes("simplyrecipes.com")) return "simplyrecipes";
  return "blog";
}

async function fetchFromRapidAPI(url: string, platform: string): Promise<string> {
  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
  if (!RAPIDAPI_KEY) {
    throw new Error(
      "RAPIDAPI_KEY is not configured in Supabase. Please set the RAPIDAPI_KEY secret to enable Instagram/Facebook recipe importing."
    );
  }

  if (platform === "instagram") {
    const host = "instagram-scraper-stable-api.p.rapidapi.com";
    
    // Attempt 1: POST to get_ig_post_info.php (Form Data)
    try {
      console.log(`[extract-recipe] Instagram Scrape Attempt 1: POST to /get_ig_post_info.php`);
      const response = await fetch("https://instagram-scraper-stable-api.p.rapidapi.com/get_ig_post_info.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": host,
        },
        body: new URLSearchParams({
          shortcode_or_url: url,
        }).toString(),
      });
      
      if (response.ok) {
        const data = await response.json();
        const text = data?.data?.caption?.text || data?.caption?.text || data?.caption || data?.text || "";
        if (text && text.length > 10) return text;
      }
      console.log(`[extract-recipe] Instagram Scrape Attempt 1 status: ${response.status}`);
    } catch (e) {
      console.warn(`[extract-recipe] Instagram Scrape Attempt 1 failed: ${e.message}`);
    }

    // Attempt 2: GET to get_post_info.php
    try {
      console.log(`[extract-recipe] Instagram Scrape Attempt 2: GET to /get_post_info.php`);
      const response = await fetch(`https://instagram-scraper-stable-api.p.rapidapi.com/get_post_info.php?shortcode_or_url=${encodeURIComponent(url)}`, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": host,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const text = data?.data?.caption?.text || data?.caption?.text || data?.caption || data?.text || "";
        if (text && text.length > 10) return text;
      }
    } catch (e) {
      console.warn(`[extract-recipe] Instagram Scrape Attempt 2 failed: ${e.message}`);
    }

    throw new Error("Could not retrieve post caption from Instagram Scraper API. Verify the URL is public.");
  }

  if (platform === "facebook") {
    const host = "facebook-scraper3.p.rapidapi.com";
    
    // Attempt 1: GET to /post/details
    try {
      console.log(`[extract-recipe] Facebook Scrape Attempt 1: GET to /post/details`);
      const response = await fetch(`https://facebook-scraper3.p.rapidapi.com/post/details?url=${encodeURIComponent(url)}`, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": host,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const text = data?.text || data?.caption || data?.description || data?.title || data?.message || "";
        if (text && text.length > 10) return text;
      }
    } catch (e) {
      console.warn(`[extract-recipe] Facebook Scrape Attempt 1 failed: ${e.message}`);
    }

    // Attempt 2: GET to /post
    try {
      console.log(`[extract-recipe] Facebook Scrape Attempt 2: GET to /post`);
      const response = await fetch(`https://facebook-scraper3.p.rapidapi.com/post?url=${encodeURIComponent(url)}`, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": host,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const text = data?.text || data?.caption || data?.description || data?.title || data?.message || "";
        if (text && text.length > 10) return text;
      }
    } catch (e) {
      console.warn(`[extract-recipe] Facebook Scrape Attempt 2 failed: ${e.message}`);
    }

    throw new Error("Could not retrieve post content from Facebook Scraper API. Verify the URL is public.");
  }

  throw new Error(`Unsupported social platform: ${platform}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    // Verify JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, url, imageBase64, imageMimeType, userId } = await req.json();

    if (!type) {
      throw new Error("Missing type (url or screenshot)");
    }

    console.log(`[extract-recipe] type=${type}, userId=${userId}`);

    // ─── Build messages for OpenAI ───────────────────────────
    let messages: any[] = [];

    if (type === "url") {
      if (!url) throw new Error("URL is required");

      const platform = detectPlatform(url);
      let pageText = "";

      if (platform === "instagram" || platform === "facebook") {
        try {
          pageText = await fetchFromRapidAPI(url, platform);
        } catch (e) {
          throw new Error(
            `Failed to scrape ${platform} URL using Scraper API: ${e.message}. You can try importing a screenshot of the recipe instead.`
          );
        }
      } else {
        // Fetch the page content
        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            redirect: "follow",
          });
          const html = await response.text();

          // Strip scripts, styles, and HTML tags
          pageText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&#\d+;/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 15000);
        } catch (e) {
          throw new Error(
            `Failed to fetch URL: ${e.message}. The site may block automated requests.`
          );
        }
      }

      if (pageText.length < 50) {
        throw new Error(
          "Could not extract enough text from that URL. Try a different recipe link or use a screenshot instead."
        );
      }

      messages = [
        { role: "system", content: RECIPE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract the recipe from this page content:\n\nSource URL: ${url}\n\n${pageText}`,
        },
      ];

    } else if (type === "screenshot") {
      if (!imageBase64) throw new Error("imageBase64 is required");

      // GPT-4o vision — send image inline
      messages = [
        { role: "system", content: RECIPE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the recipe from this image. Include all ingredients with measurements and full instructions.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`,
              },
            },
          ],
        },
      ];
    } else {
      throw new Error(`Unknown import type: ${type}`);
    }

    // ─── Call OpenAI ─────────────────────────────────────────
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages,
          temperature: 0.15,
          max_tokens: 4096,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      const msg =
        errorData.error?.message ||
        `OpenAI API error (${openaiResponse.status})`;
      throw new Error(msg);
    }

    const openaiData = await openaiResponse.json();

    if (openaiData.error) {
      throw new Error(openaiData.error.message);
    }

    const textContent = openaiData.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error(
        "No response from AI. The content may be too short or unclear."
      );
    }

    // ─── Parse JSON response ─────────────────────────────────
    let recipeJson;
    try {
      recipeJson = JSON.parse(textContent);
    } catch (e) {
      console.error(
        "[extract-recipe] JSON parse failed:",
        e,
        "\nRaw:",
        textContent.substring(0, 500)
      );
      throw new Error("Failed to parse AI response. Please try again.");
    }

    // ─── Format for the client ───────────────────────────────
    const platform = type === "url" ? detectPlatform(url) : null;

    const formattedRecipe = {
      user_id: userId,
      title: recipeJson.title || "Untitled Recipe",
      description: recipeJson.description || null,
      source_url: type === "url" ? url : null,
      source_type: type,
      source_platform: platform,
      prep_time_minutes: recipeJson.prep_time_minutes || null,
      cook_time_minutes: recipeJson.cook_time_minutes || null,
      total_time_minutes:
        (recipeJson.prep_time_minutes || 0) +
        (recipeJson.cook_time_minutes || 0) || null,
      servings: recipeJson.servings || 4,
      category: recipeJson.category || "dinner",
      cuisine: recipeJson.cuisine || null,
      health_score: recipeJson.health_score || null,
      instructions: recipeJson.instructions || [],
      nutrition_per_serving: recipeJson.nutrition_per_serving || null,
      ingredients: (recipeJson.ingredients || []).map(
        (ing: any, i: number) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: ing.category || "other",
          is_optional: ing.is_optional || false,
          health_score: ing.health_score || null,
          healthier_swap: ing.healthier_swap || null,
          sort_order: i,
        })
      ),
    };

    console.log("[extract-recipe] Success:", {
      title: formattedRecipe.title,
      ingredients: formattedRecipe.ingredients.length,
      steps: formattedRecipe.instructions.length,
      health_score: formattedRecipe.health_score,
      platform: formattedRecipe.source_platform,
    });

    return new Response(
      JSON.stringify({ recipe: formattedRecipe }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[extract-recipe] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
