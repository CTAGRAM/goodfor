# Alternatives Not Working - Detailed Error Report

## Issue Summary
The alternatives feature is not returning any results when users scan products.

## Architecture Overview

### Current Implementation
1. **Frontend**: `src/app/alternatives.jsx`
2. **Edge Function**: `get-alternatives` (deployed to Supabase)
3. **Database Tables**: `scans`, `products`

---

## Edge Function Code (v2)

**Deployed at**: `https://yiilubsznpyiswpvqyhy.supabase.co/functions/v1/get-alternatives`

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
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { barcode, category } = await req.json();

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "barcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's recent scans for this product to find category and safety score
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = user?.id;

    console.log("[GetAlternatives] User ID:", userId);
    console.log("[GetAlternatives] Barcode:", barcode);
    console.log("[GetAlternatives] Category:", category);

    // Get current product's category and safety score
    const { data: currentScans } = await supabaseClient
      .from("scans")
      .select("safety_score, category, product_id, products(*)")
      .eq("products.barcode", barcode)
      .order("scanned_at", { ascending: false })
      .limit(1);

    const searchCategory = category || currentScans?.[0]?.category || "Food Product";
    const minScore = currentScans?.[0]?.safety_score || 0;

    console.log("[GetAlternatives] Search category:", searchCategory);
    console.log("[GetAlternatives] Min safety score:", minScore);

    // Search for products in same category with better safety scores
    const { data: betterScans, error: searchError } = await supabaseClient
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
          image_url
        )
      `)
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

    const formattedAlternatives = (betterScans || []).map((scan) => ({
      barcode: scan.products?.barcode,
      name: scan.products?.name,
      brand: scan.products?.brand,
      imageUrl: scan.products?.image_url,
      safetyScore: scan.safety_score,
      safetyLevel: scan.safety_level,
      improvement: scan.safety_score - minScore,
      reason: `Better safety score (+${scan.safety_score - minScore} points)`,
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

## Frontend Call

**File**: `src/lib/edgeFunctions.js`

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
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${EDGE_FUNCTIONS_URL}/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Edge Function error: ${response.status}`);
    }

    return await response.json();
}
```

---

## Database Schema

### `scans` table
```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  product_id UUID REFERENCES products(id),
  family_member_id UUID REFERENCES family_members(id),
  safety_score INTEGER,
  safety_level TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT,
  safety_details JSONB,
  alternatives_data JSONB
);
```

### `products` table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  name TEXT,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  ingredients JSONB,
  nutrition_facts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Problem Analysis

### Issue 1: Empty Database
**Root Cause**: The `scans` and `products` tables are likely empty because:
1. New scanning logic was just implemented
2. Previous scans may have used old schema (different column names)
3. No historical data has been migrated

**Evidence**:
- Edge Function query: `.from("scans").select(...)` returns empty array
- No alternatives found because there are no scans to compare against

### Issue 2: Query Logic Flaw
The Edge Function queries `.eq("products.barcode", barcode)` which:
1. Tries to find the CURRENT product in the scans table
2. Then searches for alternatives with better scores
3. **Problem**: If this is the first time scanning this product, it won't exist in scans yet!

**Flow**:
```
User scans product → 
Frontend calls get-alternatives with barcode →
Edge Function queries scans for that barcode →
❌ Not found (first scan) →
Returns 0 alternatives
```

### Issue 3: Scan Saving May Be Failing
From earlier logs: `[ScanSave] Insert error: {"code": "PGRST204"}`

If scans aren't being saved, the database stays empty, and alternatives will never work.

---

## Solutions

### Solution 1: Fix Scan Saving (CRITICAL)
Ensure scans are actually being saved to the database:
```javascript
// Check scan-processing.jsx
// Verify product upsert succeeds
// Verify scan insert succeeds
// Check for errors in console
```

### Solution 2: Change Alternatives Logic
Instead of querying for the current product in scans:
```javascript
// OLD (broken):
const currentScans = await supabase
  .from("scans")
  .select("...")
  .eq("products.barcode", barcode)  // ❌ Won't find first-time scans

// NEW (fixed):
// Get the product directly from products table
// OR accept safety_score in the request body
// OR query OpenFoodFacts as fallback
```

### Solution 3: Seed Database with Sample Data
For testing, add sample products with various safety scores:
```sql
INSERT INTO products (barcode, name, brand, category, ...) VALUES
  ('123456', 'Healthy Snack', 'Brand A', 'Snacks', ...),
  ('789012', 'Better Snack', 'Brand B', 'Snacks', ...);

INSERT INTO scans (user_id, product_id, safety_score, safety_level, category) VALUES
  (...);
```

---

## Recommended Fix Order

1. **First**: Verify scans are being saved
   - Check terminal logs for `[ScanSave] Product saved: <uuid>`
   - Check Supabase dashboard → Table Editor → scans table
   - If empty, fix the saving logic

2. **Second**: Update Edge Function to handle first-time scans
   - Accept `safety_score` in request body
   - Don't query scans for current product
   - Just search for better alternatives in same category

3. **Third**: Test with real scans
   - Scan multiple products
   - Verify they appear in database
   - Try alternatives again

---

## How to Debug

### Check if scans are being saved:
```sql
-- Run in Supabase SQL Editor
SELECT 
  s.id, 
  s.safety_score, 
  s.category,
  p.name,
  p.barcode
FROM scans s
JOIN products p ON s.product_id = p.id
ORDER BY s.scanned_at DESC
LIMIT 10;
```

### Check Edge Function logs:
Go to Supabase Dashboard → Edge Functions → get-alternatives → Logs

Look for:
- `[GetAlternatives] User ID:`
- `[GetAlternatives] Search category:`
- `[GetAlternatives] Found X alternatives`

### Check frontend console:
Look for:
- `[ScanSave] Product saved:` 
- `[ScanSave] Scan saved successfully`
- `[EdgeFunction] Alternatives result:`

---

## Expected API Flow

### Request
```json
POST https://yiilubsznpyiswpvqyhy.supabase.co/functions/v1/get-alternatives
Authorization: Bearer <token>
Content-Type: application/json

{
  "barcode": "5038862100700",
  "category": "Beverages"
}
```

### Response (Success)
```json
{
  "success": true,
  "data": [
    {
      "barcode": "123456789",
      "name": "Healthier Alternative",
      "brand": "Good Brand",
      "imageUrl": "https://...",
      "safetyScore": 85,
      "safetyLevel": "safe",
      "improvement": 15,
      "reason": "Better safety score (+15 points)"
    }
  ],
  "count": 1,
  "searchedCategory": "Beverages"
}
```

### Response (Empty - Current Issue)
```json
{
  "success": true,
  "data": [],
  "count": 0,
  "searchedCategory": "Beverages"
}
```

---

## Next Steps for AI/Developer

1. Run SQL query to check if scans table has data
2. Check Edge Function logs for any errors
3. Verify scan saving is working (check terminal)
4. Update Edge Function to not require current product in scans
5. Test with multiple scanned products
6. Consider adding sample/seed data for testing
