## 1. Supabase Edge Function Fixes

- [ ] 1.1 Update `generate-shopping-list` edge function to write to the `items` JSONB column of `shopping_lists` instead of `shopping_list_items`.

## 2. Recipe Detail Swap UI Integration

- [ ] 2.1 Update `recipe-detail.jsx` to store fetched swaps in a state variable.
- [ ] 2.2 Render swap details inline below ingredients that have suggestions.

## 3. Pantry Discovery Navigation & Screen

- [ ] 3.1 Create a new screen `src/app/recipe-discover.jsx` with a beautiful cards layout listing recipe recommendations based on the user's pantry.
- [ ] 3.2 Fetch recommendations from `getCookableRecipes` and link to `recipe-detail` on press.
