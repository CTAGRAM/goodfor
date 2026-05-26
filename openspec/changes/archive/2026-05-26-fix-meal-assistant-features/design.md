## Context

The current meal assistant features have discrepancies between client expectations and Edge Function implementations, causing silent failures or screen crashes.

## Goals / Non-Goals

**Goals:**
- Enable successful generation of shopping lists from the meal planner.
- Render AI-generated healthier ingredient swaps inline inside the recipe detail screen.
- Create a beautiful recipe-discover screen to display meal suggestions based on pantry items.

**Non-Goals:**
- Modifying the AI prompt logic or OpenFoodFacts scoring system.

## Decisions

1. **Shopping List Representation**: To match the existing DB schema and UI code, the list items will be stored as a JSONB array inside the `items` column of `shopping_lists`.
2. **Inline Swaps Rendering**: We will add a state `swaps` in `recipe-detail.jsx`. When swaps are fetched, we will match them by original ingredient name or index and render them underneath the matching ingredient.
3. **Pantry Recipe Discovery**: We will implement `recipe-discover.jsx` using the existing `getCookableRecipes` client method to query AI recommendations based on user pantry ingredients.
