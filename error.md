# Error Analysis & Fix Plan

**Status**: 🔴 Critical Issues Persist regarding Data Saving and Search Results.

## 1. Scan Saving Failed (RLS Policy Issue)

### The Error
```
ERROR [ScanSave] Product upsert error: {
  "code": "42501",
  "message": "new row violates row-level security policy (USING expression) for table \"products\""
}
```

### Root Cause
You are trying to insert/update a product in the `products` table, but Supabase RLS (Row Level Security) is blocking it.
*   **Table**: `public.products`
*   **User**: Authenticated (UUID: `9aa16ecd-f29b-4fda-ad45-4961361d3beb`)
*   **Missing Policy**: There is no policy allowing "Authenticated Users" to `INSERT` or `UPDATE` rows in the `products` table.

### Required Fix (Run in Supabase SQL Editor)
You must explicitly allow users to add new products to the global database.

```sql
-- Enable RLS (if not already)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to insert new products
CREATE POLICY "Enable insert for authenticated users" ON "public"."products"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow any authenticated user to update products (or limit to ones they created)
CREATE POLICY "Enable update for authenticated users" ON "public"."products"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow everyone (even anon) to read products
CREATE POLICY "Enable read access for all users" ON "public"."products"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
```

---

## 2. Alternatives Returns 0 Results

### The Logs
```
LOG [EdgeFunction] Getting alternatives with data: {
  "barcode": "20017743", 
  "category": "en:dairies", 
  "nutri_score": "c", 
  "safety_score": 50
}
LOG [EdgeFunction] Alternatives result: {
  "count": 0, 
  "source": ["openfoodfacts", "local_db"], 
  "success": true
}
```

### Analysis
1.  **Code is Working**: The frontend is successfully sending the `nutri_score`, `category`, etc. to the Edge Function.
2.  **Edge Function is Working**: It queries OpenFoodFacts and Local DB but finds **0 matches**.

### Why 0 Results? (Hypothesis)
1.  **Category "en:dairies" is too broad/vague** for OpenFoodFacts search.
    *   OFF often uses specific categories like `en:whole-milks` or `en:cow-milks`.
    *   Searching just `en:dairies` might rely on a specific tag structure.
2.  **Nutri-Score Filtering is too strict**.
    *   Input: `nutri_score: c`.
    *   Filter: `a|b|c`.
    *   It *should* return results, but if OFF API returns products that don't match strict criteria, they get filtered out.
3.  **Local DB is Empty**.
    *   Since scans aren't saving (due to Issue #1 RLS), the local database never builds up a library of products to fallback on.

### Proposed Fixes

#### A. Fix Scan Saving First (Critical)
Once scans start saving, your local database will grow, and the fallback search will start working.

#### B. Debug OpenFoodFacts Search (Edge Function)
Update Edge Function to use a broader search if the specific one fails.

**Current Search URL (Reconstructed):**
`https://world.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=dairies&tagtype_1=nutrition_grades&tag_1=a|b|c&json=1`

If you try this URL in a browser, you might see 0 results or results that don't match the filtering logic.

**Recommendation**:
Relax the filtering in the Edge Function to just search by Category first, then sort by Nutri-Score in code, rather than using the strict API filter parameter.

---

## Next Steps for You
1.  **Run the SQL Commands** above in your Supabase Dashboard to fix the `products` table RLS error.
2.  **Retry Scanning** a product. It should now save to history.
3.  **Check Alternatives Again**. If still 0, we will modify the Edge Function to use "Relaxed Search" (search by category only, then filter).
