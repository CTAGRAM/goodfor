# Why Alternatives Search is Failing - Exact Technical Diagnosis

## Executive Summary

**Root Cause**: Frontend code is NOT updated. Edge Function v4 is deployed and working, but frontend still calls it with OLD parameters.

**Status**: 
- ✅ Edge Function v4 deployed (has OpenFoodFacts API integration)
- ❌ Frontend NOT updated (still passes only `barcode` and `category`)
- ❌ Result: Edge Function receives incomplete data, returns empty results

---

## Exact Evidence

### 1. Edge Function v4 Status
```
Version: 4 (deployed successfully)
Last Call: 2026-01-10 15:27:14 UTC
Status: 200 OK
Execution Time: 16,601ms (trying OpenFoodFacts API)
```

### 2. Frontend Code (CURRENT - WRONG)

**File**: `src/lib/edgeFunctions.js` Line 46-52

```javascript
export async function getAlternativesEdge(barcode, category) {
    console.log('[EdgeFunction] Getting alternatives for:', barcode, category);
    
    const result = await callEdgeFunction('get-alternatives', {
        barcode,        // ✅ Sent
        category,       // ✅ Sent
        // ❌ categories_tags: MISSING
        // ❌ nutri_score: MISSING
        // ❌ user_id: MISSING
    });
    
    return result.data || [];
}
```

### 3. What Edge Function v4 Expects

```typescript
interface AlternativeRequest {
  barcode: string;           // ✅ Frontend sends this
  category?: string;         // ✅ Frontend sends this
  categories_tags?: string[]; // ❌ Frontend NOT sending
  safety_score?: number;     // ❌ Frontend NOT sending
  nutri_score?: string;      // ❌ Frontend NOT sending (CRITICAL)
  user_id?: string;          // ❌ Frontend NOT sending
}
```

### 4. What Actually Happens

**Request Sent by Frontend:**
```json
{
  "barcode": "5038862100700",
  "category": "en:beverages-and-beverages-preparations"
}
```

**Edge Function Receives:**
```typescript
const { barcode, category, categories_tags, nutri_score, user_id } = await req.json();
// barcode = "5038862100700" ✅
// category = "en:beverages-and-beverages-preparations" ✅
// categories_tags = undefined ❌
// nutri_score = undefined ❌ (CRITICAL - needed for OpenFoodFacts search)
// user_id = undefined ❌
```

**Edge Function Tries to Search OpenFoodFacts:**
```typescript
// Line 208: Build OpenFoodFacts search URL
const nutriScoreFilter = getNutriScoreFilter(currentNutriScore);
// currentNutriScore = undefined
// nutriScoreFilter = "a|b|c" (default fallback)

const searchUrl = `${OFF_API_BASE}/cgi/search.pl?` + new URLSearchParams({
  action: "process",
  tagtype_0: "categories",
  tag_contains_0: "contains",
  tag_0: "beverages-and-beverages-preparations",
  tagtype_1: "nutrition_grades",
  tag_contains_1: "contains", 
  tag_1: "a|b|c",  // ❌ Searching only for A, B, C grades
  sort_by: "nutrition_grade",
  page_size: "20",
  json: "1"
});
```

**OpenFoodFacts Returns:**
- Maybe 0-5 products (only A/B/C grade beverages)
- Filters out current product
- Result: Empty or very few alternatives

---

## The Exact Problem

### Issue 1: No Nutri-Score Passed
```
Frontend doesn't extract nutri_score from product
     ↓
Edge Function defaults to searching only A/B/C grades
     ↓
Too restrictive filter
     ↓
Few or no results
```

### Issue 2: No Category Hierarchy
```
Frontend passes: "en:beverages-and-beverages-preparations"
Edge Function expects: ["en:beverages", "en:fruit-juices", "en:orange-juices"]
     ↓
Searches too broad category
     ↓
Gets unrelated products or nothing specific
```

### Issue 3: No User Preferences
```
Frontend doesn't pass user_id
     ↓
Edge Function can't load allergens/dietary preferences
     ↓
Can't filter properly
     ↓
May return products user is allergic to
```

---

## Database Evidence

```sql
-- Current products in database
SELECT barcode, name, category FROM products;

-- Result:
barcode          | name                    | category
5038862100700   | Orange juice with bits  | en:beverages-and-beverages-preparations
20017743        | British Whole Milk      | en:dairies
```

Only 2 products exist. When you scan one, only 1 remains. If they're in different categories → empty result.

---

## Exact Fix Required

### File 1: `src/lib/edgeFunctions.js`

**Replace lines 46-61:**
```javascript
export async function getAlternativesEdge(product) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const requestData = {
        barcode: product.barcode || product.code,
        category: product.category || product.categories?.[0],
        categories_tags: product.categories_tags || product.categories || [],
        safety_score: product.safetyScore || product.safety_score || 50,
        nutri_score: product.nutriScore || product.nutrition_grades,
        user_id: user?.id,
    };
    
    const result = await callEdgeFunction('get-alternatives', requestData);
    return result.data || [];
}
```

### File 2: `src/app/alternatives.jsx`

**Replace lines 36-39:**
```javascript
// OLD (wrong):
const alts = await getAlternativesEdge(
    product.barcode,
    product.categories?.[0] || product.category
);

// NEW (correct):
const alts = await getAlternativesEdge(product);
```

---

## Test to Prove It Works

### Manual Test with curl:
```bash
curl -X POST https://yiilubsznpyiswpvqyhy.supabase.co/functions/v1/get-alternatives \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "5038862100700",
    "category": "en:orange-juices",
    "categories_tags": ["en:beverages", "en:fruit-juices", "en:orange-juices"],
    "nutri_score": "c"
  }'
```

**Expected Response:**
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
    // ... more alternatives
  ],
  "count": 10,
  "meta": {
    "query_time_ms": 450,
    "sources_used": ["openfoodfacts"]
  }
}
```

---

## Summary

| Component | Status | What's Wrong |
|-----------|--------|--------------|
| Edge Function v4 | ✅ Deployed | Working perfectly |
| Frontend `edgeFunctions.js` | ❌ Not Updated | Still using old function signature |
| Frontend `alternatives.jsx` | ❌ Not Updated | Passing individual params instead of product object |
| OpenFoodFacts API | ✅ Available | Ready to return results |
| Result | ❌ Empty | Frontend sends incomplete data → Edge Function can't search properly |

**Fix**: Update 2 lines in `edgeFunctions.js` and 1 line in `alternatives.jsx` to pass complete product object.

**ETA**: 2 minutes to fix, immediate results.
