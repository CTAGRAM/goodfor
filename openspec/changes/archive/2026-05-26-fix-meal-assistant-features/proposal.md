## Why

During auditing, we identified critical integration gaps between the Edge Functions, database schema, and frontend screens for the Meal Assistant features:
1. **Shopping List Generation Mismatch**: The Edge Function tries to insert into a non-existent `shopping_list_items` table, while the frontend expects items in the `items` JSONB column of `shopping_lists`.
2. **Missing pantry recipe discover navigation route**: In the pantry view, "What can I cook?" navigates to `/recipe-discover`, which is missing.
3. **Healthier Swaps UI integration**: In `recipe-detail.jsx`, the "Make it healthier" card triggers the Edge Function but does not display or apply the swaps.
4. **Fridge Scan Saving**: The database lacked a `fridge_scans` table (which has now been created to resolve database warnings/fails).

## What Changes

1. **Edge Function `generate-shopping-list`**: Modify it to store items directly in the JSONB `items` column of `shopping_lists` and update the title.
2. **New Screen `recipe-discover.jsx`**: Create a screen at `src/app/recipe-discover.jsx` that calls `getCookableRecipes(userId)` and lists suggested meals.
3. **Healthier Swaps UI**: Update `recipe-detail.jsx` to render the suggested swaps on the ingredient lines.

## Capabilities

### Modified Capabilities
- `meal-planner`: Fix shopping list generation from weekly plans.
- `pantry-management`: Wire up "What can I cook?" navigation to recipe suggestions.
- `recipe-management`: Render healthier swaps in the recipe details screen.

## Impact
- Supabase Edge Function `generate-shopping-list`
- Frontend screens: `pantry.jsx`, `recipe-detail.jsx`, `recipe-discover.jsx` (new)
