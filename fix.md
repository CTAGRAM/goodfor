# GoodFor - IMMEDIATE FIX GUIDE

## 🔴 Issue 1: History Not Saving (Error 42501)

**Cause:** RLS (Row Level Security) is blocking inserts to `products` table.

### Fix (Do this NOW):

1. Go to **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy-paste the ENTIRE contents of `FIX-RLS-POLICIES.sql`
5. Click **Run**
6. Verify you see the policy table at the end

**After running, retry scanning a product. It should save now!**

---

## 🔴 Issue 2: Alternatives Returning 0 Results

**Cause:** The OpenFoodFacts API search was:
1. Taking 13+ seconds (timeout issues)
2. Using wrong category format (`en:dairies` instead of `dairies`)
3. Too strict filtering

### Fix:

1. Replace your edge function with `get-alternatives-v5.ts`
2. Deploy:
   ```bash
   # In your project folder
   supabase functions deploy get-alternatives --project-ref yiilubsznpyiswpvqyhy
   ```

**Changes in v5:**
- ✅ Removes `en:` prefix (OFF API doesn't want it)
- ✅ Tries multiple category variations
- ✅ 5-second timeout (not 30+ seconds)
- ✅ Falls back to popular healthy products if category fails
- ✅ Better logging to debug issues

---

## Quick Test After Fixes

### Test 1: Scan Saving
```javascript
// In your app, scan any product
// Check Supabase Dashboard > Table Editor > products
// You should see the new product
```

### Test 2: Alternatives API
```bash
curl -X POST https://yiilubsznpyiswpvqyhy.supabase.co/functions/v1/get-alternatives \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "20017743",
    "category": "en:dairies",
    "categories_tags": ["en:dairies", "en:milks", "en:whole-milks"],
    "nutri_score": "c"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "barcode": "...",
      "name": "Some Milk Brand",
      "nutriScore": "a",
      "reason": "Nutri-Score: C → A (+2 grades)"
    }
  ],
  "meta": {
    "query_time_ms": 1500,
    "search_source": "openfoodfacts:milks"
  }
}
```

---

## Order of Operations

1. **FIRST:** Run the SQL to fix RLS ← Most important!
2. **SECOND:** Deploy the new edge function
3. **THIRD:** Test scanning a product
4. **FOURTH:** Test alternatives

---

## Still Not Working?

If after applying these fixes you still have issues, share:

1. The output of the SQL query (the policy table at the end)
2. The console logs when scanning
3. The curl response from testing alternatives

I'll help debug further!

----

sql :

-- =============================================================================
-- GOODFOR: FIX ALL RLS POLICIES
-- =============================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste this > Run
-- =============================================================================

-- =============================================================================
-- STEP 1: FIX PRODUCTS TABLE (Causing error 42501)
-- =============================================================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;

-- CREATE NEW POLICIES

-- Anyone can read products (public data)
CREATE POLICY "Anyone can read products" ON products
FOR SELECT 
TO public
USING (true);

-- Authenticated users can insert products
CREATE POLICY "Authenticated users can insert products" ON products
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Authenticated users can update products
CREATE POLICY "Authenticated users can update products" ON products
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================================================
-- STEP 2: FIX SCANS TABLE 
-- =============================================================================

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own scans" ON scans;
DROP POLICY IF EXISTS "Users can insert own scans" ON scans;
DROP POLICY IF EXISTS "Users can update own scans" ON scans;
DROP POLICY IF EXISTS "Users can delete own scans" ON scans;

-- CREATE NEW POLICIES

-- Users can only read their own scans
CREATE POLICY "Users can view own scans" ON scans
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert scans (must set user_id to their own id)
CREATE POLICY "Users can insert own scans" ON scans
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own scans
CREATE POLICY "Users can update own scans" ON scans
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scans" ON scans
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 3: FIX USER_PREFERENCES TABLE (if exists)
-- =============================================================================

-- Only run if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        -- Enable RLS
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
        
        -- Create policies
        EXECUTE 'CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: VERIFY POLICIES WERE CREATED
-- =============================================================================

-- This should show all the policies we just created
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('products', 'scans', 'user_preferences')
ORDER BY tablename, cmd;

-- =============================================================================
-- DONE! You should see output like:
-- 
-- | tablename | policyname                              | cmd    |
-- |-----------|----------------------------------------|--------|
-- | products  | Anyone can read products                | SELECT |
-- | products  | Authenticated users can insert products | INSERT |
-- | products  | Authenticated users can update products | UPDATE |
-- | scans     | Users can view own scans                | SELECT |
-- | scans     | Users can insert own scans              | INSERT |
-- | scans     | Users can update own scans              | UPDATE |
-- | scans     | Users can delete own scans              | DELETE |
-- =============================================================================


---

edge function :

// =============================================================================
// GET-ALTERNATIVES v5 - FIXED OpenFoodFacts Search
// =============================================================================
// 
// FIXES FROM v4:
// 1. Better category extraction (removes "en:" prefix for OFF API)
// 2. Relaxed search (category only, then filter in code)
// 3. Added fallback to broader categories
// 4. Better error handling and logging
// 5. Faster timeout handling
//
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OFF_API_BASE = "https://world.openfoodfacts.org";

// Timeout for external API calls (5 seconds)
const API_TIMEOUT = 5000;

interface AlternativeRequest {
  barcode: string;
  category?: string;
  categories_tags?: string[];
  safety_score?: number;
  nutri_score?: string;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const body: AlternativeRequest = await req.json();
    const { 
      barcode, 
      category, 
      categories_tags = [],
      safety_score = 50, 
      nutri_score,
      user_id 
    } = body;

    console.log("[GetAlternatives v5] Request:", { 
      barcode, 
      category, 
      categories_tags: categories_tags?.slice(0, 3),
      nutri_score 
    });

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build list of categories to try (most specific to least specific)
    const categoriesToTry = buildCategoryList(category, categories_tags);
    console.log("[GetAlternatives v5] Categories to try:", categoriesToTry);

    let alternatives: any[] = [];
    let searchSource = "none";

    // Try OpenFoodFacts API with each category until we get results
    for (const cat of categoriesToTry) {
      if (alternatives.length >= 5) break;
      
      console.log("[GetAlternatives v5] Trying category:", cat);
      
      const offResults = await searchOpenFoodFacts(cat, barcode, nutri_score);
      
      if (offResults.length > 0) {
        alternatives = offResults;
        searchSource = `openfoodfacts:${cat}`;
        console.log("[GetAlternatives v5] Found", offResults.length, "from OFF with category:", cat);
        break;
      }
    }

    // If still no results, try a generic search by product name
    if (alternatives.length === 0) {
      console.log("[GetAlternatives v5] Trying generic dairy/milk search...");
      const genericResults = await searchOpenFoodFactsGeneric(barcode);
      if (genericResults.length > 0) {
        alternatives = genericResults;
        searchSource = "openfoodfacts:generic";
      }
    }

    // Fallback to local DB
    if (alternatives.length < 5) {
      const dbResults = await searchLocalDB(supabaseClient, barcode, category, safety_score);
      const existingBarcodes = new Set(alternatives.map(a => a.barcode));
      for (const alt of dbResults) {
        if (!existingBarcodes.has(alt.barcode) && alternatives.length < 10) {
          alternatives.push(alt);
        }
      }
      if (dbResults.length > 0) {
        searchSource += "+local_db";
      }
    }

    // Sort by nutri-score (a is best)
    alternatives.sort((a, b) => {
      const scoreOrder: Record<string, number> = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
      const aScore = scoreOrder[a.nutri_score?.toLowerCase()] || 0;
      const bScore = scoreOrder[b.nutri_score?.toLowerCase()] || 0;
      return bScore - aScore;
    });

    // Take top 10
    alternatives = alternatives.slice(0, 10);

    // Format response
    const formattedAlternatives = alternatives.map((alt) => ({
      barcode: alt.barcode || alt.code,
      name: alt.name || alt.product_name,
      brand: alt.brand || alt.brands,
      imageUrl: alt.image_url || alt.image_front_small_url || alt.image_front_url,
      nutriScore: alt.nutri_score || alt.nutrition_grades,
      novaGroup: alt.nova_group,
      safetyScore: calculateSafetyScore(alt),
      safetyLevel: getSafetyLevel(alt),
      reason: getImprovementReason(alt, nutri_score),
      source: alt.source || "openfoodfacts",
    }));

    const endTime = performance.now();

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedAlternatives,
        count: formattedAlternatives.length,
        meta: {
          query_time_ms: Math.round(endTime - startTime),
          search_source: searchSource,
          categories_tried: categoriesToTry.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[GetAlternatives v5] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message,
        data: [],
        count: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


// =============================================================================
// BUILD CATEGORY LIST (Most specific to least specific)
// =============================================================================
function buildCategoryList(category?: string, categories_tags?: string[]): string[] {
  const categories: string[] = [];
  
  // Process categories_tags (usually from OFF, most specific last)
  if (categories_tags && categories_tags.length > 0) {
    // Reverse so most specific is first
    const reversed = [...categories_tags].reverse();
    for (const cat of reversed) {
      const cleaned = cleanCategory(cat);
      if (cleaned && !categories.includes(cleaned)) {
        categories.push(cleaned);
      }
    }
  }
  
  // Add single category if provided
  if (category) {
    const cleaned = cleanCategory(category);
    if (cleaned && !categories.includes(cleaned)) {
      categories.push(cleaned);
    }
  }
  
  // Add common fallbacks based on detected type
  const allCats = categories.join(" ").toLowerCase();
  
  if (allCats.includes("dairy") || allCats.includes("milk") || allCats.includes("dairies")) {
    if (!categories.includes("milks")) categories.push("milks");
    if (!categories.includes("dairy")) categories.push("dairy");
  }
  
  if (allCats.includes("juice") || allCats.includes("beverage")) {
    if (!categories.includes("fruit-juices")) categories.push("fruit-juices");
    if (!categories.includes("beverages")) categories.push("beverages");
  }
  
  if (allCats.includes("snack") || allCats.includes("chip")) {
    if (!categories.includes("snacks")) categories.push("snacks");
  }
  
  return categories.slice(0, 5); // Max 5 categories to try
}


function cleanCategory(category: string): string {
  if (!category) return "";
  
  // Remove "en:" prefix that OFF uses internally
  let cleaned = category.replace(/^en:/, "");
  
  // Remove "fr:" or other language prefixes
  cleaned = cleaned.replace(/^[a-z]{2}:/, "");
  
  // Replace underscores with hyphens (OFF uses hyphens)
  cleaned = cleaned.replace(/_/g, "-");
  
  return cleaned.toLowerCase().trim();
}


// =============================================================================
// SEARCH OPENFOODFACTS API - FIXED VERSION
// =============================================================================
async function searchOpenFoodFacts(
  category: string,
  excludeBarcode: string,
  currentNutriScore?: string
): Promise<any[]> {
  try {
    // Build search URL - simpler approach that actually works
    // OFF API: /cgi/search.pl with category tag
    const params = new URLSearchParams({
      action: "process",
      tagtype_0: "categories",
      tag_contains_0: "contains",
      tag_0: category,
      sort_by: "unique_scans_n",  // Sort by popularity
      page_size: "30",
      json: "1",
      fields: "code,product_name,brands,image_front_small_url,image_front_url,nutrition_grades,nova_group,allergens_tags,categories_tags",
    });

    const searchUrl = `${OFF_API_BASE}/cgi/search.pl?${params}`;
    console.log("[OFF Search] URL:", searchUrl);

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "GoodFor/1.0 (contact@goodfor.app)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("[OFF Search] HTTP error:", response.status);
      return [];
    }

    const data = await response.json();
    const products = data.products || [];
    
    console.log("[OFF Search] Raw results:", products.length);

    // Filter and process results
    const filtered = products
      .filter((p: any) => {
        // Must have barcode
        if (!p.code) return false;
        // Exclude current product
        if (p.code === excludeBarcode) return false;
        // Must have a name
        if (!p.product_name) return false;
        // Prefer products with nutri-score
        // (but don't require it - we'll sort later)
        return true;
      })
      .map((p: any) => ({
        barcode: p.code,
        name: p.product_name,
        brand: p.brands || "Unknown brand",
        image_url: p.image_front_small_url || p.image_front_url,
        nutri_score: p.nutrition_grades,
        nova_group: p.nova_group,
        allergens_tags: p.allergens_tags || [],
        source: "openfoodfacts",
      }));

    // If we have a current nutri-score, prioritize better ones
    if (currentNutriScore) {
      const scoreOrder: Record<string, number> = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
      const currentScoreNum = scoreOrder[currentNutriScore.toLowerCase()] || 3;
      
      // Sort: products with better nutri-score first
      filtered.sort((a: any, b: any) => {
        const aScore = scoreOrder[a.nutri_score?.toLowerCase()] || 0;
        const bScore = scoreOrder[b.nutri_score?.toLowerCase()] || 0;
        
        // Prioritize products that are better than current
        const aIsBetter = aScore > currentScoreNum ? 1 : 0;
        const bIsBetter = bScore > currentScoreNum ? 1 : 0;
        
        if (aIsBetter !== bIsBetter) return bIsBetter - aIsBetter;
        return bScore - aScore;
      });
    }

    return filtered.slice(0, 15);

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("[OFF Search] Timeout after", API_TIMEOUT, "ms");
    } else {
      console.error("[OFF Search] Error:", error.message);
    }
    return [];
  }
}


// =============================================================================
// GENERIC SEARCH (Fallback when category search fails)
// =============================================================================
async function searchOpenFoodFactsGeneric(excludeBarcode: string): Promise<any[]> {
  try {
    // Try a very broad search for common healthy alternatives
    // This is a fallback when specific category doesn't work
    
    // Search for products with good nutri-score
    const params = new URLSearchParams({
      action: "process",
      tagtype_0: "nutrition_grades",
      tag_contains_0: "contains",
      tag_0: "a",  // Only A-rated products
      sort_by: "unique_scans_n",
      page_size: "20",
      json: "1",
      fields: "code,product_name,brands,image_front_small_url,nutrition_grades,nova_group,categories_tags",
    });

    const searchUrl = `${OFF_API_BASE}/cgi/search.pl?${params}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(searchUrl, {
      headers: { "User-Agent": "GoodFor/1.0 (contact@goodfor.app)" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const products = data.products || [];

    return products
      .filter((p: any) => p.code && p.code !== excludeBarcode && p.product_name)
      .slice(0, 10)
      .map((p: any) => ({
        barcode: p.code,
        name: p.product_name,
        brand: p.brands || "Unknown",
        image_url: p.image_front_small_url,
        nutri_score: p.nutrition_grades,
        nova_group: p.nova_group,
        source: "openfoodfacts",
      }));

  } catch (error) {
    console.error("[OFF Generic] Error:", error);
    return [];
  }
}


// =============================================================================
// SEARCH LOCAL DATABASE
// =============================================================================
async function searchLocalDB(
  supabase: any,
  excludeBarcode: string,
  category: string | undefined,
  minScore: number
): Promise<any[]> {
  try {
    // Build query
    let query = supabase
      .from("scans")
      .select(`
        safety_score,
        safety_level,
        category,
        products (
          id,
          barcode,
          name,
          brand,
          image_url,
          nutri_score,
          nova_group
        )
      `)
      .gte("safety_score", minScore)
      .order("safety_score", { ascending: false })
      .limit(10);

    // Add category filter if available (use ILIKE for partial match)
    if (category) {
      const baseCategory = cleanCategory(category).split("-")[0];
      query = query.ilike("category", `%${baseCategory}%`);
    }

    const { data: scans, error } = await query;

    if (error) {
      console.error("[DB Search] Error:", error);
      return [];
    }

    return (scans || [])
      .filter((scan: any) => scan.products && scan.products.barcode !== excludeBarcode)
      .map((scan: any) => ({
        barcode: scan.products.barcode,
        name: scan.products.name,
        brand: scan.products.brand,
        image_url: scan.products.image_url,
        nutri_score: scan.products.nutri_score,
        nova_group: scan.products.nova_group,
        safety_score: scan.safety_score,
        source: "local_db",
      }));

  } catch (error) {
    console.error("[DB Search] Error:", error);
    return [];
  }
}


// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateSafetyScore(product: any): number {
  let score = 70;
  
  const nutriBoost: Record<string, number> = { 'a': 25, 'b': 20, 'c': 10, 'd': 0, 'e': -10 };
  const nutri = product.nutri_score?.toLowerCase() || product.nutrition_grades?.toLowerCase();
  score += nutriBoost[nutri] || 0;
  
  const novaGroup = product.nova_group;
  if (novaGroup === 4) score -= 15;
  if (novaGroup === 3) score -= 5;
  if (novaGroup === 1) score += 10;
  
  return Math.min(100, Math.max(0, score));
}

function getSafetyLevel(product: any): string {
  const score = calculateSafetyScore(product);
  if (score >= 80) return "safe";
  if (score >= 60) return "caution";
  return "warning";
}

function getImprovementReason(product: any, originalNutriScore?: string): string {
  const productScore = product.nutri_score?.toLowerCase() || product.nutrition_grades?.toLowerCase();
  
  if (!productScore) {
    return "Alternative option in same category";
  }
  
  if (!originalNutriScore) {
    if (productScore === 'a') return "Excellent Nutri-Score (A)";
    if (productScore === 'b') return "Good Nutri-Score (B)";
    return "Alternative option";
  }

  const scoreOrder = ['a', 'b', 'c', 'd', 'e'];
  const originalIndex = scoreOrder.indexOf(originalNutriScore.toLowerCase());
  const productIndex = scoreOrder.indexOf(productScore);

  if (productIndex < originalIndex) {
    const improvement = originalIndex - productIndex;
    return `Nutri-Score: ${originalNutriScore.toUpperCase()} → ${productScore.toUpperCase()} (+${improvement} grade${improvement > 1 ? 's' : ''})`;
  }

  if (productIndex === originalIndex) {
    return `Same Nutri-Score (${productScore.toUpperCase()})`;
  }

  return "Alternative option";
}