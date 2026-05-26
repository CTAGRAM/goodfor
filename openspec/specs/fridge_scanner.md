# Fridge and Meal Scanner

### Requirement: fridge-image-analysis
The system MUST allow users to take a photo of their fridge, pantry, or meal and use Vision AI to detect ingredients, suggest recipes, and highlight missing items.

#### Scenario: User captures fridge photo
- **WHEN** the user snaps a photo of their fridge or uploads a photo from their gallery
- **THEN** the system SHALL upload the base64-encoded image to the `analyze-fridge` Edge Function
- **AND** retrieve list of detected ingredients, 3-5 suggested recipes, missing ingredients to buy, and nutrition health scores.

### Requirement: missing-ingredients-to-pantry
The system SHALL support adding suggested missing ingredients directly to the user's pantry.

#### Scenario: User adds missing items to pantry
- **WHEN** the user clicks "Add" or "Add All" on suggested missing items in the results view
- **THEN** the system SHALL insert the selected items into the `pantry_items` table in the database
- **AND** update the UI checkbox to show the items are added.
