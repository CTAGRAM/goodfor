-- ============================================================
-- GoodFor v2: Recipe, Pantry, Shopping & Meal Plan System
-- ============================================================

-- 1. Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    source_type TEXT DEFAULT 'manual', -- 'url', 'screenshot', 'manual'
    source_platform TEXT, -- 'tiktok', 'instagram', 'youtube', 'blog', etc.
    image_url TEXT,
    servings INTEGER DEFAULT 4,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    total_time_minutes INTEGER,
    category TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'
    cuisine TEXT, -- 'italian', 'indian', 'mexican', etc.
    difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    health_score INTEGER, -- 0-100 overall health score
    instructions JSONB, -- Array of step strings
    nutrition_per_serving JSONB, -- { calories, protein, carbs, fat, fiber, sugar, sodium }
    tags TEXT[], -- ['vegan', 'gluten-free', 'high-protein', etc.]
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Recipe Ingredients (normalized for smart matching)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC,
    unit TEXT, -- 'cups', 'tbsp', 'g', 'oz', 'pieces', etc.
    category TEXT DEFAULT 'other', -- 'produce', 'dairy', 'meat', 'grains', 'pantry_staple', etc.
    is_optional BOOLEAN DEFAULT false,
    health_score INTEGER, -- per-ingredient health rating
    healthier_swap TEXT, -- AI-suggested healthier alternative
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Shopping Lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Shopping List',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Each item: { name, quantity, unit, category, aisle, checked, recipe_source }
    recipe_ids UUID[], -- Which recipes this list was generated from
    meal_plan_id UUID, -- If generated from a meal plan
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pantry Items
CREATE TABLE IF NOT EXISTS public.pantry_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC,
    unit TEXT,
    category TEXT DEFAULT 'other',
    expiry_date DATE,
    barcode TEXT,
    added_from TEXT DEFAULT 'manual', -- 'manual', 'scan', 'shopping_list'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Meal Plans
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Weekly Meal Plan',
    week_start DATE NOT NULL,
    days JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Each day: { date, meals: { breakfast: {recipe_id, title, ...}, lunch: {...}, dinner: {...}, snack: {...} } }
    preferences JSONB, -- { diet, calories_target, servings, excluded_ingredients }
    grocery_list_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Offline Product Cache
CREATE TABLE IF NOT EXISTS public.product_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode TEXT NOT NULL UNIQUE,
    product_data JSONB NOT NULL,
    safety_data JSONB,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON public.recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiry ON public.pantry_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON public.meal_plans(week_start);
CREATE INDEX IF NOT EXISTS idx_product_cache_barcode ON public.product_cache(barcode);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_cache ENABLE ROW LEVEL SECURITY;

-- Recipes: users can only access their own
CREATE POLICY "Users can view own recipes" ON public.recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON public.recipes FOR DELETE USING (auth.uid() = user_id);

-- Recipe Ingredients: access through recipe ownership
CREATE POLICY "Users can view recipe ingredients" ON public.recipe_ingredients FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can insert recipe ingredients" ON public.recipe_ingredients FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can update recipe ingredients" ON public.recipe_ingredients FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can delete recipe ingredients" ON public.recipe_ingredients FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));

-- Shopping Lists: users can only access their own
CREATE POLICY "Users can view own shopping lists" ON public.shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping lists" ON public.shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping lists" ON public.shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping lists" ON public.shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- Pantry Items: users can only access their own
CREATE POLICY "Users can view own pantry items" ON public.pantry_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pantry items" ON public.pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pantry items" ON public.pantry_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pantry items" ON public.pantry_items FOR DELETE USING (auth.uid() = user_id);

-- Meal Plans: users can only access their own
CREATE POLICY "Users can view own meal plans" ON public.meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON public.meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON public.meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans" ON public.meal_plans FOR DELETE USING (auth.uid() = user_id);

-- Product Cache: readable by all authenticated users, writable by service role only
CREATE POLICY "Authenticated users can read product cache" ON public.product_cache FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage product cache" ON public.product_cache FOR ALL USING (auth.role() = 'service_role');
