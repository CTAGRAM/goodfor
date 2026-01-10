# GoodFor: Alternative Products Recommendation System

## Executive Summary

This document outlines the architecture for a fast, personalized alternative product recommendation system. The design prioritizes both **quality** (relevant, personalized results) and **speed** (<1 second response time).

**Core Strategy:** Pre-compute what's expensive, filter what's fast.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   [Scan Product] → [View Details] → [Click "Find Alternatives"] → [Results] │
│        ↓                                                    ↓                │
│   Cache Hit/Miss                                     < 800ms target          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐        │
│  │   Supabase   │    │  Supabase Edge   │    │    PostgreSQL      │        │
│  │   Client     │───▶│    Function      │───▶│   (with indexes)   │        │
│  │   (App)      │    │  "get-alts"      │    │                    │        │
│  └──────────────┘    └──────────────────┘    └────────────────────┘        │
│                              │                         │                    │
│                              ▼                         ▼                    │
│                     ┌──────────────────┐    ┌────────────────────┐        │
│                     │   Redis Cache    │    │  Background Jobs   │        │
│                     │   (Optional)     │    │  (Pre-computation) │        │
│                     └──────────────────┘    └────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Design

### Core Tables

```sql
-- ============================================
-- PRODUCTS TABLE (Main product data)
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(14) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    
    -- Categorization (CRITICAL for alternatives)
    category_id UUID REFERENCES categories(id),
    subcategory_id UUID REFERENCES subcategories(id),
    
    -- OFF Data
    ingredients_text TEXT,
    allergens_tags TEXT[],           -- ['en:milk', 'en:gluten', 'en:nuts']
    traces_tags TEXT[],              -- May contain
    additives_tags TEXT[],           -- ['en:e322', 'en:e471']
    
    -- Nutritional Data (per 100g)
    energy_kcal DECIMAL(8,2),
    fat DECIMAL(8,2),
    saturated_fat DECIMAL(8,2),
    sugars DECIMAL(8,2),
    sodium DECIMAL(8,2),
    fiber DECIMAL(8,2),
    proteins DECIMAL(8,2),
    
    -- Scores (PRE-COMPUTED)
    nutri_score CHAR(1),             -- a, b, c, d, e
    nova_group SMALLINT,             -- 1, 2, 3, 4
    eco_score CHAR(1),
    
    -- GoodFor Custom Scores (PRE-COMPUTED)
    health_score SMALLINT,           -- 0-100 (higher = healthier)
    safety_score_infant SMALLINT,    -- 0-100 for each age bracket
    safety_score_child SMALLINT,
    safety_score_teen SMALLINT,
    safety_score_adult SMALLINT,
    safety_score_elderly SMALLINT,
    
    -- Dietary Flags (PRE-COMPUTED from ingredients)
    is_vegan BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    is_lactose_free BOOLEAN DEFAULT FALSE,
    is_organic BOOLEAN DEFAULT FALSE,
    is_sugar_free BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    image_url TEXT,
    source VARCHAR(50) DEFAULT 'openfoodfacts',
    data_quality_score SMALLINT,     -- How complete is the data
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CATEGORIES & SUBCATEGORIES
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    product_type VARCHAR(20) NOT NULL  -- 'food' or 'beauty'
);

-- Example categories:
-- food > beverages > soft-drinks
-- food > snacks > chips
-- food > baby-food > infant-formula
-- beauty > skincare > moisturizers
-- beauty > baby-care > baby-lotion

CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL
);

-- ============================================
-- USER PREFERENCES (Fast lookup)
-- ============================================
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    
    -- Age Configuration
    age_bracket VARCHAR(20) NOT NULL DEFAULT 'adult',
    -- Values: 'infant_0_6', 'infant_6_12', 'toddler', 'child', 'teen', 'adult', 'elderly', 'pregnant'
    
    -- Allergen Avoidance (CRITICAL)
    avoid_allergens TEXT[] DEFAULT '{}',
    -- ['en:milk', 'en:gluten', 'en:peanuts', 'en:tree-nuts', 'en:eggs', 'en:soy', 'en:fish', 'en:shellfish', 'en:sesame']
    
    -- Dietary Preferences
    dietary_preferences TEXT[] DEFAULT '{}',
    -- ['vegan', 'vegetarian', 'gluten_free', 'lactose_free', 'organic_only', 'low_sugar', 'low_sodium']
    
    -- Ingredient Avoidance (Custom)
    avoid_ingredients TEXT[] DEFAULT '{}',
    -- ['palm oil', 'aspartame', 'high fructose corn syrup']
    
    -- Cosmetic Preferences (for beauty products)
    avoid_cosmetic_ingredients TEXT[] DEFAULT '{}',
    -- ['parabens', 'sulfates', 'fragrance', 'retinoids']
    
    -- Scoring Preference
    prefer_organic BOOLEAN DEFAULT FALSE,
    prefer_eco_friendly BOOLEAN DEFAULT FALSE,
    
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PRE-COMPUTED ALTERNATIVES (THE SECRET SAUCE)
-- ============================================
-- This table stores pre-computed alternative candidates
-- Background jobs populate this based on category + similarity

CREATE TABLE product_alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    alternative_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Why is this an alternative?
    similarity_score DECIMAL(5,4),    -- 0.0000 to 1.0000 (category + ingredient similarity)
    health_improvement SMALLINT,      -- How much healthier (-100 to +100)
    
    -- Pre-computed flags for fast filtering
    alt_is_vegan BOOLEAN,
    alt_is_vegetarian BOOLEAN,
    alt_is_gluten_free BOOLEAN,
    alt_is_lactose_free BOOLEAN,
    alt_allergens TEXT[],             -- Allergens in alternative
    alt_nutri_score CHAR(1),
    alt_nova_group SMALLINT,
    
    computed_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(source_product_id, alternative_product_id)
);

-- ============================================
-- INDEXES (CRITICAL FOR SPEED)
-- ============================================

-- Product lookups
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);

-- Score-based sorting
CREATE INDEX idx_products_health_score ON products(health_score DESC);
CREATE INDEX idx_products_nutri_score ON products(nutri_score);

-- Allergen filtering (GIN index for array containment)
CREATE INDEX idx_products_allergens ON products USING GIN(allergens_tags);
CREATE INDEX idx_products_traces ON products USING GIN(traces_tags);

-- Dietary filtering
CREATE INDEX idx_products_dietary ON products(is_vegan, is_vegetarian, is_gluten_free, is_lactose_free);

-- Alternatives lookup (MOST IMPORTANT)
CREATE INDEX idx_alternatives_source ON product_alternatives(source_product_id);
CREATE INDEX idx_alternatives_score ON product_alternatives(source_product_id, health_improvement DESC);
CREATE INDEX idx_alternatives_allergens ON product_alternatives USING GIN(alt_allergens);

-- Composite index for the main query pattern
CREATE INDEX idx_alternatives_main ON product_alternatives(
    source_product_id, 
    health_improvement DESC
) INCLUDE (alternative_product_id, alt_allergens, alt_is_vegan, alt_is_gluten_free);
```

---

## The Flow: Step by Step

### Step 1: User Scans Product

```
App → Supabase Edge Function "scan-product"
     → Check cache (Redis/Supabase)
     → If miss: Call OpenFoodFacts API
     → Store in products table
     → Return product data
```

### Step 2: User Clicks "Get Alternatives"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GET ALTERNATIVES FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [App Request]                                                               │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  Edge Function: get-alternatives                                 │        │
│  │                                                                  │        │
│  │  Input: {                                                        │        │
│  │    product_id: "uuid",                                          │        │
│  │    user_id: "uuid" (from JWT)                                   │        │
│  │  }                                                               │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  1. Get User Preferences (CACHED)                                │        │
│  │     - Allergens to avoid                                         │        │
│  │     - Dietary restrictions                                       │        │
│  │     - Age bracket                                                │        │
│  │     Time: ~5ms (from cache) or ~20ms (from DB)                  │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  2. Query Pre-computed Alternatives with Filters                 │        │
│  │                                                                  │        │
│  │  SELECT p.*, pa.health_improvement, pa.similarity_score          │        │
│  │  FROM product_alternatives pa                                    │        │
│  │  JOIN products p ON p.id = pa.alternative_product_id            │        │
│  │  WHERE pa.source_product_id = $1                                │        │
│  │    AND NOT (pa.alt_allergens && $2)  -- Exclude user allergens  │        │
│  │    AND (NOT $3 OR p.is_vegan = true)  -- Vegan filter           │        │
│  │    AND (NOT $4 OR p.is_gluten_free = true)                      │        │
│  │    AND p.data_quality_score >= 50    -- Only quality data       │        │
│  │  ORDER BY pa.health_improvement DESC, pa.similarity_score DESC  │        │
│  │  LIMIT 10                                                        │        │
│  │                                                                  │        │
│  │  Time: ~50-150ms (with proper indexes)                          │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  3. Enrich & Format Response                                     │        │
│  │     - Add comparison highlights                                  │        │
│  │     - Calculate % improvements                                   │        │
│  │     - Format for app display                                     │        │
│  │     Time: ~10ms                                                  │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│       │                                                                      │
│       ▼                                                                      │
│  [Response: ~100-200ms total]                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Supabase Edge Function Implementation

### File: `supabase/functions/get-alternatives/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlternativeRequest {
  product_id: string;
  limit?: number;
}

interface UserPreferences {
  age_bracket: string;
  avoid_allergens: string[];
  dietary_preferences: string[];
  avoid_ingredients: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = performance.now();

    // 1. Initialize Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 2. Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse request body
    const { product_id, limit = 10 }: AlternativeRequest = await req.json();

    if (!product_id) {
      return new Response(
        JSON.stringify({ error: "product_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Get user preferences (consider caching this)
    const { data: preferences, error: prefError } = await supabaseClient
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Use defaults if no preferences set
    const userPrefs: UserPreferences = preferences || {
      age_bracket: "adult",
      avoid_allergens: [],
      dietary_preferences: [],
      avoid_ingredients: [],
    };

    // 5. Build the optimized query
    const alternatives = await getAlternatives(
      supabaseClient,
      product_id,
      userPrefs,
      limit
    );

    const endTime = performance.now();

    // 6. Return response with timing info
    return new Response(
      JSON.stringify({
        success: true,
        data: alternatives,
        meta: {
          count: alternatives.length,
          query_time_ms: Math.round(endTime - startTime),
          filters_applied: {
            allergens_excluded: userPrefs.avoid_allergens.length,
            dietary_filters: userPrefs.dietary_preferences.length,
            age_bracket: userPrefs.age_bracket,
          },
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in get-alternatives:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getAlternatives(
  supabase: any,
  productId: string,
  preferences: UserPreferences,
  limit: number
) {
  // Determine which safety score to use based on age bracket
  const safetyScoreColumn = getSafetyScoreColumn(preferences.age_bracket);

  // Build dynamic filters
  const filters = buildFilters(preferences);

  // Execute the main query using RPC for complex filtering
  const { data, error } = await supabase.rpc("get_product_alternatives", {
    p_product_id: productId,
    p_avoid_allergens: preferences.avoid_allergens,
    p_require_vegan: preferences.dietary_preferences.includes("vegan"),
    p_require_vegetarian: preferences.dietary_preferences.includes("vegetarian"),
    p_require_gluten_free: preferences.dietary_preferences.includes("gluten_free"),
    p_require_lactose_free: preferences.dietary_preferences.includes("lactose_free"),
    p_age_bracket: preferences.age_bracket,
    p_limit: limit,
  });

  if (error) {
    console.error("Query error:", error);
    throw error;
  }

  // Transform data for the app
  return data.map((alt: any) => ({
    id: alt.id,
    barcode: alt.barcode,
    name: alt.name,
    brand: alt.brand,
    image_url: alt.image_url,
    
    // Scores
    nutri_score: alt.nutri_score,
    nova_group: alt.nova_group,
    health_score: alt.health_score,
    safety_score: alt[safetyScoreColumn],
    
    // Comparison with original
    comparison: {
      health_improvement: alt.health_improvement,
      similarity_score: alt.similarity_score,
      is_healthier: alt.health_improvement > 0,
      improvement_percentage: alt.health_improvement,
    },
    
    // Dietary info
    dietary_info: {
      is_vegan: alt.is_vegan,
      is_vegetarian: alt.is_vegetarian,
      is_gluten_free: alt.is_gluten_free,
      is_lactose_free: alt.is_lactose_free,
      is_organic: alt.is_organic,
    },
    
    // Key nutritional highlights
    nutrition_highlights: {
      sugars_per_100g: alt.sugars,
      sodium_per_100g: alt.sodium,
      energy_kcal: alt.energy_kcal,
    },
  }));
}

function getSafetyScoreColumn(ageBracket: string): string {
  const mapping: Record<string, string> = {
    "infant_0_6": "safety_score_infant",
    "infant_6_12": "safety_score_infant",
    "toddler": "safety_score_child",
    "child": "safety_score_child",
    "teen": "safety_score_teen",
    "adult": "safety_score_adult",
    "elderly": "safety_score_elderly",
    "pregnant": "safety_score_adult", // Use adult + additional filters
  };
  return mapping[ageBracket] || "safety_score_adult";
}

function buildFilters(preferences: UserPreferences) {
  return {
    allergens: preferences.avoid_allergens,
    dietary: preferences.dietary_preferences,
    ingredients: preferences.avoid_ingredients,
  };
}
```

### Database Function (RPC) for Complex Query

```sql
-- ============================================
-- OPTIMIZED RPC FUNCTION FOR ALTERNATIVES
-- ============================================
CREATE OR REPLACE FUNCTION get_product_alternatives(
    p_product_id UUID,
    p_avoid_allergens TEXT[],
    p_require_vegan BOOLEAN DEFAULT FALSE,
    p_require_vegetarian BOOLEAN DEFAULT FALSE,
    p_require_gluten_free BOOLEAN DEFAULT FALSE,
    p_require_lactose_free BOOLEAN DEFAULT FALSE,
    p_age_bracket TEXT DEFAULT 'adult',
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    barcode VARCHAR,
    name VARCHAR,
    brand VARCHAR,
    image_url TEXT,
    nutri_score CHAR(1),
    nova_group SMALLINT,
    health_score SMALLINT,
    safety_score_infant SMALLINT,
    safety_score_child SMALLINT,
    safety_score_teen SMALLINT,
    safety_score_adult SMALLINT,
    safety_score_elderly SMALLINT,
    is_vegan BOOLEAN,
    is_vegetarian BOOLEAN,
    is_gluten_free BOOLEAN,
    is_lactose_free BOOLEAN,
    is_organic BOOLEAN,
    sugars DECIMAL,
    sodium DECIMAL,
    energy_kcal DECIMAL,
    health_improvement SMALLINT,
    similarity_score DECIMAL
)
LANGUAGE plpgsql
STABLE  -- Optimization hint: function doesn't modify data
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.barcode,
        p.name,
        p.brand,
        p.image_url,
        p.nutri_score,
        p.nova_group,
        p.health_score,
        p.safety_score_infant,
        p.safety_score_child,
        p.safety_score_teen,
        p.safety_score_adult,
        p.safety_score_elderly,
        p.is_vegan,
        p.is_vegetarian,
        p.is_gluten_free,
        p.is_lactose_free,
        p.is_organic,
        p.sugars,
        p.sodium,
        p.energy_kcal,
        pa.health_improvement,
        pa.similarity_score
    FROM product_alternatives pa
    INNER JOIN products p ON p.id = pa.alternative_product_id
    WHERE 
        -- Match source product
        pa.source_product_id = p_product_id
        
        -- Exclude products containing user's allergens
        -- Using NOT && (overlap operator) for array comparison
        AND NOT (COALESCE(p.allergens_tags, '{}') && p_avoid_allergens)
        AND NOT (COALESCE(p.traces_tags, '{}') && p_avoid_allergens)
        
        -- Dietary filters (only apply if required)
        AND (NOT p_require_vegan OR p.is_vegan = TRUE)
        AND (NOT p_require_vegetarian OR p.is_vegetarian = TRUE)
        AND (NOT p_require_gluten_free OR p.is_gluten_free = TRUE)
        AND (NOT p_require_lactose_free OR p.is_lactose_free = TRUE)
        
        -- Only return products with decent data quality
        AND p.data_quality_score >= 40
        
    ORDER BY 
        -- Prioritize by health improvement
        pa.health_improvement DESC,
        -- Then by similarity (relevance)
        pa.similarity_score DESC,
        -- Then by data quality
        p.data_quality_score DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_alternatives TO authenticated;
```

---

## Background Job: Pre-computing Alternatives

This is the **KEY** to fast queries. Run this as a scheduled job (daily or when products are added).

### File: `supabase/functions/compute-alternatives/index.ts`

```typescript
// This function computes alternatives for products
// Run as a scheduled job (cron) or triggered when new products are added

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Use service role for background job
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Get products that need alternatives computed
  // Either new products or products updated in last 24h
  const { data: products, error } = await supabase
    .from("products")
    .select("id, category_id, subcategory_id, health_score, nutri_score, nova_group, allergens_tags")
    .or(`
      id.not.in.(SELECT DISTINCT source_product_id FROM product_alternatives),
      updated_at.gt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}
    `)
    .limit(500);  // Process in batches

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let processed = 0;
  let alternatives_created = 0;

  for (const product of products || []) {
    // Find alternatives in same category
    const alternatives = await findAlternativesForProduct(supabase, product);
    
    if (alternatives.length > 0) {
      // Batch insert alternatives
      const { error: insertError } = await supabase
        .from("product_alternatives")
        .upsert(alternatives, { 
          onConflict: "source_product_id,alternative_product_id",
          ignoreDuplicates: false 
        });

      if (!insertError) {
        alternatives_created += alternatives.length;
      }
    }
    processed++;
  }

  return new Response(
    JSON.stringify({
      success: true,
      products_processed: processed,
      alternatives_created: alternatives_created,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});

async function findAlternativesForProduct(supabase: any, product: any) {
  // Find products in same category with better or equal health scores
  const { data: candidates, error } = await supabase
    .from("products")
    .select(`
      id, health_score, nutri_score, nova_group, 
      allergens_tags, is_vegan, is_vegetarian, 
      is_gluten_free, is_lactose_free
    `)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .gte("data_quality_score", 40)
    .order("health_score", { ascending: false })
    .limit(50);

  if (error || !candidates) return [];

  // Calculate similarity and improvement scores
  return candidates.map((candidate: any) => ({
    source_product_id: product.id,
    alternative_product_id: candidate.id,
    similarity_score: calculateSimilarity(product, candidate),
    health_improvement: (candidate.health_score || 50) - (product.health_score || 50),
    alt_is_vegan: candidate.is_vegan,
    alt_is_vegetarian: candidate.is_vegetarian,
    alt_is_gluten_free: candidate.is_gluten_free,
    alt_is_lactose_free: candidate.is_lactose_free,
    alt_allergens: candidate.allergens_tags || [],
    alt_nutri_score: candidate.nutri_score,
    alt_nova_group: candidate.nova_group,
    computed_at: new Date().toISOString(),
  }));
}

function calculateSimilarity(product: any, candidate: any): number {
  let score = 1.0;  // Start with perfect similarity
  
  // Same subcategory = higher similarity
  if (product.subcategory_id !== candidate.subcategory_id) {
    score -= 0.2;
  }
  
  // Similar NOVA group
  const novaDiff = Math.abs((product.nova_group || 2) - (candidate.nova_group || 2));
  score -= novaDiff * 0.1;
  
  // Penalize if candidate introduces new allergens
  const productAllergens = new Set(product.allergens_tags || []);
  const candidateAllergens = candidate.allergens_tags || [];
  const newAllergens = candidateAllergens.filter((a: string) => !productAllergens.has(a));
  score -= newAllergens.length * 0.05;
  
  return Math.max(0, Math.min(1, score));
}
```

---

## Caching Strategy

### Option 1: Supabase Built-in (Simpler)

Use Supabase's connection pooler and rely on PostgreSQL's built-in caching:

```typescript
// In your Edge Function
// The query plan and frequently accessed data will be cached by PostgreSQL

// For user preferences, cache in a Map (Edge Function instance cache)
const userPrefsCache = new Map<string, { prefs: UserPreferences; expires: number }>();

async function getUserPreferences(supabase: any, userId: string): Promise<UserPreferences> {
  const cached = userPrefsCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.prefs;
  }

  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (data) {
    userPrefsCache.set(userId, {
      prefs: data,
      expires: Date.now() + 5 * 60 * 1000,  // 5 minute cache
    });
  }

  return data || DEFAULT_PREFERENCES;
}
```

### Option 2: Redis/Upstash (Faster, More Complex)

```typescript
import { Redis } from "https://esm.sh/@upstash/redis";

const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_URL")!,
  token: Deno.env.get("UPSTASH_REDIS_TOKEN")!,
});

// Cache alternatives results
async function getCachedAlternatives(productId: string, userPrefsHash: string) {
  const cacheKey = `alts:${productId}:${userPrefsHash}`;
  const cached = await redis.get(cacheKey);
  return cached ? JSON.parse(cached as string) : null;
}

async function setCachedAlternatives(
  productId: string, 
  userPrefsHash: string, 
  data: any
) {
  const cacheKey = `alts:${productId}:${userPrefsHash}`;
  await redis.setex(cacheKey, 3600, JSON.stringify(data));  // 1 hour cache
}
```

---

## Performance Benchmarks & Optimization Tips

### Expected Performance

| Operation | Without Optimization | With Optimization |
|-----------|---------------------|-------------------|
| User preferences lookup | 20-50ms | 5-10ms (cached) |
| Alternatives query | 200-500ms | 50-100ms (pre-computed + indexed) |
| Response formatting | 20-50ms | 10-20ms |
| **Total** | **300-600ms** | **80-150ms** |

### Key Optimization Techniques

1. **Pre-compute alternatives** (most important)
   - Don't calculate similarity at runtime
   - Background job runs daily or on product updates

2. **Use composite indexes**
   ```sql
   CREATE INDEX idx_alternatives_main ON product_alternatives(
       source_product_id, 
       health_improvement DESC
   ) INCLUDE (alternative_product_id, alt_allergens, alt_is_vegan, alt_is_gluten_free);
   ```

3. **Use RPC instead of REST**
   - Single round-trip to database
   - Complex filtering in PostgreSQL (faster than JS)

4. **Limit data transfer**
   - Only select fields you need
   - Don't return full ingredient lists in alternatives

5. **Cache user preferences**
   - Preferences change rarely
   - 5-minute cache is safe

6. **Use connection pooling**
   - Supabase uses PgBouncer by default
   - Connections are reused

---

## Complete API Route Structure

```
/functions/v1/
├── scan-product                 # POST { barcode }
│   └── Returns product data (calls OFF API if not cached)
│
├── get-alternatives             # POST { product_id }
│   └── Returns personalized alternatives (main feature)
│
├── search-products              # GET ?q=query&category=food
│   └── Full-text search
│
├── get-product-details          # GET ?id=uuid
│   └── Full product info with safety analysis
│
├── user-preferences             # GET/PUT
│   └── Manage user allergens, dietary prefs, age bracket
│
├── check-recalls                # GET ?product_id=uuid
│   └── Check if product has active recalls
│
└── compute-alternatives         # POST (cron triggered)
    └── Background job for pre-computation
```

---

## Recommended Implementation Order

1. **Phase 1: Core Data** (Week 1)
   - Set up database schema
   - Implement product sync from OpenFoodFacts
   - Basic scan endpoint

2. **Phase 2: User Preferences** (Week 2)
   - User preferences table and API
   - Age bracket selection
   - Allergen configuration

3. **Phase 3: Alternatives Engine** (Week 3)
   - Background job for pre-computing alternatives
   - `get-alternatives` Edge Function
   - Basic filtering by allergens and dietary preferences

4. **Phase 4: Optimization** (Week 4)
   - Add caching layer
   - Performance tuning
   - Add Upstash Redis if needed

5. **Phase 5: Enhancements** (Week 5+)
   - Recall integration
   - Beauty product support
   - Advanced scoring

---

## Supabase vs External Backend?

### Verdict: Supabase Edge Functions are IDEAL for this use case

**Why Supabase Edge Functions work:**
- ✅ Low latency (deployed globally at edge)
- ✅ Direct database access (no network hop)
- ✅ Scales automatically
- ✅ Simple deployment
- ✅ Built-in auth
- ✅ RPC functions for complex queries

**When you'd need external backend:**
- ❌ Heavy ML/AI processing (not our case)
- ❌ Long-running jobs >60s (use pg_cron instead)
- ❌ WebSocket connections (not needed)

**Recommended Architecture:**
```
┌─────────────────────────────────────────────────┐
│                Mobile App                        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│          Supabase Edge Functions                 │
│  - scan-product                                  │
│  - get-alternatives                              │
│  - user-preferences                              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│            Supabase PostgreSQL                   │
│  - products table                                │
│  - product_alternatives (pre-computed)           │
│  - user_preferences                              │
│  - RPC functions                                 │
└─────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         pg_cron (Scheduled Jobs)                 │
│  - Sync products from OpenFoodFacts              │
│  - Compute alternatives                          │
│  - Sync recalls from FDA/FSA                     │
└─────────────────────────────────────────────────┘
```