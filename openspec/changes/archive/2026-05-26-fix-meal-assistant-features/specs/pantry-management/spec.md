## ADDED Requirements

### Requirement: recipe-discover-screen
The system MUST provide a screen showing recipe suggestions based on current pantry items.

#### Scenario: User checks pantry recommendations
- **WHEN** the user opens the Pantry screen and taps "What can I cook?"
- **THEN** the system SHALL navigate to `/recipe-discover`
- **AND** load suggested recipes from the `suggest-recipes` Edge Function, showing ingredient matching quality and missing items.
