# Meal Planner

### Requirement: weekly-meal-planning
The system MUST support generating and editing weekly meal plans.

#### Scenario: User auto-generates weekly plan
- **WHEN** the user taps "Auto-Generate Plan" in the Meal Planner screen
- **THEN** the system SHALL invoke the `generate-meal-plan` Edge Function to pick random saved recipes or placeholders for breakfast, lunch, and dinner across 7 days
- **AND** save the entries to the `meal_plans` and `meal_plan_entries` tables.
