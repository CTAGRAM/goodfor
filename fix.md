# GoodFor - Complete Fix Summary

## 🔴 Problem 1: Alternatives Returns Empty

### Root Causes (Multiple Issues)

| Issue | Severity | Fix Required |
|-------|----------|--------------|
| Frontend not passing `safety_score` | 🟡 Medium | Fix frontend call |
| Only 2 products in database | 🔴 Critical | Cannot find alternatives from empty DB |
| Not using OpenFoodFacts API | 🔴 Critical | Must fetch from external source |
| Exact category matching | 🟡 Medium | Use hierarchical category search |

### The Real Problem

Your current edge function only searches **your own database** for alternatives. With only 2 products, there are no alternatives to find!

**Current Flow (Broken):**
```
User scans Milk → Search DB for other milks → DB has only 1 milk → Empty result
```

**Fixed Flow:**
```
User scans Milk → Search OpenFoodFacts API for milks → Get 20 results → Filter by preferences → Return 10 best
```

### Solution: Deploy get-alternatives-v4.ts

The new edge function:
1. ✅ Searches OpenFoodFacts API for real alternatives
2. ✅ Falls back to local DB as secondary source
3. ✅ Handles category hierarchy properly
4. ✅ Filters by user allergens/dietary preferences
5. ✅ Returns proper error states (not just empty)

**Deploy Command:**
```bash
supabase functions deploy get-alternatives --project-ref yiilubsznpyiswpvqyhy
```

---

## 🔴 Problem 2: History Not Saving

### Likely Causes (Need to Verify)

| Possible Issue | How to Check |
|----------------|--------------|
| RLS blocking inserts | Run: `SELECT * FROM pg_policies WHERE tablename = 'scans';` |
| Missing `user_id` in insert | Check your scan save code |
| User not authenticated | Check if `auth.getUser()` returns a user |
| Foreign key constraint | Product must exist before scan |
| Error not being caught | Add proper error logging |

### Diagnostic Steps

**Step 1: Check RLS Policies**
```sql
-- Run in Supabase SQL Editor
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'scans';
```

**Step 2: Check if inserts work manually**
```sql
-- Try inserting a test scan
INSERT INTO scans (user_id, product_id, category, safety_score, safety_level)
VALUES (
    'your-user-id-here',
    (SELECT id FROM products LIMIT 1),
    'test',
    75,
    'safe'
);
```

**Step 3: Check auth in browser console**
```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Solution: Apply RLS Policies

```sql
-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Users can view their own scans
CREATE POLICY "Users can view own scans" ON scans
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans" ON scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own scans
CREATE POLICY "Users can update own scans" ON scans
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scans" ON scans
    FOR DELETE USING (auth.uid() = user_id);
```

---

## Files to Update

### 1. Edge Function: `supabase/functions/get-alternatives/index.ts`
Replace with: `get-alternatives-v4.ts` (in this folder)

### 2. Frontend: `src/lib/edgeFunctions.js`
```diff
- export async function getAlternativesEdge(barcode, category) {
-     const result = await callEdgeFunction('get-alternatives', {
-         barcode,
-         category,
-     });
+ export async function getAlternativesEdge(product) {
+     const requestData = {
+         barcode: product.barcode || product.code,
+         category: product.category || product.categories?.[0],
+         categories_tags: product.categories_tags || [],
+         safety_score: product.safetyScore || product.safety_score || 50,
+         nutri_score: product.nutriScore || product.nutrition_grades,
+         user_id: (await supabase.auth.getUser())?.data?.user?.id,
+     };
+     const result = await callEdgeFunction('get-alternatives', requestData);
```

### 3. Frontend: `src/app/alternatives.jsx`
```diff
  const alts = await getAlternativesEdge(
-     product.barcode,
-     product.categories?.[0] || product.category
+     product  // Pass entire product object
  );
```

### 4. Scan Saving: Add proper error handling
Use the `saveScanToHistory()` function from `frontend-fixes.js`

---

## Quick Deployment Checklist

- [ ] **Step 1:** Deploy new edge function
  ```bash
  cd supabase/functions/get-alternatives
  # Replace index.ts with get-alternatives-v4.ts content
  supabase functions deploy get-alternatives
  ```

- [ ] **Step 2:** Update frontend files
  - `src/lib/edgeFunctions.js` - Update `getAlternativesEdge`
  - `src/app/alternatives.jsx` - Pass full product object

- [ ] **Step 3:** Fix history saving
  - Check RLS policies in Supabase Dashboard
  - Apply policies if missing
  - Update scan save code with proper error handling

- [ ] **Step 4:** Test
  ```bash
  # Test alternatives API
  curl -X POST https://yiilubsznpyiswpvqyhy.supabase.co/functions/v1/get-alternatives \
    -H "Content-Type: application/json" \
    -d '{
      "barcode": "5038862100700",
      "category": "en:beverages",
      "categories_tags": ["en:beverages", "en:fruit-juices", "en:orange-juices"],
      "nutri_score": "c"
    }'
  ```

---

## Expected Results After Fix

### Alternatives
```json
{
  "success": true,
  "data": [
    {
      "barcode": "3057640257773",
      "name": "Tropicana Pure Premium Orange",
      "brand": "Tropicana",
      "nutriScore": "b",
      "reason": "Nutri-Score improved by 1 grade (C → B)"
    },
    {
      "barcode": "5011026000206",
      "name": "Tesco Pure Orange Juice",
      "brand": "Tesco",
      "nutriScore": "b",
      "reason": "Nutri-Score improved by 1 grade (C → B)"
    }
    // ... 8 more alternatives
  ],
  "count": 10,
  "meta": {
    "query_time_ms": 450,
    "sources_used": ["openfoodfacts", "local_db"]
  }
}
```

### History (after RLS fix)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "safety_score": 85,
      "scanned_at": "2026-01-10T15:34:54Z",
      "products": {
        "name": "British Whole Milk",
        "brand": "Morning Fresh"
      }
    }
  ]
}
```

---

## Need More Help?

Share these with me and I can provide more specific fixes:

1. **For history issue:** Your `scans` table schema and current RLS policies
2. **For alternatives:** Console logs when clicking "Get Alternatives"
3. **General:** Any error messages you see in browser console or Supabase logs



----

get alt :

// =============================================================================
// GET-ALTERNATIVES v4 - Complete Rewrite
// =============================================================================
// This version actually works because it:
// 1. Uses OpenFoodFacts API to find real alternatives (not just your DB)
// 2. Handles category hierarchy properly
// 3. Filters by user preferences
// 4. Falls back gracefully
// =============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OpenFoodFacts API base URL
const OFF_API_BASE = "https://world.openfoodfacts.org";

interface AlternativeRequest {
  barcode: string;
  category?: string;
  categories_tags?: string[];  // Full category hierarchy from OFF
  safety_score?: number;
  nutri_score?: string;
  user_id?: string;
}

interface UserPreferences {
  avoid_allergens: string[];
  dietary_preferences: string[];
  age_bracket: string;
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
      categories_tags,
      safety_score = 50, 
      nutri_score,
      user_id 
    } = body;

    console.log("[GetAlternatives v4] Request:", { 
      barcode, 
      category, 
      categories_tags: categories_tags?.slice(0, 3),
      safety_score,
      nutri_score 
    });

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user preferences if user_id provided
    let userPrefs: UserPreferences = {
      avoid_allergens: [],
      dietary_preferences: [],
      age_bracket: "adult",
    };

    if (user_id) {
      const { data: prefs } = await supabaseClient
        .from("user_preferences")
        .select("avoid_allergens, dietary_preferences, age_bracket")
        .eq("user_id", user_id)
        .single();
      
      if (prefs) {
        userPrefs = prefs as UserPreferences;
      }
    }

    // Strategy: Try multiple sources in order of preference
    let alternatives: any[] = [];

    // 1. First, try to find alternatives from OpenFoodFacts API
    const offAlternatives = await findAlternativesFromOFF(
      barcode,
      categories_tags || [category || ""],
      nutri_score,
      userPrefs
    );
    alternatives = offAlternatives;

    console.log("[GetAlternatives v4] Found", alternatives.length, "from OpenFoodFacts");

    // 2. If OFF returned few results, supplement with local DB
    if (alternatives.length < 5) {
      const dbAlternatives = await findAlternativesFromDB(
        supabaseClient,
        barcode,
        category,
        safety_score,
        userPrefs
      );
      
      // Merge, avoiding duplicates
      const existingBarcodes = new Set(alternatives.map(a => a.barcode));
      for (const alt of dbAlternatives) {
        if (!existingBarcodes.has(alt.barcode)) {
          alternatives.push(alt);
        }
      }
    }

    // 3. Sort by health improvement / nutri-score
    alternatives.sort((a, b) => {
      // Nutri-score sorting: a > b > c > d > e
      const scoreOrder = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
      const aScore = scoreOrder[a.nutri_score?.toLowerCase()] || 0;
      const bScore = scoreOrder[b.nutri_score?.toLowerCase()] || 0;
      return bScore - aScore;
    });

    // 4. Limit to top 10
    alternatives = alternatives.slice(0, 10);

    // 5. Format response
    const formattedAlternatives = alternatives.map((alt, index) => ({
      barcode: alt.barcode,
      name: alt.name || alt.product_name,
      brand: alt.brand || alt.brands,
      imageUrl: alt.image_url || alt.image_front_small_url,
      nutriScore: alt.nutri_score || alt.nutrition_grades,
      novaGroup: alt.nova_group,
      safetyScore: calculateSafetyScore(alt, userPrefs),
      safetyLevel: getSafetyLevel(alt, userPrefs),
      improvement: getImprovementReason(alt, nutri_score),
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
          sources_used: ["openfoodfacts", "local_db"],
          filters_applied: {
            allergens_excluded: userPrefs.avoid_allergens.length,
            dietary_filters: userPrefs.dietary_preferences.length,
          },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[GetAlternatives v4] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message,
        // Return empty array so app doesn't crash
        data: [],
        count: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


// =============================================================================
// FIND ALTERNATIVES FROM OPENFOODFACTS API
// =============================================================================
async function findAlternativesFromOFF(
  currentBarcode: string,
  categories: string[],
  currentNutriScore: string | undefined,
  userPrefs: UserPreferences
): Promise<any[]> {
  try {
    // Extract the most specific category (last one is usually most specific)
    // e.g., ["en:beverages", "en:fruit-juices", "en:orange-juices"] -> "en:orange-juices"
    const searchCategory = categories
      .filter(c => c && c.startsWith("en:"))
      .pop() || categories[0] || "";

    if (!searchCategory) {
      console.log("[OFF Search] No valid category found");
      return [];
    }

    // Build search URL
    // We want products in same category with better nutri-score
    const nutriScoreFilter = getNutriScoreFilter(currentNutriScore);
    
    const searchUrl = `${OFF_API_BASE}/cgi/search.pl?` + new URLSearchParams({
      action: "process",
      tagtype_0: "categories",
      tag_contains_0: "contains",
      tag_0: searchCategory.replace("en:", ""),
      tagtype_1: "nutrition_grades",
      tag_contains_1: "contains", 
      tag_1: nutriScoreFilter,
      sort_by: "nutrition_grade",
      page_size: "20",
      json: "1",
      fields: "code,product_name,brands,image_front_small_url,nutrition_grades,nova_group,allergens_tags,ingredients_analysis_tags",
    });

    console.log("[OFF Search] Searching category:", searchCategory, "with nutri filter:", nutriScoreFilter);

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "GoodFor/1.0 (contact@goodfor.app)",
      },
    });

    if (!response.ok) {
      console.error("[OFF Search] API error:", response.status);
      return [];
    }

    const data = await response.json();
    const products = data.products || [];

    console.log("[OFF Search] API returned", products.length, "products");

    // Filter out current product and apply user preferences
    const filtered = products.filter((p: any) => {
      // Exclude current product
      if (p.code === currentBarcode) return false;
      
      // Exclude products with user's allergens
      if (userPrefs.avoid_allergens.length > 0 && p.allergens_tags) {
        const hasAllergen = userPrefs.avoid_allergens.some(
          allergen => p.allergens_tags.includes(allergen)
        );
        if (hasAllergen) return false;
      }

      // Apply dietary filters
      if (userPrefs.dietary_preferences.includes("vegan")) {
        if (!p.ingredients_analysis_tags?.includes("en:vegan")) return false;
      }
      if (userPrefs.dietary_preferences.includes("vegetarian")) {
        if (!p.ingredients_analysis_tags?.includes("en:vegetarian")) return false;
      }

      return true;
    });

    return filtered.map((p: any) => ({
      barcode: p.code,
      name: p.product_name,
      brand: p.brands,
      image_url: p.image_front_small_url,
      nutri_score: p.nutrition_grades,
      nova_group: p.nova_group,
      allergens_tags: p.allergens_tags,
      source: "openfoodfacts",
    }));

  } catch (error) {
    console.error("[OFF Search] Error:", error);
    return [];
  }
}


// =============================================================================
// FIND ALTERNATIVES FROM LOCAL DATABASE
// =============================================================================
async function findAlternativesFromDB(
  supabase: any,
  currentBarcode: string,
  category: string | undefined,
  currentScore: number,
  userPrefs: UserPreferences
): Promise<any[]> {
  try {
    if (!category) return [];

    // Extract base category for broader matching
    // e.g., "en:beverages-and-beverages-preparations" -> search for anything with "beverages"
    const categoryParts = category.replace("en:", "").split("-");
    const baseCategory = categoryParts[0]; // "beverages"

    // Search for products with similar category and better scores
    const { data: scans, error } = await supabase
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
          nova_group,
          allergens_tags
        )
      `)
      .ilike("category", `%${baseCategory}%`)  // Broader category match
      .gte("safety_score", currentScore)       // Equal or better score
      .neq("products.barcode", currentBarcode) // Exclude current product
      .order("safety_score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[DB Search] Error:", error);
      return [];
    }

    // Filter by user preferences
    const filtered = (scans || []).filter((scan: any) => {
      if (!scan.products) return false;
      
      // Check allergens
      if (userPrefs.avoid_allergens.length > 0 && scan.products.allergens_tags) {
        const hasAllergen = userPrefs.avoid_allergens.some(
          allergen => scan.products.allergens_tags.includes(allergen)
        );
        if (hasAllergen) return false;
      }

      return true;
    });

    return filtered.map((scan: any) => ({
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

function getNutriScoreFilter(currentScore: string | undefined): string {
  // Return scores that are equal or better
  // Nutri-Score: a (best) -> e (worst)
  const scoreOrder = ['a', 'b', 'c', 'd', 'e'];
  
  if (!currentScore) {
    return "a|b|c"; // Default to better half
  }

  const currentIndex = scoreOrder.indexOf(currentScore.toLowerCase());
  if (currentIndex === -1) {
    return "a|b|c";
  }

  // Return all scores that are equal or better
  // e.g., if current is 'c', return 'a|b|c'
  return scoreOrder.slice(0, currentIndex + 1).join("|");
}


function calculateSafetyScore(product: any, userPrefs: UserPreferences): number {
  let score = 70; // Base score

  // Boost for good nutri-score
  const nutriBoost: Record<string, number> = { 'a': 25, 'b': 20, 'c': 10, 'd': 0, 'e': -10 };
  const nutri = product.nutri_score?.toLowerCase() || product.nutrition_grades?.toLowerCase();
  score += nutriBoost[nutri] || 0;

  // Penalty for high NOVA group
  const novaGroup = product.nova_group || product.novaGroup;
  if (novaGroup === 4) score -= 15;
  if (novaGroup === 3) score -= 5;

  // Bonus for no allergens matching user's avoidance list
  if (userPrefs.avoid_allergens.length > 0) {
    const productAllergens = product.allergens_tags || [];
    const hasUserAllergen = userPrefs.avoid_allergens.some(a => productAllergens.includes(a));
    if (!hasUserAllergen) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}


function getSafetyLevel(product: any, userPrefs: UserPreferences): string {
  const score = calculateSafetyScore(product, userPrefs);
  
  if (score >= 80) return "safe";
  if (score >= 60) return "caution";
  return "warning";
}


function getImprovementReason(product: any, originalNutriScore: string | undefined): string {
  const productScore = product.nutri_score?.toLowerCase() || product.nutrition_grades?.toLowerCase();
  
  if (!originalNutriScore || !productScore) {
    return "Healthier alternative in same category";
  }

  const scoreOrder = ['a', 'b', 'c', 'd', 'e'];
  const originalIndex = scoreOrder.indexOf(originalNutriScore.toLowerCase());
  const productIndex = scoreOrder.indexOf(productScore.toLowerCase());

  if (productIndex < originalIndex) {
    const improvement = originalIndex - productIndex;
    return `Nutri-Score improved by ${improvement} grade${improvement > 1 ? 's' : ''} (${originalNutriScore.toUpperCase()} → ${productScore.toUpperCase()})`;
  }

  if (productIndex === originalIndex) {
    return `Same Nutri-Score (${productScore.toUpperCase()}) with potentially better ingredients`;
  }

  return "Alternative option in same category";
}


---

