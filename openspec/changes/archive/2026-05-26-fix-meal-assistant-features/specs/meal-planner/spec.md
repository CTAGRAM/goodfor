## ADDED Requirements

### Requirement: shopping-list-creation
The system SHALL aggregate ingredients from selected recipes, subtract existing pantry items, and store the resulting list in the `items` JSONB column of the `shopping_lists` table.

#### Scenario: Generate list from planner
- **WHEN** the user selects recipes in the Meal Planner and clicks "Generate Shopping List"
- **THEN** the system SHALL compute the list of missing items, update the `items` JSONB column of the `shopping_lists` table, and display the populated list.
