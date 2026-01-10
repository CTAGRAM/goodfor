# Alternatives Not Working - Complete Diagnostic Report
**Last Updated**: 2026-01-10 21:07 IST  
**Edge Function Version**: v3  
**Status**: 🟡 Returns 200 but empty results

---

## Current System State

### Database Overview
```sql
-- Current scans in database
SELECT COUNT(*) FROM scans;
-- Result: 2 scans

SELECT COUNT(*) FROM products;
-- Result: 2 products
```

### Actual Data in Database
```
Scan 1:
  - Product: British Whole Milk
  - Barcode: 20017743
  - Brand: Morning fresh, Dairy Manor
  - Category: en:dairies
  - Safety Score: 85
  - Safety Level: caution
  - Scanned At: 2026-01-10 15:34:54 UTC

Scan 2:
  - Product: Orange juice with bits  
  - Barcode: 5038862100700
  - Brand: Innocent
  - Category: en:beverages-and-beverages-preparations
  - Safety Score: 100
  - Safety Level: safe
  - Scanned At: 2026-01-10 15:14:33 UTC
```

---

## Edge Function v3 - DEPLOYED CODE

**URL**: `https://yiilubsznpyiswpvqyhy.supabase.co/functions/v1/get-alternatives`  
**Version**: 3  
**JWT Verification**: DISABLED  
**Last Updated**: 2026-01-10 14:47:19 UTC

### Complete Source Code
```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { barcode, category, safety_score } = await req.json();

    console.log("[GetAlternatives] Request:", { barcode, category, safety_score });

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchCategory = category || "Food Product";
    const minScore = safety_score || 50; // Default minimum score

    console.log("[GetAlternatives] Searching:", { searchCategory, minScore });

    // Search for products in same category with better safety scores
    const { data: betterScans, error: searchError } = await supabaseClient
      .from("scans")
      .select(\`
        safety_score,
        safety_level,
        category,
        products (
          id,
          barcode,
          name,
          brand,
          image_url
        )
      \`)
      .eq("category", searchCategory)
      .gte("safety_score", minScore + 5)
      .order("safety_score", { ascending: false })
      .limit(10);

    if (searchError) {
      console.error("[GetAlternatives] Search error:", searchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch alternatives", details: searchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[GetAlternatives] Found", betterScans?.length || 0, "alternatives");

    // Filter out the current product if it's in the results
    const filtered = (betterScans || []).filter(scan => 
      scan.products?.barcode !== barcode
    );

    const formattedAlternatives = filtered.map((scan) => ({
      barcode: scan.products?.barcode,
      name: scan.products?.name,
      brand: scan.products?.brand,
      imageUrl: scan.products?.image_url,
      safetyScore: scan.safety_score,
      safetyLevel: scan.safety_level,
      improvement: scan.safety_score - minScore,
      reason: \`Better safety score (+\${scan.safety_score - minScore} points)\`,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedAlternatives,
        count: formattedAlternatives.length,
        searchedCategory: searchCategory,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[GetAlternatives] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## Edge Function Logs (Latest)

### Recent Invocations
```
1. Timestamp: 2026-01-10 15:35:10 UTC
   Version: 3
   Status: 200 OK
   Execution Time: 345ms
   
2. Timestamp: 2026-01-10 15:35:03 UTC
   Version: 3
   Status: 200 OK
   Execution Time: 3218ms
   
3. Timestamp: 2026-01-10 14:54:59 UTC
   Version: 2
   Status: 200 OK
   Execution Time: 3344ms
   
4. Timestamp: 2026-01-10 14:22:21 UTC
   Version: 1
   Status: 401 UNAUTHORIZED
   Execution Time: 2510ms
```

**Analysis**: 
- Function is executing successfully (200 responses)
- Execution times are normal (345ms - 3.2s)
- v1 had 401 errors (JWT verification issue - FIXED in v2)
- v3 is currently deployed and responding

---

## Frontend Implementation

### File: `src/lib/edgeFunctions.js`
```javascript
export async function getAlternativesEdge(barcode, category) {
    console.log('[EdgeFunction] Getting alternatives for:', barcode, category);
    
    const result = await callEdgeFunction('get-alternatives', {
        barcode,
        category,
    });

    console.log('[EdgeFunction] Alternatives result:', result);
    
    if (!result.success) {
        throw new Error(result.error || 'Failed to get alternatives');
    }

    return result.data || [];
}

async function callEdgeFunction(functionName, body = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = {
        'Content-Type': 'application/json',
    };

    if (session?.access_token) {
        headers['Authorization'] = \`Bearer \${session.access_token}\`;
    }

    const response = await fetch(\`\${EDGE_FUNCTIONS_URL}/\${functionName}\`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || \`Edge Function error: \${response.status}\`);
    }

    return await response.json();
}
```

### File: `src/app/alternatives.jsx`
```javascript
const loadAlternatives = async () => {
    try {
        setLoading(true);
        console.log('[Alternatives] Loading for product:', product.barcode);
        
        // Use Edge Function to get alternatives
        const alts = await getAlternativesEdge(
            product.barcode,
            product.categories?.[0] || product.category
        );

        console.log('[Alternatives] Got', alts.length, 'alternatives from Edge Function');

        // Map to display format
        const mapped = alts.map((alt, index) => ({
            barcode: alt.barcode,
            name: alt.name,
            brand: alt.brand,
            imageUrl: alt.imageUrl,
            score: alt.safetyScore || 75,
            badge: alt.safetyLevel === 'safe' ? 'Top Match' : index === 0 ? 'Eco-Friendly' : 'Popular Choice',
            reasons: [alt.reason || 'Better safety score'],
        }));

        setAlternatives(mapped);
    } catch (error) {
        console.error('[Alternatives] Failed to load:', error);
        setAlternatives([]);
    } finally {
        setLoading(false);
    }
};
```

---

## Root Cause Analysis

### 🔴 CRITICAL ISSUE: Frontend NOT Passing safety_score

**The Problem**: The frontend code is calling:
```javascript
getAlternativesEdge(product.barcode, product.categories?.[0])
```

But the function signature in `edgeFunctions.js` is:
```javascript
export async function getAlternativesEdge(barcode, category)
```

**Missing**: The `safety_score` parameter!

The Edge Function v3 expects:
```json
{
  "barcode": "...",
  "category": "...",
  "safety_score": 85  // <-- MISSING IN FRONTEND CALL
}
```

But frontend only sends:
```json
{
  "barcode": "...",
  "category": "..."
  // safety_score is undefined!
}
```

### Why This Causes Empty Results

1. **Request**: User scans "Orange Juice" (safety_score = 100)
2. **Frontend sends**: \`{ barcode: "5038862100700", category: "en:beverages-and-beverages-preparations" }\`
3. **Edge Function receives**: \`safety_score = undefined\`
4. **Edge Function defaults**: \`minScore = 50\`
5. **Query runs**: Find products in "en:beverages-and-beverages-preparations" with score >= 55
6. **Database has**: Only 1 beverage (Orange Juice itself, score 100)
7. **Filter removes**: Current product (Orange Juice)
8. **Result**: Empty array ✓ (technically correct, but not useful)

### Example Scenario with Milk
1. **Request**: User scans "British Whole Milk" (safety_score = 85)
2. **Frontend would send**: \`{ barcode: "20017743", category: "en:dairies" }\`
3. **Edge Function defaults**: \`minScore = 50\`
4. **Query**: Find dairies with score >= 55
5. **Database has**: Only 1 dairy product (the milk itself)
6. **After filtering**: Empty (milk removed)
7. **Result**: Empty array

---

## Why It Returns Empty

### Scenario 1: Category Mismatch
```
User scanning: barcode=5038862100700 (Orange Juice)
Category sent: "en:beverages-and-beverages-preparations"

Database query: WHERE category = "en:beverages-and-beverages-preparations" AND safety_score >= 55

Current scans in DB:
  ✅ Orange Juice (category: en:beverages-and-beverages-preparations, score: 100)
  ❌ Milk (category: en:dairies, score: 85) - wrong category

After filtering out current product:
  Result: [] (empty)
```

### Scenario 2: Insufficient Data
- Only 2 products in entire database
- When user scans one, only 1 remains
- If that 1 doesn't match category → empty
- If it matches but is the same product → filtered out → empty

---

## The Real Fix Needed

### Option 1: Pass safety_score from Frontend (RECOMMENDED)
```javascript
// edgeFunctions.js
export async function getAlternativesEdge(barcode, category, safety_score) {
    const result = await callEdgeFunction('get-alternatives', {
        barcode,
        category,
        safety_score, // <-- ADD THIS
    });
    // ...
}

// alternatives.jsx
const safetyScore = product.safetyScore || product.safeScore || 50;
const alts = await getAlternativesEdge(
    product.barcode,
    product.categories?.[0] || product.category,
    safetyScore // <-- ADD THIS
);
```

### Option 2: Fallback to OpenFoodFacts
If no alternatives in database, fetch from external API:
```typescript
// In Edge Function
if (betterScans.length === 0) {
    // Fetch from OpenFoodFacts API
    // Search same category
    // Return those instead
}
```

### Option 3: Seed Database with Sample Products
```sql
-- Add 20-30 sample products across categories
INSERT INTO products (barcode, name, brand, category, ...) VALUES
  ('111111', 'Healthy Snack A', 'Brand X', 'Snacks', ...),
  ('222222', 'Healthy Snack B', 'Brand Y', 'Snacks', ...),
  -- ... more products
```

---

## Expected vs Actual Behavior

### What SHOULD Happen
```
User scans Milk (score 70)
→ App sends: { barcode: "20017743", category: "en:dairies", safety_score: 70 }
→ Edge Function queries: category = "en:dairies" AND score >= 75
→ Database returns: [Better Milk brands from other users' scans]
→ User sees: 3-5 healthier milk alternatives
```

### What ACTUALLY Happens
```
User scans Milk (score 70)
→ App sends: { barcode: "20017743", category: "en:dairies" }  ❌ no safety_score
→ Edge Function queries: category = "en:dairies" AND score >= 55 (default)
→ Database returns: [Milk itself]
→ Filter removes current product
→ User sees: [] (empty)
```

---

## Testing Commands

### Check what Edge Function would return for Orange Juice
```bash
curl -X POST https://yiilubsznpyiswpvqyhy.supabase.co/functions/v1/get-alternatives \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "5038862100700",
    "category": "en:beverages-and-beverages-preparations",
    "safety_score": 100
  }'
```

### Check database for potential alternatives
```sql
SELECT 
  p.name,
  p.barcode,
  p.category,
  s.safety_score
FROM scans s
JOIN products p ON s.product_id = p.id
WHERE s.category = 'en:beverages-and-beverages-preparations'
  AND s.safety_score >= 105
ORDER BY s.safety_score DESC;
```

---

## Summary

| Component | Status | Issue |
|-----------|--------|-------|
| Edge Function v3 | ✅ Deployed | Working correctly |
| Database Scans | ✅ Has Data | Only 2 scans total |  
| Frontend Call | ❌ Bug | NOT passing \`safety_score\` |
| Results | ❌ Empty | Not enough data + missing parameter |

### Immediate Actions Required

1. **Fix Frontend** (src/lib/edgeFunctions.js):
   - Add \`safety_score\` parameter to \`getAlternativesEdge\` function
   
2. **Fix Frontend** (src/app/alternatives.jsx):
   - Extract safety score from product data
   - Pass it to \`getAlternativesEdge\`

3. **Optional**: Seed database with more sample scans for realistic testing

---

## Code Changes Needed

### File: \`src/lib/edgeFunctions.js\`
```diff
- export async function getAlternativesEdge(barcode, category) {
+ export async function getAlternativesEdge(barcode, category, safety_score) {
    const result = await callEdgeFunction('get-alternatives', {
        barcode,
        category,
+       safety_score,
    });
```

### File: \`src/app/alternatives.jsx\`  
```diff
  const loadAlternatives = async () => {
      try {
          setLoading(true);
+         const safetyScore = product.safetyScore || product.safeScore || 50;
          
          const alts = await getAlternativesEdge(
              product.barcode,
-             product.categories?.[0] || product.category
+             product.categories?.[0] || product.category,
+             safetyScore
          );
```

---

**Status**: Ready for code fixes. Edge Function is working correctly. Frontend needs 2 small changes.
